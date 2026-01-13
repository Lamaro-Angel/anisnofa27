import { useState, useEffect, useRef } from "react";
import { useConversations, useMessages, useSendMessage, useMarkAsRead, useAvailableUsers } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Send, Plus, Search, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function Messages() {
  const { user } = useAuth();
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: conversationsLoading } = useConversations();
  const { data: messages, isLoading: messagesLoading } = useMessages(selectedPartner);
  const { data: availableUsers } = useAvailableUsers();
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  const selectedConversation = conversations?.find((c) => c.id === selectedPartner);
  const selectedUser = availableUsers?.find((u) => u.id === selectedPartner);

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (selectedPartner) {
      markAsRead.mutate(selectedPartner);
    }
  }, [selectedPartner]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!selectedPartner || !messageInput.trim()) return;

    sendMessage.mutate(
      { receiverId: selectedPartner, content: messageInput.trim() },
      {
        onSuccess: () => {
          setMessageInput("");
        },
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartNewChat = (userId: string) => {
    setSelectedPartner(userId);
    setNewChatOpen(false);
  };

  const filteredUsers = availableUsers?.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.student_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    professor: "Professor",
    aluno: "Aluno",
    encarregado: "Enc. Educação",
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex h-full gap-4">
        {/* Conversations List - Hidden on mobile when chat is open */}
        <Card className={cn("w-full md:w-80 flex flex-col", selectedPartner && "hidden md:flex")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Mensagens</CardTitle>
              <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Plus className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Conversa</DialogTitle>
                    <DialogDescription>Selecione um utilizador para iniciar uma conversa</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar utilizadores..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-1">
                        {filteredUsers?.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => handleStartNewChat(u.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(u.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{u.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {u.email || (u.student_number ? `Nº ${u.student_number}` : "")}
                              </p>
                            </div>
                            {u.role && (
                              <Badge variant="secondary" className="text-xs">
                                {roleLabels[u.role] || u.role}
                              </Badge>
                            )}
                          </button>
                        ))}
                        {filteredUsers?.length === 0 && (
                          <p className="text-center py-8 text-muted-foreground">
                            Nenhum utilizador encontrado
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {conversationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : conversations?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Sem conversas</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique no + para iniciar uma nova conversa
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations?.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedPartner(conv.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left",
                        selectedPartner === conv.id && "bg-accent"
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(conv.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{conv.full_name}</p>
                          {conv.unread_count > 0 && (
                            <Badge className="ml-2">{conv.unread_count}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className={cn("flex-1 flex flex-col", !selectedPartner && "hidden md:flex")}>
          {selectedPartner ? (
            <>
              <CardHeader className="border-b pb-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedPartner(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedConversation?.full_name || selectedUser?.full_name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {selectedConversation?.full_name || selectedUser?.full_name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation?.email || selectedUser?.email}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  ) : messages?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">Sem mensagens</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Envie uma mensagem para iniciar a conversa
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages?.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-2",
                                isOwn
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              )}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p
                                className={cn(
                                  "text-[10px] mt-1",
                                  isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}
                              >
                                {msg.created_at &&
                                  format(new Date(msg.created_at), "HH:mm", { locale: pt })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escreva uma mensagem..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Selecione uma conversa</h3>
              <p className="text-muted-foreground mt-1">
                Escolha uma conversa da lista ou inicie uma nova
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
