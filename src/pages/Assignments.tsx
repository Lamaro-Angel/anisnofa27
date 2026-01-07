import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Calendar, Clock, Download, Plus, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { pt } from "date-fns/locale";

// Component for secure file download via Edge Function
function SubmissionInfo({ submission }: { submission: NonNullable<Assignment['submission']> }) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: "destructive", title: "Não autenticado" });
        return;
      }

      const response = await supabase.functions.invoke('get-submission-file', {
        body: { submissionId: submission.id }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao obter ficheiro');
      }

      const { signedUrl } = response.data;
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível descarregar o ficheiro."
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-3 rounded-lg bg-muted mb-4">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium">Submetido</span>
      </div>
      <button 
        onClick={handleDownload}
        disabled={downloading}
        className="text-sm text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
      >
        {downloading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
        {submission.file_name}
      </button>
      {submission.feedback && (
        <p className="text-sm mt-2 text-muted-foreground">
          <strong>Feedback:</strong> {submission.feedback}
        </p>
      )}
    </div>
  );
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  class_subject: {
    id: string;
    subject: { name: string } | null;
    class: { name: string } | null;
  } | null;
  submission?: {
    id: string;
    file_url: string;
    file_name: string;
    submitted_at: string;
    grade: number | null;
    feedback: string | null;
  } | null;
}

export default function Assignments() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // Get student ID for student role
  const { data: studentData } = useQuery({
    queryKey: ["student-id", user?.id],
    queryFn: async () => {
      if (!user || role !== "aluno") return null;
      const { data, error } = await supabase
        .from("students")
        .select("id, class_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && role === "aluno",
  });

  // Fetch assignments
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["assignments", studentData?.class_id],
    queryFn: async () => {
      let query = supabase
        .from("assignments")
        .select(`
          *,
          class_subject:class_subjects!inner(
            id,
            subject:subjects(name),
            class:classes(name)
          )
        `)
        .order("due_date", { ascending: true });

      // Filter by student's class
      if (role === "aluno" && studentData?.class_id) {
        query = query.eq("class_subject.class_id", studentData.class_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get submissions for each assignment if student
      if (role === "aluno" && studentData?.id && data) {
        const assignmentIds = data.map((a) => a.id);
        const { data: submissions } = await supabase
          .from("assignment_submissions")
          .select("*")
          .eq("student_id", studentData.id)
          .in("assignment_id", assignmentIds);

        return data.map((assignment) => ({
          ...assignment,
          submission: submissions?.find((s) => s.assignment_id === assignment.id) || null,
        })) as Assignment[];
      }

      return data as Assignment[];
    },
    enabled: role !== "aluno" || !!studentData,
  });

  const uploadSubmission = useMutation({
    mutationFn: async ({ file, assignmentId }: { file: File; assignmentId: string }) => {
      if (!user || !studentData) throw new Error("Not authenticated");

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Tipo de ficheiro não permitido. Use PDF ou DOCX.");
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("O ficheiro deve ter no máximo 10MB.");
      }

      // Upload file
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${assignmentId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get URL
      const { data: { publicUrl } } = supabase.storage
        .from("assignments")
        .getPublicUrl(filePath);

      // Create submission record
      const { error: insertError } = await supabase
        .from("assignment_submissions")
        .upsert({
          assignment_id: assignmentId,
          student_id: studentData.id,
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
          submitted_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast({
        title: "Trabalho submetido!",
        description: "O seu trabalho foi enviado com sucesso.",
      });
      setSubmitDialogOpen(false);
      setSelectedAssignment(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível submeter o trabalho.",
      });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAssignment) return;

    setUploading(true);
    try {
      await uploadSubmission.mutateAsync({ file, assignmentId: selectedAssignment.id });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.submission) {
      if (assignment.submission.grade !== null) {
        return <Badge className="bg-green-500">Avaliado: {assignment.submission.grade}</Badge>;
      }
      return <Badge className="bg-blue-500">Submetido</Badge>;
    }
    if (assignment.due_date && isPast(new Date(assignment.due_date))) {
      return <Badge variant="destructive">Prazo expirado</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Repositório de Trabalhos
          </h1>
          <p className="text-muted-foreground">
            {role === "aluno" 
              ? "Submeta os seus trabalhos em PDF ou DOCX" 
              : "Gerir trabalhos e submissões"
            }
          </p>
        </div>
        {role === "professor" && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Trabalho
          </Button>
        )}
      </div>

      {/* Assignments List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : assignments && assignments.length > 0 ? (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  {getStatusBadge(assignment)}
                </div>
                <CardDescription>
                  {assignment.class_subject?.subject?.name} • {assignment.class_subject?.class?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignment.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {assignment.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  {assignment.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(assignment.due_date), "dd/MM/yyyy HH:mm", { locale: pt })}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDistanceToNow(new Date(assignment.created_at), { addSuffix: true, locale: pt })}
                  </div>
                </div>

                {/* Submission info */}
                {assignment.submission && (
                  <SubmissionInfo submission={assignment.submission} />
                )}

                {/* Action buttons */}
                {role === "aluno" && (
                  <Dialog open={submitDialogOpen && selectedAssignment?.id === assignment.id} onOpenChange={setSubmitDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        variant={assignment.submission ? "outline" : "default"}
                        onClick={() => setSelectedAssignment(assignment)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {assignment.submission ? "Reenviar Trabalho" : "Submeter Trabalho"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submeter Trabalho</DialogTitle>
                        <DialogDescription>
                          Carregue o seu trabalho em formato PDF ou DOCX (máx. 10MB)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Trabalho</Label>
                          <p className="text-sm font-medium mt-1">{assignment.title}</p>
                        </div>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Clique para selecionar ou arraste o ficheiro
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF ou DOCX, máximo 10MB
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleFileSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={uploading}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={() => fileInputRef.current?.click()} 
                          disabled={uploading}
                        >
                          {uploading ? "A enviar..." : "Selecionar Ficheiro"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum trabalho disponível.</p>
          </div>
        )}
      </div>
    </div>
  );
}