
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'sonner';
import { petitionService } from '@/services/petitionService';
import { PetitionStatus } from '@/types';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import FileUpload from '@/components/FileUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

const schema = yup.object({
  title: yup.string().required('Título é obrigatório'),
  description: yup.string().required('Descrição é obrigatória'),
  legal_area: yup.string().required('Área legal é obrigatória'),
  petition_type: yup.string().required('Tipo de petição é obrigatório'),
  has_process: yup.boolean().default(false),
  process_number: yup.string().when('has_process', {
    is: true,
    then: (schema) => schema.required('Número do processo é obrigatório quando há processo'),
  }),
  attachments: yup.array().of(yup.mixed())
});

const PetitionForm = () => {
  const { user } = useAuth();
  const { teamId } = useTeam();
  const navigate = useNavigate();
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      legal_area: '',
      petition_type: '',
      has_process: false,
      process_number: '',
      attachments: []
    },
  });

  const handleFileChange = (files: File[]) => {
    form.setValue('attachments', files);
  };

  const onSubmit = async (data: any) => {
    try {
      const petitionData = {
        ...data,
        team_id: teamId,
        status: PetitionStatus.PENDING,
      };
      
      const result = await petitionService.createPetition(petitionData);
      
      if (result) {
        // Upload attachments if any
        if (data.attachments && data.attachments.length > 0) {
          const uploadPromises = data.attachments.map((file: File) => 
            petitionService.uploadAttachment(result.id, file)
          );
          
          await Promise.all(uploadPromises);
          console.log('Todos os anexos foram enviados com sucesso');
        }
        
        toast.success('Petição criada com sucesso!');
        navigate(`/petitions/${result.id}`);
      }
    } catch (error) {
      console.error('Erro ao criar petição:', error);
      toast.error('Erro ao criar petição. Por favor, tente novamente.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Título da petição" {...field} />
              </FormControl>
              <FormDescription>
                Dê um título claro e objetivo para a petição.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva detalhadamente a petição"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Forneça uma descrição detalhada da petição.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="legal_area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área Legal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a área legal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="civel">Cível</SelectItem>
                    <SelectItem value="trabalhista">Trabalhista</SelectItem>
                    <SelectItem value="previdenciaria">Previdenciária</SelectItem>
                    <SelectItem value="familiar">Familiar</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecione a área legal correspondente à petição.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="petition_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Petição</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de petição" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="inicial">Inicial</SelectItem>
                    <SelectItem value="contestacao">Contestação</SelectItem>
                    <SelectItem value="manifestacao">Manifestação</SelectItem>
                    <SelectItem value="recursos">Recursos</SelectItem>
                    <SelectItem value="contrarrazoes">Contrarrazões</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecione o tipo de petição.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="has_process"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-0.5 leading-none">
                <FormLabel>Possui número de processo?</FormLabel>
                <FormDescription>
                  Marque se esta petição está relacionada a um processo existente.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {form.watch("has_process") && (
          <FormField
            control={form.control}
            name="process_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do Processo</FormLabel>
                <FormControl>
                  <Input placeholder="Número do processo" {...field} />
                </FormControl>
                <FormDescription>
                  Informe o número do processo (CNJ).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="attachments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anexos</FormLabel>
              <FormControl>
                <FileUpload
                  onFilesChange={handleFileChange}
                  maxFiles={5}
                  maxSizeInMB={10}
                />
              </FormControl>
              <FormDescription>
                Adicione arquivos relevantes para a petição (máximo 5 arquivos, até 10MB cada).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          Criar Petição
        </Button>
      </form>
    </Form>
  );
};

export default PetitionForm;
