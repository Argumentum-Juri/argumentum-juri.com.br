import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { goApiClient } from '@/lib/goApiClient';
import { verifyCustomJWT, JWTPayload } from '@/lib/jwtVerifier';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  authInitialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    termsAccepted: boolean
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshData: () => Promise<void>;
  getToken: () => string | null;
}

const GoAuthContext = createContext<AuthContextType | undefined>(undefined);

// Função helper para obter o token de fora do contexto
export const getGoAuthToken = (): string | null => {
  return goApiClient.currentToken;
};

export const GoAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  // Função para verificar e carregar usuário do token existente
  const loadUserFromToken = useCallback(async () => {
    console.log('[GoAuth] 🔍 Verificando token existente...');
    
    const token = goApiClient.currentToken;
    if (!token) {
      console.log('[GoAuth] 🔍 Nenhum token encontrado');
      setUser(null);
      setIsLoading(false);
      setAuthInitialized(true);
      return;
    }

    try {
      const payload = await verifyCustomJWT(token);
      if (payload) {
        const userData: User = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          isAdmin: payload.is_admin
        };
        
        console.log('[GoAuth] ✅ Token válido, usuário carregado:', userData.email);
        setUser(userData);
      } else {
        console.log('[GoAuth] ❌ Token inválido, removendo...');
        goApiClient.clearToken();
        setUser(null);
      }
    } catch (error) {
      console.error('[GoAuth] ❌ Erro ao verificar token:', error);
      goApiClient.clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
      setAuthInitialized(true);
    }
  }, []);

  useEffect(() => {
    console.log('[GoAuth] 🚀 Iniciando verificação de autenticação...');
    loadUserFromToken();
  }, [loadUserFromToken]);

  const signIn = async (email: string, password: string) => {
    console.log('[GoAuth] Iniciando login para:', email);
    setIsLoading(true);
    
    try {
      const { data, error } = await goApiClient.login(email, password);
      
      if (error) {
        console.error('[GoAuth] Erro no login:', error);
        throw new Error(error);
      }

      if (data?.user) {
        console.log('[GoAuth] Login realizado com sucesso:', data.user.email);
        // Garantir que o GoApiClient tenha os tokens atualizados na instância viva
        goApiClient.setTokens(data.token, data.refreshToken);
        setUser(data.user);
        toast.success('Login realizado com sucesso!');
      } else {
        throw new Error('Dados de usuário não recebidos');
      }
    } catch (error) {
      console.error('[GoAuth] Erro no login:', error);
      toast.error(error instanceof Error ? error.message : 'Erro no login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    termsAccepted: boolean
  ): Promise<void> => {
    console.log('[GoAuth] Iniciando registro para:', email);
    setIsLoading(true);
    
    try {
      const { data, error } = await goApiClient.register(email, password, fullName);
      
      if (error) {
        console.error('[GoAuth] Erro no registro:', error);
        throw new Error(error);
      }

      if (data?.user) {
        console.log('[GoAuth] Registro realizado com sucesso:', data.user.email);
        // Garantir que o GoApiClient tenha os tokens atualizados na instância viva
        goApiClient.setTokens(data.token, data.refreshToken);
        setUser(data.user);
        toast.success('Registro realizado com sucesso!');
      } else {
        throw new Error('Dados de usuário não recebidos');
      }
    } catch (error) {
      console.error('[GoAuth] Erro no registro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro no registro');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[GoAuth] Fazendo logout...');
    setIsLoading(true);
    
    try {
      await goApiClient.logout();
      setUser(null);
      toast.success('Logout realizado com sucesso!');
      console.log('[GoAuth] Logout realizado com sucesso');
    } catch (error) {
      console.error('[GoAuth] Erro no logout:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await goApiClient.resetPassword(email);
      if (error) {
        throw new Error(error);
      }
      toast.success('Email de recuperação enviado!');
    } catch (error) {
      console.error('[GoAuth] Erro no reset de senha:', error);
      toast.error(error instanceof Error ? error.message : 'Erro no reset de senha');
      throw error;
    }
  };

  const refreshData = useCallback(async () => {
    console.log('[GoAuth] Atualizando dados do usuário...');
    await loadUserFromToken();
  }, [loadUserFromToken]);

  const getToken = useCallback((): string | null => {
    return goApiClient.currentToken;
  }, []);

  return (
    <GoAuthContext.Provider
      value={{
        user,
        isLoading,
        authInitialized,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshData,
        getToken,
      }}
    >
      {children}
    </GoAuthContext.Provider>
  );
};

export const useGoAuth = (): AuthContextType => {
  const context = useContext(GoAuthContext);
  if (context === undefined) {
    throw new Error('useGoAuth must be used within a GoAuthProvider');
  }
  return context;
};
