import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window for attempt counting

// In-memory store for rate limiting (in production, use Redis or database)
// This is reset on function cold start, but provides protection within a session
const rateLimitStore = new Map<string, { attempts: number; lockedUntil: number; lastAttempt: number }>();

function getClientKey(email: string, ip: string): string {
  // Hash the combination of email and IP for the key
  return `${email.toLowerCase()}_${ip}`;
}

function cleanupOldEntries(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    // Remove entries older than the attempt window and not locked
    if (now - value.lastAttempt > ATTEMPT_WINDOW_MS && value.lockedUntil < now) {
      rateLimitStore.delete(key);
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, email, password, fullName, role } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get client IP (may be forwarded through proxy)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';

    const clientKey = getClientKey(email, ip);
    const now = Date.now();

    // Cleanup old entries periodically
    if (Math.random() < 0.1) { // 10% chance to cleanup on each request
      cleanupOldEntries();
    }

    // Check rate limit
    let rateLimit = rateLimitStore.get(clientKey);
    
    if (rateLimit) {
      // Check if account is locked
      if (rateLimit.lockedUntil > now) {
        const remainingMs = rateLimit.lockedUntil - now;
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        console.log(`Account locked for ${email} from ${ip}. ${remainingMinutes} minutes remaining.`);
        
        return new Response(JSON.stringify({ 
          error: `Conta temporariamente bloqueada. Tente novamente em ${remainingMinutes} minutos.`,
          locked: true,
          remainingMinutes,
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reset attempts if window has passed
      if (now - rateLimit.lastAttempt > ATTEMPT_WINDOW_MS) {
        rateLimit = { attempts: 0, lockedUntil: 0, lastAttempt: now };
      }
    } else {
      rateLimit = { attempts: 0, lockedUntil: 0, lastAttempt: now };
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    let result: { data: any; error: any } = { data: null, error: null };

    // Password validation for signup
    if (action === 'signup' || action === 'login') {
      if (!password) {
        return new Response(JSON.stringify({ error: 'Password is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Strong password validation for signup
      if (action === 'signup') {
        const passwordErrors: string[] = [];
        
        if (password.length < 8) {
          passwordErrors.push('A senha deve ter pelo menos 8 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
          passwordErrors.push('A senha deve conter pelo menos uma letra maiúscula');
        }
        if (!/[a-z]/.test(password)) {
          passwordErrors.push('A senha deve conter pelo menos uma letra minúscula');
        }
        if (!/[0-9]/.test(password)) {
          passwordErrors.push('A senha deve conter pelo menos um número');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          passwordErrors.push('A senha deve conter pelo menos um caractere especial (!@#$%^&*...)');
        }

        if (passwordErrors.length > 0) {
          return new Response(JSON.stringify({ 
            error: passwordErrors.join('. '),
            validationErrors: passwordErrors,
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Perform the requested action
    switch (action) {
      case 'login': {
        result = await anonClient.auth.signInWithPassword({ email, password });
        break;
      }

      case 'signup': {
        if (!fullName || !role) {
          return new Response(JSON.stringify({ error: 'Full name and role are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        result = await anonClient.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        // If signup successful, create user role
        if (result.data?.user && !result.error) {
          const userId = result.data.user.id;
          
          // Insert user role
          await adminClient.from('user_roles').insert({
            user_id: userId,
            role: role,
          });

          // Create role-specific record
          if (role === 'professor') {
            await adminClient.from('teachers').insert({ user_id: userId });
          } else if (role === 'aluno') {
            await adminClient.from('students').insert({ user_id: userId });
          } else if (role === 'encarregado') {
            await adminClient.from('guardians').insert({ user_id: userId });
          }
        }
        break;
      }

      case 'reset-password': {
        // Use generic response to prevent email enumeration
        await anonClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${req.headers.get('origin')}/update-password`,
        });
        
        // Always return success to prevent email enumeration
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Se o email existir no sistema, receberá instruções para recuperar a senha.',
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Handle result
    if (result.error) {
      // Increment failed attempts
      rateLimit.attempts += 1;
      rateLimit.lastAttempt = now;

      // Lock account if max attempts reached
      if (rateLimit.attempts >= MAX_ATTEMPTS) {
        rateLimit.lockedUntil = now + LOCKOUT_DURATION_MS;
        console.log(`Account locked for ${email} from ${ip} after ${rateLimit.attempts} failed attempts`);
      }

      rateLimitStore.set(clientKey, rateLimit);

      // Return generic error message to prevent enumeration
      const remainingAttempts = MAX_ATTEMPTS - rateLimit.attempts;
      const errorMessage = remainingAttempts > 0 
        ? `Credenciais inválidas. ${remainingAttempts} tentativas restantes.`
        : `Conta bloqueada por 15 minutos devido a múltiplas tentativas falhadas.`;

      console.log(`Failed ${action} attempt for ${email} from ${ip}. Attempts: ${rateLimit.attempts}`);

      return new Response(JSON.stringify({ 
        error: errorMessage,
        remainingAttempts: Math.max(0, remainingAttempts),
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Success - reset rate limit for this client
    rateLimitStore.delete(clientKey);
    console.log(`Successful ${action} for ${email} from ${ip}`);

    return new Response(JSON.stringify({ 
      success: true,
      data: result.data,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
