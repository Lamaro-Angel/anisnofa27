import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, TrendingUp, Calendar, 
  CheckCircle, Clock, FileText, Bell,
  Award, UserCheck, MessageSquare
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { pt } from "date-fns/locale";

export default function StudentDashboard() {
  const { user } = useAuth();

  // Get student info
  const { data: student } = useQuery({
    queryKey: ["student-info", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select(`
          *,
          classes(name, grade_level)
        `)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Get student's grades
  const { data: grades } = useQuery({
    queryKey: ["student-grades", user?.id],
    queryFn: async () => {
      if (!student) return [];
      const { data } = await supabase
        .from("grades")
        .select(`
          *,
          subjects(name)
        `)
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!student,
  });

  // Calculate average grade
  const averageGrade = grades && grades.length > 0
    ? (grades.reduce((sum, g) => sum + (g.grade || 0), 0) / grades.length).toFixed(1)
    : null;

  // Get attendance rate
  const { data: attendanceRate } = useQuery({
    queryKey: ["student-attendance", user?.id],
    queryFn: async () => {
      if (!student) return null;
      const { data } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", student.id);

      if (!data || data.length === 0) return null;
      const present = data.filter(a => a.status === "presente").length;
      return Math.round((present / data.length) * 100);
    },
    enabled: !!student,
  });

  // Get upcoming assignments
  const { data: assignments } = useQuery({
    queryKey: ["student-assignments", user?.id],
    queryFn: async () => {
      if (!student?.class_id) return [];
      const { data } = await supabase
        .from("assignments")
        .select(`
          *,
          class_subjects!inner(class_id, subjects(name))
        `)
        .eq("class_subjects.class_id", student.class_id)
        .gte("due_date", new Date().toISOString())
        .order("due_date", { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!student?.class_id,
  });

  // Get student ranking
  const { data: ranking } = useQuery({
    queryKey: ["student-ranking", user?.id],
    queryFn: async () => {
      if (!student) return null;
      const { data } = await supabase
        .from("student_rankings")
        .select("*")
        .eq("student_id", student.id)
        .maybeSingle();
      return data;
    },
    enabled: !!student,
  });

  // Get announcements
  const { data: announcements } = useQuery({
    queryKey: ["student-announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {user?.user_metadata?.full_name || "Estudante"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {student?.classes?.name ? (
            <>Turma {student.classes.name} • {student.classes.grade_level}</>
          ) : (
            "Sistema de Gestão Escolar Anisnofa"
          )}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Minha Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGrade || "—"}</div>
            <p className="text-xs text-muted-foreground">valores (0-20)</p>
            {averageGrade && (
              <Progress 
                value={(parseFloat(averageGrade) / 20) * 100} 
                className="mt-2 h-2"
              />
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assiduidade</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate !== null ? `${attendanceRate}%` : "—"}</div>
            <p className="text-xs text-muted-foreground">taxa de presença</p>
            {attendanceRate !== null && (
              <Progress value={attendanceRate} className="mt-2 h-2" />
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Posição</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ranking?.rank_position ? `${ranking.rank_position}º` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {ranking?.points ? `${ranking.points} pontos` : "no ranking"}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trabalhos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Últimas Notas
            </CardTitle>
            <CardDescription>Avaliações recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {grades && grades.length > 0 ? (
              <div className="space-y-3">
                {grades.slice(0, 5).map((grade: any) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div>
                      <p className="font-medium">{grade.subjects?.name}</p>
                      <p className="text-sm text-muted-foreground">{grade.period}</p>
                    </div>
                    <Badge 
                      variant={grade.grade >= 10 ? "default" : "destructive"}
                      className="text-lg px-3 py-1"
                    >
                      {grade.grade}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma nota registada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Entregas
            </CardTitle>
            <CardDescription>Trabalhos a entregar</CardDescription>
          </CardHeader>
          <CardContent>
            {assignments && assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.class_subjects?.subjects?.name}
                      </p>
                    </div>
                    {assignment.due_date && (
                      <Badge variant="outline">
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

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Avisos Recentes
          </CardTitle>
          <CardDescription>Comunicados da escola</CardDescription>
        </CardHeader>
        <CardContent>
          {announcements && announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement: any) => (
                <div key={announcement.id} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold">{announcement.title}</h4>
                    {announcement.is_pinned && (
                      <Badge variant="secondary" className="shrink-0">Fixado</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {announcement.created_at
                      ? formatDistanceToNow(new Date(announcement.created_at), {
                          addSuffix: true,
                          locale: pt,
                        })
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum aviso publicado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Acesso Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <QuickAction icon={TrendingUp} label="Ver Notas" href="/notas" />
            <QuickAction icon={UserCheck} label="Ver Presenças" href="/presencas" />
            <QuickAction icon={FileText} label="Meus Trabalhos" href="/trabalhos" />
            <QuickAction icon={MessageSquare} label="Mensagens" href="/mensagens" />
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
