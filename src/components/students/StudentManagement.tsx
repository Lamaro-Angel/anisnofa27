import { useState } from "react";
import { useStudents, useUpdateStudent } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Edit, GraduationCap } from "lucide-react";

export default function StudentManagement() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    student_number: string;
    class_id: string | null;
  } | null>(null);

  const { data: students, isLoading } = useStudents();
  const { data: classes } = useClasses();
  const updateStudent = useUpdateStudent();

  const filteredStudents = students?.filter((student) => {
    const matchesSearch = student.profile?.full_name
      ?.toLowerCase()
      .includes(search.toLowerCase()) ||
      student.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      student.student_number?.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === "all" || student.class_id === classFilter;
    return matchesSearch && matchesClass;
  });

  const handleEdit = (student: typeof students[0]) => {
    setSelectedStudent({
      id: student.id,
      student_number: student.student_number || "",
      class_id: student.class_id,
    });
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedStudent) return;
    updateStudent.mutate(
      {
        id: selectedStudent.id,
        student_number: selectedStudent.student_number || undefined,
        class_id: selectedStudent.class_id,
      },
      {
        onSuccess: () => setEditDialogOpen(false),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Gestão de Alunos
        </CardTitle>
        <CardDescription>Gerir informações e turmas dos alunos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, email ou número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por turma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as turmas</SelectItem>
              {classes?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} - {cls.grade_level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <TableHead>Aluno</TableHead>
                  <TableHead>Nº de Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents?.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {student.profile?.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.profile?.full_name || "Sem nome"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.student_number || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      {student.class ? (
                        <Badge variant="secondary">
                          {student.class.name} - {student.class.grade_level}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Sem turma</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.profile?.email || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(student)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum aluno encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Aluno</DialogTitle>
              <DialogDescription>Atualize as informações do aluno</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Número de Aluno</Label>
                <Input
                  value={selectedStudent?.student_number || ""}
                  onChange={(e) =>
                    setSelectedStudent((prev) =>
                      prev ? { ...prev, student_number: e.target.value } : null
                    )
                  }
                  placeholder="Ex: 2024001"
                />
              </div>
              <div className="space-y-2">
                <Label>Turma</Label>
                <Select
                  value={selectedStudent?.class_id || "none"}
                  onValueChange={(v) =>
                    setSelectedStudent((prev) =>
                      prev ? { ...prev, class_id: v === "none" ? null : v } : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem turma</SelectItem>
                    {classes?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.grade_level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={updateStudent.isPending}>
                {updateStudent.isPending ? "A guardar..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
