
import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(1, { message: 'A senha não pode estar vazia.' }),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(3, { message: 'O nome completo deve ter pelo menos 3 caracteres.' }),
    email: z.string().email({ message: 'Por favor, insira um email válido.' }),
    password: z
      .string()
      .min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
    confirmPassword: z
      .string()
      .min(6, { message: 'A confirmação da senha deve ter pelo menos 6 caracteres.' }),
    termsAccepted: z.boolean().refine(val => val === true, {
      message: 'Você deve aceitar os Termos de Uso e a Política de Privacidade.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'], // Campo onde o erro será exibido
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const passwordResetSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido para redefinir sua senha.' }),
});

export type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;
