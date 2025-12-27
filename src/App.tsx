import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Classes from "./pages/Classes";
import Grades from "./pages/Grades";
import Attendance from "./pages/Attendance";
import Messages from "./pages/Messages";
import Announcements from "./pages/Announcements";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Ranking from "./pages/Ranking";
import Assignments from "./pages/Assignments";
import Tuition from "./pages/Tuition";
import Reports from "./pages/Reports";
import ContactRequests from "./pages/ContactRequests";
import Enrollment from "./pages/Enrollment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      
      {/* Dashboard - All authenticated users */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* Users - Admin only */}
      <Route path="/users" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <Users />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      
      {/* Classes - Admin and Professor */}
      <Route path="/classes" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "professor"]}>
            <Classes />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      
      {/* Grades - All roles */}
      <Route path="/grades" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
      
      {/* Attendance - All roles */}
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      
      {/* Messages - All roles */}
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      
      {/* Announcements - All roles */}
      <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
      
      {/* Profile - All roles */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      {/* Ranking - Admin, Professor and Student */}
      <Route path="/ranking" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "professor", "aluno"]}>
            <Ranking />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      
      {/* Assignments - Admin, Professor and Student */}
      <Route path="/assignments" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "professor", "aluno"]}>
            <Assignments />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      
      {/* Tuition - Admin and Guardian only */}
      <Route path="/tuition" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin", "encarregado"]}>
            <Tuition />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      
      {/* Settings - Admin only */}
      <Route path="/settings" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <Settings />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      
      {/* Reports - All roles */}
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      
      {/* Contact Requests - Admin only */}
      <Route path="/contact-requests" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <ContactRequests />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      
      {/* Enrollment - Admin only */}
      <Route path="/enrollment" element={
        <ProtectedRoute>
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <Enrollment />
          </RoleProtectedRoute>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;