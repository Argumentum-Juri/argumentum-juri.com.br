import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  SignInFormValues,
  SignUpFormValues,
  PasswordResetFormValues,
} from '@/lib/authValidationSchemas';
import AuthNavbar from '@/components/auth/AuthNavbar';
import AuthTabs from '@/components/auth/AuthTabs';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import PasswordResetForm from '@/components/auth/PasswordResetForm';
import AuthFooter from '@/components/auth/AuthFooter';

const SIGN_IN_TAB = 'signin';
const SIGN_UP_TAB = 'signup';

export default function AuthPage() {
  const { signIn, signUp, user, isLoading: authContextIsLoading, authInitialized, resetPassword } = useGoAuth();
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

  // Redirecionar usuário logado
  useEffect(() => {
    console.log('[AuthPage] useEffect Redirecionamento: Status:', { 
      userExists: !!user, 
      authContextIsLoading, 
      authInitialized,
      from,
      isAdmin: user?.isAdmin,
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
      
      // Lógica de redirecionamento corrigida para deep linking
      let targetRoute: string;
      
      if (user.isAdmin) {
        // Se é admin E a rota original é uma rota admin, use o from original
        if (from.startsWith('/admin/')) {
          targetRoute = from;
        } else {
          // Se é admin mas a rota original não é admin, use dashboard admin
          targetRoute = '/admin/dashboard';
        }
      } else {
        // Se não é admin, use o from original ou dashboard padrão
        targetRoute = from === '/dashboard' ? from : (from.startsWith('/admin/') ? '/dashboard' : from);
      }
      
      console.log('[AuthPage] Redirecionando usuário autenticado para:', targetRoute);
      navigate(targetRoute, { replace: true });
    } else if (!user?.id) {
      console.log('[AuthPage] Usuário não autenticado, permanecendo na página de auth');
      setRedirectInitiated(false);
    }
  }, [user, authContextIsLoading, authInitialized, navigate, from, redirectInitiated]);

  const onSubmitSignIn = async (values: SignInFormValues) => {
    console.log('[AuthPage] onSubmitSignIn: Iniciando tentativa de login...', values.email);
    setIsSigningIn(true);
    setGlobalError(null);
    
    try {
      await signIn(values.email, values.password);
      console.log('[AuthPage] onSubmitSignIn: Login realizado com sucesso');
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('[AuthPage] onSubmitSignIn: Erro capturado:', error.message);
      setGlobalError(error.message);
      toast.error(error.message || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const onSubmitSignUp = async (values: SignUpFormValues) => {
    console.log('[AuthPage] onSubmitSignUp: Iniciando registro...');
    setIsSigningUp(true);
    setGlobalError(null);
    try { 
      await signUp(values.email, values.password, values.fullName, values.termsAccepted);
      toast.success('Registro realizado com sucesso!');
      setActiveTab(SIGN_IN_TAB);
      setIsPasswordResetTab(false);
    } catch (error: any) { 
      console.error('[AuthPage] onSubmitSignUp: Erro no registro', error.message);
      setGlobalError(error.message);
      toast.error(error.message || 'Falha ao registrar. Tente novamente.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const onSubmitPasswordReset = async (values: PasswordResetFormValues) => {
    console.log('[AuthPage] onSubmitPasswordReset: Iniciando...');
    setIsSendingResetLink(true);
    setGlobalError(null);
    try { 
      await resetPassword(values.email);
      toast.success(
        'Se uma conta existir para este email, um link de redefinição de senha foi enviado.'
      );
      setIsPasswordResetTab(false);
      setActiveTab(SIGN_IN_TAB);
    } catch (error: any) { 
      console.error('[AuthPage] onSubmitPasswordReset: Erro', error.message);
      setGlobalError(error.message);
      toast.error(error.message || 'Falha ao enviar o link de redefinição.');
    } finally {
      setIsSendingResetLink(false);
    }
  };

  const handleForgotPassword = () => {
    setGlobalError(null);
    setIsPasswordResetTab(true);
    setActiveTab('reset-password');
  };

  const handleBackToLogin = () => {
    setIsPasswordResetTab(false);
    setActiveTab(SIGN_IN_TAB);
    setGlobalError(null);
  };

  const handleTabChange = (tab: string) => {
    setGlobalError(null);
    if (tab === SIGN_IN_TAB || tab === SIGN_UP_TAB) {
      setIsPasswordResetTab(false);
      setActiveTab(tab);
    }
  };

  // Loader principal da página de autenticação
  if (!authInitialized) {
    console.log('[AuthPage] Renderizando loader principal da página (aguardando inicialização)');
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#D1A566]" />
      </div>
    );
  }

  // Se há usuário e redirecionamento foi iniciado, mostrar loading
  if (user?.id && redirectInitiated) {
    console.log('[AuthPage] Usuário detectado, redirecionamento iniciado...');
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#D1A566] mx-auto mb-4" />
          <p className="text-gray-600">Redirecionando...</p>
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
    <div className="min-h-screen bg-gray-50">
      <AuthNavbar />
      
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-md mx-auto">
          {/* Main Auth Card */}
          <div className="bg-[#FCFBF9] rounded-lg shadow-lg overflow-hidden animate-scale-in">
            <AuthTabs 
              activeTab={activeTab} 
              onTabChange={handleTabChange}
              isPasswordResetTab={isPasswordResetTab}
            />

            <div className="p-8">
              {globalError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{globalError}</AlertDescription>
                </Alert>
              )}

              {isPasswordResetTab ? (
                <PasswordResetForm
                  onSubmit={onSubmitPasswordReset}
                  onBackToLogin={handleBackToLogin}
                  isLoading={isSendingResetLink || authContextIsLoading}
                />
              ) : activeTab === SIGN_IN_TAB ? (
                <LoginForm
                  onSubmit={onSubmitSignIn}
                  onForgotPassword={handleForgotPassword}
                  isLoading={isSigningIn || authContextIsLoading}
                />
              ) : (
                <SignupForm
                  onSubmit={onSubmitSignUp}
                  isLoading={isSigningUp || authContextIsLoading}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}
