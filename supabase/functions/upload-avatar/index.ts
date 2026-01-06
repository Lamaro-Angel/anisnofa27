import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed MIME types (strict whitelist)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

// Blocked extensions
const BLOCKED_EXTENSIONS = new Set([
  'svg', 'gif', 'exe', 'php', 'html', 'htm', 'js', 'ts', 'jsx', 'tsx',
  'sh', 'bat', 'cmd', 'ps1', 'py', 'rb', 'pl', 'cgi', 'asp', 'aspx',
]);

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Magic bytes for file type validation
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header (WebP starts with RIFF)
};

function validateMagicBytes(bytes: Uint8Array, expectedType: string): boolean {
  const magic = MAGIC_BYTES[expectedType];
  if (!magic) return false;
  
  for (let i = 0; i < magic.length; i++) {
    if (bytes[i] !== magic[i]) return false;
  }
  
  // Additional check for WebP - must have WEBP at offset 8
  if (expectedType === 'image/webp') {
    const webpSignature = [0x57, 0x45, 0x42, 0x50]; // WEBP
    for (let i = 0; i < webpSignature.length; i++) {
      if (bytes[i + 8] !== webpSignature[i]) return false;
    }
  }
  
  return true;
}

function getExtensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    default: return 'jpg';
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

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify user with anon client
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`User ${user.id} attempting avatar upload`);

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size}`);

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum size is 2MB.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate MIME type from request
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop() || '';
    if (BLOCKED_EXTENSIONS.has(extension)) {
      return new Response(JSON.stringify({ 
        error: 'File extension not allowed.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read file content for magic byte validation
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Validate magic bytes (server-side content validation)
    if (!validateMagicBytes(bytes, file.type)) {
      console.warn(`Magic byte validation failed for user ${user.id}`);
      return new Response(JSON.stringify({ 
        error: 'Invalid file content. File does not match declared type.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role client for storage operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete existing avatar for this user
    const { data: existingFiles } = await adminClient.storage
      .from('avatars')
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
      await adminClient.storage.from('avatars').remove(filesToDelete);
      console.log(`Deleted ${filesToDelete.length} existing avatars for user ${user.id}`);
    }

    // Generate new file path using user ID (overwrites any previous avatar)
    const newExtension = getExtensionFromMimeType(file.type);
    const filePath = `${user.id}/avatar.${newExtension}`;

    // Upload new avatar
    const { error: uploadError } = await adminClient.storage
      .from('avatars')
      .upload(filePath, bytes, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload avatar.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create signed URL (valid for 1 year) instead of public URL
    const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
      .from('avatars')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      return new Response(JSON.stringify({ error: 'Failed to generate avatar URL.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update profile with new avatar URL
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ avatar_url: signedUrlData.signedUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update profile.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Avatar uploaded successfully for user ${user.id}`);

    return new Response(JSON.stringify({ 
      success: true,
      avatar_url: signedUrlData.signedUrl,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
