
import React, { FC } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const CallToActionSection: FC = () => {
  return (
    <section id="cta" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-xl p-10 md:p-16 text-center border border-gray-100">
          <h2 className="text-4xl md:text-5xl font-serif text-argumentum-gold mb-6 leading-tight">
            Pronto para Elevar sua Advocacia?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de advogados que já estão economizando tempo, aumentando a qualidade
            e focando no que realmente importa com a Argumentum.
          </p>
          <Button 
            asChild 
            size="lg" 
            className="landing-btn bg-argumentum-gold hover:bg-argumentum-gold/90 text-argumentum-dark text-lg px-4 py-3 whitespace-normal h-auto min-h-12 w-full sm:w-auto"
          >
            <Link to="/auth?tab=signup">
              Acesse agora a plataforma
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">Crie sua conta e comece a usar imediatamente. Sem compromisso.</p>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
