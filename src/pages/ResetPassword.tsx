import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mail, Lock, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } else {
      setSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique a sua caixa de entrada para redefinir a palavra-passe.",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl gradient-primary">
          <GraduationCap className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Anisnofa</h1>
          <p className="text-sm text-muted-foreground">Sistema de Gestão Escolar</p>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-lg border-border/50">
        <form onSubmit={handleResetPassword}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Recuperar Palavra-passe
            </CardTitle>
            <CardDescription>
              {sent 
                ? "Verifique o seu email para continuar" 
                : "Introduza o seu email para receber instruções"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!sent ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  Enviámos um email para <strong>{email}</strong> com instruções para redefinir a sua palavra-passe.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {!sent ? (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "A enviar..." : "Enviar instruções"}
              </Button>
            ) : (
              <Button type="button" className="w-full" onClick={() => navigate("/auth")}>
                Voltar ao Login
              </Button>
            )}
            <Link
              to="/auth"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}