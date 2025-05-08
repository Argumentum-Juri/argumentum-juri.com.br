
import React from 'react';
import { Shield, Lock, Server, FileCheck, UserCheck, Clock, RefreshCw } from 'lucide-react';

const SecurityFeature = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="flex space-x-4">
    <div className="shrink-0">
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
    </div>
    <div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

const Security = () => {
  return (
    <div className="py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Segurança</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A proteção dos seus dados e documentos jurídicos é nossa prioridade máxima
          </p>
        </div>
        
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-6">Nossa Abordagem de Segurança</h2>
            <p className="mb-6">
              A Petição Ágil implementa as mais rigorosas medidas de segurança para garantir que seus dados e documentos jurídicos estejam sempre protegidos. Nossa infraestrutura foi projetada com segurança em mente desde o início, incorporando múltiplas camadas de proteção e seguindo as melhores práticas do setor.
            </p>
            <p>
              Entendemos a natureza sensível e confidencial dos documentos jurídicos e nos comprometemos a manter os mais altos padrões de segurança, em total conformidade com a Lei Geral de Proteção de Dados (LGPD) e outras regulamentações aplicáveis.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-6">Recursos de Segurança</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <SecurityFeature 
                icon={<Shield className="h-6 w-6" />}
                title="Criptografia de Ponta a Ponta"
                description="Todos os dados são criptografados em trânsito e em repouso, garantindo que somente pessoas autorizadas possam acessá-los."
              />
              
              <SecurityFeature 
                icon={<Lock className="h-6 w-6" />}
                title="Autenticação Forte"
                description="Sistema de autenticação de múltiplos fatores para impedir acessos não autorizados às contas."
              />
              
              <SecurityFeature 
                icon={<Server className="h-6 w-6" />}
                title="Infraestrutura Segura"
                description="Servidores em data centers certificados com monitoramento 24/7 e proteção contra ameaças físicas e virtuais."
              />
              
              <SecurityFeature 
                icon={<FileCheck className="h-6 w-6" />}
                title="Controle de Acesso"
                description="Permissões granulares que garantem que apenas usuários autorizados possam acessar documentos específicos."
              />
              
              <SecurityFeature 
                icon={<UserCheck className="h-6 w-6" />}
                title="Confidencialidade"
                description="Rígidos acordos de confidencialidade com toda nossa equipe para proteger as informações dos clientes."
              />
              
              <SecurityFeature 
                icon={<Clock className="h-6 w-6" />}
                title="Logs de Auditoria"
                description="Registro detalhado de todas as ações realizadas na plataforma para rastreabilidade completa."
              />
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-6">Conformidade com a LGPD</h2>
            <p className="mb-4">
              A Petição Ágil está totalmente alinhada com a Lei Geral de Proteção de Dados (LGPD), implementando todos os requisitos necessários para garantir a devida proteção aos dados pessoais dos usuários.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Coletamos apenas os dados necessários para a prestação de nossos serviços</li>
              <li>Garantimos total transparência sobre como seus dados são utilizados</li>
              <li>Fornecemos ferramentas para que você possa exercer seus direitos de titular de dados</li>
              <li>Implementamos medidas técnicas e organizacionais para proteger seus dados</li>
              <li>Mantemos registros de todas as operações de tratamento de dados realizadas</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-6">Monitoramento e Resposta a Incidentes</h2>
            <p className="mb-4">
              Nossa equipe de segurança monitora continuamente a plataforma em busca de potenciais vulnerabilidades ou ameaças. Em caso de identificação de qualquer incidente de segurança:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Ativamos imediatamente nosso protocolo de resposta a incidentes</li>
              <li>Isolamos o problema para evitar propagação</li>
              <li>Realizamos análise forense detalhada</li>
              <li>Comunicamos os usuários afetados conforme exigido pela LGPD</li>
              <li>Implementamos medidas corretivas para evitar recorrências</li>
            </ul>
            <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
              <div className="flex items-start space-x-4">
                <div className="shrink-0">
                  <RefreshCw className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Melhoria Contínua</h4>
                  <p className="text-sm text-muted-foreground">
                    Conduzimos regularmente testes de penetração, análises de vulnerabilidades e auditorias de segurança para garantir que nossos sistemas estejam sempre protegidos contra as mais recentes ameaças cibernéticas.
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-6">Perguntas sobre Segurança</h2>
            <p>
              Se você tiver dúvidas ou preocupações sobre nossas práticas de segurança, entre em contato com nossa equipe através do e-mail <a href="mailto:seguranca@peticaoagil.com.br" className="text-primary hover:underline">seguranca@peticaoagil.com.br</a>. Temos satisfação em fornecer informações adicionais sobre como protegemos seus dados.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Security;
