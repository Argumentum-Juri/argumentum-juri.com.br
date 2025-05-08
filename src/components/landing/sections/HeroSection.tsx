
import React, { FC } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Feather } from 'lucide-react';

const HeroSection: FC = () => {

  return (
    <section id="inicio" className="relative overflow-hidden py-20 sm:py-28 bg-gradient-to-b from-white to-gray-50">
      <div className="absolute inset-0 bg-[url('/pattern-light.svg')] opacity-5" aria-hidden="true"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Feather className="h-20 w-20 text-argumentum-gold animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-6xl font-serif text-argumentum-gold mb-6 font-bold leading-tight drop-shadow-sm">
            Argumentum
          </h1>
          <p className="text-2xl text-argumentum-text mb-4 font-light">
            O êxito começa com um bom argumento
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10">
            Transforme sua prática jurídica. Crie petições excepcionais com
            nossa plataforma inteligente, combinando expertise legal com eficiência incomparável.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-argumentum-gold hover:bg-argumentum-gold/90 text-argumentum-dark shadow-md hover:shadow-lg transition-all duration-300">
              <Link to="/auth?tab=signup">
                Começar Agora Gratuitamente
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-argumentum-gold text-argumentum-gold hover:bg-argumentum-gold/10 hover:text-argumentum-gold/90 transition-colors duration-300">
              <Link to="/auth?tab=signin">
                Já tenho uma conta
              </Link>
            </Button>
          </div>
            <p className="text-sm text-muted-foreground mt-4">Teste sem compromisso. Crie sua primeira petição hoje.</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
