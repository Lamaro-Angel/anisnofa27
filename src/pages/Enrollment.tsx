import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useClasses } from "@/hooks/useClasses";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Search, GraduationCap, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";

export default function Enrollment() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: users, isLoading: usersLoading } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [studentNumber, setStudentNumber] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);

    // Se a página foi aberta via link /enrollment?classId=..., limpar o parâmetro ao fechar
    if (!open && searchParams.get("classId")) {
      const next = new URLSearchParams(searchParams);
      next.delete("classId");
      setSearchParams(next, { replace: true });
    }
  };

  // Preselecionar turma via query param (atalho desde Gestão de Turmas)
  useEffect(() => {
    const classId = searchParams.get("classId");
    if (!classId) return;

    setSelectedClass(classId);
    setDialogOpen(true);
  }, [searchParams]);

  // Realtime: atualizar listas quando houver mudanças em matrículas
  useEffect(() => {
    const channel = supabase
      .channel("students-realtime-enrollment")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["enrolled-students"] });
          queryClient.invalidateQueries({ queryKey: ["classes"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Get all enrolled students with their classes
  const { data: enrolledStudents, isLoading: studentsLoading } = useQuery({
    queryKey: ["enrolled-students"],
    queryFn: async () => {
      const { data: students, error } = await supabase
        .from("students")
        .select(`
          id,
          student_number,
          enrollment_date,
          user_id,
          class_id
        `)
        .order("enrollment_date", { ascending: false });

      if (error) throw error;

      // Get profiles for the students
      const userIds = students.map((s) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      // Get classes
      const classIds = students.filter((s) => s.class_id).map((s) => s.class_id) as string[];
      const { data: classesData } = classIds.length
        ? await supabase.from("classes").select("id, name, grade_level").in("id", classIds)
        : { data: [] };

      return students.map((student) => ({
        ...student,
        profile: profiles?.find((p) => p.id === student.user_id),
        class: classesData?.find((c) => c.id === student.class_id),
      }));
    },
  });

  // Filter users who are students (have role 'aluno') but are not yet enrolled
  const enrolledUserIds = new Set(enrolledStudents?.map((s) => s.user_id) || []);
  const availableStudents = users?.filter(
    (u) =>
      u.role === "aluno" &&
      !enrolledUserIds.has(u.id) &&
      (u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Search for enrolled students
  const filteredEnrolled = enrolledStudents?.filter(
    (s) =>
      s.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEnroll = async () => {
    if (!selectedUser || !selectedClass) {
      toast({ title: "Selecione um aluno e uma turma", variant: "destructive" });
      return;
    }

    setEnrolling(true);
    try {
      // Check if student record already exists
      const { data: existingStudent } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", selectedUser)
        .maybeSingle();

      if (existingStudent) {
        // Update existing record with class
        const { error } = await supabase
          .from("students")
          .update({
            class_id: selectedClass,
            student_number: studentNumber || null,
            enrollment_date: new Date().toISOString().split("T")[0],
          })
          .eq("id", existingStudent.id);

        if (error) throw error;
      } else {
        // Create new student record
        const { error } = await supabase.from("students").insert({
          user_id: selectedUser,
          class_id: selectedClass,
          student_number: studentNumber || null,
          enrollment_date: new Date().toISOString().split("T")[0],
        });

        if (error) throw error;
      }

      toast({ title: "Aluno matriculado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["enrolled-students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setDialogOpen(false);
      setSelectedUser(null);
      setSelectedClass("");
      setStudentNumber("");
    } catch (error: any) {
      toast({ title: "Erro ao matricular aluno", description: error.message, variant: "destructive" });
    } finally {
      setEnrolling(false);
    }
  };

  const handleUpdateClass = async (studentId: string, newClassId: string) => {
    try {
      const { error } = await supabase
        .from("students")
        .update({ class_id: newClassId })
        .eq("id", studentId);

      if (error) throw error;

      toast({ title: "Turma atualizada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["enrolled-students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar turma", description: error.message, variant: "destructive" });
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const isLoading = classesLoading || usersLoading || studentsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Matrículas</h1>
          <p className="text-muted-foreground">Matricular e gerir alunos nas turmas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Matricular Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Matricular Novo Aluno</DialogTitle>
              <DialogDescription>
                Selecione um utilizador com papel de aluno e atribua uma turma
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Aluno</Label>
                <Select value={selectedUser || ""} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <span>{user.full_name}</span>
                          <span className="text-muted-foreground text-xs">({user.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                    {availableStudents?.length === 0 && (
                      <div className="p-2 text-center text-muted-foreground text-sm">
                        Nenhum aluno disponível para matrícula
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Turma</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.grade_level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número de Aluno (opcional)</Label>
                <Input
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  placeholder="Ex: 2024001"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEnroll} disabled={!selectedUser || !selectedClass || enrolling}>
                {enrolling ? "A matricular..." : "Matricular"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Matriculados</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledStudents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">alunos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Turmas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">turmas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableStudents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">por matricular</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alunos Matriculados</CardTitle>
          <CardDescription>Lista de todos os alunos matriculados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, email ou número..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                    <TableHead>Aluno</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Data Matrícula</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrolled?.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {student.profile?.full_name ? getInitials(student.profile.full_name) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.profile?.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{student.profile?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.student_number || "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={student.class_id || ""}
                          onValueChange={(value) => handleUpdateClass(student.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Sem turma" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes?.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.enrollment_date
                          ? new Date(student.enrollment_date).toLocaleDateString("pt-PT")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Matriculado</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEnrolled?.length === 0 && (
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
        </CardContent>
      </Card>
    </div>
  );
}
