import { useState } from "react";
import { useGuardians, useUpdateGuardian, useLinkStudentToGuardian, useUnlinkStudentFromGuardian } from "@/hooks/useGuardians";
import { useStudents } from "@/hooks/useStudents";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Edit, UserPlus, X, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function GuardianManagement() {
  const [search, setSearch] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<{
    id: string;
    relationship: string;
    occupation: string;
  } | null>(null);
  const [linkData, setLinkData] = useState<{
    guardianId: string;
    studentId: string;
    isPrimary: boolean;
  }>({ guardianId: "", studentId: "", isPrimary: false });

  const { data: guardians, isLoading } = useGuardians();
  const { data: students } = useStudents();
  const updateGuardian = useUpdateGuardian();
  const linkStudent = useLinkStudentToGuardian();
  const unlinkStudent = useUnlinkStudentFromGuardian();

  const filteredGuardians = guardians?.filter((guardian) => {
    return (
      guardian.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      guardian.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      guardian.students?.some((s) =>
        s.student?.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    );
  });

  const handleEdit = (guardian: typeof guardians[0]) => {
    setSelectedGuardian({
      id: guardian.id,
      relationship: guardian.relationship || "",
      occupation: guardian.occupation || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedGuardian) return;
    updateGuardian.mutate(
      {
        id: selectedGuardian.id,
        relationship: selectedGuardian.relationship || undefined,
        occupation: selectedGuardian.occupation || undefined,
      },
      {
        onSuccess: () => setEditDialogOpen(false),
      }
    );
  };

  const handleOpenLinkDialog = (guardianId: string) => {
    setLinkData({ guardianId, studentId: "", isPrimary: false });
    setLinkDialogOpen(true);
  };

  const handleLink = () => {
    if (!linkData.guardianId || !linkData.studentId) return;
    linkStudent.mutate(
      {
        guardianId: linkData.guardianId,
        studentId: linkData.studentId,
        isPrimary: linkData.isPrimary,
      },
      {
        onSuccess: () => {
          setLinkDialogOpen(false);
          setLinkData({ guardianId: "", studentId: "", isPrimary: false });
        },
      }
    );
  };

  // Get students not yet linked to the current guardian
  const getAvailableStudents = (guardianId: string) => {
    const guardian = guardians?.find((g) => g.id === guardianId);
    const linkedStudentIds = guardian?.students?.map((s) => s.student_id) || [];
    return students?.filter((s) => !linkedStudentIds.includes(s.id)) || [];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gestão de Encarregados
        </CardTitle>
        <CardDescription>Gerir encarregados e associar educandos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome do encarregado ou educando..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Encarregado</TableHead>
                  <TableHead>Parentesco</TableHead>
                  <TableHead>Educandos</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuardians?.map((guardian) => (
                  <TableRow key={guardian.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {guardian.profile?.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{guardian.profile?.full_name || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{guardian.occupation || "-"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{guardian.relationship || "Não definido"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {guardian.students && guardian.students.length > 0 ? (
                          guardian.students.map((gs) => (
                            <div key={gs.id} className="flex items-center gap-1">
                              <Badge variant={gs.is_primary ? "default" : "secondary"}>
                                {gs.student?.profile?.full_name || "Aluno"}
                                {gs.is_primary && " (P)"}
                              </Badge>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5">
                                    <X className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Desassociar educando?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      O educando será removido da lista deste encarregado.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => unlinkStudent.mutate(gs.id)}>
                                      Confirmar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem educandos</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>
                        <p className="text-sm">{guardian.profile?.email || "-"}</p>
                        <p className="text-xs">{guardian.profile?.phone || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenLinkDialog(guardian.id)}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(guardian)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredGuardians?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum encarregado encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Guardian Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Encarregado</DialogTitle>
              <DialogDescription>Atualize as informações do encarregado</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Parentesco</Label>
                <Select
                  value={selectedGuardian?.relationship || ""}
                  onValueChange={(v) =>
                    setSelectedGuardian((prev) => (prev ? { ...prev, relationship: v } : null))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar parentesco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pai">Pai</SelectItem>
                    <SelectItem value="Mãe">Mãe</SelectItem>
                    <SelectItem value="Avô">Avô</SelectItem>
                    <SelectItem value="Avó">Avó</SelectItem>
                    <SelectItem value="Tio">Tio</SelectItem>
                    <SelectItem value="Tia">Tia</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profissão</Label>
                <Input
                  value={selectedGuardian?.occupation || ""}
                  onChange={(e) =>
                    setSelectedGuardian((prev) => (prev ? { ...prev, occupation: e.target.value } : null))
                  }
                  placeholder="Ex: Professor, Engenheiro..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateGuardian.isPending}>
                {updateGuardian.isPending ? "A guardar..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Link Student Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Associar Educando</DialogTitle>
              <DialogDescription>Selecione um aluno para associar a este encarregado</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Aluno</Label>
                <Select value={linkData.studentId} onValueChange={(v) => setLinkData((prev) => ({ ...prev, studentId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStudents(linkData.guardianId).map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.profile?.full_name || "Sem nome"} - {student.student_number || "S/N"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrimary"
                  checked={linkData.isPrimary}
                  onCheckedChange={(checked) => setLinkData((prev) => ({ ...prev, isPrimary: !!checked }))}
                />
                <Label htmlFor="isPrimary" className="text-sm">
                  Encarregado principal deste educando
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleLink} disabled={!linkData.studentId || linkStudent.isPending}>
                {linkStudent.isPending ? "A associar..." : "Associar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
