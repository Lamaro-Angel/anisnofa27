import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Lock, Eye, FileText, Users, Database, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
          <p className="text-muted-foreground mt-2">
            Sistema de Gestão Escolar Anisnofa
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Última atualização: Janeiro de 2025
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-8">
                {/* Introdução */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">1. Introdução</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    A Anisnofa está comprometida em proteger a privacidade dos nossos utilizadores. 
                    Esta Política de Privacidade explica como recolhemos, utilizamos, armazenamos e 
                    protegemos as informações pessoais dos alunos, professores, encarregados de educação 
                    e demais utilizadores do nosso Sistema de Gestão Escolar.
                  </p>
                </section>

                {/* Dados Recolhidos */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">2. Dados que Recolhemos</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="leading-relaxed">Recolhemos os seguintes tipos de dados:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Dados de identificação:</strong> Nome completo, email, número de telefone, data de nascimento, género.</li>
                      <li><strong>Dados académicos:</strong> Notas, presenças, turma, número de aluno, trabalhos submetidos.</li>
                      <li><strong>Dados de acesso:</strong> Endereço IP, tipo de dispositivo, browser utilizado, data e hora de acesso.</li>
                      <li><strong>Dados de comunicação:</strong> Mensagens trocadas dentro da plataforma.</li>
                      <li><strong>Dados financeiros:</strong> Histórico de pagamentos de propinas (apenas para encarregados).</li>
                    </ul>
                  </div>
                </section>

                {/* Finalidade */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">3. Finalidade do Tratamento</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="leading-relaxed">Os seus dados são utilizados para:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Gestão do processo educativo (notas, presenças, avaliações).</li>
                      <li>Comunicação entre escola, alunos e encarregados de educação.</li>
                      <li>Gestão administrativa e financeira.</li>
                      <li>Melhoria contínua dos serviços prestados.</li>
                      <li>Cumprimento de obrigações legais.</li>
                      <li>Segurança e prevenção de fraudes.</li>
                    </ul>
                  </div>
                </section>

                {/* Partilha de Dados */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">4. Partilha de Dados</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="leading-relaxed">
                      Os seus dados pessoais são tratados de forma confidencial e não são vendidos a terceiros. 
                      Podemos partilhar dados com:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Autoridades educativas, quando legalmente exigido.</li>
                      <li>Prestadores de serviços tecnológicos (alojamento, segurança).</li>
                      <li>Outras entidades, apenas com o seu consentimento expresso.</li>
                    </ul>
                  </div>
                </section>

                {/* Segurança */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">5. Segurança dos Dados</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="leading-relaxed">
                      Implementamos medidas técnicas e organizativas para proteger os seus dados:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Encriptação de dados em trânsito e em repouso.</li>
                      <li>Controlo de acessos baseado em funções (RLS).</li>
                      <li>Autenticação segura com opção de múltiplos fatores.</li>
                      <li>Monitorização contínua de actividades suspeitas.</li>
                      <li>Backups regulares e planos de recuperação.</li>
                    </ul>
                  </div>
                </section>

                {/* Direitos */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">6. Os Seus Direitos</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="leading-relaxed">Enquanto titular dos dados, tem os seguintes direitos:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Acesso:</strong> Solicitar cópia dos seus dados pessoais.</li>
                      <li><strong>Rectificação:</strong> Corrigir dados incorrectos ou incompletos.</li>
                      <li><strong>Apagamento:</strong> Solicitar a eliminação dos seus dados (com limitações legais).</li>
                      <li><strong>Portabilidade:</strong> Receber os seus dados em formato estruturado.</li>
                      <li><strong>Oposição:</strong> Opor-se ao tratamento em certas circunstâncias.</li>
                      <li><strong>Limitação:</strong> Restringir o tratamento dos seus dados.</li>
                    </ul>
                  </div>
                </section>

                {/* Retenção */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">7. Período de Retenção</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Os dados pessoais são conservados durante o período necessário para as finalidades 
                    que motivaram a sua recolha, ou pelo período exigido por lei. Dados académicos são 
                    mantidos por um mínimo de 10 anos após a conclusão do percurso escolar.
                  </p>
                </section>

                {/* Cookies */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">8. Cookies e Tecnologias Similares</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Utilizamos cookies essenciais para o funcionamento da plataforma, incluindo 
                    autenticação e preferências de sessão. Não utilizamos cookies de rastreamento 
                    ou publicidade.
                  </p>
                </section>

                {/* Contacto */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">9. Contacto</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Para questões relacionadas com a privacidade dos seus dados ou para exercer 
                    os seus direitos, contacte-nos através do email: <strong>privacidade@anisnofa.ao</strong>
                  </p>
                </section>

                {/* Alterações */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">10. Alterações à Política</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Esta política pode ser atualizada periodicamente. Notificaremos sobre alterações 
                    significativas através da plataforma ou por email. A continuação do uso da 
                    plataforma após as alterações constitui aceitação da política atualizada.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/auth">Voltar ao Login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/termos">Ver Termos de Uso</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
