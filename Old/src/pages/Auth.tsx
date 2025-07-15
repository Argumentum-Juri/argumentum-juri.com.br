import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mail } from 'lucide-react';
import { handleSupabaseError } from '@/utils/utils';
import {
  signInSchema,
  SignInFormValues,
  signUpSchema,
  SignUpFormValues,
  passwordResetSchema,
  PasswordResetFormValues,
} from '@/lib/authValidationSchemas';
import { Logo } from '@/components/ui/Logo';

const SIGN_IN_TAB = 'signin';
const SIGN_UP_TAB = 'signup';

export default function AuthPage() {
  const { signIn, signUp, user, isLoading: authContextIsLoading, authInitialized, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(SIGN_IN_TAB);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);
  const [isPasswordResetTab, setIsPasswordResetTab] = useState(false);
  const [redirectInitiated, setRedirectInitiated] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';
  const searchParams = new URLSearchParams(location.search);
  const inviteId = searchParams.get('inviteId');
  const tabFromUrl = searchParams.get('tab');

  // Efeito para definir a aba ativa com base no parâmetro da URL
  useEffect(() => {
    if (tabFromUrl === 'signup') {
      setActiveTab(SIGN_UP_TAB);
      setIsPasswordResetTab(false);
    } else if (tabFromUrl === 'signin') {
      setActiveTab(SIGN_IN_TAB);
      setIsPasswordResetTab(false);
    }
  }, [tabFromUrl]);

  // Redirecionar usuário logado - simplificado
  useEffect(() => {
    console.log('[AuthPage] useEffect Redirecionamento: Status:', { 
      userExists: !!user, 
      authContextIsLoading, 
      authInitialized,
      from,
      isAdmin,
      userId: user?.id,
      redirectInitiated
    });
    
    // Aguardar a inicialização completa da autenticação
    if (!authInitialized || authContextIsLoading) {
      console.log('[AuthPage] Aguardando inicialização/carregamento...');
      return;
    }

    // Se há usuário e redirecionamento ainda não foi iniciado
    if (user?.id && !redirectInitiated) {
      setRedirectInitiated(true);
      const targetRoute = isAdmin ? '/admin/dashboard' : from;
      console.log('[AuthPage] Redirecionando usuário autenticado para:', targetRoute);
      
      navigate(targetRoute, { replace: true });
    } else if (!user?.id) {
      console.log('[AuthPage] Usuário não autenticado, permanecendo na página de auth');
      setRedirectInitiated(false);
    }
  }, [user, authContextIsLoading, authInitialized, navigate, from, isAdmin, redirectInitiated]);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
  });

  const passwordResetForm = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: '' },
  });

  const onSubmitSignIn = async (values: SignInFormValues) => {
    console.log('[AuthPage] onSubmitSignIn: Iniciando tentativa de login...', values.email);
    setIsSigningIn(true);
    setGlobalError(null);
    
    try {
      await signIn(values.email, values.password);
      console.log('[AuthPage] onSubmitSignIn: Login realizado com sucesso');
      toast.success('Login realizado com sucesso!');
      // O redirecionamento será feito pelo useEffect que monitora o user
    } catch (error: any) {
      console.error('[AuthPage] onSubmitSignIn: Erro capturado:', error.message);
      const processedErrorMessage = handleSupabaseError(error);
      if (processedErrorMessage) {
        setGlobalError(processedErrorMessage);
        toast.error(processedErrorMessage);
      } else {
        toast.error('Falha no login. Verifique suas credenciais.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const onSubmitSignUp = async (values: SignUpFormValues) => {
    console.log('[AuthPage] onSubmitSignUp: Iniciando registro...');
    setIsSigningUp(true);
    setGlobalError(null);
    try { 
      await signUp(values.email, values.password, values.fullName, values.termsAccepted, inviteId);
      toast.success(
        'Registro realizado com sucesso! Por favor, verifique seu email para confirmar sua conta.'
      );
      signUpForm.reset();
      setActiveTab(SIGN_IN_TAB);
      setIsPasswordResetTab(false);
    } catch (error: any) { 
      console.error('[AuthPage] onSubmitSignUp: Erro no registro', error.message);
      const processedErrorMessage = handleSupabaseError(error);
      if (processedErrorMessage) {
        setGlobalError(processedErrorMessage);
        toast.error(processedErrorMessage);
      } else {
        toast.error('Falha ao registrar. Tente novamente.');
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  const onSubmitPasswordReset = async (values: PasswordResetFormValues) => {
    console.log('[AuthPage] onSubmitPasswordReset: Iniciando...');
    setIsSendingResetLink(true);
    setGlobalError(null);
    try { 
      await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/profile?tab=security`,
      });
      toast.success(
        'Se uma conta existir para este email, um link de redefinição de senha foi enviado.'
      );
      passwordResetForm.reset();
      setIsPasswordResetTab(false);
      setActiveTab(SIGN_IN_TAB);
    } catch (error: any) { 
      console.error('[AuthPage] onSubmitPasswordReset: Erro', error.message);
      const processedErrorMessage = handleSupabaseError(error);
      if (processedErrorMessage) {
        setGlobalError(processedErrorMessage);
        toast.error(processedErrorMessage);
      } else {
        toast.error('Falha ao enviar o link de redefinição.');
      }
    } finally {
      setIsSendingResetLink(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google') => {
    console.log('[AuthPage] handleOAuthSignIn: Iniciando com', provider);
    setGlobalError(null); 
    setIsSigningIn(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (error) {
        console.error('[AuthPage] handleOAuthSignIn: Erro do provedor OAuth', error.message);
        const processedErrorMessage = handleSupabaseError(error);
        if (processedErrorMessage) {
          setGlobalError(processedErrorMessage);
          toast.error(processedErrorMessage);
        } else {
          toast.error(`Falha ao autenticar com ${provider}.`);
        }
        setIsSigningIn(false);
      }
    } catch (networkOrSDKError: any) {
      console.error('[AuthPage] handleOAuthSignIn: Erro na chamada da SDK', networkOrSDKError.message);
      const processedErrorMessage = handleSupabaseError(networkOrSDKError);
      if (processedErrorMessage) {
        setGlobalError(processedErrorMessage);
        toast.error(processedErrorMessage);
      } else {
        toast.error(`Falha ao iniciar autenticação com ${provider}.`);
      }
      setIsSigningIn(false);
    }
  };

  // Loader principal da página de autenticação
  if (!authInitialized) {
    console.log('[AuthPage] Renderizando loader principal da página (aguardando inicialização)');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Se há usuário e redirecionamento foi iniciado, mostrar loading
  if (user?.id && redirectInitiated) {
    console.log('[AuthPage] Usuário detectado, redirecionamento iniciado...');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  console.log('[AuthPage] Renderizando formulários. Status:', { 
    user: !!user, 
    authContextIsLoading, 
    authInitialized,
    userId: user?.id,
    redirectInitiated
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
       <div className="absolute top-8 left-8">
         <Link to="/" className="flex items-center space-x-2 text-xl font-semibold">
            <Logo className="h-8 w-auto" />
            <span>Argumentum</span>
          </Link>
        </div>
      <Tabs
        value={isPasswordResetTab ? 'reset-password' : activeTab}
        onValueChange={(value) => {
          setGlobalError(null);
          signInForm.clearErrors();
          signUpForm.clearErrors();
          passwordResetForm.clearErrors();
          if (value === SIGN_IN_TAB || value === SIGN_UP_TAB) {
            setIsPasswordResetTab(false);
            setActiveTab(value);
          }
        }}
        className="w-full max-w-md"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value={SIGN_IN_TAB} disabled={isPasswordResetTab}>Login</TabsTrigger>
          <TabsTrigger value={SIGN_UP_TAB} disabled={isPasswordResetTab}>Registrar</TabsTrigger>
        </TabsList>

        {globalError && !isPasswordResetTab && (activeTab === SIGN_IN_TAB || activeTab === SIGN_UP_TAB) && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}
        
        <TabsContent value={SIGN_IN_TAB} style={{ display: activeTab === SIGN_IN_TAB && !isPasswordResetTab ? 'block' : 'none' }}>
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Acesse sua conta para continuar.</CardDescription>
            </CardHeader>
            <form onSubmit={signInForm.handleSubmit(onSubmitSignIn)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input id="email-signin" type="email" placeholder="seu@email.com" {...signInForm.register('email')} disabled={isSigningIn || authContextIsLoading} />
                  {signInForm.formState.errors.email && (<p className="text-xs text-destructive">{signInForm.formState.errors.email.message}</p>)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-signin">Senha</Label>
                    <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => {
                        setGlobalError(null); signInForm.clearErrors(); setIsPasswordResetTab(true); setActiveTab('reset-password');
                      }}>
                        Esqueceu a senha?
                    </Button>
                  </div>
                  <Input id="password-signin" type="password" placeholder="••••••••" {...signInForm.register('password')} disabled={isSigningIn || authContextIsLoading} />
                  {signInForm.formState.errors.password && (<p className="text-xs text-destructive">{signInForm.formState.errors.password.message}</p>)}
                </div>
              </CardContent>
              <CardFooter className="flex-col space-y-3">
                <Button type="submit" className="w-full" disabled={isSigningIn || authContextIsLoading}>
                  {isSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
                <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('google')} disabled={isSigningIn || authContextIsLoading} type="button">
                  <Mail className="mr-2 h-4 w-4" /> Entrar com Gmail
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value={SIGN_UP_TAB} style={{ display: activeTab === SIGN_UP_TAB && !isPasswordResetTab ? 'block' : 'none' }}>
          <Card>
            <CardHeader>
              <CardTitle>Criar Conta</CardTitle>
              <CardDescription>Preencha os campos abaixo para criar sua conta.</CardDescription>
            </CardHeader>
            <form onSubmit={signUpForm.handleSubmit(onSubmitSignUp)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName-signup">Nome Completo</Label>
                  <Input id="fullName-signup" placeholder="Seu Nome Completo" {...signUpForm.register('fullName')} disabled={isSigningUp || authContextIsLoading} />
                  {signUpForm.formState.errors.fullName && (<p className="text-xs text-destructive">{signUpForm.formState.errors.fullName.message}</p>)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="seu@email.com" {...signUpForm.register('email')} disabled={isSigningUp || authContextIsLoading} />
                  {signUpForm.formState.errors.email && (<p className="text-xs text-destructive">{signUpForm.formState.errors.email.message}</p>)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Senha</Label>
                  <Input id="password-signup" type="password" placeholder="Mínimo 6 caracteres" {...signUpForm.register('password')} disabled={isSigningUp || authContextIsLoading}/>
                  {signUpForm.formState.errors.password && (<p className="text-xs text-destructive">{signUpForm.formState.errors.password.message}</p>)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword-signup">Confirmar Senha</Label>
                  <Input id="confirmPassword-signup" type="password" placeholder="Repita a senha" {...signUpForm.register('confirmPassword')} disabled={isSigningUp || authContextIsLoading} />
                  {signUpForm.formState.errors.confirmPassword && (<p className="text-xs text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>)}
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="termsAccepted-signup" checked={signUpForm.watch('termsAccepted')}
                    onCheckedChange={(checked) => {
                        const value = typeof checked === 'boolean' ? checked : false;
                        signUpForm.setValue('termsAccepted', value, {shouldValidate: true});
                      }
                    }
                    disabled={isSigningUp || authContextIsLoading} className="mt-1"
                  />
                  <Label htmlFor="termsAccepted-signup" className="text-sm font-normal data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70">
                    Eu li e aceito os{' '}
                    <Link to="/terms" className="underline hover:text-primary" target="_blank">Termos de Uso</Link>{' '}
                    e a{' '}
                    <Link to="/privacy" className="underline hover:text-primary" target="_blank">Política de Privacidade</Link>.
                  </Label>
                </div>
                {signUpForm.formState.errors.termsAccepted && (<p className="text-xs text-destructive">{signUpForm.formState.errors.termsAccepted.message}</p>)}
              </CardContent>
              <CardFooter className="flex-col space-y-3">
                <Button type="submit" className="w-full" disabled={isSigningUp || authContextIsLoading}>
                  {isSigningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Registrar
                </Button>
                <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('google')} disabled={isSigningUp || authContextIsLoading} type="button">
                  <Mail className="mr-2 h-4 w-4" /> Registrar com Gmail
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {isPasswordResetTab && (
            <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Redefinir Senha</CardTitle>
                  <CardDescription>Digite seu email para enviarmos um link de redefinição de senha.</CardDescription>
                </CardHeader>
                {globalError && (
                    <Alert variant="destructive" className="mx-6 mb-0">
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{globalError}</AlertDescription>
                    </Alert>
                )}
                <form onSubmit={passwordResetForm.handleSubmit(onSubmitPasswordReset)}>
                <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-reset">Email</Label>
                      <Input id="email-reset" type="email" placeholder="seu@email.com" {...passwordResetForm.register('email')} disabled={isSendingResetLink || authContextIsLoading} />
                      {passwordResetForm.formState.errors.email && (<p className="text-xs text-destructive">{passwordResetForm.formState.errors.email.message}</p>)}
                    </div>
                </CardContent>
                <CardFooter className="flex-col space-y-2">
                    <Button type="submit" className="w-full" disabled={isSendingResetLink || authContextIsLoading}>
                      {isSendingResetLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar Link
                    </Button>
                    <Button type="button" variant="link" className="text-sm" onClick={() => {
                        setIsPasswordResetTab(false); setActiveTab(SIGN_IN_TAB); setGlobalError(null);
                      }}>
                        Voltar para o Login
                    </Button>
                </CardFooter>
                </form>
            </Card>
        )}
      </Tabs>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Argumentum &copy; {new Date().getFullYear()} Todos os direitos reservados.
      </p>
    </div>
  );
}
