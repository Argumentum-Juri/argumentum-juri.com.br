
import React, { useState, FC } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import { toast } from "sonner";

const ContactSection: FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulando envio (substituir por chamada de API real)
    setTimeout(() => {
      toast.success('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setIsSubmitting(false);
      setSubmitted(true);
      
      // Reset submitted state after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <section id="contato" className="py-20 bg-gray-50 border-t">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif text-argumentum-gold mb-4">
            Entre em Contato
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Estamos à disposição para tirar suas dúvidas, ouvir seus comentários ou discutir como a Argumentum pode transformar sua prática jurídica.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Coluna de Informações de Contato */}
          <div className="md:col-span-1">
            <Card className="border-gray-200 shadow-md h-full bg-white">
              <CardHeader className="bg-argumentum-gold/10 border-b border-gray-200">
                <CardTitle className="text-argumentum-text">Informações de Contato</CardTitle>
                <CardDescription>Entre em contato por qualquer canal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-sm pt-6">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-3 mt-0.5 text-argumentum-gold flex-shrink-0" />
                  <div>
                    <p className="font-medium text-argumentum-text">Email</p>
                    <a href="mailto:contato@argumentum.com.br" className="text-argumentum-text hover:text-argumentum-gold transition-colors">
                      contato@argumentum.com.br
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="h-5 w-5 mr-3 mt-0.5 text-argumentum-gold flex-shrink-0" />
                  <div>
                    <p className="font-medium text-argumentum-text">Telefone</p>
                    <a href="tel:+551199999999" className="text-argumentum-text hover:text-argumentum-gold transition-colors">
                      +55 11 9999-9999
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 mt-0.5 text-argumentum-gold flex-shrink-0" />
                  <div>
                    <p className="font-medium text-argumentum-text">Endereço</p>
                    <address className="not-italic text-muted-foreground">
                      Av. Paulista, 1000, Sala 405<br />
                      São Paulo, SP<br />
                      CEP 01310-100
                    </address>
                  </div>
                </div>
                
                <div className="pt-4 mt-6 border-t border-gray-100">
                  <p className="font-medium text-argumentum-text mb-3">Horário de Atendimento</p>
                  <p className="text-muted-foreground">
                    Segunda a Sexta: 9h às 18h<br />
                    Sábados: 9h às 13h
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna do Formulário */}
          <div className="md:col-span-2">
            <Card className="border-gray-200 shadow-md bg-white">
              <CardHeader className="bg-argumentum-gold/10 border-b border-gray-200">
                <CardTitle className="text-argumentum-text">Envie sua mensagem</CardTitle>
                <CardDescription>Preenchendo o formulário abaixo, nossa equipe retornará em até 24h úteis</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {submitted ? (
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-green-100 rounded-full mb-6">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-argumentum-text mb-2">Mensagem Enviada!</h3>
                    <p className="text-muted-foreground">Obrigado por entrar em contato. Responderemos em breve.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm font-medium">Nome completo</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome completo"
                          required
                          className="border-gray-300 focus:border-argumentum-gold focus:ring-argumentum-gold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          required
                          className="border-gray-300 focus:border-argumentum-gold focus:ring-argumentum-gold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="subject" className="text-sm font-medium">Assunto</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Sobre o que você quer falar?"
                        required
                        className="border-gray-300 focus:border-argumentum-gold focus:ring-argumentum-gold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="message" className="text-sm font-medium">Mensagem</Label>
                      <Textarea
                        id="message"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escreva sua mensagem aqui..."
                        required
                        className="border-gray-300 focus:border-argumentum-gold focus:ring-argumentum-gold"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full md:w-auto bg-argumentum-gold hover:bg-argumentum-gold/90 text-argumentum-dark px-6"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
