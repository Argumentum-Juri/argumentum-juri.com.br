import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Question } from '@/types/petition-form';
import { DocumentInfo } from '@/types/documentInfo';
import { petitionService } from '@/services/petition';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { ProcessPart } from '@/types/petition-form';

const FORM_STORAGE_KEY = "chatPetitionForm_answers";
const FILES_STORAGE_KEY = "chatPetitionForm_files";

export const useChatPetitionFormLogic = (questions: Question[], teamId: string) => {
  const navigate = useNavigate();
  const { user } = useGoAuth();
  
  // Initialize answers with localStorage data
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        console.log('[Form Persistence] Dados recuperados do localStorage');
        toast.success("Dados do formulário recuperados!", { 
          description: "Suas respostas anteriores foram restauradas.",
          duration: 3000 
        });
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('[Form Persistence] Erro ao recuperar dados:', error);
    }
    return {};
  });

  // Initialize files with sessionStorage data
  const [attachedFiles, setAttachedFiles] = useState<DocumentInfo[]>(() => {
    try {
      const saved = sessionStorage.getItem(FILES_STORAGE_KEY);
      if (saved) {
        const parsedFiles = JSON.parse(saved);
        console.log('[Form Persistence] Arquivos recuperados do sessionStorage');
        return parsedFiles;
      }
    } catch (error) {
      console.error('[Form Persistence] Erro ao recuperar arquivos:', error);
    }
    return [];
  });

  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showingSummary, setShowingSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(answers));
      console.log('[Form Persistence] Dados salvos no localStorage');
    }
  }, [answers]);

  // Save files to sessionStorage whenever they change
  useEffect(() => {
    if (attachedFiles.length > 0) {
      // Only save file metadata, not the actual File objects
      const fileMetadata = attachedFiles.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.url,
        success: file.success
        // Note: We don't save the actual File object as it can't be serialized
      }));
      sessionStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(fileMetadata));
      console.log('[Form Persistence] Metadados de arquivos salvos no sessionStorage');
    }
  }, [attachedFiles]);

  // Clear form data from storage
  const clearFormData = useCallback(() => {
    localStorage.removeItem(FORM_STORAGE_KEY);
    sessionStorage.removeItem(FILES_STORAGE_KEY);
    console.log('[Form Persistence] Dados limpos do storage');
  }, []);

  // Initialize active questions based on conditions
  useEffect(() => {
    const initialQuestions = questions.filter(q => {
      if (!q.condition) return true;
      return q.condition(answers);
    });
    setActiveQuestions(initialQuestions);
  }, [questions, answers]);

  const currentQuestion = activeQuestions[currentQuestionIndex];

  const validateProcessParts = useCallback((parts: ProcessPart[]) => {
    console.log('[DEBUG] Validando partes do processo:', parts);
    
    // Verificar se existe ao menos uma parte
    if (!parts || parts.length === 0) {
      console.log('[DEBUG] Erro: Nenhuma parte adicionada');
      return 'Adicione pelo menos uma parte ao processo.';
    }

    // Verificar se todas as partes têm os campos obrigatórios preenchidos
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      console.log(`[DEBUG] Validando parte ${i + 1}:`, part);
      
      // Verificar tipo de parte
      if (!part.type || part.type.trim() === '') {
        console.log(`[DEBUG] Erro: Parte ${i + 1} sem tipo`);
        return `Parte ${i + 1}: Selecione o tipo de parte.`;
      }
      
      // Verificar nome completo
      if (!part.fullName || part.fullName.trim() === '') {
        console.log(`[DEBUG] Erro: Parte ${i + 1} sem nome completo`);
        return `Parte ${i + 1}: Informe o nome completo da parte.`;
      }
    }

    // Verificar se pelo menos uma parte está marcada como representada
    const hasRepresentedPart = parts.some(part => part.represented === true);
    if (!hasRepresentedPart) {
      console.log('[DEBUG] Erro: Nenhuma parte marcada como representada');
      return 'Marque qual parte você representa.';
    }

    console.log('[DEBUG] Validação das partes passou com sucesso');
    return null; // Validação passou
  }, []);

  const validateCurrentStep = useCallback(() => {
    if (!currentQuestion) return true;

    console.log('[DEBUG] Validando pergunta atual:', currentQuestion.field);
    console.log('[DEBUG] Tipo da pergunta:', currentQuestion.type);

    const value = answers[currentQuestion.field];
    console.log('[DEBUG] Valor atual:', value);
    
    // Check if field is required and empty
    if (currentQuestion.required) {
      if (value === undefined || value === null || value === '') {
        setCurrentError('Por favor, preencha este campo antes de prosseguir.');
        return false;
      }
      
      // For arrays (like multi-select or file uploads), check if empty
      if (Array.isArray(value) && value.length === 0) {
        setCurrentError('Por favor, preencha este campo antes de prosseguir.');
        return false;
      }

      // Validação específica para partes do processo (multiEntry)
      // CORREÇÃO: Mudando de 'process_parts' para 'partes_processuais'
      if (currentQuestion.type === 'multiEntry' && currentQuestion.field === 'partes_processuais') {
        console.log('[DEBUG] Executando validação específica para partes processuais');
        const validationError = validateProcessParts(value);
        if (validationError) {
          console.log('[DEBUG] Erro na validação das partes:', validationError);
          setCurrentError(validationError);
          return false;
        }
      }
    }

    // Run custom validation if exists
    if (currentQuestion.validation) {
      const validationError = currentQuestion.validation(value, answers);
      if (validationError) {
        setCurrentError(validationError);
        return false;
      }
    }

    setCurrentError(null);
    return true;
  }, [currentQuestion, answers, validateProcessParts]);

  const handleAnswerChange = useCallback((field: string, value: any) => {
    console.log('[DEBUG] Alterando resposta:', field, value);
    
    setAnswers(prev => {
      const newAnswers = { ...prev, [field]: value };
      
      // Update active questions based on new answers
      const newActiveQuestions = questions.filter(q => {
        if (!q.condition) return true;
        return q.condition(newAnswers);
      });
      
      // If active questions changed, we might need to adjust current index
      if (newActiveQuestions.length !== activeQuestions.length) {
        setActiveQuestions(newActiveQuestions);
        
        // If current question is no longer active, move to next valid question
        const currentFieldStillActive = newActiveQuestions.some(q => q.field === currentQuestion?.field);
        if (!currentFieldStillActive && newActiveQuestions.length > 0) {
          const nextIndex = Math.min(currentQuestionIndex, newActiveQuestions.length - 1);
          setCurrentQuestionIndex(nextIndex);
        }
      }
      
      return newAnswers;
    });

    // Clear error when user starts typing/changing values
    if (currentError) {
      setCurrentError(null);
    }
  }, [questions, activeQuestions, currentQuestion, currentQuestionIndex, currentError]);

  const handleFileChange = useCallback((files: DocumentInfo[]) => {
    setAttachedFiles(files);
    
    // Clear error when files are added
    if (currentError) {
      setCurrentError(null);
    }
  }, [currentError]);

  const nextQuestion = useCallback(() => {
    console.log('[DEBUG] Clicou em "Próxima" - iniciando validação');
    
    // Sempre validar o passo atual antes de prosseguir
    const isValid = validateCurrentStep();
    
    console.log('[DEBUG] Resultado da validação:', isValid);
    
    if (!isValid) {
      console.log('[DEBUG] Validação falhou - não avançando');
      // Se a validação falhar, não avançar e o erro já foi definido no validateCurrentStep
      return;
    }

    console.log('[DEBUG] Validação passou - avançando para próxima pergunta');
    
    // Se a validação passou, prosseguir normalmente
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentError(null); // Clear error when moving to next question
    } else {
      setShowingSummary(true);
      setCurrentError(null);
    }
  }, [currentQuestionIndex, activeQuestions.length, validateCurrentStep]);

  const previousQuestion = useCallback(() => {
    if (showingSummary) {
      setShowingSummary(false);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
    setCurrentError(null); // Clear error when going back
  }, [showingSummary, currentQuestionIndex]);

  const handleSubmit = useCallback(async () => {
    if (!user?.id || !teamId) {
      toast.error("Erro de autenticação", { description: "Usuário ou equipe não identificados." });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare petition data
      const petitionData = {
        title: answers.title || 'Nova Petição',
        description: answers.description || '',
        legal_area: answers.legal_area || '',
        petition_type: answers.petition_type || '',
        has_process: Boolean(answers.has_process),
        process_number: answers.has_process ? answers.process_number : null,
        content: answers.content || '',
        category: answers.category || answers.legal_area || '',
        target: answers.target || '0',
        form_type: answers.form_type || answers.petition_type || '',
        form_answers: answers,
        form_schema: JSON.stringify(activeQuestions),
        team_id: teamId
      };

      // Create petition
      const newPetition = await petitionService.createPetition(petitionData);
      
      if (newPetition?.id) {
        // Upload attachments if any
        if (attachedFiles.length > 0) {
          const uploadPromises = attachedFiles.map(doc => {
            if (doc.file) {
              return petitionService.petitionAttachments?.uploadAttachment(newPetition.id, doc.file);
            }
            return Promise.resolve();
          });
          
          await Promise.allSettled(uploadPromises);
        }
        
        // Clear form data from storage after successful submission
        clearFormData();
        
        toast.success("Petição criada com sucesso!");
        navigate(`/petitions/${newPetition.id}`);
      }
    } catch (error: any) {
      console.error('Erro ao criar petição:', error);
      toast.error("Erro ao criar petição", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, teamId, answers, activeQuestions, attachedFiles, navigate, clearFormData]);

  return {
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
    validateCurrentStep,
    clearFormData, // Export for manual clearing if needed
  };
};
