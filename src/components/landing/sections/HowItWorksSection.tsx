
import React, { FC } from 'react';
import { FileText, Users, CheckSquare, LucideIcon } from 'lucide-react';

interface StepItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const HowItWorksSection: FC = () => {
  const howItWorksSteps: StepItem[] = [
    {
      icon: FileText,
      title: "1. Envie sua Demanda",
      description: "Descreva o caso e anexe os documentos necessários de forma segura em nossa plataforma."
    },
    {
      icon: Users,
      title: "2. Nossa Equipe Analisa",
      description: "Nossos especialistas jurídicos revisam sua solicitação e elaboram a petição."
    },
    {
      icon: CheckSquare,
      title: "3. Receba e Utilize",
      description: "Receba a petição pronta, revise se necessário e utilize em seus processos."
    }
  ];

  return (
    <section id="como-funciona" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif text-argumentum-gold mb-4">
            Como Funciona? Simples e Eficiente.
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Em apenas três passos, você transforma sua necessidade em uma petição de alta qualidade.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {howItWorksSteps.map((step, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
            >
              <div className={`inline-flex items-center justify-center p-4 bg-argumentum-gold/10 rounded-full mb-5 relative ${index < 2 ? 'after:content-[""] after:absolute after:w-full after:h-0.5 after:bg-gray-200 after:top-1/2 after:left-full after:transform after:-translate-y-1/2 after:hidden md:after:block' : ''}`}>
                <step.icon className="h-8 w-8 text-argumentum-gold relative z-10" />
              </div>
              <h3 className="text-xl font-semibold text-argumentum-text mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-argumentum-gold/10 p-8 rounded-lg border border-argumentum-gold/20 max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-serif text-argumentum-text mb-4">Pronto para começar?</h3>
          <p className="text-muted-foreground mb-0">
            Nossa plataforma torna todo o processo simples, seguro e eficiente. Experimente agora e veja a diferença.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
