
import React from 'react';
import { Question } from '@/types/petition-form';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Loader2, Paperclip, Coins } from 'lucide-react';
import { allPossibleQuestions } from '@/utils/petitionFormQuestions';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PetitionSummaryProps {
  activeQuestions: Question[];
  answers: Record<string, any>;
  attachedFiles: File[];
  isSubmitting: boolean;
  onPrevious: () => void;
  onSubmit: () => void;
  tokenCost?: number;
}

export const PetitionSummary: React.FC<PetitionSummaryProps> = ({
  answers,
  attachedFiles,
  isSubmitting,
  onPrevious,
  onSubmit,
  tokenCost = 16
}) => {
  // Função para formatar o valor da resposta
  const formatAnswer = (question: Question, value: any): string => {
    if (!value && value !== false) return '';

    switch (question.type) {
      case 'select':
      case 'combobox':
        if (Array.isArray(value)) {
          return value.map(v => {
            const option = question.options?.find(opt => opt.value === v);
            return option ? option.label : v;
          }).join(', ');
        }
        if (question.options) {
          const option = question.options.find(opt => opt.value === value);
          return option ? option.label : String(value);
        }
        return String(value);
      
      case 'checkbox':
        return value ? 'Sim' : 'Não';
      
      case 'date':
        try {
          return new Date(value).toLocaleDateString('pt-BR');
        } catch (e) {
          return String(value);
        }
      
      case 'multiEntry':
        if (Array.isArray(value)) {
          return value.map((part: any) => 
            `${part.type}: ${part.fullName} (${part.represented ? 'Representado' : 'Não representado'})`
          ).join('\n');
        }
        return String(value);
      
      case 'file':
        if (Array.isArray(value)) {
          return value.map((file: any) => file.name || 'Arquivo sem nome').join('\n');
        }
        return String(value);
        
      default:
        return String(value);
    }
  };

  // Filtrar questões que devem ser exibidas com base nas condições
  const questionsToShow = allPossibleQuestions.filter(question => {
    if (!question.condition) return answers[question.field] !== undefined;
    return question.condition(answers);
  });

  // Verificar se temos a pergunta de anexos do processo
  const hasProcessAttachments = answers.process_attachments || [];

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg border-primary/20">
      <CardContent className="pt-6 pb-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">Resumo da Petição</h2>
        
        <Alert className="mb-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
          <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <span className="font-medium">Esta petição custará {tokenCost} tokens do seu saldo.</span> 
            O valor será debitado quando você enviar a petição.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-6 bg-muted/20 p-6 rounded-lg">
          {questionsToShow.map((question) => {
            const value = answers[question.field];
            if (value === undefined) return null;

            return (
              <div key={question.field} className="space-y-2">
                <h3 className="font-medium text-lg text-primary/80">{question.question}</h3>
                <p className="text-foreground whitespace-pre-wrap mt-1">
                  {formatAnswer(question, value)}
                </p>
              </div>
            );
          })}

          {hasProcessAttachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-lg text-primary/80">Anexos do Processo</h3>
              <div className="mt-2 space-y-2">
                {hasProcessAttachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-background p-2 rounded-md">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attachedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-lg text-primary/80">Anexos:</h3>
              <div className="mt-2 space-y-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-background p-2 rounded-md">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={onPrevious} className="px-6 gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="gap-2 bg-primary hover:bg-primary/90 px-6"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
            ) : (
              <><CheckCircle className="h-4 w-4" /> Enviar Petição ({tokenCost} tokens)</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
