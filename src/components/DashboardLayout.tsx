import { ReactNode, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FloatingContactButton } from "@/components/FloatingContactButton";
import { GlobalUserSearch } from "@/components/GlobalUserSearch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList,
  Bell,
  FileText,
  Inbox,
  Check,
  CreditCard,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, role, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications();
  useNotifications(); // Enable push notifications
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Determine dashboard path based on role
  const dashboardPath = role === "professor" 
    ? "/teacher-dashboard" 
    : role === "aluno" 
      ? "/student-dashboard" 
      : role === "encarregado"
        ? "/guardian-dashboard"
        : "/dashboard";

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: dashboardPath, roles: ["admin", "professor", "aluno", "encarregado"] },
    { label: "Utilizadores", icon: Users, href: "/users", roles: ["admin"] },
    { label: "Matrículas", icon: GraduationCap, href: "/enrollment", roles: ["admin"] },
    { label: "Turmas", icon: BookOpen, href: "/classes", roles: ["admin", "professor"] },
    { label: "Notas", icon: ClipboardList, href: "/grades", roles: ["admin", "professor", "aluno", "encarregado"] },
    { label: "Frequência", icon: Calendar, href: "/attendance", roles: ["admin", "professor", "aluno", "encarregado"] },
    { label: "Ranking", icon: Trophy, href: "/ranking", roles: ["admin", "professor", "aluno"] },
    { label: "Trabalhos", icon: BookOpen, href: "/assignments", roles: ["admin", "professor", "aluno"] },
    { label: "Relatórios", icon: FileText, href: "/reports", roles: ["admin", "professor", "aluno", "encarregado"] },
    { label: "Propinas", icon: CreditCard, href: "/tuition", roles: ["admin", "encarregado"] },
    { label: "Mensagens", icon: MessageSquare, href: "/messages", roles: ["admin", "professor", "aluno", "encarregado"] },
    { label: "Avisos", icon: Bell, href: "/announcements", roles: ["admin", "professor", "aluno", "encarregado"] },
    { label: "Contactos", icon: Inbox, href: "/contact-requests", roles: ["admin"] },
    { label: "Meu Perfil", icon: Settings, href: "/profile", roles: ["admin", "professor", "aluno", "encarregado"] },
    { label: "Definições", icon: Settings, href: "/settings", roles: ["admin"] },
  ];

  const filteredNavItems = navItems.filter((item) => !role || item.roles.includes(role));

  const initials = user?.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 px-4 border-b border-sidebar-border">
          <div className="p-2 rounded-lg gradient-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground">Anisnofa</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        
        {/* Footer links */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Link to="/politica-privacidade" className="hover:text-foreground hover:underline">
              Privacidade
            </Link>
            <span>•</span>
            <Link to="/termos" className="hover:text-foreground hover:underline">
              Termos
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center justify-between h-full px-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 flex justify-center">
              <GlobalUserSearch />
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between p-3 border-b border-border">
                    <h4 className="font-semibold">Notificações</h4>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs h-7"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Marcar todas como lidas
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-80">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Bell className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">Sem notificações</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => {
                              markAsRead(notification.id);
                              if (notification.type === "message") {
                                navigate("/messages");
                              } else {
                                navigate("/announcements");
                              }
                            }}
                            className={cn(
                              "w-full p-3 text-left hover:bg-muted/50 transition-colors",
                              !notification.read && "bg-accent/30"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-full",
                                notification.type === "message" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                              )}>
                                {notification.type === "message" ? (
                                  <MessageSquare className="h-4 w-4" />
                                ) : (
                                  <Bell className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{notification.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{notification.content}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: pt })}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <ThemeToggle />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">{user?.user_metadata?.full_name || "Utilizador"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Terminar sessão
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      <FloatingContactButton />
    </div>
  );
}
