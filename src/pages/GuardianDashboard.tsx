import { useAuth } from "@/hooks/useAuth";
import { useGuardianStudents } from "@/hooks/useGuardianStudents";
import { useTuitionPayments } from "@/hooks/useTuitionPayments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  CreditCard, 
  GraduationCap, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Bell,
  Calendar,
  TrendingUp,
  BookOpen,
  User
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Link } from "react-router-dom";

export default function GuardianDashboard() {
  const { user, role } = useAuth();
  const { data: students, isLoading: studentsLoading } = useGuardianStudents();
  const { data: payments, isLoading: paymentsLoading } = useTuitionPayments();

  // Fetch announcements for guardians
  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ["guardian-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch recent grades for students
  const { data: recentGrades, isLoading: gradesLoading } = useQuery({
    queryKey: ["guardian-recent-grades", students],
    queryFn: async () => {
      if (!students || students.length === 0) return [];
      
      const studentIds = students.map(gs => gs.student.id);
      
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select(`
          *,
          subject:subjects(name)
        `)
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(10);

      if (gradesError) throw gradesError;

      // Enrich with student names from our existing data
      const enrichedGrades = gradesData.map(grade => {
        const studentInfo = students.find(gs => gs.student.id === grade.student_id);
        return {
          ...grade,
          studentName: studentInfo?.student.profile?.full_name || "—"
        };
      });

      return enrichedGrades;
    },
    enabled: !!students && students.length > 0,
  });

  // Calculate stats
  const pendingPayments = payments?.filter(p => p.payment_status === "pending" || p.payment_status === "overdue") || [];
  const totalPending = pendingPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const overduePayments = payments?.filter(p => p.payment_status === "overdue") || [];

  if (role !== "encarregado") {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Esta página é apenas para encarregados de educação.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Bem-vindo, Encarregado
        </h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe o progresso dos seus educandos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Educandos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{students?.length || 0}</div>
                <p className="text-xs text-muted-foreground">matriculados</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Propinas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-warning">
                  {pendingPayments.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalPending.toLocaleString("pt-AO")} Kz
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive">
                  {overduePayments.length}
                </div>
                <p className="text-xs text-muted-foreground">pagamentos</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notas Recentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {gradesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{recentGrades?.length || 0}</div>
                <p className="text-xs text-muted-foreground">últimos 30 dias</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Students Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Meus Educandos
            </CardTitle>
            <CardDescription>
              Alunos associados à sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : students && students.length > 0 ? (
              <div className="space-y-4">
                {students.map((gs) => (
                  <div key={gs.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={gs.student.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {gs.student.profile?.full_name
                          ?.split(" ")
                          .map(n => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase() || <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold">{gs.student.profile?.full_name || "—"}</h4>
                      <p className="text-sm text-muted-foreground">
                        {gs.student.class?.name || "Sem turma"} • {gs.student.class?.grade_level || "—"}
                      </p>
                      {gs.student.student_number && (
                        <p className="text-xs text-muted-foreground">
                          Nº {gs.student.student_number}
                        </p>
                      )}
                    </div>
                    {gs.is_primary && (
                      <Badge variant="outline" className="shrink-0">Principal</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum educando associado</p>
                <p className="text-sm">Contacte a administração</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Propinas Pendentes
              </CardTitle>
              <CardDescription>
                Pagamentos a efetuar
              </CardDescription>
            </div>
            <Link to="/propinas">
              <Button variant="outline" size="sm">Ver todas</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : pendingPayments.length > 0 ? (
              <ScrollArea className="h-[280px]">
                <div className="space-y-3">
                  {pendingPayments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <p className="font-medium">{payment.description || "Propina Mensal"}</p>
                        <p className="text-sm text-muted-foreground">
                          Vence: {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: pt })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{Number(payment.amount).toLocaleString("pt-AO")} Kz</p>
                        <Badge 
                          variant={payment.payment_status === "overdue" ? "destructive" : "secondary"}
                        >
                          {payment.payment_status === "overdue" ? "Em atraso" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success opacity-50" />
                <p>Sem pagamentos pendentes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Notas Recentes
            </CardTitle>
            <CardDescription>
              Últimas avaliações dos seus educandos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gradesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : recentGrades && recentGrades.length > 0 ? (
              <ScrollArea className="h-[280px]">
                <div className="space-y-3">
                  {recentGrades.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <p className="font-medium">{grade.subject?.name || "—"}</p>
                        <p className="text-sm text-muted-foreground">
                          {grade.studentName}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            (grade.grade ?? 0) >= 14 
                              ? "default" 
                              : (grade.grade ?? 0) >= 10 
                                ? "secondary" 
                                : "destructive"
                          }
                          className="text-lg px-3 py-1"
                        >
                          {grade.grade ?? "—"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(grade.created_at!), "dd/MM", { locale: pt })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sem notas recentes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Anúncios
              </CardTitle>
              <CardDescription>
                Comunicados recentes da escola
              </CardDescription>
            </div>
            <Link to="/anuncios">
              <Button variant="outline" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {announcementsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : announcements && announcements.length > 0 ? (
              <ScrollArea className="h-[280px]">
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium line-clamp-1">{announcement.title}</h4>
                        {announcement.is_pinned && (
                          <Badge variant="secondary" className="shrink-0">Fixado</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(announcement.created_at!), "dd/MM/yyyy", { locale: pt })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sem anúncios recentes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
