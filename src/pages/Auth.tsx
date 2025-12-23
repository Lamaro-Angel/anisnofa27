import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mail, Lock, User, Chrome } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type AppRole = "admin" | "professor" | "aluno" | "encarregado";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupRole, setSignupRole] = useState<AppRole>("aluno");
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message === "Invalid login credentials" 
          ? "Email ou palavra-passe incorretos" 
          : error.message,
      });
    } else {
      toast({
        title: "Bem-vindo!",
        description: "Sessão iniciada com sucesso.",
      });
      navigate("/dashboard");
    }

    setLoginLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);

    if (signupPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A palavra-passe deve ter pelo menos 6 caracteres.",
      });
      setSignupLoading(false);
      return;
    }

    const { error } = await signUp(signupEmail, signupPassword, signupName, signupRole);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message.includes("already registered")
          ? "Este email já está registado"
          : error.message,
      });
    } else {
      toast({
        title: "Conta criada!",
        description: "A sua conta foi criada com sucesso.",
      });
      navigate("/dashboard");
    }

    setSignupLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível iniciar sessão com Google.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Logo */}
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
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Registar</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardHeader>
                <CardTitle>Bem-vindo de volta</CardTitle>
                <CardDescription>
                  Introduza as suas credenciais para aceder ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Palavra-passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? "A entrar..." : "Entrar"}
                </Button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Continuar com Google
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardHeader>
                <CardTitle>Criar conta</CardTitle>
                <CardDescription>
                  Preencha os dados para criar a sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="João Silva"
                      className="pl-10"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Palavra-passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Tipo de conta</Label>
                  <Select value={signupRole} onValueChange={(v) => setSignupRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aluno">Aluno</SelectItem>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="encarregado">Encarregado de Educação</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={signupLoading}>
                  {signupLoading ? "A criar conta..." : "Criar conta"}
                </Button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Continuar com Google
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        © 2024 Anisnofa. Todos os direitos reservados.
      </p>
    </div>
  );
}
