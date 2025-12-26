import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGrades, useCreateGrade, useStudentGrades, GradePeriod } from "@/hooks/useGrades";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useStudentsByClass } from "@/hooks/useStudents";
import { useStudentsLimitedByClass } from "@/hooks/useStudentsLimited";
import { useTeacherUniqueClasses, useTeacherClasses } from "@/hooks/useTeacherClasses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const periodLabels: Record<GradePeriod, string> = {
  "1_trimestre": "1º Trimestre",
  "2_trimestre": "2º Trimestre",
  "3_trimestre": "3º Trimestre",
  final: "Final",
};

export default function Grades() {
  const { role, user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<GradePeriod | "">("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGrade, setNewGrade] = useState({ student_id: "", grade: "", description: "" });

  // For admin, use all classes. For professor, use only their classes
  const { data: allClasses } = useClasses();
  const { data: teacherClasses } = useTeacherUniqueClasses();
  const { data: teacherClassSubjects } = useTeacherClasses();
  const { data: subjects } = useSubjects();
  
  // Use appropriate class list based on role
  const classes = role === "professor" ? teacherClasses : allClasses;
  
  // For professor, filter subjects to only those they teach in the selected class
  const availableSubjects = role === "professor" && selectedClass
    ? subjects?.filter((s) => teacherClassSubjects?.some((tc) => tc.subject_id === s.id && tc.id === selectedClass) ||
        teacherClassSubjects?.some((tc) => tc.subject_id === s.id))
    : subjects;

  // For admin, use full student data. For professor, use limited view
  const { data: classStudentsFull } = useStudentsByClass(role === "admin" ? selectedClass || null : null);
  const { data: classStudentsLimited } = useStudentsLimitedByClass(role === "professor" ? selectedClass || null : null);
  const classStudents = role === "professor" 
    ? classStudentsLimited?.map(s => ({ id: s.student_id, profile: { full_name: s.full_name } }))
    : classStudentsFull;
  
  // Get current student ID if user is a student
  const { data: currentStudent } = useQuery({
    queryKey: ["current_student", user?.id],
    queryFn: async () => {
      if (!user || role !== "aluno") return null;
      const { data } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: role === "aluno" && !!user,
  });

  // For students, show their own grades
  const { data: studentGrades, isLoading: studentGradesLoading } = useStudentGrades(
    role === "aluno" ? currentStudent?.id || null : null
  );

  // For admin/professor, show filtered grades
  const { data: allGrades, isLoading: allGradesLoading } = useGrades(
    role !== "aluno"
      ? {
          classId: selectedClass || undefined,
          subjectId: selectedSubject || undefined,
          period: (selectedPeriod as GradePeriod) || undefined,
        }
      : undefined
  );

  const createGrade = useCreateGrade();

  const isLoading = role === "aluno" ? studentGradesLoading : allGradesLoading;
  const grades = role === "aluno" ? studentGrades : allGrades;

  const handleCreateGrade = () => {
    if (!selectedClass || !selectedSubject || !selectedPeriod || !newGrade.student_id || !newGrade.grade) return;

    createGrade.mutate(
      {
        student_id: newGrade.student_id,
        subject_id: selectedSubject,
        class_id: selectedClass,
        period: selectedPeriod as GradePeriod,
        grade: parseFloat(newGrade.grade),
        description: newGrade.description || undefined,
      },
      {
        onSuccess: () => {
          setNewGrade({ student_id: "", grade: "", description: "" });
          setDialogOpen(false);
        },
      }
    );
  };

  const getGradeBadgeColor = (grade: number | null) => {
    if (grade === null) return "secondary";
    if (grade >= 14) return "default";
    if (grade >= 10) return "secondary";
    return "destructive";
  };

  // Student view
  if (role === "aluno") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">As Minhas Notas</h1>
          <p className="text-muted-foreground">Consulte as suas notas por disciplina e período</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
            <CardDescription>Histórico de avaliações</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades?.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.subject?.name || "-"}</TableCell>
                        <TableCell>{periodLabels[grade.period]}</TableCell>
                        <TableCell>
                          <Badge variant={getGradeBadgeColor(grade.grade)}>
                            {grade.grade !== null ? grade.grade.toFixed(1) : "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{grade.description || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {grades?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Sem notas registadas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin/Professor view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Notas</h1>
        <p className="text-muted-foreground">Lançar e consultar notas dos alunos</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Notas</CardTitle>
            <CardDescription>Filtre por turma, disciplina e período</CardDescription>
          </div>
          {(role === "admin" || role === "professor") && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={!selectedClass || !selectedSubject || !selectedPeriod}>
                  <Plus className="h-4 w-4" />
                  Lançar Nota
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lançar Nova Nota</DialogTitle>
                  <DialogDescription>Selecione o aluno e insira a nota</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Aluno</Label>
                    <Select value={newGrade.student_id} onValueChange={(v) => setNewGrade({ ...newGrade, student_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {classStudents?.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.profile?.full_name || "Sem nome"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nota (0-20)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={newGrade.grade}
                      onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value })}
                      placeholder="Ex: 15.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações (opcional)</Label>
                    <Input
                      value={newGrade.description}
                      onChange={(e) => setNewGrade({ ...newGrade, description: e.target.value })}
                      placeholder="Comentário sobre a avaliação"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateGrade} disabled={!newGrade.student_id || !newGrade.grade}>
                    Lançar Nota
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar turma" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar disciplina" />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as GradePeriod | "")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1_trimestre">1º Trimestre</SelectItem>
                <SelectItem value="2_trimestre">2º Trimestre</SelectItem>
                <SelectItem value="3_trimestre">3º Trimestre</SelectItem>
                <SelectItem value="final">Final</SelectItem>
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
                    <TableHead>Turma</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades?.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">
                        {grade.student?.profile?.full_name || "-"}
                      </TableCell>
                      <TableCell>{grade.class?.name || "-"}</TableCell>
                      <TableCell>{grade.subject?.name || "-"}</TableCell>
                      <TableCell>{periodLabels[grade.period]}</TableCell>
                      <TableCell>
                        <Badge variant={getGradeBadgeColor(grade.grade)}>
                          {grade.grade !== null ? grade.grade.toFixed(1) : "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {grade.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {grades?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {selectedClass && selectedSubject && selectedPeriod
                          ? "Sem notas registadas para esta seleção"
                          : "Selecione uma turma, disciplina e período para ver as notas"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
