import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Pin, Plus, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const roleLabels: Record<AppRole, string> = {
  admin: "Administradores",
  professor: "Professores",
  aluno: "Alunos",
  encarregado: "Encarregados",
};

export default function Announcements() {
  const { role } = useAuth();
  const { data: announcements, isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    target_roles: [] as AppRole[],
    is_pinned: false,
    expires_at: "",
  });

  const canCreate = role === "admin" || role === "professor";

  const handleRoleToggle = (toggledRole: AppRole) => {
    setNewAnnouncement((prev) => ({
      ...prev,
      target_roles: prev.target_roles.includes(toggledRole)
        ? prev.target_roles.filter((r) => r !== toggledRole)
        : [...prev.target_roles, toggledRole],
    }));
  };

  const handleCreate = () => {
    createAnnouncement.mutate(
      {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        target_roles: newAnnouncement.target_roles.length > 0 ? newAnnouncement.target_roles : undefined,
        is_pinned: newAnnouncement.is_pinned,
        expires_at: newAnnouncement.expires_at || undefined,
      },
      {
        onSuccess: () => {
          setNewAnnouncement({ title: "", content: "", target_roles: [], is_pinned: false, expires_at: "" });
          setDialogOpen(false);
        },
      }
    );
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Avisos</h1>
          <p className="text-muted-foreground">Comunicados e anúncios da escola</p>
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Aviso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Novo Aviso</DialogTitle>
                <DialogDescription>Preencha os dados do aviso</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="Título do aviso"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    placeholder="Escreva o conteúdo do aviso..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destinatários (deixe vazio para todos)</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["admin", "professor", "aluno", "encarregado"] as AppRole[]).map((r) => (
                      <label key={r} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={newAnnouncement.target_roles.includes(r)}
                          onCheckedChange={() => handleRoleToggle(r)}
                        />
                        <span className="text-sm">{roleLabels[r]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expira em (opcional)</Label>
                    <Input
                      type="datetime-local"
                      value={newAnnouncement.expires_at}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, expires_at: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={newAnnouncement.is_pinned}
                        onCheckedChange={(checked) =>
                          setNewAnnouncement({ ...newAnnouncement, is_pinned: checked as boolean })
                        }
                      />
                      <span className="text-sm">Fixar aviso</span>
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={!newAnnouncement.title || !newAnnouncement.content}>
                  Publicar Aviso
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : announcements?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Sem avisos</h3>
            <p className="text-muted-foreground text-center mt-1">
              Não há avisos publicados de momento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements?.map((announcement) => (
            <Card key={announcement.id} className={announcement.is_pinned ? "border-primary/50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {announcement.author && (
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(announcement.author.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        {announcement.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      </div>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>{announcement.author?.full_name || "Sistema"}</span>
                        <span>•</span>
                        <span>
                          {announcement.created_at &&
                            format(new Date(announcement.created_at), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {announcement.target_roles && announcement.target_roles.length > 0 && (
                      <div className="flex gap-1">
                        {announcement.target_roles.map((r) => (
                          <Badge key={r} variant="outline" className="text-xs">
                            {roleLabels[r]}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {role === "admin" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar aviso?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser revertida.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAnnouncement.mutate(announcement.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
                {announcement.expires_at && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Expira em{" "}
                      {format(new Date(announcement.expires_at), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
