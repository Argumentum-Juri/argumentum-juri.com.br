
import React, { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Coins } from 'lucide-react';
import { useTeam } from '@/contexts/TeamContext';
import { Question } from '@/types/petition-form';
import { QuestionRenderer } from './petition-form/QuestionRenderer';
import { PetitionSummary } from './petition-form/PetitionSummary';
import { usePetitionFormLogic } from '@/hooks/usePetitionFormLogic';
import { allPossibleQuestions } from '@/utils/petitionFormQuestions';
import { useNavigate } from 'react-router-dom';
import { tokenService } from '@/services/tokenService';
import { toast } from 'sonner';

interface ChatPetitionFormProps {
  tokenCost?: number;
}

const ChatPetitionForm: React.FC<ChatPetitionFormProps> = ({ tokenCost = 16 }) => {
  const { teamId } = useTeam();
  const navigate = useNavigate();
  
  const {
    answers,
    currentQuestion,
    currentQuestionIndex,
    activeQuestions,
    isSubmitting,
    showingSummary,
    attachedFiles,
    handleAnswerChange,
    handleFileChange,
    nextQuestion,
    previousQuestion,
    handleSubmit,
  } = usePetitionFormLogic(allPossibleQuestions, teamId);

  // Check token balance before submission AND when showing summary
  useEffect(() => {
    const verifyTokens = async () => {
      if (showingSummary) {
        const balance = await tokenService.getTokenBalance();
        if (balance < tokenCost) {
          toast.error(
            'Saldo insuficiente de tokens', 
            { 
              description: `Você precisa de pelo menos ${tokenCost} tokens para criar uma petição. 
                           Seu saldo atual é de ${balance} tokens.` 
            }
          );
          navigate('/tokens/store');
        }
      }
    };
    
    verifyTokens();
  }, [showingSummary, navigate, tokenCost]);

  const renderCurrentQuestion = (): JSX.Element | null => {
    if (showingSummary) {
      return (
        <PetitionSummary
          activeQuestions={activeQuestions}
          answers={answers}
          attachedFiles={attachedFiles}
          isSubmitting={isSubmitting}
          onPrevious={previousQuestion}
          onSubmit={handleSubmit}
          tokenCost={tokenCost}
        />
      );
    }

    if (!currentQuestion) return null;

    return (
      <Card className="w-full max-w-3xl mx-auto shadow-lg border-primary/20">
        <CardContent className="pt-6 pb-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-muted-foreground">
              Pergunta {currentQuestionIndex + 1} de {activeQuestions.length}
            </span>
            <div className="w-1/2 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-6 text-primary">{currentQuestion.question}</h3>

          <QuestionRenderer
            question={currentQuestion}
            value={answers[currentQuestion.field]}
            onChange={handleAnswerChange}
            files={currentQuestion.type === 'file' ? attachedFiles : undefined}
            onFilesChange={currentQuestion.type === 'file' ? handleFileChange : undefined}
            allAnswers={answers}
          />

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-6 gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>

            <Button
              onClick={nextQuestion}
              className="gap-2 bg-primary hover:bg-primary/90 px-6"
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
