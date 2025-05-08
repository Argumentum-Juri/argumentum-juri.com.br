
import React, { FC } from 'react';
import { Clock, CheckCircle, Shield, LucideIcon } from 'lucide-react';

interface BenefitItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const BenefitsSection: FC = () => {
  const benefits: BenefitItem[] = [
    {
      icon: Clock,
      title: "Economia de Tempo",
      description: "Reduza drasticamente o tempo gasto na elaboração e revisão de petições. Foque no relacionamento com clientes e no planejamento estratégico."
    },
    {
      icon: CheckCircle,
      title: "Qualidade Garantida",
      description: "Petições elaboradas por especialistas e revisadas para máxima assertividade. Garantimos documentos tecnicamente rigorosos e argumentativamente sólidos."
    },
    {
      icon: Shield,
      title: "Segurança e Confidencialidade",
      description: "Seus dados e documentos protegidos com criptografia e protocolos rigorosos. Conformidade total com a LGPD e normas de ética profissional."
    }
  ];

  return (
    <section id="vantagens" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif text-argumentum-gold mb-4">
            Vantagens que Impulsionam seu Sucesso
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Veja como a Argumentum agrega valor real à sua advocacia e transforma sua prática diária.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center p-4 bg-argumentum-gold/10 rounded-full mb-6 ring-4 ring-argumentum-gold/5">
                <benefit.icon className="h-10 w-10 text-argumentum-gold" />
              </div>
              <h3 className="text-2xl font-serif text-argumentum-text mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 p-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h4 className="text-3xl font-bold text-argumentum-gold mb-2">+500</h4>
              <p className="text-muted-foreground">Advogados confiam em nosso serviço</p>
            </div>
            <div>
              <h4 className="text-3xl font-bold text-argumentum-gold mb-2">98%</h4>
              <p className="text-muted-foreground">Taxa de satisfação com nossas petições</p>
            </div>
            <div>
              <h4 className="text-3xl font-bold text-argumentum-gold mb-2">+5000</h4>
              <p className="text-muted-foreground">Petições entregues com sucesso</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
