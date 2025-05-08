
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Question, PetitionFormAnswers } from '@/types/petition-form';
import { useNavigate } from 'react-router-dom';
import { petitionService } from '@/services/petitionService';
import { tokenService } from '@/services/tokenService';
import { PetitionStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const usePetitionFormLogic = (allPossibleQuestions: Question[], teamId: string) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<PetitionFormAnswers>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showingSummary, setShowingSummary] = useState<boolean>(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const activeQuestions = useMemo(() => {
    return allPossibleQuestions.filter(q => q.condition ? q.condition(answers) : true);
  }, [allPossibleQuestions, answers]);

  const currentQuestion = activeQuestions[currentQuestionIndex];

  const validateCurrentAnswer = useCallback((): string | null => {
    if (!currentQuestion) return null;
    const value = answers[currentQuestion.field];

    if (currentQuestion.required) {
      if (currentQuestion.type === 'checkbox' && typeof value !== 'boolean') {
        return 'Por favor, selecione Sim ou Não.';
      }
      if (currentQuestion.type !== 'checkbox' && (value === undefined || value === '' || value === null)) {
        return 'Este campo é obrigatório';
      }
    }

    if (currentQuestion.validation) {
      return currentQuestion.validation(value, answers);
    }

    return null;
  }, [currentQuestion, answers]);

  const handleAnswerChange = (field: string, value: any) => {
    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    }
    
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (files: File[]) => {
    setAttachedFiles(files);
  };

  const nextQuestion = useCallback(() => {
    const error = validateCurrentAnswer();
    if (error) {
      toast.error(error);
      return;
    }

    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Before showing summary, check token balance
      tokenService.getTokenBalance().then(balance => {
        // We'll do a final check before submission, this is just to warn early
        if (balance < 16) {
          toast.warning('Seu saldo de tokens é baixo', {
            description: 'Você precisará de pelo menos 16 tokens para criar esta petição.'
          });
        }
        setShowingSummary(true);
      });
    }
  }, [currentQuestionIndex, activeQuestions.length, validateCurrentAnswer]);

  const previousQuestion = useCallback(() => {
    if (showingSummary) {
      setShowingSummary(false);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [showingSummary, currentQuestionIndex]);

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);

    try {
      // Final check for token balance
      const balance = await tokenService.getTokenBalance();
      if (balance < 16) {
        toast.error('Saldo insuficiente de tokens', {
          description: 'Você precisa de pelo menos 16 tokens para criar uma petição.'
        });
        navigate('/tokens/store');
        return;
      }

      const { title, legal_area, petition_type, ...otherAnswers } = answers;

      const petitionData = {
        team_id: teamId,
        status: PetitionStatus.PENDING,
        title: answers.title || '',
        description: answers.description || '',
        legal_area: answers.legal_area || null,
        petition_type: answers.petition_type || null,
        has_process: typeof answers.has_process === 'string' 
          ? answers.has_process === 'true' 
          : !!answers.has_process,
        process_number: answers.process_number || null,
        form_answers: otherAnswers,
        user_id: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await petitionService.createPetition(petitionData);

      if (result && result.id) {
        const allFiles = [...attachedFiles];
        
        if (allFiles.length > 0) {
          await Promise.allSettled(
            allFiles.map(async (file) => {
              try {
                const uploadResult = await petitionService.petitionAttachments.uploadAttachment(result.id, file);
                if (!uploadResult.success) {
                  toast.error(`Falha ao enviar ${file.name}.`);
                }
              } catch (error) {
                console.error(`Erro ao fazer upload do anexo ${file.name}:`, error);
                toast.error(`Erro ao enviar ${file.name}.`);
              }
            })
          );
        }

        toast.success('Petição criada com sucesso!');
        navigate(`/petitions/${result.id}`);
      } else {
        // If result is null, likely because of insufficient tokens
        // We'll let the createPetition function handle the error message
        if (!result) {
          // Check token balance again for user feedback
          const newBalance = await tokenService.getTokenBalance();
          if (newBalance < 16) {
            navigate('/tokens/store');
          }
        } else {
          toast.error('Erro ao criar petição. Resposta inválida do servidor.');
        }
      }
    } catch (error) {
      console.error('Erro ao criar petição:', error);
      toast.error('Erro ao criar petição. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
};
