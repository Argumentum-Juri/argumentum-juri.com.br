
export interface Question {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file' | 'multiEntry' | 'combobox';
  field: string;
  question: string;
  options?: { value: string | boolean; label: string }[];
  required: boolean;
  validation?: (value: any, allAnswers: Record<string, any>) => string | null;
  condition?: (answers: Record<string, any>) => boolean;
  multiple?: boolean; // Propriedade para indicar seleção múltipla
  label?: string; // Adicionando a propriedade label para uso no componente combobox
  allowCustomValues?: boolean; // Flag para permitir valores personalizados no combobox
  dynamicOptions?: boolean; // Flag para indicar que as opções são carregadas dinamicamente
}

export interface QuestionOption {
  value: string | boolean;
  label: string;
}

export interface PetitionFormAnswers {
  [key: string]: any;
}

export interface StatusCounts {
  pending: number;
  review: number;
  in_review: number;
  approved: number;
  rejected: number;
}

export interface ProcessPart {
  id: string; // Para identificar unicamente cada parte (útil para remoção)
  type: 'Autor' | 'Réu' | string; // Ou os tipos específicos que precisar
  fullName: string;
  represented: boolean;
}
