
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { passwordResetSchema, PasswordResetFormValues } from '@/lib/authValidationSchemas';

interface PasswordResetFormProps {
  onSubmit: (values: PasswordResetFormValues) => Promise<void>;
  onBackToLogin: () => void;
  isLoading: boolean;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ 
  onSubmit, 
  onBackToLogin, 
  isLoading 
}) => {
  const form = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: '' },
  });

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif font-semibold text-[#D1A566] mb-2">
          Redefinir Senha
        </h2>
        <p className="text-gray-600 text-sm">
          Digite seu email para enviarmos um link de redefinição de senha.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-reset" className="text-gray-700 font-medium">
            Email
          </Label>
          <Input
            id="email-reset"
            type="email"
            placeholder="seu@email.com"
            {...form.register('email')}
            disabled={isLoading}
            className="h-12 border-gray-300 focus:border-[#D1A566] focus:ring-[#D1A566]"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#D1A566] hover:bg-[#E5C07B] text-[#1C140F] font-medium transition-all hover:scale-105"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Link
          </Button>

          <Button
            type="button"
            variant="link"
            onClick={onBackToLogin}
            className="w-full text-[#D1A566] hover:text-[#E5C07B]"
          >
            Voltar para o Login
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PasswordResetForm;
