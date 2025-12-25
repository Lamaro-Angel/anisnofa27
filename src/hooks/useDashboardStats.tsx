import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  totalAnnouncements: number;
  averageGrade: number | null;
  attendanceRate: number | null;
  unreadMessages: number;
  recentActivity: Array<{
    id: string;
    action: string;
    details: string;
    created_at: string;
  }>;
}

export function useDashboardStats() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id, role],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch counts in parallel
      const [
        studentsResult,
        classesResult,
        teachersResult,
        announcementsResult,
        gradesResult,
        attendanceResult,
        messagesResult,
        activityResult,
      ] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("teachers").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
        supabase.from("grades").select("grade").not("grade", "is", null),
        supabase.from("attendance").select("status"),
        user ? supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", user.id)
          .eq("is_read", false)
        : Promise.resolve({ count: 0 }),
        role === "admin"
          ? supabase
              .from("activity_logs")
              .select("id, action, details, created_at")
              .order("created_at", { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [] }),
      ]);

      // Calculate average grade
      let averageGrade: number | null = null;
      if (gradesResult.data && gradesResult.data.length > 0) {
        const grades = gradesResult.data
          .map((g) => g.grade)
          .filter((g): g is number => g !== null);
        if (grades.length > 0) {
          averageGrade = grades.reduce((a, b) => a + b, 0) / grades.length;
        }
      }

      // Calculate attendance rate
      let attendanceRate: number | null = null;
      if (attendanceResult.data && attendanceResult.data.length > 0) {
        const total = attendanceResult.data.length;
        const present = attendanceResult.data.filter(
          (a) => a.status === "presente" || a.status === "atraso"
        ).length;
        attendanceRate = (present / total) * 100;
      }

      // Format activity logs
      const recentActivity = (activityResult.data || []).map((log) => ({
        id: log.id,
        action: log.action,
        details: typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details || ""),
        created_at: log.created_at || "",
      }));

      return {
        totalStudents: studentsResult.count || 0,
        totalClasses: classesResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalAnnouncements: announcementsResult.count || 0,
        averageGrade: averageGrade ? Math.round(averageGrade * 10) / 10 : null,
        attendanceRate: attendanceRate ? Math.round(attendanceRate * 10) / 10 : null,
        unreadMessages: messagesResult.count || 0,
        recentActivity,
      };
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });
}
