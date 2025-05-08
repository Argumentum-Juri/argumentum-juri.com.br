
import React from 'react';
import { Question } from '@/types/petition-form';
import { Card, CardContent } from "@/components/ui/card";
import { allPossibleQuestions } from '@/utils/petitionFormQuestions';

interface FormAnswersTabProps {
  formAnswers: Record<string, any>;
}

const FormAnswersTab: React.FC<FormAnswersTabProps> = ({ formAnswers }) => {
  const formatAnswer = (question: Question, value: any): string => {
    if (value === undefined || value === null) return 'Não informado';

    switch (question.type) {
      case 'select':
      case 'combobox':
        if (Array.isArray(value)) {
          return value.map(v => {
            const option = question.options?.find((opt: any) => opt.value === v);
            return option ? option.label : v;
          }).join(', ');
        }
        if (question.options) {
          const option = question.options.find((opt: any) => opt.value === value);
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

  // Mostrar todas as respostas disponíveis, não apenas as que correspondem às perguntas conhecidas
  const allAnswers = Object.keys(formAnswers).filter(key => 
    formAnswers[key] !== undefined && 
    formAnswers[key] !== null && 
    formAnswers[key] !== ''
  );
  
  // Obter perguntas para as respostas
  const allFields = allAnswers.map(field => {
    const question = allPossibleQuestions.find(q => q.field === field);
    return {
      field,
      question: question?.question || field,
      type: question?.type || 'text',
      options: question?.options,
      value: formAnswers[field]
    };
  });

  if (!formAnswers || Object.keys(formAnswers).length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma resposta encontrada para esta petição.
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {allFields.map((item) => (
            <div key={item.field} className="border-b pb-4 last:border-b-0">
              <h3 className="font-medium text-lg mb-2 text-primary">
                {item.question}
              </h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {formatAnswer({
                  field: item.field,
                  question: item.question,
                  type: item.type,
                  options: item.options
                } as Question, item.value)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormAnswersTab;
