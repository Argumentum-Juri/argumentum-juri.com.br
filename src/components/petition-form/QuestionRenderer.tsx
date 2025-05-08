
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { format } from "date-fns"; 
import { Question, QuestionOption, ProcessPart } from '@/types/petition-form';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; 
import { cn } from "@/lib/utils"; 
import { CheckCircle, Paperclip, Calendar as CalendarIcon, Loader2 } from 'lucide-react'; 
import FileUpload from '@/components/FileUpload';
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AddPartyModal } from '@/components/petition-form/ModalForm';
import { PlusCircle, Trash2, UserCheck, UserX } from 'lucide-react';
import { Check, ChevronsUpDown } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useCitiesByState } from '@/hooks/useCitiesByState';
import { brazilianStates } from '@/components/petition-form/QuestionOptions';

interface QuestionRendererProps {
  question: Question;
  value: any | ProcessPart[];
  onChange: (field: string, value: any) => void;
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  allAnswers?: Record<string, any>; // Adicionando acesso a todas as respostas
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  files,
  onFilesChange,
  allAnswers = {}
}) => {
  // Declarando todos os hooks no início do componente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  
  // Para filtrar cidades pelo estado selecionado
  const selectedState = useMemo(() => {
    if (question.field === 'cidade_distribuicao' && allAnswers && allAnswers['uf_distribuicao']) {
      return allAnswers['uf_distribuicao'];
    }
    return undefined;
  }, [question.field, allAnswers]);
  
  // Buscando cidades se for o campo cidade_distribuicao
  const { cities, loading: loadingCities, error: citiesError } = useCitiesByState(selectedState);

  // Definindo as opções a serem exibidas (baseado em options estáticas ou cidades carregadas dinamicamente)
  const displayOptions = useMemo(() => {
    if (question.dynamicOptions && question.field === 'cidade_distribuicao') {
      return cities;
    }
    return question.options || [];
  }, [question.dynamicOptions, question.field, question.options, cities]);
  
  // Preparando valores atuais para tipos diferentes
  const currentParts: ProcessPart[] = Array.isArray(value) ? value : [];

  // Funções auxiliares para o gerenciamento comum
  const handleAddPart = useCallback((newPart: ProcessPart) => {
    const updatedParts = [...currentParts, newPart];
    onChange(question.field, updatedParts);
  }, [currentParts, onChange, question.field]);

  const handleRemovePart = useCallback((partIdToRemove: string) => {
    const updatedParts = currentParts.filter(part => part.id !== partIdToRemove);
    onChange(question.field, updatedParts);
  }, [currentParts, onChange, question.field]);

  const isOptionSelected = useCallback((optionValue: string | boolean): boolean => {
    if (typeof optionValue === 'boolean' && typeof value === 'boolean') {
      return optionValue === value;
    }

    if (optionValue === 'true' && (value === true || value === 'true')) {
      return true;
    }

    if (optionValue === 'false' && (value === false || value === 'false')) {
      return true;
    }

    return optionValue === value;
  }, [value]);

  // Funções auxiliares para o combobox
  const getComboboxText = useCallback(() => {
    const options = displayOptions;
    const selectedValues = question.multiple ? 
      (Array.isArray(value) ? value : value ? [value] : []) : 
      (value ? [value] : []);
    
    const selectedLabels = selectedValues
      .map(val => options.find(opt => opt.value === val)?.label || val) // Se não encontrar na lista, usa o próprio valor
      .filter(Boolean);
    
    const displayName = question.label || question.field.replace(/_/g, ' ');
    
    return {
      selectedLabels,
      displayName
    };
  }, [displayOptions, question.multiple, question.label, question.field, value]);

  const handleComboboxSelect = useCallback((selectedValue: string) => {
    if (question.multiple) {
      const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
      const newValues = selectedValues.includes(selectedValue)
        ? selectedValues.filter(v => v !== selectedValue)
        : [...selectedValues, selectedValue];
      onChange(question.field, newValues);
    } else {
      onChange(question.field, selectedValue);
      setOpenCombobox(false);
    }
    setSearchInputValue('');
  }, [question.multiple, question.field, value, onChange]);

  const handleInputChange = useCallback((value: string) => {
    setSearchInputValue(value);
  }, []);

  const handleCustomSelect = useCallback(() => {
    // Somente adicionar valor personalizado se permitido pela questão
    if (searchInputValue && question.allowCustomValues !== false) {
      handleComboboxSelect(searchInputValue);
    }
  }, [searchInputValue, handleComboboxSelect, question.allowCustomValues]);

  const filteredOptions = useMemo(() => {
    return displayOptions.filter(option =>
      option.label.toLowerCase().includes(searchInputValue.toLowerCase())
    );
  }, [displayOptions, searchInputValue]);

  const valueIsCustom = useMemo(() => {
    return searchInputValue && 
           !displayOptions.some(opt => opt.label.toLowerCase() === searchInputValue.toLowerCase()) &&
           question.allowCustomValues !== false; // Só mostra opção para adicionar se for permitido
  }, [searchInputValue, displayOptions, question.allowCustomValues]);

  switch (question.type) {
    case 'text':
      return (
        <Input
          id={question.id}
          value={value || ''}
          onChange={(e) => onChange(question.field, e.target.value)}
          placeholder="Digite sua resposta aqui"
          className="mb-6"
        />
      );

    case 'textarea':
      return (
        <Textarea
          id={question.id}
          value={value || ''}
          onChange={(e) => onChange(question.field, e.target.value)}
          placeholder="Digite sua resposta aqui"
          className="min-h-[150px] mb-6"
        />
      );

    case 'select':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {question.options?.map((option) => (
            <Button
              key={String(option.value)}
              type="button"
              variant={isOptionSelected(option.value) ? "default" : "outline"}
              className={`justify-start h-auto py-3 text-left ${
                isOptionSelected(option.value) ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : ''
              }`}
              onClick={() => onChange(question.field, option.value)}
            >
              <span className="flex items-center">
                <span className={`mr-3 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isOptionSelected(option.value)
                    ? 'bg-primary-foreground border-primary text-primary'
                    : 'border-muted-foreground'
                }`}>
                  {isOptionSelected(option.value) && <CheckCircle className="h-3 w-3" />}
                </span>
                {option.label}
              </span>
            </Button>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-3 mb-6">
          <Button
            type="button"
            variant={value === true ? "default" : "outline"}
            className={`flex-1 py-3 ${value === true ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : ''}`}
            onClick={() => onChange(question.field, true)}
          >
            <span className="flex items-center justify-center gap-2">
              <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                value === true
                  ? 'bg-primary-foreground border-primary text-primary'
                  : 'border-muted-foreground'
              }`}>
                {value === true && <CheckCircle className="h-3 w-3" />}
              </span>
              Sim
            </span>
          </Button>
          <Button
            type="button"
            variant={value === false ? "default" : "outline"}
            className={`flex-1 py-3 ${value === false ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : ''}`}
            onClick={() => onChange(question.field, false)}
          >
            <span className="flex items-center justify-center gap-2">
              <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                value === false
                  ? 'bg-primary-foreground border-primary text-primary'
                  : 'border-muted-foreground'
              }`}>
                {value === false && <CheckCircle className="h-3 w-3" />}
              </span>
              Não
            </span>
          </Button>
        </div>
      );

    case 'date': 
      const dateValue = value ? new Date(value) : undefined;
      const isValidDate = dateValue && !isNaN(dateValue.getTime());

      return (
          <Popover>
          <PopoverTrigger asChild>
              <Button
              variant={"outline"}
              className={cn(
                  "w-full justify-start text-left font-normal mb-6", 
                  !isValidDate && "text-muted-foreground" 
              )}
              >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {isValidDate ? format(dateValue, "dd/MM/yyyy") : <span>Escolha uma data</span>}
              </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
              <Calendar
              mode="single"
              selected={isValidDate ? dateValue : undefined} 
              onSelect={(selectedDate) => {
                  onChange(question.field, selectedDate);
              }}
              initialFocus
              />
          </PopoverContent>
          </Popover>
      );

    case 'file':
      return (
          <div className="mb-6">
            <FileUpload
              onFilesChange={onFilesChange}
              maxFiles={5}
              maxSizeInMB={10}
            />
            {files && files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Arquivos Anexados:</p>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md text-sm">
                    <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className='truncate' title={file.name}>{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

    case 'multiEntry':
      return (
        <div className="mb-6 space-y-4">
          {currentParts.length > 0 && (
            <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Partes adicionadas:</p>
                {currentParts.map((part) => (
                    <div key={part.id} className="flex items-center justify-between gap-3 p-3 border rounded-md bg-muted/50">
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold truncate" title={part.fullName}>{part.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                                {part.type} - {part.represented ?
                                    <span className='inline-flex items-center'><UserCheck className="w-3 h-3 mr-1 text-green-600"/> Representado</span> :
                                    <span className='inline-flex items-center'><UserX className="w-3 h-3 mr-1 text-red-600"/> Não representado</span>
                                }
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                            onClick={() => handleRemovePart(part.id)}
                            aria-label={`Remover ${part.fullName}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
          )}

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Parte
                  </Button>
            </DialogTrigger>
              <AddPartyModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                onAddPart={handleAddPart}
            />
          </Dialog>

          {currentParts.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">
                  Clique em "Adicionar Parte" para incluir as partes do processo. Você incluirá uma parte por vez.
              </p>
          )}
        </div>
      );

    case 'combobox': {
      const { selectedLabels, displayName } = getComboboxText();
      
      return (
        <div className="mb-6">
          {question.dynamicOptions && question.field === 'cidade_distribuicao' && !selectedState && (
            <div className="text-amber-600 text-sm mb-2">
              Por favor, selecione primeiro um estado para ver as cidades disponíveis.
            </div>
          )}
          
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between font-normal text-left h-auto min-h-[2.5rem] py-2"
                disabled={question.dynamicOptions && question.field === 'cidade_distribuicao' && !selectedState}
              >
                <span className="truncate">
                  {selectedLabels.length > 0
                    ? selectedLabels.join(', ')
                    : searchInputValue || `Selecione ${displayName}...`}
                </span>
                {loadingCities ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder={`Buscar ${displayName}...`}
                  value={searchInputValue}
                  onValueChange={handleInputChange}
                />
                <CommandList>
                  {loadingCities && (
                    <div className="py-6 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">Carregando cidades...</p>
                    </div>
                  )}
                  
                  {!loadingCities && citiesError && (
                    <div className="py-6 text-center">
                      <p className="text-sm text-destructive">Erro ao carregar cidades. Tente novamente.</p>
                    </div>
                  )}
                  
                  {!loadingCities && !citiesError && (
                    <>
                      <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
                      {filteredOptions.map((option) => (
                        <CommandItem
                          key={String(option.value)}
                          value={option.label}
                          onSelect={() => {
                            handleComboboxSelect(option.value as string);
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selectedLabels.includes(option.label) ? "bg-primary text-primary-foreground" : "opacity-50"
                              )}
                            >
                              {selectedLabels.includes(option.label) && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                            {option.label}
                          </div>
                        </CommandItem>
                      ))}
                      
                      {/* Só mostra a opção de adicionar valores personalizados se for permitido */}
                      {valueIsCustom && (
                        <CommandItem
                          value={searchInputValue}
                          onSelect={handleCustomSelect}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <PlusCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                            Adicionar "{searchInputValue}"
                          </div>
                        </CommandItem>
                      )}
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {question.dynamicOptions && question.field === 'cidade_distribuicao' && selectedState && (
            <p className="text-xs text-muted-foreground mt-1">
              Mostrando cidades de {brazilianStates.find(state => state.value === selectedState)?.label}
            </p>
          )}
        </div>
      );
    }

    default:
      return null;
  }
};
