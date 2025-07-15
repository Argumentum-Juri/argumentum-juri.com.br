
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInSchema, SignInFormValues } from '@/lib/authValidationSchemas';

interface LoginFormProps {
  onSubmit: (values: SignInFormValues) => Promise<void>;
  onForgotPassword: () => void;
  isLoading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onSubmit, 
  onForgotPassword, 
  isLoading 
}) => {
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif font-semibold text-[#D1A566] mb-2">
          Login
        </h2>
        <p className="text-gray-600 text-sm">
          Acesse sua conta para continuar.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 font-medium">
            Email
          </Label>
          <Input
            id="email"
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Senha
            </Label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-[#D1A566] hover:text-[#E5C07B] transition-colors"
            >
              Esqueceu a senha?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...form.register('password')}
            disabled={isLoading}
            className="h-12 border-gray-300 focus:border-[#D1A566] focus:ring-[#D1A566]"
          />
          {form.formState.errors.password && (
            <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#D1A566] hover:bg-[#E5C07B] text-[#1C140F] font-medium transition-all hover:scale-105 disabled:opacity-50"
          >
            {isLoading && (
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
            )}
            Entrar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
