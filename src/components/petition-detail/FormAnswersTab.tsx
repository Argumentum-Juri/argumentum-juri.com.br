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

    // Proteção contra objetos complexos - converter para JSON legível ou ignorar
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // Tratar arrays normalmente
        switch (question.type) {
          case 'multiEntry':
            return value.map((part: any) => 
              `${part.type}: ${part.fullName} (${part.represented ? 'Representado' : 'Não representado'})`
            ).join('\n');
          case 'file':
            return value.map((file: any) => file.name || 'Arquivo sem nome').join('\n');
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
        // Para objetos não-array, não exibir (são provavelmente configurações técnicas)
        return 'Configuração técnica (não exibida)';
      }
    }

    switch (question.type) {
      case 'select':
      case 'combobox':
      case 'dynamic-select':
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
        
      default:
        return String(value);
    }
  };

  // Lista expandida de campos técnicos que devem ser excluídos
  const technicalFields = [
    // Campos de sistema básicos
    'id', 'user_id', 'created_at', 'updated_at', 'team_id',
    
    // Campos de formatação e configuração
    'font_size', 'font_family', 'line_spacing', 'paragraph_indent', 
    'margin_size', 'primary_color', 'accent_color', 'use_letterhead',
    'format_settings', 'formatting_settings', 'petition_settings',
    
    // Campos de armazenamento e arquivos
    'logo_url', 'letterhead_template_url', 'petition_template_url', 
    'storage_provider', 'r2_key', 'original_filename',
    'logo_r2_key', 'letterhead_template_r2_key', 'petition_template_r2_key',
    'logo_storage_provider', 'letterhead_template_storage_provider',
    'petition_template_storage_provider', 'logo_original_filename',
    'letterhead_template_original_filename', 'petition_template_original_filename',
    
    // Campos de status e metadados
    'status', 'rejection_count', 'category', 'content', 'current_signatures',
    'form_schema', 'form_type', 'target'
  ];

  // Função melhorada para verificar se um campo é uma resposta válida do formulário
  const isValidFormAnswer = (field: string, value: any): boolean => {
    // Excluir campos técnicos (case insensitive)
    const fieldLower = field.toLowerCase();
    if (technicalFields.some(techField => fieldLower.includes(techField.toLowerCase()))) {
      return false;
    }
    
    // Excluir campos que contêm palavras-chave técnicas
    const technicalKeywords = ['settings', 'config', 'metadata', 'template', 'storage', 'provider', 'url', 'key', 'filename'];
    if (technicalKeywords.some(keyword => fieldLower.includes(keyword))) {
      return false;
    }
    
    // Verificar se o valor não está vazio
    if (value === undefined || value === null || value === '') {
      return false;
    }
    
    // Excluir objetos complexos que não são arrays ou objetos de resposta conhecidos
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Verificar se é um objeto que parece ser uma resposta de formulário
      const hasFormLikeProperties = ['type', 'fullName', 'represented', 'name', 'label', 'value'].some(prop => 
        Object.prototype.hasOwnProperty.call(value, prop)
      );
      if (!hasFormLikeProperties) {
        return false;
      }
    }
    
    // Verificar se há uma pergunta correspondente OU se o campo parece ser uma resposta de formulário
    const hasCorrespondingQuestion = allPossibleQuestions.some(q => q.field === field);
    const looksLikeFormField = !field.includes('_url') && 
                              !field.includes('_key') && 
                              !field.includes('_provider') && 
                              !field.includes('_filename') &&
                              !field.includes('_at') &&
                              !field.startsWith('is_') &&
                              field !== 'id';
    
    return hasCorrespondingQuestion || looksLikeFormField;
  };

  // Verificar se os form_answers contêm apenas campos técnicos (indicando estrutura incorreta)
  const onlyTechnicalFields = formAnswers && Object.keys(formAnswers).length > 0 &&
    Object.keys(formAnswers).every(field => !isValidFormAnswer(field, formAnswers[field]));

  if (!formAnswers || Object.keys(formAnswers).length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma resposta encontrada para esta petição.
      </div>
    );
  }

  if (onlyTechnicalFields) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="mb-2">Nenhuma resposta do formulário foi registrada nesta petição.</p>
        <p className="text-sm">Esta petição contém apenas configurações técnicas.</p>
      </div>
    );
  }

  // Filtrar e processar respostas válidas
  const validAnswers = Object.keys(formAnswers)
    .filter(field => isValidFormAnswer(field, formAnswers[field]))
    .map(field => {
      const question = allPossibleQuestions.find(q => q.field === field);
      return {
        field,
        question: question?.question || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: question?.type || 'text',
        options: question?.options,
        value: formAnswers[field]
      };
    })
    .sort((a, b) => a.question.localeCompare(b.question)); // Ordenar alfabeticamente

  if (validAnswers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="mb-2">Nenhuma resposta do formulário foi registrada nesta petição.</p>
        <p className="text-sm">Os dados disponíveis são apenas configurações técnicas.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {validAnswers.map((item) => (
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
