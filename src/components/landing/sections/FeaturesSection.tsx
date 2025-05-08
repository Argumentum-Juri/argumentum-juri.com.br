
import React, { FC } from 'react';
import { ScrollText, Scale, Users2, Library, LucideIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeaturesSection: FC = () => {
  const features: FeatureItem[] = [
    {
      icon: ScrollText,
      title: "Petições Personalizadas",
      description: "Crie petições jurídicas de alta qualidade adaptadas às suas necessidades específicas."
    },
    {
      icon: Scale,
      title: "Expertise Jurídica",
      description: "Equipe especializada pronta para transformar seus argumentos em petições convincentes."
    },
    {
      icon: Users2,
      title: "Colaboração Eficiente",
      description: "Sistema intuitivo de revisão e aprovação para agilizar seu fluxo de trabalho."
    },
    {
      icon: Library,
      title: "Biblioteca de Modelos",
      description: "Acesso a templates profissionais para diversos tipos de petições jurídicas."
    }
  ];

  return (
    <section id="recursos" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif text-argumentum-gold mb-4">
            Recursos Desenhados para Advogados Modernos
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Nossa plataforma foi meticulosamente desenvolvida para otimizar seu fluxo de trabalho e garantir resultados excepcionais em cada petição.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="inline-flex items-center justify-center p-3 bg-argumentum-gold/10 rounded-lg mb-6 group-hover:bg-argumentum-gold/20 transition-colors duration-300">
                <feature.icon className="h-7 w-7 text-argumentum-gold" />
              </div>
              <h3 className="text-xl font-serif text-argumentum-text mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Button 
            asChild
            className="bg-argumentum-gold hover:bg-argumentum-goldLight text-argumentum-dark"
          >
            <Link to="/auth?tab=signup">
              Aproveitar Recursos Agora
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
