import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAttendance, useStudentAttendance, useClassSubjects, useBulkCreateAttendance, AttendanceStatus } from "@/hooks/useAttendance";
import { useClasses } from "@/hooks/useClasses";
import { useStudentsByClass } from "@/hooks/useStudents";
import { useStudentsLimitedByClass } from "@/hooks/useStudentsLimited";
import { useTeacherUniqueClasses, useTeacherClassSubjects } from "@/hooks/useTeacherClasses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const statusLabels: Record<AttendanceStatus, string> = {
  presente: "Presente",
  falta: "Falta",
  justificado: "Justificado",
  atraso: "Atraso",
};

const statusIcons: Record<AttendanceStatus, React.ComponentType<{ className?: string }>> = {
  presente: CheckCircle,
  falta: XCircle,
  justificado: AlertCircle,
  atraso: Clock,
};

const statusColors: Record<AttendanceStatus, "default" | "destructive" | "secondary" | "outline"> = {
  presente: "default",
  falta: "destructive",
  justificado: "secondary",
  atraso: "outline",
};

export default function Attendance() {
  const { role, user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedClassSubject, setSelectedClassSubject] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});

  // For admin, use all classes. For professor, use only their classes
  const { data: allClasses } = useClasses();
  const { data: teacherClasses } = useTeacherUniqueClasses();
  
  // Use appropriate class list based on role
  const classes = role === "professor" ? teacherClasses : allClasses;
  
  // For professor, use their class subjects. For admin, use all class subjects
  const { data: allClassSubjects } = useClassSubjects(role === "admin" ? selectedClass || null : null);
  const { data: teacherClassSubjectsData } = useTeacherClassSubjects(role === "professor" ? selectedClass || null : null);
  const classSubjects = role === "professor" ? teacherClassSubjectsData : allClassSubjects;

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

  // For students, show their own attendance
  const { data: studentAttendance, isLoading: studentAttendanceLoading } = useStudentAttendance(
    role === "aluno" ? currentStudent?.id || null : null
  );

  // For admin/professor, show filtered attendance
  const { data: allAttendance, isLoading: allAttendanceLoading } = useAttendance(
    role !== "aluno"
      ? {
          classSubjectId: selectedClassSubject || undefined,
          date: selectedDate || undefined,
        }
      : undefined
  );

  const bulkCreateAttendance = useBulkCreateAttendance();

  const isLoading = role === "aluno" ? studentAttendanceLoading : allAttendanceLoading;
  const attendance = role === "aluno" ? studentAttendance : allAttendance;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = () => {
    if (!selectedClassSubject || !selectedDate) return;

    const records = Object.entries(attendanceRecords).map(([student_id, status]) => ({
      student_id,
      class_subject_id: selectedClassSubject,
      date: selectedDate,
      status,
    }));

    if (records.length === 0) return;

    bulkCreateAttendance.mutate(records, {
      onSuccess: () => {
        setAttendanceRecords({});
      },
    });
  };

  // Calculate attendance stats for student
  const getAttendanceStats = () => {
    if (!studentAttendance) return { present: 0, absent: 0, justified: 0, late: 0, total: 0 };
    const stats = {
      present: studentAttendance.filter((a) => a.status === "presente").length,
      absent: studentAttendance.filter((a) => a.status === "falta").length,
      justified: studentAttendance.filter((a) => a.status === "justificado").length,
      late: studentAttendance.filter((a) => a.status === "atraso").length,
      total: studentAttendance.length,
    };
    return stats;
  };

  // Student view
  if (role === "aluno") {
    const stats = getAttendanceStats();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">A Minha Frequência</h1>
          <p className="text-muted-foreground">Consulte o seu registo de presenças</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Presenças</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.present}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Faltas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Justificadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.justified}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Atrasos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.late}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Presenças</CardTitle>
            <CardDescription>Registo detalhado por data</CardDescription>
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
                      <TableHead>Data</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance?.map((att) => {
                      const StatusIcon = statusIcons[att.status];
                      return (
                        <TableRow key={att.id}>
                          <TableCell className="font-medium">
                            {format(new Date(att.date), "dd MMM yyyy", { locale: pt })}
                          </TableCell>
                          <TableCell>{att.class_subject?.subject?.name || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={statusColors[att.status]} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusLabels[att.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{att.notes || "-"}</TableCell>
                        </TableRow>
                      );
                    })}
                    {attendance?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Sem registos de frequência
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
        <h1 className="text-3xl font-bold">Registo de Presenças</h1>
        <p className="text-muted-foreground">Marcar e consultar presenças dos alunos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marcar Presenças</CardTitle>
          <CardDescription>Selecione a turma, disciplina e data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedClassSubject(""); }}>
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
            </div>

            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select value={selectedClassSubject} onValueChange={setSelectedClassSubject} disabled={!selectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {classSubjects?.map((cs) => (
                    <SelectItem key={cs.id} value={cs.id}>
                      {cs.subject?.name || "Sem nome"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {selectedClass && selectedClassSubject && (
            <>
              <div className="rounded-md border mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classStudents?.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.profile?.full_name || "Sem nome"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={attendanceRecords[student.id] || ""}
                            onValueChange={(v) => handleStatusChange(student.id, v as AttendanceStatus)}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Marcar..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="presente">
                                <span className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                  Presente
                                </span>
                              </SelectItem>
                              <SelectItem value="falta">
                                <span className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-destructive" />
                                  Falta
                                </span>
                              </SelectItem>
                              <SelectItem value="justificado">
                                <span className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  Justificado
                                </span>
                              </SelectItem>
                              <SelectItem value="atraso">
                                <span className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Atraso
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                    {classStudents?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                          Nenhum aluno nesta turma
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <Button
                onClick={handleSaveAttendance}
                disabled={Object.keys(attendanceRecords).length === 0}
                className="w-full sm:w-auto"
              >
                Guardar Presenças
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Presenças</CardTitle>
          <CardDescription>Registos anteriores</CardDescription>
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
                    <TableHead>Data</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance?.slice(0, 20).map((att) => {
                    const StatusIcon = statusIcons[att.status];
                    return (
                      <TableRow key={att.id}>
                        <TableCell className="font-medium">
                          {format(new Date(att.date), "dd MMM yyyy", { locale: pt })}
                        </TableCell>
                        <TableCell>{att.student?.profile?.full_name || "-"}</TableCell>
                        <TableCell>{att.class_subject?.class?.name || "-"}</TableCell>
                        <TableCell>{att.class_subject?.subject?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[att.status]} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusLabels[att.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {attendance?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Sem registos de frequência
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
