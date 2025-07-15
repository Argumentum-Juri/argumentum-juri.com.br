
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { Question } from '@/types/petition-form';
import { DocumentInfo } from '@/types/documentInfo';

interface PetitionSummaryProps {
  activeQuestions: Question[];
  answers: Record<string, any>;
  attachedFiles: DocumentInfo[];
  isSubmitting: boolean;
  onPrevious: () => void;
  onSubmit: () => void;
  tokenCost: number;
}

export const PetitionSummary: React.FC<PetitionSummaryProps> = ({
  activeQuestions,
  answers,
  attachedFiles,
  isSubmitting,
  onPrevious,
  onSubmit,
  tokenCost,
}) => {
  // Format value for display based on type - updated with robust formatting logic
  const formatAnswerValue = (question: Question, value: any): string => {
    if (value === undefined || value === null) return 'Não informado';

    // Verificar se é uma questão Sim/Não baseada nas opções
    const isYesNoQuestion = question.options?.length === 2 && 
      question.options.some(opt => opt.label === 'Sim' || opt.label === 'Não');

    // Converter valores booleanos para Sim/Não ANTES de qualquer outro processamento
    if (typeof value === 'boolean' || value === 'true' || value === 'false' || 
        value === true || value === false || isYesNoQuestion) {
      
      // Para valores booleanos diretos
      if (typeof value === 'boolean') {
        return value ? 'Sim' : 'Não';
      }
      
      // Para strings que representam booleanos
      if (value === 'true' || value === true) return 'Sim';
      if (value === 'false' || value === false) return 'Não';
      
      // Para questões Sim/Não, tentar encontrar a opção correspondente
      if (isYesNoQuestion && question.options) {
        const option = question.options.find((opt: any) => opt.value === value);
        if (option) return option.label;
      }
    }

    // Proteção contra objetos complexos - converter para formato legível
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // Tratar arrays baseado no tipo da questão
        switch (question.type) {
          case 'multiEntry':
            return value.map((part: any) => 
              `${part.type}: ${part.fullName} (${part.represented ? 'Representado' : 'Não representado'})`
            ).join(', ');
          case 'file':
            return `${value.length} arquivo(s) anexado(s)`;
          case 'select':
          case 'combobox':
          case 'dynamic-select':
            return value.map(v => {
              const option = question.options?.find((opt: any) => opt.value === v);
              return option ? option.label : v;
            }).join(', ');
          default:
            return value.join(', ');
        }
      } else {
        // Para objetos não-array, tentar extrair informações úteis ou ignorar
        return 'Dados estruturados (ver detalhes completos)';
      }
    }

    switch (question.type) {
      case 'checkbox':
        return value ? 'Sim' : 'Não';
      case 'date':
        try {
          return new Date(value).toLocaleDateString('pt-BR');
        } catch (e) {
          return String(value);
        }
      case 'file':
        return `${attachedFiles.length} arquivo(s) anexado(s)`;
      case 'select':
      case 'combobox':
      case 'dynamic-select':
        if (question.options) {
          const option = question.options.find(opt => opt.value === value);
          return option?.label || String(value);
        }
        return String(value);
      default:
        return String(value);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg border-primary/20">
      <CardContent className="pt-6 pb-6">
        <h2 className="text-xl font-bold mb-4 text-primary">Resumo da Petição</h2>
        <p className="text-muted-foreground mb-6">
          Verifique os dados abaixo antes de enviar sua solicitação.
        </p>

        <div className="space-y-4 mb-6">
          {activeQuestions.map((question) => (
            <div key={question.field} className="border-b border-border pb-3">
              <p className="font-medium text-foreground">{question.question}</p>
              <p className="text-muted-foreground">{formatAnswerValue(question, answers[question.field])}</p>
            </div>
          ))}
          
          {attachedFiles.length > 0 && (
            <div className="border-b border-border pb-3">
              <p className="font-medium text-foreground">Arquivos Anexados</p>
              <ul className="list-disc list-inside text-muted-foreground pl-2">
                {attachedFiles.map((file) => (
                  <li key={file.id}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="border-b border-border pb-3 flex justify-between items-center">
            <p className="font-medium text-foreground">Custo da Petição</p>
            <p className="text-amber-600 dark:text-amber-400 font-semibold">{tokenCost} tokens</p>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={onPrevious}
            className="px-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar e Editar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 px-6"
          >
            {isSubmitting ? (
              <>Processando...</>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" /> Confirmar e Enviar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
