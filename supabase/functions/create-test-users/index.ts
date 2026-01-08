import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  gender: "masculino" | "feminino" | "outro";
  birth_date: string;
  role: "aluno" | "professor" | "encarregado";
  class_id?: string;
  student_number?: string;
  employee_number?: string;
  specialization?: string;
  relationship?: string;
  occupation?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    // Verify the caller is an admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: callerError } = await userClient.auth.getUser();
    if (callerError || !caller) {
      throw new Error("Não autorizado");
    }

    // Check if caller is admin
    const { data: roleData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Apenas administradores podem criar utilizadores de teste");
    }

    // Use service role client to create users
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Define test users
    const testUsers: TestUser[] = [
      // 10 Alunos
      { email: "aluno1@anisnofa.ao", password: "Teste@123!", full_name: "João Pedro Silva", phone: "921111101", gender: "masculino", birth_date: "2008-03-15", role: "aluno", class_id: "25cabadd-8ff5-42b6-977f-fc8dcb914060", student_number: "ALU2024001" },
      { email: "aluno2@anisnofa.ao", password: "Teste@123!", full_name: "Maria Fernanda Santos", phone: "921111102", gender: "feminino", birth_date: "2007-06-22", role: "aluno", class_id: "25cabadd-8ff5-42b6-977f-fc8dcb914060", student_number: "ALU2024002" },
      { email: "aluno3@anisnofa.ao", password: "Teste@123!", full_name: "Carlos Alberto Mendes", phone: "921111103", gender: "masculino", birth_date: "2008-09-10", role: "aluno", class_id: "1c77792f-9704-4261-ac13-751ba05a7b31", student_number: "ALU2024003" },
      { email: "aluno4@anisnofa.ao", password: "Teste@123!", full_name: "Ana Beatriz Costa", phone: "921111104", gender: "feminino", birth_date: "2007-12-05", role: "aluno", class_id: "1c77792f-9704-4261-ac13-751ba05a7b31", student_number: "ALU2024004" },
      { email: "aluno5@anisnofa.ao", password: "Teste@123!", full_name: "Pedro Miguel Andrade", phone: "921111105", gender: "masculino", birth_date: "2008-01-28", role: "aluno", class_id: "f68b9433-ebf1-49ab-afc7-b596a01b9bf9", student_number: "ALU2024005" },
      { email: "aluno6@anisnofa.ao", password: "Teste@123!", full_name: "Sofia Helena Lopes", phone: "921111106", gender: "feminino", birth_date: "2007-04-17", role: "aluno", class_id: "f68b9433-ebf1-49ab-afc7-b596a01b9bf9", student_number: "ALU2024006" },
      { email: "aluno7@anisnofa.ao", password: "Teste@123!", full_name: "Miguel Ângelo Ferreira", phone: "921111107", gender: "masculino", birth_date: "2008-07-03", role: "aluno", class_id: "45b6e58c-dc52-4005-9c63-5ea895d3e660", student_number: "ALU2024007" },
      { email: "aluno8@anisnofa.ao", password: "Teste@123!", full_name: "Luísa Maria Pereira", phone: "921111108", gender: "feminino", birth_date: "2007-11-20", role: "aluno", class_id: "45b6e58c-dc52-4005-9c63-5ea895d3e660", student_number: "ALU2024008" },
      { email: "aluno9@anisnofa.ao", password: "Teste@123!", full_name: "André Paulo Gomes", phone: "921111109", gender: "masculino", birth_date: "2008-05-08", role: "aluno", class_id: "d67a2e48-588f-47c9-9e32-8a93d25bdcb0", student_number: "ALU2024009" },
      { email: "aluno10@anisnofa.ao", password: "Teste@123!", full_name: "Beatriz Isabel Neves", phone: "921111110", gender: "feminino", birth_date: "2007-08-14", role: "aluno", class_id: "d67a2e48-588f-47c9-9e32-8a93d25bdcb0", student_number: "ALU2024010" },
      
      // 3 Professores
      { email: "professor1@anisnofa.ao", password: "Teste@123!", full_name: "António José Rodrigues", phone: "922222201", gender: "masculino", birth_date: "1980-05-12", role: "professor", employee_number: "PROF001", specialization: "Matemática" },
      { email: "professor2@anisnofa.ao", password: "Teste@123!", full_name: "Fernanda Luísa Machado", phone: "922222202", gender: "feminino", birth_date: "1985-08-25", role: "professor", employee_number: "PROF002", specialization: "Português" },
      { email: "professor3@anisnofa.ao", password: "Teste@123!", full_name: "Ricardo Manuel Sousa", phone: "922222203", gender: "masculino", birth_date: "1978-11-30", role: "professor", employee_number: "PROF003", specialization: "Física" },
      
      // 3 Encarregados
      { email: "encarregado1@anisnofa.ao", password: "Teste@123!", full_name: "Manuel António Silva", phone: "923333301", gender: "masculino", birth_date: "1975-02-18", role: "encarregado", relationship: "Pai", occupation: "Engenheiro" },
      { email: "encarregado2@anisnofa.ao", password: "Teste@123!", full_name: "Teresa Maria Santos", phone: "923333302", gender: "feminino", birth_date: "1978-07-04", role: "encarregado", relationship: "Mãe", occupation: "Médica" },
      { email: "encarregado3@anisnofa.ao", password: "Teste@123!", full_name: "José Carlos Mendes", phone: "923333303", gender: "masculino", birth_date: "1972-10-22", role: "encarregado", relationship: "Pai", occupation: "Empresário" },
    ];

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const testUser of testUsers) {
      try {
        // Check if user already exists
        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("id")
          .eq("email", testUser.email)
          .maybeSingle();

        if (existingProfile) {
          results.push({ email: testUser.email, success: false, error: "Já existe" });
          continue;
        }

        // Create user with admin API
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
          user_metadata: {
            full_name: testUser.full_name,
            phone: testUser.phone,
            gender: testUser.gender,
            birth_date: testUser.birth_date,
          },
        });

        if (authError || !authData.user) {
          results.push({ email: testUser.email, success: false, error: authError?.message || "Erro ao criar" });
          continue;
        }

        const userId = authData.user.id;

        // Update profile with additional data
        await adminClient
          .from("profiles")
          .update({
            phone: testUser.phone,
            gender: testUser.gender,
            birth_date: testUser.birth_date,
          })
          .eq("id", userId);

        // Create user role
        await adminClient.from("user_roles").insert({
          user_id: userId,
          role: testUser.role,
        });

        // Create role-specific record
        if (testUser.role === "aluno" && testUser.class_id) {
          await adminClient.from("students").insert({
            user_id: userId,
            class_id: testUser.class_id,
            student_number: testUser.student_number,
          });
        } else if (testUser.role === "professor") {
          await adminClient.from("teachers").insert({
            user_id: userId,
            employee_number: testUser.employee_number,
            specialization: testUser.specialization,
          });
        } else if (testUser.role === "encarregado") {
          await adminClient.from("guardians").insert({
            user_id: userId,
            relationship: testUser.relationship,
            occupation: testUser.occupation,
          });
        }

        results.push({ email: testUser.email, success: true });
      } catch (err) {
        results.push({ email: testUser.email, success: false, error: String(err) });
      }
    }

    // Link students to guardians
    const guardians = results.filter(r => r.success && r.email.startsWith("encarregado"));
    const students = results.filter(r => r.success && r.email.startsWith("aluno"));

    if (guardians.length > 0 && students.length > 0) {
      // Get guardian and student IDs
      const { data: guardianData } = await adminClient
        .from("guardians")
        .select("id, user_id")
        .order("created_at", { ascending: false })
        .limit(3);

      const { data: studentData } = await adminClient
        .from("students")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (guardianData && studentData) {
        // Link first 3-4 students to first guardian, next 3-4 to second, etc.
        for (let i = 0; i < Math.min(studentData.length, 10); i++) {
          const guardianIndex = Math.floor(i / 4);
          if (guardianIndex < guardianData.length) {
            await adminClient.from("guardian_students").upsert({
              guardian_id: guardianData[guardianIndex].id,
              student_id: studentData[i].id,
              is_primary: i % 4 === 0,
            }, { onConflict: "guardian_id,student_id" });
          }
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Criados ${successCount} utilizadores. ${failedCount} falharam.`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
