import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function FloatingContactButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from("contact_requests").insert({
      sender_id: user.id,
      subject,
      message,
    });

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível enviar a mensagem." });
    } else {
      toast({ title: "Enviado!", description: "A sua mensagem foi enviada à direção." });
      setSubject("");
      setMessage("");
      setIsOpen(false);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 shadow-xl z-50 animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Contactar Direção</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                placeholder="Assunto"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <Textarea
                placeholder="A sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                {loading ? "A enviar..." : "Enviar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
