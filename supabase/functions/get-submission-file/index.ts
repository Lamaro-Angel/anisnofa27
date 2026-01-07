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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user client to verify authentication
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { submissionId } = await req.json();
    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: 'Missing submissionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service client for database queries
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get submission details
    const { data: submission, error: submissionError } = await serviceClient
      .from('assignment_submissions')
      .select(`
        id,
        student_id,
        file_url,
        assignment:assignments(
          id,
          class_subject:class_subjects(
            id,
            class_id,
            teacher_id
          )
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's role
    const { data: userRole } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const role = userRole?.role;

    // Authorization checks
    let authorized = false;

    // 1. Admin can access all
    if (role === 'admin') {
      authorized = true;
    }

    // 2. Student can access their own submission
    if (role === 'aluno') {
      const { data: student } = await serviceClient
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (student && student.id === submission.student_id) {
        authorized = true;
      }
    }

    // 3. Teacher can access submissions in their classes
    if (role === 'professor') {
      const { data: teacher } = await serviceClient
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const assignment = submission.assignment as any;
      if (teacher && assignment?.class_subject?.teacher_id === teacher.id) {
        authorized = true;
      }
    }

    if (!authorized) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract file path from URL
    const fileUrl = submission.file_url;
    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'No file attached to submission' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the storage path from the URL
    // Expected format: .../storage/v1/object/public/assignments/path/to/file
    const pathMatch = fileUrl.match(/\/assignments\/(.+)$/);
    if (!pathMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid file URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const filePath = pathMatch[1];

    // Generate a signed URL valid for 60 seconds
    const { data: signedUrlData, error: signedUrlError } = await serviceClient
      .storage
      .from('assignments')
      .createSignedUrl(filePath, 60);

    if (signedUrlError || !signedUrlData) {
      console.error('Error generating signed URL:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate download URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ signedUrl: signedUrlData.signedUrl, expiresIn: 60 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-submission-file:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
