
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from "@/components/ui/checkbox";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, isAdmin } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'signin');
  
  useEffect(() => {
    if (user) {
      console.log("Auth: User logged in, isAdmin:", isAdmin);
      
      // Redirecionamento baseado no status do usuário
      if (isAdmin) {
        console.log("Redirecting admin to admin dashboard");
        navigate('/admin/dashboard');
      } else {
        console.log("Redirecting user to regular dashboard");
        navigate('/dashboard');
      }
    }
    
    const tabParam = searchParams.get('tab');
    if (tabParam && ['signin', 'signup'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [user, isAdmin, navigate, searchParams]);
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const { error, isAdmin } = await signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      toast.success('Login realizado com sucesso');
      console.log("Login successful, isAdmin:", isAdmin);
      
      // Redirecionamento automático após login
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Erro ao fazer login:", err);
      
      let errorMsg = 'Email ou senha incorretos. Por favor, tente novamente.';
      if (err.message && err.message.includes('Email not confirmed')) {
        errorMsg = 'Por favor, confirme seu email antes de fazer login.';
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }
    
    if (!termsAccepted) {
      setError('Você deve aceitar os termos de uso e política de privacidade para continuar.');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("Iniciando processo de registro");
      const { error } = await signUp(email, password, fullName);
      
      if (error) throw error;

      console.log("Usuário criado com sucesso, atualizando aceitação dos termos");
      
      toast.success('Conta criada com sucesso! Você já pode entrar no sistema.');
      setActiveTab('signin');
      setEmail('');
      setPassword('');
      setFullName('');
      setTermsAccepted(false);
    } catch (err: any) {
      console.error("Erro ao criar conta:", err);
      
      let errorMsg = err.message || 'Erro ao criar conta. Por favor, tente novamente.';
      if (err.message && err.message.includes('already registered')) {
        errorMsg = 'Este email já está registrado. Por favor, faça login ou use outro email.';
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast.error('Por favor, informe seu email');
      return;
    }

    setResetLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?tab=signin`,
      });
      
      if (error) throw error;
      
      toast.success('Email de recuperação enviado. Verifique sua caixa de entrada.');
      setShowResetDialog(false);
      setResetEmail('');
    } catch (error: any) {
      toast.error('Erro ao enviar email de recuperação: ' + error.message);
    } finally {
      setResetLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-160px)] p-4">
      <div className="w-full max-w-md">
        {showResetDialog ? (
          <Card>
            <CardHeader>
              <CardTitle>Recuperar Senha</CardTitle>
              <CardDescription>
                Digite seu email para receber instruções de recuperação de senha
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input 
                    id="reset-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowResetDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={resetLoading}>
                  {resetLoading ? 'Enviando...' : 'Enviar'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Registrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn}>
                  <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>
                      Entre com sua conta para acessar a plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input 
                        id="signin-email" 
                        type="email" 
                        placeholder="seu@email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password">Senha</Label>
                        <Button 
                          type="button" 
                          variant="link" 
                          className="px-0 font-normal h-auto"
                          onClick={() => setShowResetDialog(true)}
                        >
                          Esqueceu a senha?
                        </Button>
                      </div>
                      <Input 
                        id="signin-password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" type="submit" disabled={isLoading}>
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp}>
                  <CardHeader>
                    <CardTitle>Criar Conta</CardTitle>
                    <CardDescription>
                      Registre-se para começar a usar a plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome Completo</Label>
                      <Input 
                        id="signup-name" 
                        placeholder="Seu nome completo" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input 
                        id="signup-email" 
                        type="email" 
                        placeholder="seu@email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input 
                        id="signup-password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        A senha deve ter pelo menos 6 caracteres
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox 
                        id="terms" 
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Eu li e concordo com os{" "}
                        <RouterLink to="/terms" className="text-primary hover:underline">
                          Termos de Uso
                        </RouterLink>{" "}
                        e{" "}
                        <RouterLink to="/privacy" className="text-primary hover:underline">
                          Política de Privacidade
                        </RouterLink>
                      </label>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" type="submit" disabled={isLoading}>
                      {isLoading ? 'Criando conta...' : 'Registrar'}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Auth;
