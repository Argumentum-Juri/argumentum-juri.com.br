
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, FileText, Coins, Loader2, MessageSquareDashedIcon, BookOpen, Users, FileCheck, Paperclip, ArrowRight, CalendarClock } from 'lucide-react';
import ChatPetitionForm from '@/components/ChatPetitionForm';
import { DEFAULT_PETITION_COST } from '@/services/petition';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { tokenService } from '@/services/tokenService';
import { useTeams } from '@/hooks/useTeams';

const PetitionForm: React.FC = () => {
  const { user } = useGoAuth();
  const { teams, isLoading: teamsLoading } = useTeams();
  const [teamTokens, setTeamTokens] = useState<number | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamTokens = async () => {
      if (!user?.id || teamsLoading) {
        return;
      }

      try {
        setLoadingTokens(true);
        setTokenError(null);
        
        // Buscar a equipe onde o usuário é proprietário
        const ownerTeam = teams?.find(team => team.role === 'owner');
        
        if (!ownerTeam || !ownerTeam.team_id) {
          setTokenError('Equipe proprietária não encontrada');
          setTeamTokens(null);
          setLoadingTokens(false);
          return;
        }
        
        console.log('Buscando tokens para equipe:', ownerTeam.team_id);
        const tokens = await tokenService.getTeamTokenBalance(ownerTeam.team_id);
        setTeamTokens(tokens);
      } catch (error) {
        console.error('Erro ao buscar tokens da equipe:', error);
        setTokenError('Não foi possível carregar o saldo de tokens');
        setTeamTokens(null);
      } finally {
        setLoadingTokens(false);
      }
    };

    fetchTeamTokens();
  }, [user?.id, teams, teamsLoading]);

  const renderTokenBalance = () => {
    if (loadingTokens || teamsLoading) {
      return (
        <span className="font-medium inline-flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Carregando...
        </span>
      );
    }

    if (tokenError || teamTokens === null) {
      return (
        <span className="font-medium text-amber-600 dark:text-amber-400">
          {tokenError || 'Erro ao carregar saldo'}
        </span>
      );
    }

    const hasEnoughTokens = teamTokens >= DEFAULT_PETITION_COST;
    
    return (
      <span className={`font-medium ${hasEnoughTokens ? '' : 'text-red-600 dark:text-red-400'}`}>
        {teamTokens} token{teamTokens !== 1 ? 's' : ''}
        {!hasEnoughTokens && ' (insuficiente)'}
      </span>
    );
  };

  // Dados para o modal
  const requiredTokens = DEFAULT_PETITION_COST;
  const ownerTeam = teams?.find(team => team.role === 'owner');
  const activeTeam = ownerTeam ? { name: ownerTeam.teams?.name || 'Equipe Proprietária' } : null;

  return (
    <div className="py-8 px-4 w-full bg-gradient-to-b from-background to-muted/30 min-h-screen">
      {/* Cabeçalho da Página */}
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
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-primary/20 hover:bg-primary/5 whitespace-nowrap w-full sm:w-auto"
              >
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

        {/* Seção de Informações sobre o Sistema */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Como funciona?
              </h3>
              <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                O sistema vai guiá-lo em cada etapa da criação da petição. Preencha os detalhes solicitados e, se necessário, 
                adicione anexos para dar suporte à sua solicitação. Nossos advogados especializados irão analisar e preparar seu 
                documento.
              </p>
            </div>
          </div>
        </div>

        {/* Seção de Custo da Petição */}
        <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Coins className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Custo da petição: {DEFAULT_PETITION_COST} tokens
              </h3>
              <p className="text-amber-700 dark:text-amber-300">
                A criação desta petição custará {DEFAULT_PETITION_COST} tokens do saldo da equipe. 
                <span className="font-medium"> Saldo atual da equipe (proprietário): {renderTokenBalance()}.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário da Petição */}
      <ChatPetitionForm />
    </div>
  );
};

export default PetitionForm;
