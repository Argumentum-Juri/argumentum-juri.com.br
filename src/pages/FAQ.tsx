
import React, { useState } from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const faqCategories = [
    {
      title: "Sobre a Plataforma",
      questions: [
        {
          question: "O que é a Petição Ágil?",
          answer: "A Petição Ágil é uma plataforma online que permite a advogados terceirizar a criação de petições jurídicas. Nosso serviço otimiza o fluxo de trabalho, possibilitando que os profissionais foquem em aspectos estratégicos da advocacia."
        },
        {
          question: "Quem pode utilizar a plataforma?",
          answer: "A plataforma é destinada a advogados, escritórios de advocacia e departamentos jurídicos que desejam otimizar seu fluxo de trabalho e terceirizar a criação de petições."
        },
        {
          question: "Como garantem a qualidade dos documentos?",
          answer: "Contamos com uma equipe de redatores jurídicos especializados em diversas áreas do direito. Todos os documentos passam por um rigoroso processo de revisão antes de serem entregues ao cliente."
        }
      ]
    },
    {
      title: "Processo de Trabalho",
      questions: [
        {
          question: "Como faço para solicitar uma petição?",
          answer: "Após fazer login, acesse a seção 'Nova Petição', preencha o formulário com as informações necessárias e envie sua solicitação. Você pode anexar documentos relevantes para auxiliar na elaboração."
        },
        {
          question: "Qual o prazo para recebimento da petição?",
          answer: "O prazo varia conforme o plano contratado e a complexidade da petição. Normalmente, entregamos em 24-48 horas para casos padrão, mas também oferecemos opções de entrega urgente."
        },
        {
          question: "É possível solicitar alterações no documento recebido?",
          answer: "Sim. Após receber o documento, você pode solicitar revisões e ajustes através da plataforma. Cada plano inclui um determinado número de revisões sem custo adicional."
        }
      ]
    },
    {
      title: "Pagamentos e Planos",
      questions: [
        {
          question: "Como funciona o sistema de tokens?",
          answer: "Os tokens são créditos utilizados para solicitar petições. Cada petição consome uma quantidade específica de tokens, dependendo da sua complexidade e urgência."
        },
        {
          question: "Os tokens têm validade?",
          answer: "Sim, os tokens adquiridos têm validade de 12 meses a partir da data de compra."
        },
        {
          question: "É possível cancelar uma assinatura?",
          answer: "Sim. Você pode cancelar sua assinatura a qualquer momento através da plataforma. O acesso permanecerá ativo até o final do período já pago."
        }
      ]
    },
    {
      title: "Segurança e Privacidade",
      questions: [
        {
          question: "Como garantem a confidencialidade dos documentos?",
          answer: "Implementamos medidas rigorosas de segurança, incluindo criptografia de ponta a ponta, e todos os nossos colaboradores assinam termos de confidencialidade. Estamos em conformidade com a LGPD."
        },
        {
          question: "Por quanto tempo meus documentos ficam armazenados?",
          answer: "Os documentos permanecem armazenados em sua conta enquanto ela estiver ativa. Você pode excluí-los quando desejar ou solicitar a exclusão completa de sua conta e dados."
        },
        {
          question: "Quem tem acesso às informações que envio?",
          answer: "Apenas nossa equipe autorizada tem acesso às informações necessárias para elaborar sua petição. Não compartilhamos seus dados com terceiros sem seu consentimento."
        }
      ]
    }
  ];
  
  // Filtrar perguntas com base na pesquisa
  const filteredFAQs = searchTerm 
    ? faqCategories.map(category => ({
        ...category,
        questions: category.questions.filter(q => 
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
          q.answer.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(category => category.questions.length > 0)
    : faqCategories;
  
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-4">Perguntas Frequentes</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Encontre respostas para as dúvidas mais comuns sobre nossa plataforma
          </p>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por palavra-chave..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground">
                Nenhum resultado encontrado para "{searchTerm}".
              </p>
              <p className="mt-2">
                Tente utilizar palavras-chave diferentes ou entre em contato conosco.
              </p>
            </div>
          ) : (
            filteredFAQs.map((category, index) => (
              category.questions.length > 0 && (
                <div key={index} className="mb-10">
                  <h2 className="text-xl font-semibold mb-4">{category.title}</h2>
                  <Accordion type="single" collapsible className="space-y-4">
                    {category.questions.map((item, itemIndex) => (
                      <AccordionItem key={itemIndex} value={`item-${index}-${itemIndex}`} className="border rounded-lg px-5">
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="pt-2 pb-3 text-muted-foreground">
                            {item.answer}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
