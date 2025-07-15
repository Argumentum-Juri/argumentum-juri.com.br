
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { signUpSchema, SignUpFormValues } from '@/lib/authValidationSchemas';

interface SignupFormProps {
  onSubmit: (values: SignUpFormValues) => Promise<void>;
  isLoading: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSubmit, isLoading }) => {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif font-semibold text-[#D1A566] mb-2">
          Criar Conta
        </h2>
        <p className="text-gray-600 text-sm">
          Preencha os campos abaixo para criar sua conta.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-gray-700 font-medium">
            Nome Completo
          </Label>
          <Input
            id="fullName"
            placeholder="Seu Nome Completo"
            {...form.register('fullName')}
            disabled={isLoading}
            className="h-12 border-gray-300 focus:border-[#D1A566] focus:ring-[#D1A566]"
          />
          {form.formState.errors.fullName && (
            <p className="text-xs text-red-600">{form.formState.errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-signup" className="text-gray-700 font-medium">
            Email
          </Label>
          <Input
            id="email-signup"
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

        <div className="space-y-2">
          <Label htmlFor="password-signup" className="text-gray-700 font-medium">
            Senha
          </Label>
          <Input
            id="password-signup"
            type="password"
            placeholder="Mínimo 6 caracteres"
            {...form.register('password')}
            disabled={isLoading}
            className="h-12 border-gray-300 focus:border-[#D1A566] focus:ring-[#D1A566]"
          />
          {form.formState.errors.password && (
            <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
            Confirmar Senha
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repita a senha"
            {...form.register('confirmPassword')}
            disabled={isLoading}
            className="h-12 border-gray-300 focus:border-[#D1A566] focus:ring-[#D1A566]"
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-red-600">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="termsAccepted"
            checked={form.watch('termsAccepted')}
            onCheckedChange={(checked) => {
              const value = typeof checked === 'boolean' ? checked : false;
              form.setValue('termsAccepted', value, { shouldValidate: true });
            }}
            disabled={isLoading}
            className="mt-1 border-gray-300 data-[state=checked]:bg-[#D1A566] data-[state=checked]:border-[#D1A566]"
          />
          <Label htmlFor="termsAccepted" className="text-sm text-gray-600 leading-relaxed">
            Eu li e aceito os{' '}
            <Link to="/terms" className="text-[#D1A566] hover:text-[#E5C07B] underline" target="_blank">
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link to="/privacy" className="text-[#D1A566] hover:text-[#E5C07B] underline" target="_blank">
              Política de Privacidade
            </Link>.
          </Label>
        </div>
        {form.formState.errors.termsAccepted && (
          <p className="text-xs text-red-600">{form.formState.errors.termsAccepted.message}</p>
        )}

        <div className="space-y-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#D1A566] hover:bg-[#E5C07B] text-[#1C140F] font-medium transition-all hover:scale-105"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;
