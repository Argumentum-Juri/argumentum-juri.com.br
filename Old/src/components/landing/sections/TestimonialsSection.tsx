
import React, { FC } from 'react';
import { Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

interface Testimonial {
  quote: string;
  author: string;
  title: string;
  stars: number;
}

const TestimonialsSection: FC = () => {
  const testimonials: Testimonial[] = [
    {
      quote: "A Argumentum revolucionou a forma como lidamos com petições. A qualidade e a agilidade são incomparáveis. Consegui aumentar em 40% minha capacidade de atendimento.",
      author: "Dr. Carlos Andrade",
      title: "Advogado Cível",
      stars: 5
    },
    {
      quote: "O tempo que economizo usando a plataforma me permite focar em outras áreas estratégicas do meu escritório. O retorno sobre o investimento foi visível já no primeiro mês de uso.",
      author: "Dra. Beatriz Lima",
      title: "Advogado Trabalhista",
      stars: 5
    },
    {
      quote: "A segurança e a facilidade de uso da plataforma são pontos altos. O suporte técnico é excepcional, sempre disponível para tirar dúvidas. Recomendo fortemente!",
      author: "Dr. Ricardo Mendes",
      title: "Advogado Cível",
      stars: 4
    }
  ];

  return (
    <section id="depoimentos" className="py-20 bg-argumentum-light/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif text-argumentum-gold mb-4">
            O Que Nossos Clientes Dizem
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Advogados como você já estão colhendo os frutos da parceria com a Argumentum.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < testimonial.stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <blockquote className="text-muted-foreground italic mb-6 flex-grow">
                "{testimonial.quote}"
              </blockquote>
              <div className="mt-auto pt-4 border-t border-gray-100">
                <p className="font-semibold text-argumentum-text">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.title}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild className="landing-btn bg-argumentum-gold hover:bg-argumentum-goldLight text-argumentum-dark px-4 py-2 whitespace-normal h-auto">
            <Link to="/auth?tab=signup">
              Junte-se aos Nossos Clientes Satisfeitos
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
