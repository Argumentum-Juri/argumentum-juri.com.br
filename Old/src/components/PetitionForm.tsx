
// src/components/PetitionForm.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'sonner';
import { petitionService, DEFAULT_PETITION_COST } from '@/services/petition'; 
import type { Json } from '@/integrations/supabase/types';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import FileUpload from '@/components/FileUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useTokenBalance } from '@/components/Header';
import { useForm, Controller } from 'react-hook-form';
import { PetitionStatus } from '@/types/enums';
import { CreatePetitionParams } from '@/services/petition/core/createPetition';

const schema = yup.object({
  title: yup.string().required('Título é obrigatório').min(3, 'Título muito curto'),
  description: yup.string().required('Descrição é obrigatória').min(10, 'Descrição muito curta'),
  legal_area: yup.string().required('Área legal é obrigatória'),
  petition_type: yup.string().required('Tipo de petição é obrigatório'),
  has_process: yup.boolean().default(false),
  process_number: yup.string().when('has_process', {
    is: true,
    then: (s) => s.required('Número do processo é obrigatório').matches(/^[0-9.-]*$/, 'Apenas números, pontos e hífens'),
    otherwise: (s) => s.nullable().optional(),
  }),
  attachments: yup.array().of(yup.mixed<File>()).nullable().optional(),
  content: yup.string().optional(),
  category: yup.string().optional(),
  target: yup.string().optional().matches(/^[0-9]*$/, 'Meta de assinaturas deve conter apenas números'), 
  form_type: yup.string().optional(),
  // form_answers e form_schema podem ser objetos, a validação yup.mixed() é genérica.
  // Você pode ser mais específico se souber a estrutura.
  form_answers: yup.mixed().optional(), 
  form_schema: yup.mixed().optional(), 
});

type PetitionFormData = yup.InferType<typeof schema>;

type PetitionInsertServiceData = Omit<
  CreatePetitionParams, 
  'id' | 'created_at' | 'updated_at' | 'status' | 'current_signatures' | 'user_id' | 'team_id'
>;

