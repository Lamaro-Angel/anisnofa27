import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Optional: Verify this is called from a cron job or admin
    const authHeader = req.headers.get('Authorization');
    
    // Allow calls with service key or from scheduled jobs
    const isScheduledJob = authHeader?.includes(supabaseServiceKey);
    
    if (!isScheduledJob) {
      // If not a scheduled job, verify user is admin
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader || '' } }
      });

      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create service client to check admin role
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: roleData } = await serviceClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create service client for cleanup operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Anonymize IPs older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: logsToAnonymize, error: fetchError } = await serviceClient
      .from('activity_logs')
      .select('id, ip_address')
      .lt('created_at', sevenDaysAgo.toISOString())
      .or('ip_anonymized.is.null,ip_anonymized.eq.false')
      .not('ip_address', 'is', null);

    if (fetchError) {
      console.error('Error fetching logs to anonymize:', fetchError);
    }

    let anonymizedCount = 0;
    if (logsToAnonymize && logsToAnonymize.length > 0) {
      for (const log of logsToAnonymize) {
        const anonymizedIp = anonymizeIp(log.ip_address);
        const { error: updateError } = await serviceClient
          .from('activity_logs')
          .update({
            ip_address: anonymizedIp,
            ip_anonymized: true,
            anonymized_at: new Date().toISOString()
          })
          .eq('id', log.id);

        if (!updateError) {
          anonymizedCount++;
        }
      }
    }

    // 2. Delete logs older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { count: deletedCount, error: deleteError } = await serviceClient
      .from('activity_logs')
      .delete({ count: 'exact' })
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (deleteError) {
      console.error('Error deleting old logs:', deleteError);
    }

    const result = {
      success: true,
      anonymizedCount,
      deletedCount: deletedCount || 0,
      timestamp: new Date().toISOString()
    };

    console.log('Cleanup completed:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cleanup-logs:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to anonymize IP addresses
function anonymizeIp(ip: string | null): string | null {
  if (!ip) return null;

  // For IPv4: Replace last octet with 0
  const ipv4Match = ip.match(/^(\d+\.\d+\.\d+)\.\d+$/);
  if (ipv4Match) {
    return `${ipv4Match[1]}.0`;
  }

  // For IPv6: Truncate to first 4 segments
  if (ip.includes(':')) {
    const segments = ip.split(':');
    if (segments.length >= 4) {
      return `${segments[0]}:${segments[1]}:${segments[2]}:${segments[3]}::`;
    }
  }

  return 'anonymized';
}
