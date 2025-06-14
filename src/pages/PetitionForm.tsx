
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import ChatPetitionForm from "@/components/ChatPetitionForm";
import { 
  HelpCircle, 
  FileText, 
  Coins, 
  MessageSquareDashedIcon, 
  BookOpen, 
  Users, 
  FileCheck, 
  ArrowRight, 
  CalendarClock, 
  Paperclip,
  Loader2, 
  AlertCircle as AlertCircleIcon 
} from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
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

// Hooks e Serviços
import { useAuth } from '@/contexts/AuthContext';     
import { tokenService } from '@/services/tokenService'; 
// DEFAULT_PETITION_COST é usado diretamente, getPetitionTokenCost removido se for igual
import { DEFAULT_PETITION_COST } from '@/services/petition';    

const PetitionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, isLoading: authLoading, teamId, activeTeam, teamLoading } = useAuth(); 

  const [teamTokenBalance, setTeamTokenBalance] = useState<number | null>(null);
  const [loadingTeamBalance, setLoadingTeamBalance] = useState<boolean>(false);
  // Simplificação: requiredTokens é agora diretamente DEFAULT_PETITION_COST
  const [requiredTokens] = useState<number>(DEFAULT_PETITION_COST); 
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Função para buscar/atualizar saldo do time
  const fetchTeamBalance = useCallback(async () => {
    if (!teamId || !currentUser) {
      if (currentUser && !teamId && !teamLoading) {
         setErrorState("Nenhuma equipe ativa encontrada. O saldo do time não pode ser verificado.");
         toast.error("Nenhuma equipe ativa encontrada para verificar o saldo de tokens.", {id: "no-active-team-balance"});
      }
      setTeamTokenBalance(null);
      setLoadingTeamBalance(false); // Certificar que o loading para se não houver time
      return;
    }

    setLoadingTeamBalance(true);
    setErrorState(null);
    try {
      const balance = await tokenService.getTeamTokenBalance(teamId);
      setTeamTokenBalance(balance);
    } catch (error) {
      console.error(`Erro ao buscar saldo do time ${teamId}:`, error);
      toast.error("Falha ao buscar saldo do time.", { id: "team-balance-fetch-error" });
      setTeamTokenBalance(null);
      setErrorState("Falha ao buscar saldo do time.");
    } finally {
      setLoadingTeamBalance(false);
    }
  }, [teamId, currentUser, teamLoading]);

  useEffect(() => {
    setPageLoading(authLoading || teamLoading || loadingTeamBalance);
  }, [authLoading, teamLoading, loadingTeamBalance]);

  useEffect(() => {
    // Realiza as buscas iniciais
    if (!authLoading && !teamLoading) { // Somente após auth e team context carregarem
      if (currentUser && teamId) { 
        fetchTeamBalance();
      } else if (currentUser && !teamId) {
        // Se usuário existe, carregamento do time terminou, mas não há time ativo
        setErrorState("Equipe ativa não encontrada. Não é possível prosseguir.");
        toast.error("Equipe ativa não identificada.", {id: "petitionform-no-team"});
        setPageLoading(false); 
      } else if (!currentUser) {
        setPageLoading(false); 
      }
    }
  }, [authLoading, teamLoading, currentUser, teamId, fetchTeamBalance]);


  useEffect(() => {
    if (!pageLoading && currentUser) { 
      if (teamId && teamTokenBalance !== null && teamTokenBalance < requiredTokens) {
        toast.warning(
          'Saldo do time insuficiente', 
          { 
            id: "insufficient-team-tokens-toast",
            description: `O time "${activeTeam?.name || teamId}" precisa de ${requiredTokens} tokens. Saldo atual do proprietário: ${teamTokenBalance} tokens.`,
            action: { label: 'Adquirir Tokens', onClick: () => navigate('/tokens/store') }
          }
        );
      } else if (!teamId && !errorState) { 
        setErrorState("Nenhuma equipe ativa para verificar o saldo de tokens.");
        toast.error("Nenhuma equipe ativa selecionada.", {id: "no-active-team-final-check"});
      }
    }
  }, [pageLoading, currentUser, teamId, activeTeam?.name, teamTokenBalance, requiredTokens, navigate, errorState]);

  if (pageLoading) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="inline-block animate-spin h-10 w-10 text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) { 
     navigate('/auth/login', { replace: true, state: { from: '/petitions/new' } });
     return null; 
  }

  if (errorState) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-card rounded-lg shadow-xl">
          <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-card-foreground">Erro ao Carregar</h2>
          <p className="mb-4 text-muted-foreground">{errorState}</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Voltar para o Início
          </Button>
        </div>
      </div>
    );
  }
  
  if (!teamId) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-card rounded-lg shadow-xl">
          <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-card-foreground">Equipe Não Encontrada</h2>
          <p className="mb-4 text-muted-foreground">
            Não foi possível identificar sua equipe ativa. Por favor, verifique suas configurações de equipe.
          </p>
          <Button onClick={() => navigate('/teams')} className="w-full">
            Gerenciar Equipes
          </Button>
        </div>
      </div>
    );
  }
  
  if (teamTokenBalance !== null && teamTokenBalance < requiredTokens) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-card rounded-lg shadow-xl">
          <AlertCircleIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-card-foreground">Saldo do Time Insuficiente</h2>
          <p className="mb-4 text-muted-foreground">
            Sua equipe ("{activeTeam?.name || teamId}") precisa de pelo menos {requiredTokens} tokens para criar uma petição. 
            O saldo atual (do proprietário da equipe) é de {teamTokenBalance} tokens.
          </p>
          <Button onClick={() => navigate('/tokens/store')} className="w-full">
            <Coins className="mr-2 h-4 w-4" />
            Comprar tokens para o Time
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
              Utilize nosso assistente inteligente para criar sua nova petição jurídica personalizada.
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
                      A criação de uma nova petição custa {requiredTokens} tokens. Estes tokens serão deduzidos do saldo 
                      do proprietário da sua equipe ({activeTeam?.name || 'Equipe Ativa'})
                      no momento da submissão da petição. Certifique-se de que o proprietário da equipe tenha tokens suficientes.
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
              A criação desta petição custará {requiredTokens} tokens do saldo da equipe.
              {teamTokenBalance !== null && ( 
                <span className="ml-1">
                  Saldo atual da equipe (proprietário): <strong>{teamTokenBalance} tokens</strong>.
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