const PetitionForm = () => {
  const { user, teamId: defaultUserTeamId, teamLoading } = useAuth(); 
  const { refreshTokens: refreshTeamTokensInHeader } = useTokenBalance(); 
  const navigate = useNavigate();

  const form = useForm<PetitionFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      legal_area: '',
      petition_type: '',
      has_process: false,
      process_number: '',
      attachments: [],
      content: '',
      category: '',
      target: '0', 
      form_answers: {}, // Inicializar como objeto vazio
      form_schema: undefined, // ou {} se preferir
    },
  });

  const onSubmit = async (formData: PetitionFormData) => {
    if (!user?.id || !defaultUserTeamId) {
      // Toasts já tratados nas verificações anteriores ou no início da função
      return;
    }

    form.clearErrors();

    try {
      // CORREÇÃO DA LINHA ~99 (onde o objeto é construído):
      // Ajustar form_schema para ser string JSON, e garantir que outros campos TEXT sejam strings.
      let formSchemaString: string | undefined = undefined;
      if (formData.form_schema) {
        if (typeof formData.form_schema === 'string') {
          // Se já for uma string JSON, validar se é JSON válido (opcional, mas bom)
          try {
            JSON.parse(formData.form_schema);
            formSchemaString = formData.form_schema;
          } catch (e) {
            toast.error("Erro no formato do Schema do Formulário", { description: "O schema fornecido não é um JSON válido."});
            return; // Impedir submissão
          }
        } else if (typeof formData.form_schema === 'object') {
          formSchemaString = JSON.stringify(formData.form_schema);
        }
      }

      // Ensure formAnswers is a Record<string, any>
      const formAnswers: Record<string, any> = {};
      
      // If formData.form_answers is a string (JSON), parse it
      if (typeof formData.form_answers === 'string') {
        try {
          Object.assign(formAnswers, JSON.parse(formData.form_answers));
        } catch (e) {
          console.error("Failed to parse form_answers JSON:", e);
        }
      } 
      // If it's already an object, use it directly
      else if (formData.form_answers && typeof formData.form_answers === 'object') {
        Object.assign(formAnswers, formData.form_answers);
      }

      const petitionInputForService: CreatePetitionParams = {
        title: String(formData.title || "Petição Sem Título"),
        description: String(formData.description || ""),
        legal_area: String(formData.legal_area || ""), 
        petition_type: String(formData.petition_type || ""), 
        has_process: Boolean(formData.has_process || false),
        process_number: formData.has_process ? String(formData.process_number || "") : null,
        category: String(formData.category || formData.legal_area || ""), 
        content: String(formData.content || ""),                           
        target: String(formData.target || '0'), 
        form_type: String(formData.form_type || formData.petition_type || ""), 
        form_schema: formSchemaString,
        form_answers: formAnswers,
        team_id: defaultUserTeamId
      };
      
      console.log("Enviando para createPetition:", petitionInputForService, "Usuário:", user.id, "Equipe Padrão:", defaultUserTeamId);
      // Update to call createPetition with just the petition data
      // The function will get userId from auth context internally
      const newPetition = await petitionService.createPetition(petitionInputForService);
      
      if (newPetition && newPetition.id) {
        const filesToUpload = formData.attachments;
        if (filesToUpload && filesToUpload.length > 0 && petitionService.petitionAttachments) {
          toast.info("Enviando anexos...", { id: "attachment-upload-petitionform" });
          const uploadPromises = filesToUpload.map((file: File) =>  
            petitionService.petitionAttachments.uploadAttachment(newPetition.id as string, file)
             .catch(err => ({ success: false, error: err, fileName: file.name }))
          );
          
          const results = await Promise.allSettled(uploadPromises);
          results.forEach(result => {
            if (result.status === 'fulfilled' && result.value && !result.value.success) {
              toast.error(`Falha ao enviar anexo: ${(result.value as any).fileName || 'arquivo'}.`, { description: (result.value as any).error?.message });
            } else if (result.status === 'rejected') {
              toast.error(`Erro crítico ao enviar um anexo.`);
            }
          });
          toast.dismiss("attachment-upload-petitionform");
        }
        
        // Fix: Passar o argumento 'force' como true para forçar atualização
        await refreshTeamTokensInHeader(true); 
        navigate(`/petitions/${newPetition.id}`);
      }
    } catch (error: any) {
      console.error('Erro ao submeter formulário de petição:', error);
      if (error.message && 
          !error.message.toLowerCase().includes("saldo") && 
          !error.message.toLowerCase().includes("cobrança") &&
          !error.message.toLowerCase().includes("autenticado") &&
          !error.message.toLowerCase().includes("equipe padrão")) {
        toast.error('Erro ao Criar Petição', { description: error.message || 'Por favor, tente novamente.' });
      }
    }
  };

  if (teamLoading) {
    return <div className="container mx-auto p-4 text-center"><p>Carregando dados da equipe...</p></div>;
  }

  if (!defaultUserTeamId && !teamLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-destructive font-semibold">Equipe padrão não encontrada.</p>
        <p className="text-muted-foreground mb-4">Você precisa estar associado a uma equipe padrão para criar petições.</p>
        <Button onClick={() => navigate('/teams')}>Gerenciar Equipes</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-primary">Criar Nova Petição</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as (data: PetitionFormData) => Promise<void>)} className="space-y-8 max-w-2xl mx-auto bg-card p-6 md:p-8 rounded-lg shadow-lg">
          <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título da Petição</FormLabel><FormControl><Input placeholder="Ex: Solicitação de Revisão de Benefício" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição Detalhada</FormLabel><FormControl><Textarea placeholder="Descreva o objetivo e os principais pontos da sua petição..." className="resize-y min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="legal_area" render={({ field }) => (<FormItem><FormLabel>Área Legal</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger></FormControl><SelectContent><SelectItem value="civel">Cível</SelectItem><SelectItem value="trabalhista">Trabalhista</SelectItem><SelectItem value="previdenciaria">Previdenciária</SelectItem><SelectItem value="familiar">Familiar</SelectItem><SelectItem value="criminal">Criminal</SelectItem><SelectItem value="consumidor">Consumidor</SelectItem><SelectItem value="tributaria">Tributária</SelectItem><SelectItem value="outra">Outra</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="petition_type" render={({ field }) => (<FormItem><FormLabel>Tipo de Peça</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="inicial">Petição Inicial</SelectItem><SelectItem value="contestacao">Contestação</SelectItem><SelectItem value="manifestacao">Manifestação</SelectItem><SelectItem value="recurso">Recurso</SelectItem><SelectItem value="contrarazoes">Contrarazões</SelectItem><SelectItem value="requerimento">Requerimento Simples</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="has_process" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Esta petição está vinculada a um processo existente?</FormLabel></div></FormItem>)} />
          {form.watch("has_process") && (<FormField control={form.control} name="process_number" render={({ field }) => (<FormItem><FormLabel>Número do Processo (CNJ)</FormLabel><FormControl><Input placeholder="Ex: 0000000-00.0000.0.00.0000" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />)}
          
           <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta de Assinaturas (Opcional)</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="Ex: 1000" 
                    {...field} 
                    value={field.value || ''} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           {/* Adicionar outros campos do formulário conforme necessário, como 'content', 'category', 'form_type', etc. */}
           {/* Exemplo para 'content' (Textarea) */}
            <FormField
                control={form.control}
                name="content" // Certifique-se que 'content' está no schema Yup e PetitionFormData
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Conteúdo Adicional (Opcional)</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="Detalhes adicionais, argumentação, etc."
                        className="resize-y min-h-[80px]"
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />


          <FormField
            control={form.control}
            name="attachments" 
            render={({ field }) => ( 
              <FormItem>
                <FormLabel>Anexos (Opcional)</FormLabel>
                <FormControl>
                  <FileUpload
                    onFilesChange={(files) => form.setValue('attachments', files, { shouldValidate: true, shouldDirty: true })}
                    maxFiles={5}
                    maxSizeInMB={10}
                  />
                </FormControl>
                <FormDescription>
                  Adicione até 5 arquivos (PDF, DOCX, PNG, JPG), máximo 10MB cada.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting || teamLoading} className="w-full">
            {form.formState.isSubmitting ? 'Criando Petição...' : `Criar Petição (${DEFAULT_PETITION_COST} Tokens)`}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default PetitionForm;
