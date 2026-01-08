import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Phone, Calendar } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import authImage from "@/assets/auth-students.jpg";
import googleLogo from "@/assets/google-logo.png";

type AppRole = "professor" | "aluno" | "encarregado";
type GenderType = "masculino" | "feminino" | "outro";
type AuthMode = "login" | "signup" | "reset";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<GenderType | "">("");
  const [role, setRole] = useState<AppRole>("aluno");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

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

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast({
        variant: "destructive",
        title: "Termos não aceites",
        description: "Deve aceitar os termos de uso e política de privacidade para continuar.",
      });
      return;
    }
    
    setLoading(true);

    // Strong password validation
    const passwordErrors: string[] = [];
    if (password.length < 8) {
      passwordErrors.push('pelo menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push('uma letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
      passwordErrors.push('uma letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
      passwordErrors.push('um número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      passwordErrors.push('um caractere especial (!@#$%...)');
    }

    if (passwordErrors.length > 0) {
      toast({
        variant: "destructive",
        title: "Palavra-passe fraca",
        description: `A palavra-passe deve conter: ${passwordErrors.join(', ')}.`,
      });
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, name, role, phone || undefined, birthDate || undefined, gender || undefined);

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

    setLoading(false);
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-accent/60 to-warning/50 z-10" />
        <img 
          src={authImage} 
          alt="Estudantes" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex flex-col justify-between p-12 h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-card/20 backdrop-blur-sm">
              <GraduationCap className="h-8 w-8 text-card" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-card">Anisnofa</h1>
              <p className="text-sm text-card/80">Sistema de Gestão Escolar</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-card" />
              <span className="text-sm font-medium text-card">Plataforma Educacional Moderna</span>
            </div>
            <h2 className="text-4xl font-bold leading-tight text-card">
              Transforme a gestão<br />
              da sua escola
            </h2>
            <p className="text-lg text-card/90 max-w-md">
              Gestão de notas, presenças, comunicação e muito mais numa única plataforma intuitiva.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-card">500+</span>
                <span className="text-sm text-card/80">Escolas</span>
              </div>
              <div className="w-px bg-card/30" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-card">50k+</span>
                <span className="text-sm text-card/80">Estudantes</span>
              </div>
              <div className="w-px bg-card/30" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-card">98%</span>
                <span className="text-sm text-card/80">Satisfação</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-card/70">
            © 2024 Anisnofa. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 p-6 pt-16">
          <div className="p-3 rounded-xl gradient-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Anisnofa</h1>
            <p className="text-xs text-muted-foreground">Sistema de Gestão Escolar</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8 animate-fade-in">
            {/* Header */}
            <div className="text-center lg:text-left space-y-2">
              <h2 className="text-3xl font-bold text-foreground">
                {mode === "login" && "Bem-vindo de volta"}
                {mode === "signup" && "Criar nova conta"}
                {mode === "reset" && "Recuperar palavra-passe"}
              </h2>
              <p className="text-muted-foreground">
                {mode === "login" && "Introduza as suas credenciais para continuar"}
                {mode === "signup" && "Preencha os dados para se registar"}
                {mode === "reset" && "Introduza o seu email para recuperar"}
              </p>
            </div>

            {/* Google Button */}
            {mode !== "reset" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base font-medium gap-3 hover:bg-accent/10 hover:border-primary transition-all duration-300"
                  onClick={handleGoogleLogin}
                >
                  <img src={googleLogo} alt="Google" className="h-5 w-5" />
                  Continuar com Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-4 text-muted-foreground">ou continue com email</span>
                  </div>
                </div>
              </>
            )}

            {/* Login Form */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-11 h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Palavra-passe</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-11 pr-11 h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Esqueceu a palavra-passe?
                  </button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium gap-2 group gradient-primary text-primary-foreground hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? "A entrar..." : "Entrar"}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            )}

            {/* Signup Form */}
            {mode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome completo</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="João Silva"
                      className="pl-11 h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-11 h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">Palavra-passe</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-11 pr-11 h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Telemóvel</Label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9XX XXX XXX"
                        className="pl-11 h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-sm font-medium">Data de Nascimento</Label>
                    <div className="relative group">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="birthDate"
                        type="date"
                        className="pl-11 h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium">Sexo</Label>
                    <Select value={gender} onValueChange={(v) => setGender(v as GenderType)}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">Tipo de conta</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aluno">Aluno</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="encarregado">Encarregado de Educação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    Li e aceito os{" "}
                    <Link to="/termos" target="_blank" className="text-primary hover:underline font-medium">
                      Termos de Uso
                    </Link>{" "}
                    e a{" "}
                    <Link to="/politica-privacidade" target="_blank" className="text-primary hover:underline font-medium">
                      Política de Privacidade
                    </Link>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium gap-2 group gradient-primary text-primary-foreground hover:opacity-90"
                  disabled={loading || !acceptedTerms}
                >
                  {loading ? "A criar conta..." : "Criar conta"}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            )}

            {/* Reset Form */}
            {mode === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-11 h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium gap-2 group gradient-primary text-primary-foreground hover:opacity-90"
                >
                  Continuar
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>

                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Voltar ao login
                </button>
              </form>
            )}

            {/* Toggle Mode */}
            {mode !== "reset" && (
              <p className="text-center text-muted-foreground">
                {mode === "login" ? (
                  <>
                    Não tem conta?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="text-primary font-medium hover:underline"
                    >
                      Registar agora
                    </button>
                  </>
                ) : (
                  <>
                    Já tem conta?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-primary font-medium hover:underline"
                    >
                      Entrar
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}