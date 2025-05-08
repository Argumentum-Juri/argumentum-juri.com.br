
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import ChatPetitionForm from "@/components/ChatPetitionForm";
import { HelpCircle, FileText, AlertCircle, Coins, MessageSquareDashedIcon, BookOpen, Users, FileCheck, ArrowRight, CalendarClock, Paperclip } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import { tokenService } from '@/services/tokenService';
import { getPetitionTokenCost } from '@/services/petition/core/createPetition';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

const PetitionFormPage = () => {
  const navigate = useNavigate();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [requiredTokens, setRequiredTokens] = useState<number>(16);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTokens = async () => {
      try {
        setLoading(true);
        // Get current token balance
        const balance = await tokenService.getTokenBalance();
        setTokenBalance(balance);
        
        // Get required tokens for petition
        const cost = await getPetitionTokenCost();
        setRequiredTokens(cost);
        
        // If not enough tokens, show warning toast and redirect after delay
        if (balance < cost) {
          toast.warning(
            'Saldo insuficiente de tokens', 
            { description: `Você precisa de pelo menos ${cost} tokens para criar uma petição.` }
          );
          
          // Redirect to token store after a short delay
          setTimeout(() => {
            navigate('/tokens/store');
          }, 2000);
        }
      } catch (error) {
        console.error('Erro ao verificar saldo de tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    checkTokens();
  }, [navigate]);

  // Don't render anything if checking balance or not enough tokens
  if (loading) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p>Verificando seu saldo de tokens...</p>
        </div>
      </div>
    );
  }

  // Check if token balance is insufficient after loading - redirect to token store
  if (tokenBalance !== null && tokenBalance < requiredTokens) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Saldo insuficiente de tokens</h2>
          <p className="mb-4 text-muted-foreground">
            Você precisa de pelo menos {requiredTokens} tokens para criar uma petição. 
            Seu saldo atual é de {tokenBalance} tokens.
          </p>
          <Button onClick={() => navigate('/tokens/store')} className="w-full">
            <Coins className="mr-2 h-4 w-4" />
            Comprar tokens
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
      <div className="mb-10 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div>
            <h1 className="text-4xl font-bold text-primary">Nova Petição</h1>
            <p className="mt-3 text-muted-foreground">
              Responda às perguntas a seguir para criar sua nova petição jurídica personalizada.
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 whitespace-nowrap w-full sm:w-auto">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>Como funciona</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-primary text-xl">Ajuda para criar uma nova petição</DialogTitle>
                <DialogDescription>
                  Orientações detalhadas para preenchimento do formulário de petição
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="mt-4 overflow-y-auto max-h-[60vh] pr-3">
                <div className="space-y-4">
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <h3 className="font-medium text-primary flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Título da Petição
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Crie um título claro e objetivo que identifique o assunto da petição. Um bom título deve refletir 
                      o pedido principal e o ramo do direito relacionado. Exemplos: "Contestação - Ação de Cobrança" ou
                      "Petição Inicial - Ação de Indenização por Danos Morais".
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <h3 className="font-medium text-primary flex items-center gap-2">
                      <MessageSquareDashedIcon className="h-4 w-4" /> Descrição Detalhada
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Detalhe os fatos e argumentos principais. Seja específico e conciso, incluindo todas as informações 
                      relevantes como datas, valores, nomes completos e contexto necessário para compreensão do caso.
                      Quanto mais detalhes você fornecer, melhor será a qualidade da petição elaborada.
                    </p>
                    <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                      <strong>Dica:</strong> Inclua datas precisas dos acontecimentos, valores exatos envolvidos, 
                      citações de leis ou jurisprudência relevantes e quaisquer tentativas anteriores de resolução.
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <h3 className="font-medium text-primary flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> Área Legal e Tipo
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Selecione a área do direito (cível, trabalhista, tributário, etc.) e o tipo de petição (inicial, 
                      contestação, recurso, etc.). Isso permite direcionar sua solicitação ao especialista adequado e 
                      formatar o documento de acordo com as especificidades de cada ramo jurídico.
                    </p>
                    <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                      <strong>Áreas disponíveis:</strong> Civil, Trabalhista, Tributário, Previdenciário, Penal, 
                      Administrativo, Consumidor, Família e Sucessões, entre outras.
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <h3 className="font-medium text-primary flex items-center gap-2">
                      <Users className="h-4 w-4" /> Partes do Processo
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Informe detalhadamente quem são as partes envolvidas no processo (autores e réus).
                      Indique quais partes você representa, para elaboração correta do documento.
                      É importante incluir o nome completo, documentos de identificação e qualificação das partes.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <h3 className="font-medium text-primary flex items-center gap-2">
                      <FileCheck className="h-4 w-4" /> Número de Processo
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Se não for uma petição inicial, informe o número completo do processo seguindo o padrão do CNJ
                      (Ex: NNNNNNN-DD.AAAA.J.TR.OOOO). Este número é essencial para o correto protocolo da petição
                      e para vinculação aos autos existentes.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <h3 className="font-medium text-primary flex items-center gap-2">
                      <Paperclip className="h-4 w-4" /> Anexos
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione documentos que fundamentam seu pedido, como contratos, notificações, provas ou documentos pessoais.
                      Certifique-se que os arquivos estejam legíveis e em formato apropriado (PDF, DOC, DOCX ou imagens).
                    </p>
                    <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                      <strong>Tipos de arquivos aceitos:</strong> PDF, DOC, DOCX, JPG, PNG (tamanho máximo: 10MB por arquivo)
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <h3 className="font-medium text-primary flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" /> Fluxo de Aprovação 
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Após o envio do formulário, nossa equipe jurídica analisará seu pedido e elaborará a petição.
                      Você receberá uma notificação quando a petição estiver pronta para revisão. Você poderá solicitar
                      ajustes ou aprovar o documento final.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <h3 className="font-medium text-primary flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" /> Prazos
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      O prazo médio para elaboração da petição é de 2 a 5 dias úteis, dependendo da complexidade.
                      Caso tenha urgência, informe na descrição do pedido para que possamos priorizar seu atendimento.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <h3 className="font-medium text-primary flex items-center gap-2">
                      <Coins className="h-4 w-4" /> Custo da Petição
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      A criação de uma nova petição custa {requiredTokens} tokens. Estes tokens serão deduzidos do seu saldo 
                      no momento da submissão da petição. Certifique-se de ter tokens suficientes antes de iniciar.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-start md:items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
            <FileText className="h-8 w-8 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-1 md:mt-0" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300">Como funciona?</h3>
              <p className="text-sm text-blue-700/80 dark:text-blue-400/80">
                O sistema vai guiá-lo em cada etapa da criação da petição. Preencha os detalhes solicitados e, se necessário, 
                adicione anexos para dar suporte à sua solicitação. Nossos advogados especializados irão analisar e 
                preparar seu documento.
              </p>
            </div>
          </div>
          
          <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
            <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">
              Custo da petição: {requiredTokens} tokens
            </AlertTitle>
            <AlertDescription className="text-amber-700/80 dark:text-amber-400/80">
              A criação desta petição custará {requiredTokens} tokens do seu saldo.
              {tokenBalance !== null && (
                <span className="ml-1">
                  Seu saldo atual é de <strong>{tokenBalance} tokens</strong>.
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
      
      <ChatPetitionForm tokenCost={requiredTokens} />
    </div>
  );
};

export default PetitionFormPage;
