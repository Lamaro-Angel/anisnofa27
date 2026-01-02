import { useAuth } from "@/hooks/useAuth";
import { useTeacherClasses } from "@/hooks/useTeacherClasses";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, Users, TrendingUp, Calendar, 
  CheckCircle, Clock, FileText, Bell,
  GraduationCap, UserCheck
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { pt } from "date-fns/locale";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data: teacherClasses, isLoading: classesLoading } = useTeacherClasses();

  // Get teacher's assignments
  const { data: assignments } = useQuery({
    queryKey: ["teacher-assignments", user?.id],
    queryFn: async () => {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!teacher) return [];

      const { data } = await supabase
        .from("assignments")
        .select(`
          *,
          class_subjects!inner(teacher_id, classes(name), subjects(name))
        `)
        .eq("class_subjects.teacher_id", teacher.id)
        .order("due_date", { ascending: true })
        .limit(5);

      return data || [];
    },
    enabled: !!user,
  });

  // Get teacher's students count
  const { data: studentsCount } = useQuery({
    queryKey: ["teacher-students-count", user?.id],
    queryFn: async () => {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!teacher) return 0;

      const { data: classSubjects } = await supabase
        .from("class_subjects")
        .select("class_id")
        .eq("teacher_id", teacher.id);

      if (!classSubjects || classSubjects.length === 0) return 0;

      const classIds = [...new Set(classSubjects.map(cs => cs.class_id))];
      
      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .in("class_id", classIds);

      return count || 0;
    },
    enabled: !!user,
  });

  // Get pending submissions to grade
  const { data: pendingSubmissions } = useQuery({
    queryKey: ["pending-submissions", user?.id],
    queryFn: async () => {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!teacher) return 0;

      const { count } = await supabase
        .from("assignment_submissions")
        .select("*, assignments!inner(class_subjects!inner(teacher_id))", { count: "exact", head: true })
        .eq("assignments.class_subjects.teacher_id", teacher.id)
        .is("grade", null);

      return count || 0;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {user?.user_metadata?.full_name || "Professor"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Painel do Professor • Sistema de Gestão Escolar Anisnofa
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Minhas Turmas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{teacherClasses?.length || 0}</div>
                <p className="text-xs text-muted-foreground">turmas atribuídas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsCount || 0}</div>
            <p className="text-xs text-muted-foreground">nas minhas turmas</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trabalhos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">ativos</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Por Avaliar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">submissões pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* My Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Minhas Turmas
            </CardTitle>
            <CardDescription>Turmas e disciplinas atribuídas</CardDescription>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : teacherClasses && teacherClasses.length > 0 ? (
              <div className="space-y-3">
                {teacherClasses.slice(0, 5).map((tc: any) => (
                  <div key={tc.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div>
                      <p className="font-medium">{tc.classes?.name}</p>
                      <p className="text-sm text-muted-foreground">{tc.subjects?.name}</p>
                    </div>
                    <Badge variant="secondary">{tc.classes?.grade_level}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma turma atribuída
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Trabalhos
            </CardTitle>
            <CardDescription>Datas de entrega</CardDescription>
          </CardHeader>
          <CardContent>
            {assignments && assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.class_subjects?.classes?.name} - {assignment.class_subjects?.subjects?.name}
                      </p>
                    </div>
                    {assignment.due_date && (
                      <Badge variant={new Date(assignment.due_date) < new Date() ? "destructive" : "outline"}>
                        {format(new Date(assignment.due_date), "dd/MM", { locale: pt })}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum trabalho pendente
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Acesso Rápido
          </CardTitle>
          <CardDescription>Ações frequentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <QuickAction icon={TrendingUp} label="Lançar Notas" href="/notas" />
            <QuickAction icon={UserCheck} label="Registar Presenças" href="/presencas" />
            <QuickAction icon={FileText} label="Criar Trabalho" href="/trabalhos" />
            <QuickAction icon={Bell} label="Publicar Aviso" href="/avisos" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
