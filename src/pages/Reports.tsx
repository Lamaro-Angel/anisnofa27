import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Printer, GraduationCap, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function Reports() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  // Fetch students based on role
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["report-students", role, user?.id],
    queryFn: async () => {
      if (role === "admin" || role === "professor") {
        const { data, error } = await supabase
          .from("students")
          .select(`
            id,
            student_number,
            user_id,
            class_id,
            enrollment_date,
            classes(id, name, grade_level)
          `);
        if (error) throw error;
        
        // Get profiles
        const userIds = data.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        
        return data.map(student => ({
          ...student,
          profile: profiles?.find(p => p.id === student.user_id)
        }));
      } else if (role === "aluno") {
        const { data, error } = await supabase
          .from("students")
          .select(`
            id,
            student_number,
            user_id,
            class_id,
            enrollment_date,
            classes(id, name, grade_level)
          `)
          .eq("user_id", user?.id)
          .single();
        if (error) throw error;
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", data.user_id)
          .single();
        
        return [{ ...data, profile }];
      } else if (role === "encarregado") {
        // Get guardian's students
        const { data: guardian } = await supabase
          .from("guardians")
          .select("id")
          .eq("user_id", user?.id)
          .single();
        
        if (!guardian) return [];
        
        const { data: guardianStudents } = await supabase
          .from("guardian_students")
          .select("student_id")
          .eq("guardian_id", guardian.id);
        
        if (!guardianStudents?.length) return [];
        
        const studentIds = guardianStudents.map(gs => gs.student_id);
        const { data, error } = await supabase
          .from("students")
          .select(`
            id,
            student_number,
            user_id,
            class_id,
            enrollment_date,
            classes(id, name, grade_level)
          `)
          .in("id", studentIds);
        
        if (error) throw error;
        
        const userIds = data.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        
        return data.map(student => ({
          ...student,
          profile: profiles?.find(p => p.id === student.user_id)
        }));
      }
      return [];
    },
    enabled: !!user && !!role,
  });

  // Set first student as default
  useState(() => {
    if (students?.length && !selectedStudent) {
      setSelectedStudent(students[0].id);
    }
  });

  // Fetch grades for selected student
  const { data: grades, isLoading: loadingGrades } = useQuery({
    queryKey: ["report-grades", selectedStudent, selectedPeriod],
    queryFn: async () => {
      if (!selectedStudent) return [];
      
      let query = supabase
        .from("grades")
        .select(`
          id,
          grade,
          period,
          description,
          created_at,
          subjects(id, name, code)
        `)
        .eq("student_id", selectedStudent);
      
      if (selectedPeriod !== "all" && (selectedPeriod === "1_trimestre" || selectedPeriod === "2_trimestre" || selectedPeriod === "3_trimestre" || selectedPeriod === "final")) {
        query = query.eq("period", selectedPeriod as "1_trimestre" | "2_trimestre" | "3_trimestre" | "final");
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudent,
  });

  // Fetch attendance for selected student
  const { data: attendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ["report-attendance", selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return { total: 0, present: 0, absent: 0, late: 0, justified: 0 };
      
      const { data, error } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", selectedStudent);
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        present: data.filter(a => a.status === "presente").length,
        absent: data.filter(a => a.status === "falta").length,
        late: data.filter(a => a.status === "atraso").length,
        justified: data.filter(a => a.status === "justificado").length,
      };
      
      return stats;
    },
    enabled: !!selectedStudent,
  });

  const selectedStudentData = students?.find(s => s.id === selectedStudent);

  // Calculate average grade
  const averageGrade = grades?.length 
    ? (grades.reduce((sum, g) => sum + (g.grade || 0), 0) / grades.length).toFixed(1)
    : "N/A";

  const attendanceRate = attendance?.total 
    ? ((attendance.present / attendance.total) * 100).toFixed(1)
    : "N/A";

  const handlePrint = () => {
    window.print();
  };

  if (loadingStudents) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!students?.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Gerar boletins e declarações</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum aluno encontrado para gerar relatórios.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Gerar boletins, declarações e histórico</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Student Selection */}
      {(role === "admin" || role === "professor" || (role === "encarregado" && students.length > 1)) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Selecionar Aluno</label>
                <Select
                  value={selectedStudent || ""}
                  onValueChange={setSelectedStudent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.profile?.full_name || "Sem nome"} - {student.classes?.name || "Sem turma"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="1_trimestre">1º Trimestre</SelectItem>
                    <SelectItem value="2_trimestre">2º Trimestre</SelectItem>
                    <SelectItem value="3_trimestre">3º Trimestre</SelectItem>
                    <SelectItem value="final">Exame Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="boletim" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="boletim">Boletim</TabsTrigger>
          <TabsTrigger value="declaracao">Declaração</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Boletim (Report Card) */}
        <TabsContent value="boletim">
          <div ref={printRef} className="print:p-8">
            <Card className="print:shadow-none print:border-2">
              <CardHeader className="text-center border-b">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <GraduationCap className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-bold">Anisnofa</span>
                </div>
                <CardTitle className="text-xl">Boletim Escolar</CardTitle>
                <CardDescription>
                  Ano Letivo {new Date().getFullYear()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Student Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome do Aluno</p>
                    <p className="font-medium">{selectedStudentData?.profile?.full_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nº de Aluno</p>
                    <p className="font-medium">{selectedStudentData?.student_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Turma</p>
                    <p className="font-medium">{selectedStudentData?.classes?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nível</p>
                    <p className="font-medium">{selectedStudentData?.classes?.grade_level || "—"}</p>
                  </div>
                </div>

                {/* Grades Table */}
                {loadingGrades ? (
                  <Skeleton className="h-48" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Nota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades?.length ? (
                        grades.map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell className="font-medium">
                              {grade.subjects?.name || "—"}
                            </TableCell>
                            <TableCell>
                              {grade.period?.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={grade.grade && grade.grade >= 10 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                {grade.grade?.toFixed(1) || "—"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nenhuma nota registada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}

                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Média Geral</p>
                      <p className="text-2xl font-bold text-primary">{averageGrade}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Taxa de Presença</p>
                      <p className="text-2xl font-bold text-primary">{attendanceRate}%</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Footer */}
                <div className="pt-8 border-t text-center text-sm text-muted-foreground">
                  <p>Documento gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: pt })}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Declaração (Declaration) */}
        <TabsContent value="declaracao">
          <Card className="print:shadow-none print:border-2">
            <CardHeader className="text-center border-b">
              <div className="flex items-center justify-center gap-2 mb-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">Anisnofa</span>
              </div>
              <CardTitle className="text-xl">Declaração de Matrícula</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="text-justify leading-relaxed space-y-4 px-8">
                <p>
                  Declaro para os devidos efeitos que <strong>{selectedStudentData?.profile?.full_name || "[Nome do Aluno]"}</strong>, 
                  portador do número de aluno <strong>{selectedStudentData?.student_number || "[Número]"}</strong>, 
                  se encontra regularmente matriculado(a) neste estabelecimento de ensino no ano letivo 
                  de <strong>{new Date().getFullYear()}</strong>, frequentando a turma <strong>{selectedStudentData?.classes?.name || "[Turma]"}</strong> do 
                  nível <strong>{selectedStudentData?.classes?.grade_level || "[Nível]"}</strong>.
                </p>
                <p>
                  A presente declaração é passada a pedido do interessado para os fins que entender convenientes.
                </p>
              </div>

              <div className="pt-12 px-8">
                <p className="text-sm text-muted-foreground">
                  Luanda, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                </p>
                <div className="mt-16 pt-4 border-t w-64">
                  <p className="text-sm text-center">A Direção</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico (Student History) */}
        <TabsContent value="historico">
          <Card className="print:shadow-none print:border-2">
            <CardHeader className="text-center border-b">
              <div className="flex items-center justify-center gap-2 mb-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">Anisnofa</span>
              </div>
              <CardTitle className="text-xl">Histórico Estudantil</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Student Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Nome Completo</p>
                  <p className="font-medium">{selectedStudentData?.profile?.full_name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nº de Aluno</p>
                  <p className="font-medium">{selectedStudentData?.student_number || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Matrícula</p>
                  <p className="font-medium">
                    {selectedStudentData?.enrollment_date 
                      ? format(new Date(selectedStudentData.enrollment_date), "dd/MM/yyyy")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Turma Atual</p>
                  <p className="font-medium">{selectedStudentData?.classes?.name || "—"}</p>
                </div>
              </div>

              {/* Attendance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Resumo de Frequência
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{attendance?.total || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Aulas</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{attendance?.present || 0}</p>
                      <p className="text-sm text-muted-foreground">Presenças</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{attendance?.absent || 0}</p>
                      <p className="text-sm text-muted-foreground">Faltas</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{attendance?.late || 0}</p>
                      <p className="text-sm text-muted-foreground">Atrasos</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{attendance?.justified || 0}</p>
                      <p className="text-sm text-muted-foreground">Justificadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Grades by Subject */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notas por Disciplina
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingGrades ? (
                    <Skeleton className="h-32" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Disciplina</TableHead>
                          <TableHead>1º Trim.</TableHead>
                          <TableHead>2º Trim.</TableHead>
                          <TableHead>3º Trim.</TableHead>
                          <TableHead>Exame</TableHead>
                          <TableHead className="text-right">Média</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          // Group grades by subject
                          const bySubject = grades?.reduce((acc, g) => {
                            const subjectName = g.subjects?.name || "Outros";
                            if (!acc[subjectName]) acc[subjectName] = {};
                            acc[subjectName][g.period] = g.grade;
                            return acc;
                          }, {} as Record<string, Record<string, number | null>>);

                          if (!bySubject || !Object.keys(bySubject).length) {
                            return (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                  Nenhuma nota registada
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return Object.entries(bySubject).map(([subject, periods]) => {
                            const values = Object.values(periods).filter(v => v !== null) as number[];
                            const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length) : null;
                            
                            return (
                              <TableRow key={subject}>
                                <TableCell className="font-medium">{subject}</TableCell>
                                <TableCell>{periods["1_trimestre"]?.toFixed(1) || "—"}</TableCell>
                                <TableCell>{periods["2_trimestre"]?.toFixed(1) || "—"}</TableCell>
                                <TableCell>{periods["3_trimestre"]?.toFixed(1) || "—"}</TableCell>
                                <TableCell>{periods["final"]?.toFixed(1) || "—"}</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {avg !== null ? avg.toFixed(1) : "—"}
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="pt-8 border-t text-center text-sm text-muted-foreground">
                <p>Documento gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: pt })}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
