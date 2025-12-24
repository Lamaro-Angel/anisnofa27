import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type AttendanceStatus = "presente" | "falta" | "justificado" | "atraso";

export interface Attendance {
  id: string;
  student_id: string;
  class_subject_id: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  recorded_by: string | null;
  created_at: string | null;
  student?: {
    id: string;
    profile?: {
      full_name: string;
    };
  };
  class_subject?: {
    id: string;
    subject?: {
      name: string;
    };
    class?: {
      name: string;
    };
  };
}

export function useAttendance(filters?: { classSubjectId?: string; date?: string; studentId?: string }) {
  return useQuery({
    queryKey: ["attendance", filters],
    queryFn: async () => {
      let query = supabase.from("attendance").select("*");

      if (filters?.classSubjectId) {
        query = query.eq("class_subject_id", filters.classSubjectId);
      }
      if (filters?.date) {
        query = query.eq("date", filters.date);
      }
      if (filters?.studentId) {
        query = query.eq("student_id", filters.studentId);
      }

      const { data: attendance, error } = await query.order("date", { ascending: false });

      if (error) throw error;

      // Fetch related data
      const studentIds = [...new Set(attendance.map((a) => a.student_id))];
      const classSubjectIds = [...new Set(attendance.map((a) => a.class_subject_id))];

      const { data: students } = await supabase.from("students").select("id, user_id").in("id", studentIds);
      const userIds = students?.map((s) => s.user_id) || [];
      const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, full_name").in("id", userIds) : { data: [] };
      const { data: classSubjects } = await supabase.from("class_subjects").select("id, class_id, subject_id").in("id", classSubjectIds);
      
      const classIds = classSubjects?.map((cs) => cs.class_id) || [];
      const subjectIds = classSubjects?.map((cs) => cs.subject_id) || [];
      
      const { data: classes } = classIds.length ? await supabase.from("classes").select("id, name").in("id", classIds) : { data: [] };
      const { data: subjects } = subjectIds.length ? await supabase.from("subjects").select("id, name").in("id", subjectIds) : { data: [] };

      const enrichedAttendance: Attendance[] = attendance.map((att) => {
        const student = students?.find((s) => s.id === att.student_id);
        const profile = profiles?.find((p) => p.id === student?.user_id);
        const classSubject = classSubjects?.find((cs) => cs.id === att.class_subject_id);
        const cls = classes?.find((c) => c.id === classSubject?.class_id);
        const subject = subjects?.find((s) => s.id === classSubject?.subject_id);

        return {
          ...att,
          student: student ? { id: student.id, profile: profile ? { full_name: profile.full_name } : undefined } : undefined,
          class_subject: classSubject ? {
            id: classSubject.id,
            class: cls ? { name: cls.name } : undefined,
            subject: subject ? { name: subject.name } : undefined,
          } : undefined,
        };
      });

      return enrichedAttendance;
    },
  });
}

export function useStudentAttendance(studentId: string | null) {
  return useQuery({
    queryKey: ["attendance", "student", studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data: attendance, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId)
        .order("date", { ascending: false });

      if (error) throw error;

      const classSubjectIds = [...new Set(attendance.map((a) => a.class_subject_id))];
      const { data: classSubjects } = await supabase.from("class_subjects").select("id, class_id, subject_id").in("id", classSubjectIds);
      
      const subjectIds = classSubjects?.map((cs) => cs.subject_id) || [];
      const { data: subjects } = subjectIds.length ? await supabase.from("subjects").select("id, name").in("id", subjectIds) : { data: [] };

      const enrichedAttendance: Attendance[] = attendance.map((att) => {
        const classSubject = classSubjects?.find((cs) => cs.id === att.class_subject_id);
        const subject = subjects?.find((s) => s.id === classSubject?.subject_id);

        return {
          ...att,
          class_subject: classSubject ? {
            id: classSubject.id,
            subject: subject ? { name: subject.name } : undefined,
          } : undefined,
        };
      });

      return enrichedAttendance;
    },
    enabled: !!studentId,
  });
}

export function useClassSubjects(classId: string | null) {
  return useQuery({
    queryKey: ["class_subjects", classId],
    queryFn: async () => {
      if (!classId) return [];

      const { data: classSubjects, error } = await supabase
        .from("class_subjects")
        .select("*")
        .eq("class_id", classId);

      if (error) throw error;

      const subjectIds = classSubjects.map((cs) => cs.subject_id);
      const teacherIds = classSubjects.filter((cs) => cs.teacher_id).map((cs) => cs.teacher_id) as string[];

      const { data: subjects } = await supabase.from("subjects").select("*").in("id", subjectIds);
      const { data: teachers } = teacherIds.length ? await supabase.from("teachers").select("id, user_id").in("id", teacherIds) : { data: [] };
      const userIds = teachers?.map((t) => t.user_id) || [];
      const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, full_name").in("id", userIds) : { data: [] };

      return classSubjects.map((cs) => {
        const subject = subjects?.find((s) => s.id === cs.subject_id);
        const teacher = teachers?.find((t) => t.id === cs.teacher_id);
        const profile = profiles?.find((p) => p.id === teacher?.user_id);

        return {
          ...cs,
          subject,
          teacher: teacher ? { ...teacher, profile } : null,
        };
      });
    },
    enabled: !!classId,
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { student_id: string; class_subject_id: string; date: string; status: AttendanceStatus; notes?: string }) => {
      const { error } = await supabase.from("attendance").insert({
        ...data,
        recorded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Presença registada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao registar presença", description: error.message, variant: "destructive" });
    },
  });
}

export function useBulkCreateAttendance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (records: { student_id: string; class_subject_id: string; date: string; status: AttendanceStatus }[]) => {
      const { error } = await supabase.from("attendance").insert(
        records.map((r) => ({ ...r, recorded_by: user?.id }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Presenças registadas com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao registar presenças", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: AttendanceStatus; notes?: string }) => {
      const { error } = await supabase.from("attendance").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Presença atualizada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar presença", description: error.message, variant: "destructive" });
    },
  });
}
