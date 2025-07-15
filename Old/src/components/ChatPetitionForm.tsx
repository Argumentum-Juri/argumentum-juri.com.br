
// src/components/ChatPetitionForm.tsx
import React, { useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Coins, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Question } from '@/types/petition-form';
import { QuestionRenderer } from './petition-form/QuestionRenderer';
import { PetitionSummary } from './petition-form/PetitionSummary';
import { useChatPetitionFormLogic } from '@/hooks/usePetitionFormLogic';
import { allPossibleQuestions } from '@/utils/petitionFormQuestions';
import { useNavigate } from 'react-router-dom';
import { tokenService } from '@/services/tokenService';
import { toast } from 'sonner';
import { DEFAULT_PETITION_COST } from '@/services/petition';
import { DocumentInfo } from '@/types/documentInfo';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChatPetitionFormProps {
  tokenCost?: number; 
}

const ChatPetitionForm: React.FC<ChatPetitionFormProps> = ({ tokenCost = DEFAULT_PETITION_COST }) => {
  const { teamId, teamLoading } = useAuth();
  const navigate = useNavigate();

  // Use the correct hook for chat-based form
  const {
    answers,
    currentQuestion,
    currentQuestionIndex,
    activeQuestions,
    isSubmitting,
    showingSummary,
    attachedFiles,
    currentError,
    handleAnswerChange,
    handleFileChange,
    nextQuestion,
    previousQuestion,
    handleSubmit,
  } = useChatPetitionFormLogic(allPossibleQuestions, teamId || ''); 

  // Convert DocumentInfo[] to File[] for file questions
  const fileArrayForCurrentQuestion = useMemo(() => {
    // If no files or not a file question, return empty array
    if (!attachedFiles || !currentQuestion || currentQuestion.type !== 'file') {
      return [];
    }
    // Extract File objects from DocumentInfo objects that have them
    return attachedFiles
      .filter(doc => doc.file) // Only include items that have a file property
      .map(doc => doc.file) as File[]; // Cast is safe because we filtered
  }, [attachedFiles, currentQuestion]);

  // Verificar saldo da equipe quando o sumário for exibido
  useEffect(() => {
    const verifyTeamTokens = async () => {
      if (showingSummary && teamId) { 
        try {
          const balance = await tokenService.getTeamTokenBalance(teamId);
          
          if (balance < tokenCost) {
            toast.error(
              'Saldo Insuficiente na Equipe', 
              { 
                description: `O proprietário da equipe possui ${balance} tokens. Você precisa de pelo menos ${tokenCost} tokens para criar esta petição.` 
              }
            );
          }
        } catch (error) {
          console.error("ChatPetitionForm: Erro ao verificar saldo da equipe:", error);
          toast.error("Erro ao Verificar Saldo", { description: "Não foi possível verificar o saldo da equipe."});
        }
      }
    };
    
    if (!teamLoading) {
        verifyTeamTokens();
    }
  }, [showingSummary, teamId, tokenCost, teamLoading]);

  const renderCurrentQuestion = (): JSX.Element | null => {
    if (teamLoading && !currentQuestion && !showingSummary) {
        return (
            <Card className="w-full max-w-3xl mx-auto shadow-lg">
                <CardContent className="pt-6 pb-6 text-center">
                    <p>Carregando dados da equipe...</p>
                </CardContent>
            </Card>
        );
    }
    
    // Se não há equipe após o carregamento, e não estamos mostrando o sumário (que pode ter sido alcançado antes)
    if (!teamId && !teamLoading && !showingSummary) { 
        return (
            <Card className="w-full max-w-3xl mx-auto shadow-lg border-destructive/50">
                <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-destructive font-semibold">Equipe não identificada.</p>
                    <p className="text-muted-foreground">Não é possível prosseguir com a criação da petição sem uma equipe padrão selecionada ou associada.</p>
                    <Button onClick={() => navigate('/teams')} className="mt-4">Gerenciar Equipes</Button>
                </CardContent>
            </Card>
        );
    }

    if (showingSummary) {
      return (
        <PetitionSummary
          activeQuestions={activeQuestions}
          answers={answers}
          attachedFiles={attachedFiles}
          isSubmitting={isSubmitting}
          onPrevious={previousQuestion}
          onSubmit={() => { 
            if (!teamId) { // Checagem final antes de chamar handleSubmit do hook
                toast.error("Erro crítico: ID da equipe não disponível para submissão.");
                return;
            }
            handleSubmit(); 
          }}
          tokenCost={tokenCost}
        />
      );
    }

    if (!currentQuestion) {
        // Este estado pode ocorrer brevemente se activeQuestions ainda não foi populado
        // ou se o formulário for renderizado sem um teamId válido inicialmente.
        if (!teamId && !teamLoading) return null; // Já tratado acima
        if (activeQuestions.length === 0 && !teamLoading) {
            return <p className="text-center text-muted-foreground">Nenhuma pergunta disponível para esta configuração ou equipe.</p>;
        }
        return <p className="text-center">Carregando pergunta...</p>;
    }

    return (
      <Card className="w-full max-w-3xl mx-auto shadow-lg border-primary/20">
        <CardContent className="pt-6 pb-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-muted-foreground">
              Pergunta {currentQuestionIndex + 1} de {activeQuestions.length || 1}
            </span>
            <div className="w-1/2 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${activeQuestions.length > 0 ? ((currentQuestionIndex + 1) / activeQuestions.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-6 text-primary">
            {currentQuestion.question}
            {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
          </h3>

          <QuestionRenderer
            question={currentQuestion}
            value={answers[currentQuestion.field]}
            onChange={handleAnswerChange}
            files={currentQuestion.type === 'file' ? fileArrayForCurrentQuestion : undefined}
            onFilesChange={(files: File[]) => {
              // Convert File[] to DocumentInfo[] before calling handleFileChange
              const docInfos: DocumentInfo[] = files.map(file => ({
                id: crypto.randomUUID(),
                name: file.name,
                type: file.type,
                size: file.size,
                url: URL.createObjectURL(file),
                success: true,
                file: file
              }));
              handleFileChange(docInfos);
            }}
            allAnswers={answers}
            hasError={!!currentError}
          />

          {/* Error Message Display */}
          {currentError && (
            <Alert className="mt-4 border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive font-medium">
                {currentError}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0 && !showingSummary}
              className="px-6 gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>

            <Button
              onClick={nextQuestion}
              className="gap-2 bg-primary hover:bg-primary/90 px-6"
              disabled={!teamId} // Desabilitar se não houver equipe para verificar saldo/prosseguir
            >
              {currentQuestionIndex < activeQuestions.length - 1 ? 'Próxima' : 'Ver Resumo'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="py-8 px-4 w-full bg-gradient-to-b from-background to-muted/30 min-h-screen">
      <div className="max-w-4xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-primary">Criação de Petição</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Vamos criar sua petição passo a passo. Responda às perguntas abaixo com cuidado para garantir a melhor qualidade do documento.
          </p>
          <div className="mt-3 flex justify-center items-center gap-2 text-amber-600 dark:text-amber-400">
            <Coins className="h-5 w-5" />
            <span className="font-medium">Custo: {tokenCost} tokens</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {renderCurrentQuestion()}
      </div>
    </div>
  );
};

export default ChatPetitionForm;
