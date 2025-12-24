import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings2, Shield, Bell, Database } from "lucide-react";

export default function Settings() {
  const { user, role } = useAuth();

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold">Acesso Restrito</h2>
        <p className="text-muted-foreground">Apenas administradores podem aceder às definições</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Definições</h1>
        <p className="text-muted-foreground">Configurações do sistema</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
            <CardDescription>Definições básicas da aplicação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Nome da Instituição</Label>
                <Input defaultValue="Anisnofa - Escola Secundária" />
              </div>
              <div className="space-y-2">
                <Label>Email de Contacto</Label>
                <Input type="email" defaultValue="geral@anisnofa.edu" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input defaultValue="+351 123 456 789" />
              </div>
            </div>
            <Button>Guardar Alterações</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>Configurar notificações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificações por Email</p>
                <p className="text-sm text-muted-foreground">Enviar emails para novos avisos</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertas de Faltas</p>
                <p className="text-sm text-muted-foreground">Notificar encarregados sobre faltas</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Resumo Semanal</p>
                <p className="text-sm text-muted-foreground">Enviar resumo semanal aos encarregados</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Base de Dados
            </CardTitle>
            <CardDescription>Informações sobre os dados do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">--</p>
                <p className="text-sm text-muted-foreground">Utilizadores</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">--</p>
                <p className="text-sm text-muted-foreground">Turmas</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">--</p>
                <p className="text-sm text-muted-foreground">Alunos</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">--</p>
                <p className="text-sm text-muted-foreground">Professores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>Ações irreversíveis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Limpar Dados de Teste</p>
                <p className="text-sm text-muted-foreground">Remover todos os dados de teste do sistema</p>
              </div>
              <Button variant="destructive" size="sm">
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
