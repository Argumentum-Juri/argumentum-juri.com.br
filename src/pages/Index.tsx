import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
// ❌ Remova o useAuth antigo:
// import { useAuth } from '@/contexts/AuthContext';
// ✅ Importe o hook do GoAuthContext
import { useGoAuth } from '@/contexts/GoAuthContext';
import { Feather, CheckCircle, Clock, Shield, Scale, ScrollText, Users2, Library } from 'lucide-react';

const Index = () => {
  // ❌ const { user } = useAuth();
  // ✅ use o hook do GoAuthContext
  const { user } = useGoAuth();

  const features = [
    {
      icon: ScrollText,
      title: "Petições Personalizadas",
      description: "Crie petições jurídicas de alta qualidade adaptadas às suas necessidades específicas."
    },
    {
      icon: Scale,
      title: "Expertise Jurídica",
      description: "Uma equipe especializada pronta para transformar seus argumentos em petições convincentes."
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

  const benefits = [
    {
      icon: Clock,
      title: "Economia de Tempo",
      description: "Reduza drasticamente o tempo gasto na elaboração de petições."
    },
    {
      icon: CheckCircle,
      title: "Qualidade Garantida",
      description: "Revisão especializada em cada documento produzido."
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Seus dados e documentos protegidos com a máxima segurança."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-[url('/pattern-light.svg')] opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Feather className="h-20 w-20 text-argumentum-gold animate-feather-float" />
            </div>
            <h1 className="text-5xl md:text-6xl font-serif text-argumentum-gold mb-6 font-bold leading-tight">
              Argumentum
            </h1>
            <p className="text-2xl text-argumentum-text mb-4 font-light">
              O êxito começa com um bom argumento
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10">
              Nossa plataforma especializada auxilia advogados a criarem petições jurídicas
              excepcionais, combinando expertise legal com eficiência operacional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button asChild size="lg" className="bg-argumentum-gold hover:bg-argumentum-goldLight text-argumentum-dark">
                  <Link to="/dashboard">
                    Acessar Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-argumentum-gold hover:bg-argumentum-goldLight text-argumentum-dark">
                    <Link to="/auth?tab=signup">
                      Começar Agora
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-argumentum-gold text-argumentum-gold hover:bg-argumentum-light">
                    <Link to="/auth?tab=signin">
                      Já tenho uma conta
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-argumentum-gold mb-4">
              Recursos Exclusivos
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Nossa plataforma foi desenvolvida para otimizar seu fluxo de trabalho e garantir
              resultados excepcionais em cada petição.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="inline-flex items-center justify-center p-3 bg-argumentum-gold/10 rounded-lg mb-6 group-hover:bg-argumentum-gold/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-argumentum-gold" />
                </div>
                <h3 className="text-xl font-serif text-argumentum-gold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center p-4 bg-argumentum-gold/10 rounded-full mb-6">
                  <benefit.icon className="h-8 w-8 text-argumentum-gold" />
                </div>
                <h3 className="text-xl font-serif text-argumentum-gold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-serif text-argumentum-gold mb-6">
              Pronto para transformar sua prática jurídica?
            </h2>
            <p className="text-muted-foreground mb-10">
              Junte-se a centenas de advogados que já estão economizando tempo e melhorando
              a qualidade de suas petições com nossa plataforma especializada.
            </p>
            <Button asChild size="lg" className="bg-argumentum-gold hover:bg-argumentum-goldLight text-argumentum-dark">
              <Link to={user ? "/dashboard" : "/auth?tab=signup"}>
                {user ? "Acessar Dashboard" : "Começar Agora"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
