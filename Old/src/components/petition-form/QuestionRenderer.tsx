import React from 'react';
import { Question } from '@/types/petition-form';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, X } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import FileUpload from '@/components/FileUpload';
import { ProcessPart } from '@/types/petition-form';
import { useCitiesByState } from '@/hooks/useCitiesByState';
import { Spinner } from '@/components/ui/spinner';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (field: string, value: any) => void;
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  allAnswers: Record<string, any>;
  hasError?: boolean;
}

// Função para converter data para formato local YYYY-MM-DD sem deslocamento de timezone
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função para converter string YYYY-MM-DD para Date local
const parseLocalDate = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;
  
  // Parse da string considerando timezone local
  const [year, month, day] = dateString.split('-').map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day); // month é 0-indexed
  }
  
  return undefined;
};

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  files,
  onFilesChange,
  allAnswers,
  hasError = false
}) => {
  // Hook para carregar cidades dinamicamente baseado no estado
  const dependentValue = question.dependsOn ? allAnswers[question.dependsOn] : undefined;
  const { cities, loading, error } = useCitiesByState(
    question.type === 'dynamic-select' ? dependentValue : undefined
  );

  const handleProcessPartChange = (index: number, field: keyof ProcessPart, newValue: any) => {
    const currentParts = value || [];
    const updatedParts = [...currentParts];
    updatedParts[index] = { ...updatedParts[index], [field]: newValue };
    onChange(question.field, updatedParts);
  };

  const addProcessPart = () => {
    const currentParts = value || [];
    const newPart: ProcessPart = {
      id: crypto.randomUUID(),
      type: 'Autor',
      fullName: '',
      represented: false
    };
    onChange(question.field, [...currentParts, newPart]);
  };

  const removeProcessPart = (index: number) => {
    const currentParts = value || [];
    const updatedParts = currentParts.filter((_: any, i: number) => i !== index);
    onChange(question.field, updatedParts);
  };

  const inputClassName = cn(
    "w-full",
    hasError && "border-destructive focus-visible:ring-destructive"
  );

  const textareaClassName = cn(
    "w-full min-h-[100px] resize-y",
    hasError && "border-destructive focus-visible:ring-destructive"
  );

  switch (question.type) {
    case 'text':
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(question.field, e.target.value)}
          placeholder="Digite sua resposta..."
          className={inputClassName}
        />
      );

    case 'textarea':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(question.field, e.target.value)}
          placeholder="Digite sua resposta detalhada..."
          className={textareaClassName}
        />
      );

    case 'select':
      return (
        <Select
          value={value || ''}
          onValueChange={(newValue) => onChange(question.field, newValue)}
        >
          <SelectTrigger className={hasError ? "border-destructive" : ""}>
            <SelectValue placeholder="Selecione uma opção..." />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={question.field}
            checked={value || false}
            onCheckedChange={(checked) => onChange(question.field, checked)}
          />
          <label
            htmlFor={question.field}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Sim
          </label>
        </div>
      );

    case 'date':
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
                hasError && "border-destructive"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(parseLocalDate(value) || new Date(), "PPP", { locale: ptBR }) : "Selecione uma data..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parseLocalDate(value)}
              onSelect={(date) => {
                if (date) {
                  // Usar formatação local em vez de toISOString() para evitar problemas de timezone
                  const localDateString = formatDateToLocal(date);
                  console.log('[DEBUG] Data selecionada:', date, 'Formatada como:', localDateString);
                  onChange(question.field, localDateString);
                } else {
                  onChange(question.field, '');
                }
              }}
              disabled={(date) => date > new Date()}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      );

    case 'file':
      return (
        <FileUpload
          onFilesChange={onFilesChange || (() => {})}
          maxFiles={5}
          maxSizeInMB={10}
        />
      );

    case 'combobox':
      return (
        <Select
          value={value || ''}
          onValueChange={(newValue) => onChange(question.field, newValue)}
        >
          <SelectTrigger className={hasError ? "border-destructive" : ""}>
            <SelectValue placeholder="Selecione uma opção..." />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'dynamic-select':
      return (
        <div className="space-y-2">
          <Select
            value={value || ''}
            onValueChange={(newValue) => onChange(question.field, newValue)}
            disabled={loading || !dependentValue}
          >
            <SelectTrigger className={cn(hasError && "border-destructive", loading && "opacity-50")}>
              <SelectValue 
                placeholder={
                  !dependentValue 
                    ? "Primeiro selecione um estado..." 
                    : loading 
                    ? "Carregando cidades..." 
                    : "Selecione uma cidade..."
                } 
              />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={String(city.value)} value={String(city.value)}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-3 w-3" />
              Carregando cidades...
            </div>
          )}
          
          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      );

    case 'multiEntry':
      const processParts = value || [];
      return (
        <div className="space-y-4">
          {processParts.map((part: ProcessPart, index: number) => (
            <div key={part.id} className={cn(
              "p-4 border rounded-lg space-y-3",
              hasError && "border-destructive"
            )}>
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Parte {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProcessPart(index)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Parte</label>
                  <Select
                    value={part.type}
                    onValueChange={(newValue) => handleProcessPartChange(index, 'type', newValue)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Autor">Autor</SelectItem>
                      <SelectItem value="Réu">Réu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome Completo</label>
                  <Input
                    value={part.fullName}
                    onChange={(e) => handleProcessPartChange(index, 'fullName', e.target.value)}
                    placeholder="Nome completo da parte"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`represented-${part.id}`}
                  checked={part.represented}
                  onCheckedChange={(checked) => handleProcessPartChange(index, 'represented', checked)}
                />
                <label
                  htmlFor={`represented-${part.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Esta é a parte que você representa
                </label>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addProcessPart}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Parte
          </Button>
        </div>
      );

    default:
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(question.field, e.target.value)}
          placeholder="Digite sua resposta..."
          className={inputClassName}
        />
      );
  }
};
