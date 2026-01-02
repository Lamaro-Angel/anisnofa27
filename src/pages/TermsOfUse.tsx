import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, AlertTriangle, CheckCircle, Ban, Scale, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
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
                {/* Aceitação */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Ao aceder ou utilizar o Sistema de Gestão Escolar Anisnofa, você concorda em 
                    cumprir e estar vinculado a estes Termos de Uso. Se não concordar com qualquer 
                    parte destes termos, não poderá utilizar a plataforma. O uso continuado da 
                    plataforma constitui aceitação de quaisquer alterações aos termos.
                  </p>
                </section>

                {/* Descrição do Serviço */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">2. Descrição do Serviço</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="leading-relaxed">
                      O Anisnofa é uma plataforma de gestão escolar que oferece:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Gestão de notas e avaliações.</li>
                      <li>Controlo de presenças e assiduidade.</li>
                      <li>Comunicação entre escola, professores, alunos e encarregados.</li>
                      <li>Gestão de turmas e horários.</li>
                      <li>Gestão de pagamentos de propinas.</li>
                      <li>Publicação de avisos e comunicados.</li>
                    </ul>
                  </div>
                </section>

                {/* Contas de Utilizador */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">3. Contas de Utilizador</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="leading-relaxed">Ao criar uma conta, você concorda em:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Fornecer informações verdadeiras, exactas e completas.</li>
                      <li>Manter a confidencialidade da sua palavra-passe.</li>
                      <li>Notificar imediatamente sobre qualquer uso não autorizado.</li>
                      <li>Ser responsável por todas as actividades realizadas na sua conta.</li>
                      <li>Não partilhar a sua conta com terceiros.</li>
                    </ul>
                  </div>
                </section>

                {/* Uso Aceitável */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">4. Uso Aceitável</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="leading-relaxed">Ao utilizar a plataforma, você compromete-se a:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Utilizar a plataforma apenas para fins educativos legítimos.</li>
                      <li>Respeitar os direitos de outros utilizadores.</li>
                      <li>Manter um comportamento adequado nas comunicações.</li>
                      <li>Não tentar aceder a dados de outros utilizadores.</li>
                      <li>Reportar bugs ou vulnerabilidades de segurança.</li>
                    </ul>
                  </div>
                </section>

                {/* Uso Proibido */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Ban className="h-5 w-5 text-destructive" />
                    <h2 className="text-xl font-semibold">5. Uso Proibido</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="leading-relaxed">É estritamente proibido:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Utilizar a plataforma para fins ilegais ou não autorizados.</li>
                      <li>Tentar hackear, interferir ou danificar o sistema.</li>
                      <li>Enviar spam, vírus ou código malicioso.</li>
                      <li>Publicar conteúdo ofensivo, discriminatório ou ilegal.</li>
                      <li>Fazer-se passar por outra pessoa ou entidade.</li>
                      <li>Recolher dados de outros utilizadores sem autorização.</li>
                      <li>Utilizar ferramentas automatizadas para aceder à plataforma.</li>
                    </ul>
                  </div>
                </section>

                {/* Propriedade Intelectual */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">6. Propriedade Intelectual</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Todo o conteúdo da plataforma, incluindo mas não limitado a textos, gráficos, 
                    logótipos, ícones, imagens, clips de áudio, software e código, é propriedade 
                    da Anisnofa ou dos seus licenciadores e está protegido por leis de direitos 
                    de autor e propriedade intelectual.
                  </p>
                </section>

                {/* Conteúdo do Utilizador */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">7. Conteúdo do Utilizador</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Ao submeter conteúdo à plataforma (trabalhos, mensagens, ficheiros), você 
                    mantém os seus direitos de propriedade, mas concede à Anisnofa uma licença 
                    não exclusiva para armazenar, processar e exibir esse conteúdo no âmbito 
                    do serviço prestado.
                  </p>
                </section>

                {/* Limitação de Responsabilidade */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <h2 className="text-xl font-semibold">8. Limitação de Responsabilidade</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <p className="leading-relaxed">
                      A Anisnofa não será responsável por:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Interrupções temporárias do serviço por manutenção ou falhas técnicas.</li>
                      <li>Perda de dados devido a falhas não atribuíveis à Anisnofa.</li>
                      <li>Danos resultantes do uso indevido da plataforma por utilizadores.</li>
                      <li>Conteúdo publicado por terceiros na plataforma.</li>
                    </ul>
                  </div>
                </section>

                {/* Suspensão e Encerramento */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">9. Suspensão e Encerramento</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    A Anisnofa reserva-se o direito de suspender ou encerrar contas que violem 
                    estes termos, sem aviso prévio. Em caso de violações graves, podemos tomar 
                    medidas legais adicionais.
                  </p>
                </section>

                {/* Alterações */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">10. Alterações aos Termos</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Podemos modificar estes termos a qualquer momento. As alterações entram em 
                    vigor imediatamente após a publicação. É sua responsabilidade rever os termos 
                    periodicamente. O uso continuado após alterações constitui aceitação.
                  </p>
                </section>

                {/* Lei Aplicável */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">11. Lei Aplicável</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Estes termos são regidos pelas leis da República de Angola. Qualquer litígio 
                    será submetido aos tribunais competentes de Luanda.
                  </p>
                </section>

                {/* Contacto */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">12. Contacto</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Para questões sobre estes termos, contacte-nos através do email: <strong>suporte@anisnofa.ao</strong>
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
            <Link to="/politica-privacidade">Ver Política de Privacidade</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
