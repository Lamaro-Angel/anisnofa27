import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, User, Mail, Phone, GraduationCap, BookOpen, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchableUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  professor: "Professor",
  aluno: "Aluno",
  encarregado: "Encarregado",
};

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Users className="h-3 w-3" />,
  professor: <BookOpen className="h-3 w-3" />,
  aluno: <GraduationCap className="h-3 w-3" />,
  encarregado: <Users className="h-3 w-3" />,
};

const roleBadgeVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  admin: "destructive",
  professor: "default",
  aluno: "secondary",
  encarregado: "outline",
};

export function GlobalUserSearch() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["searchable-users"],
    queryFn: async () => {
      // Fetch profiles that the user can see based on RLS
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url")
        .order("full_name");

      if (profilesError) throw profilesError;

      // Fetch roles for these users
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles: SearchableUser[] = profiles.map((profile) => ({
        ...profile,
        role: roles?.find((r) => r.user_id === profile.id)?.role || null,
      }));

      return usersWithRoles;
    },
    enabled: !!user && open,
  });

  const filteredUsers = useMemo(() => {
    if (!users || !searchQuery.trim()) return users || [];
    
    const query = searchQuery.toLowerCase().trim();
    return users.filter((u) => 
      u.full_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      (u.role && roleLabels[u.role]?.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Pesquisar utilizadores</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pesquisar Utilizadores
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, email ou tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <div className="space-y-2">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {u.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{u.full_name}</p>
                        {u.role && (
                          <Badge variant={roleBadgeVariants[u.role] || "secondary"} className="gap-1 shrink-0">
                            {roleIcons[u.role]}
                            {roleLabels[u.role] || u.role}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {u.email}
                        </span>
                        {u.phone && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Phone className="h-3 w-3" />
                            {u.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {searchQuery
                    ? "Nenhum utilizador encontrado"
                    : "Digite para pesquisar utilizadores"}
                </p>
              </div>
            )}
          </ScrollArea>

          {filteredUsers && filteredUsers.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {filteredUsers.length} utilizador{filteredUsers.length !== 1 ? "es" : ""} encontrado{filteredUsers.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
