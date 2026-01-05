import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, GraduationCap, Bell, TrendingUp, Calendar, MessageSquare, CheckCircle, Clock, UserCheck, Wifi, UserCog } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements();
  const { onlineCount } = useOnlinePresence();

  // Redirect to role-specific dashboards
  useEffect(() => {
    if (role === "professor") {
      navigate("/teacher-dashboard", { replace: true });
    } else if (role === "aluno") {
      navigate("/student-dashboard", { replace: true });
    } else if (role === "encarregado") {
      navigate("/guardian-dashboard", { replace: true });
    }
  }, [role, navigate]);

  const roleLabels = {
    admin: "Administrador",
    professor: "Professor",
    aluno: "Aluno",
    encarregado: "Encarregado de Educação",
  };

  const recentAnnouncements = announcements?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Bem-vindo, {user?.user_metadata?.full_name || user?.email?.split("@")[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Painel de {role ? roleLabels[role] : "Utilizador"} • Sistema de Gestão Escolar Anisnofa
        </p>
      </div>

      {/* Admin Stats Cards */}
      {role === "admin" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Utilizadores</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">registados na plataforma</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="card-hover border-green-500/20 bg-green-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Utilizadores Online</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{onlineCount}</div>
              <p className="text-xs text-muted-foreground">ativos agora</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                  <p className="text-xs text-muted-foreground">matriculados</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Encarregados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalGuardians || 0}</div>
                  <p className="text-xs text-muted-foreground">registados</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Regular Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">matriculados</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Turmas Ativas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
                <p className="text-xs text-muted-foreground">{stats?.totalTeachers || 0} professores</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {role === "aluno" ? "Minha Média" : "Média Geral"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.averageGrade !== null ? stats.averageGrade : "—"}
                </div>
                <p className="text-xs text-muted-foreground">valores (0-20)</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {role === "aluno" ? "Taxa Presença" : "Presenças"}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.attendanceRate !== null ? `${stats.attendanceRate}%` : "—"}
                </div>
                <p className="text-xs text-muted-foreground">taxa de assiduidade</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.unreadMessages || 0}</div>
                <p className="text-xs text-muted-foreground">não lidas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avisos Ativos</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalAnnouncements || 0}</div>
                <p className="text-xs text-muted-foreground">publicados</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Professores</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
                <p className="text-xs text-muted-foreground">no quadro</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity and Announcements */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity (Admin only) */}
        {role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Atividade Recente
              </CardTitle>
              <CardDescription>Últimas ações no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.created_at
                            ? formatDistanceToNow(new Date(activity.created_at), {
                                addSuffix: true,
                                locale: pt,
                              })
                            : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Announcements */}
        <Card className={role !== "admin" ? "md:col-span-2" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Avisos Recentes
            </CardTitle>
            <CardDescription>Comunicados da escola</CardDescription>
          </CardHeader>
          <CardContent>
            {announcementsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold">{announcement.title}</h4>
                      {announcement.is_pinned && (
                        <Badge variant="secondary" className="shrink-0">
                          Fixado
                        </Badge>
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

        {/* Quick Actions for non-admin */}
        {role !== "admin" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Acesso Rápido
              </CardTitle>
              <CardDescription>Ações frequentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {role === "professor" && (
                  <>
                    <QuickAction icon={BookOpen} label="Lançar Notas" href="/notas" />
                    <QuickAction icon={UserCheck} label="Registar Presenças" href="/presencas" />
                    <QuickAction icon={MessageSquare} label="Enviar Mensagem" href="/mensagens" />
                  </>
                )}
                {role === "aluno" && (
                  <>
                    <QuickAction icon={TrendingUp} label="Ver Minhas Notas" href="/notas" />
                    <QuickAction icon={UserCheck} label="Ver Presenças" href="/presencas" />
                    <QuickAction icon={MessageSquare} label="Contactar Professor" href="/mensagens" />
                  </>
                )}
                {role === "encarregado" && (
                  <>
                    <QuickAction icon={TrendingUp} label="Notas do Educando" href="/notas" />
                    <QuickAction icon={UserCheck} label="Presenças do Educando" href="/presencas" />
                    <QuickAction icon={MessageSquare} label="Falar com Escola" href="/mensagens" />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
