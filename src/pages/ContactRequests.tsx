import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageSquare, Check, Clock, User, Mail, Send } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface ContactRequest {
  id: string;
  sender_id: string;
  subject: string;
  message: string;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
}

export default function ContactRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  // Fetch contact requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["contact-requests", showResolved],
    queryFn: async () => {
      let query = supabase
        .from("contact_requests")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!showResolved) {
        query = query.eq("is_resolved", false);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(data.map(r => r.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", senderIds);

      return data.map(request => ({
        ...request,
        sender: profiles?.find(p => p.id === request.sender_id)
      })) as ContactRequest[];
    },
  });

  // Mark as resolved
  const resolveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("contact_requests")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq("id", requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
      toast({ title: "Mensagem marcada como resolvida" });
      setSelectedRequest(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao resolver mensagem" });
    },
  });

  // Send reply via messages table
  const sendReply = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Resposta enviada com sucesso" });
      setReplyMessage("");
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao enviar resposta" });
    },
  });

  const handleReply = () => {
    if (!selectedRequest || !replyMessage.trim()) return;
    sendReply.mutate({
      receiverId: selectedRequest.sender_id,
      content: replyMessage,
    });
  };

  const pendingCount = requests?.filter(r => !r.is_resolved).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Mensagens de Contacto
          </h1>
          <p className="text-muted-foreground">
            Mensagens enviadas pelos utilizadores através do botão de contacto
          </p>
        </div>
        <div className="flex items-center gap-4">
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
            </Badge>
          )}
          <Button
            variant={showResolved ? "default" : "outline"}
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? "Mostrar Pendentes" : "Mostrar Todas"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {showResolved ? "Todas as Mensagens" : "Mensagens Pendentes"}
          </CardTitle>
          <CardDescription>
            Clique numa mensagem para ver detalhes e responder
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!requests?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma mensagem {showResolved ? "" : "pendente"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Remetente</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow 
                    key={request.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <TableCell>
                      {request.is_resolved ? (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Resolvido
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{request.sender?.full_name || "Desconhecido"}</p>
                          <p className="text-xs text-muted-foreground">{request.sender?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {request.subject}
                    </TableCell>
                    <TableCell>
                      <span title={format(new Date(request.created_at), "dd/MM/yyyy HH:mm")}>
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: pt })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(request);
                        }}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedRequest?.subject}
            </DialogTitle>
            <DialogDescription>
              De: {selectedRequest?.sender?.full_name} ({selectedRequest?.sender?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Message Content */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Enviada {selectedRequest && formatDistanceToNow(new Date(selectedRequest.created_at), { addSuffix: true, locale: pt })}
              </p>
              <p className="whitespace-pre-wrap">{selectedRequest?.message}</p>
            </div>

            {/* Reply Section */}
            {!selectedRequest?.is_resolved && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Responder via Mensagens</label>
                <Textarea
                  placeholder="Escreva a sua resposta..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => resolveRequest.mutate(selectedRequest.id)}
                    disabled={resolveRequest.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Marcar como Resolvido
                  </Button>
                  <Button
                    onClick={handleReply}
                    disabled={!replyMessage.trim() || sendReply.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendReply.isPending ? "A enviar..." : "Enviar Resposta"}
                  </Button>
                </div>
              </div>
            )}

            {selectedRequest?.is_resolved && (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Resolvido em {selectedRequest.resolved_at && format(new Date(selectedRequest.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
