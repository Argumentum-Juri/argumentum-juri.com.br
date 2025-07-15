
import React, { FC } from 'react';

const AboutSection: FC = () => {
  return (
    <section id="sobre" className="py-16 bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-serif text-argumentum-gold mb-10 text-center">
          Quem Somos
        </h2>

        <div className="prose prose-lg max-w-none mx-auto text-muted-foreground prose-headings:text-argumentum-text prose-headings:font-serif">
          <p className="lead text-lg text-center mb-8 text-argumentum-text">
            Combinamos expertise jurídica e tecnologia avançada para revolucionar a forma como advogados gerenciam petições..
          </p>
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
            <p>
              A Argumentum nasceu da confluência entre profundo conhecimento jurídico e tecnologia de vanguarda, com a missão clara de revolucionar a gestão e elaboração de petições no cenário jurídico brasileiro. Compreendemos os desafios diários enfrentados pelos advogados: a pressão dos prazos, a complexidade crescente das demandas, a necessidade de manter alta qualidade em cada documento e, principalmente, o tempo precioso consumido por tarefas operacionais que desviam o foco da estratégia processual e do relacionamento com o cliente.
            </p>
            <p>
              Fomos criados para ser a solução definitiva para a terceirização inteligente de peças jurídicas. Nossa plataforma inovadora não é apenas um intermediário, mas um ecossistema completo que conecta advogados e escritórios a uma rede selecionada de redatores jurídicos experientes. Através de um fluxo de trabalho otimizado e tecnologia intuitiva, transformamos a criação de petições – desde a solicitação inicial até a entrega final – em um processo ágil, seguro e eficiente. Nosso objetivo primordial é devolver aos profissionais do direito o controle sobre seu tempo e permitir que se dediquem ao núcleo da advocacia: a análise crítica, a construção de teses robustas e o atendimento personalizado que fideliza clientes. Seja você um advogado autônomo buscando mais produtividade, um escritório de pequeno ou médio porte querendo escalar sua capacidade, ou um grande departamento jurídico otimizando recursos, a Argumentum é sua parceira estratégica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <h3 className="text-2xl font-serif text-argumentum-gold mb-4">Nossa Missão</h3>
              <p className="text-muted-foreground">
                Facilitar e enriquecer o dia a dia dos advogados brasileiros, descomplicando a elaboração de documentos jurídicos. Fornecemos uma solução tecnológica robusta e intuitiva que não só agiliza a criação, revisão colaborativa e aprovação de petições, mas também garante padrões elevados de qualidade técnica e argumentativa.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <h3 className="text-2xl font-serif text-argumentum-gold mb-4">Nossa Visão</h3>
              <p className="text-muted-foreground">
                Ser reconhecida como a plataforma líder e o ecossistema de referência para a terceirização jurídica inteligente e colaborativa no Brasil. Aspiramos ser sinônimo de eficiência, confiança e inovação, impulsionando a transformação digital no setor jurídico.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <h3 className="text-2xl font-serif text-argumentum-gold mb-4">Nossos Valores</h3>
              <p className="text-muted-foreground">
                Excelência técnica, confidencialidade, inovação contínua, agilidade e compromisso com resultados. Acreditamos que a tecnologia deve potencializar o trabalho jurídico, não substituí-lo.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h3 className="text-2xl font-serif text-argumentum-gold mb-4">Nossa Equipe</h3>
            <p>
              O coração da Argumentum é nossa equipe multidisciplinar, uma fusão de talento e experiência. Contamos com advogados com vasta atuação prática em diversas áreas do direito (Cível, Trabalhista, Tributário, Empresarial, entre outras), engenheiros de software especializados em inteligência artificial, segurança de dados e desenvolvimento de plataformas escaláveis, além de especialistas em design e experiência do usuário focados nas necessidades específicas do profissional do direito. Nossos redatores jurídicos não são apenas selecionados através de um processo rigoroso que avalia conhecimento técnico e habilidade de escrita, mas também recebem treinamento contínuo para garantir que cada documento produzido atenda aos mais altos padrões de qualidade, precisão e conformidade legal.
            </p>
          </div>

          <div className="bg-argumentum-gold/10 p-8 rounded-xl border border-argumentum-gold/20">
            <h3 className="text-2xl font-serif text-argumentum-gold mb-4">Segurança e Confidencialidade</h3>
            <p>
              A confidencialidade é um pilar inegociável na advocacia, e na Argumentum, tratamos a segurança dos seus dados com a máxima seriedade. Implementamos um arsenal de medidas de segurança robustas, incluindo criptografia de ponta-a-ponta para dados em trânsito e em repouso, controles de acesso granulares baseados em funções, infraestrutura de nuvem segura e auditorias de segurança periódicas. Operamos em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD) e seguimos as melhores práticas internacionais de segurança da informação, garantindo que todas as informações e documentos compartilhados em nossa plataforma estejam protegidos contra acessos não autorizados e violações, preservando o sigilo profissional e a confiança de seus clientes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
