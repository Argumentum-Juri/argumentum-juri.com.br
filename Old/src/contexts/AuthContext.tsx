
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { Session, User as SupabaseUser, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/profile';
import { toast } from 'sonner';
import { clearAllUserCaches, getFromCache, saveToCache, CACHE_DURATIONS } from '@/utils/cacheUtils';

interface User extends SupabaseUser {
  profile?: Profile;
}

interface Team {
  id: string;
  name?: string;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  authInitialized: boolean;
  teamId: string | null;
  activeTeam: Team | null;
  teamLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    termsAccepted: boolean,
    inviteId?: string | null,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [teamLoading, setTeamLoading] = useState<boolean>(true);

  // Função para buscar teamId do usuário
  const fetchUserTeam = useCallback(async (currentUser: SupabaseUser | null): Promise<string | null> => {
    if (!currentUser) {
      setTeamId(null);
      setActiveTeam(null);
      setTeamLoading(false);
      return null;
    }

    setTeamLoading(true);

    try {
      // Tentar carregar do cache primeiro
      const cacheKey = `user_team_${currentUser.id}`;
      const cachedTeamId = getFromCache<string>(cacheKey, CACHE_DURATIONS.MEDIUM);
      
      if (cachedTeamId) {
        console.log(`[AuthContext] Carregando equipe do cache: ${cachedTeamId}`);
        setTeamId(cachedTeamId);
        setActiveTeam({ id: cachedTeamId, name: 'Minha Equipe' });
        setTeamLoading(false);
        return cachedTeamId;
      }

      // Buscar equipe do usuário no banco
      console.log(`[AuthContext] Buscando equipe do usuário no banco de dados`);
      const { data: teamMemberData, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!error && teamMemberData?.team_id) {
        const foundTeamId = teamMemberData.team_id;
        setTeamId(foundTeamId);
        setActiveTeam({ id: foundTeamId, name: 'Minha Equipe' });
        
        // Salvar no cache
        saveToCache(cacheKey, foundTeamId, `Equipe salva no cache: ${foundTeamId}`);
        
        console.log(`[AuthContext] Equipe encontrada: ${foundTeamId}`);
        setTeamLoading(false);
        return foundTeamId;
      } else {
        console.log(`[AuthContext] Nenhuma equipe encontrada para o usuário`);
        setTeamId(null);
        setActiveTeam(null);
        setTeamLoading(false);
        return null;
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao carregar equipe:', error);
      setTeamLoading(false);
      return null;
    }
  }, []);

  // Função para buscar perfil do usuário
  const fetchUserProfile = useCallback(async (currentUser: SupabaseUser | null): Promise<void> => {
    if (!currentUser) {
      setProfile(null);
      setIsAdmin(false);
      setTeamId(null);
      setActiveTeam(null);
      setTeamLoading(false);
      return;
    }

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*, is_admin')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('[AuthContext] Erro ao buscar perfil:', error.message);
        setProfile(null);
        setIsAdmin(false);
      } else {
        const typedProfile = profileData as Profile | null;
        setProfile(typedProfile);
        setIsAdmin(typedProfile?.is_admin || false);
      }
      
      setUser({ ...currentUser, profile: profileData || undefined } as User);
      
      // Buscar team do usuário após carregar o perfil
      await fetchUserTeam(currentUser);
    } catch (error) {
      console.error('[AuthContext] Exceção ao buscar perfil:', error);
      setProfile(null);
      setIsAdmin(false);
      setUser(currentUser as User);
      setTeamLoading(false);
    }
  }, [fetchUserTeam]);

  // Inicialização da autenticação
  useEffect(() => {
    const initAuth = async () => {
      console.log('[AuthContext] Iniciando autenticação...');
      setIsLoading(true);

      try {
        // 1. Verificar sessão existente primeiro
        const { data: sessionData, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Erro ao restaurar sessão:', error);
          clearAllUserCaches();
        } else {
          console.log('[AuthContext] Sessão inicial:', !!sessionData?.session);
          setSession(sessionData?.session);
          
          // ✅ Definir user imediatamente após getSession()
          if (sessionData?.session?.user) {
            setUser(sessionData.session.user as User);
            // Buscar perfil em background
            fetchUserProfile(sessionData.session.user);
          } else {
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
            setTeamId(null);
            setActiveTeam(null);
            setTeamLoading(false);
          }
        }

        // ✅ Marcar como inicializado imediatamente após getSession()
        setAuthInitialized(true);
        setIsLoading(false);

        // 2. Configurar listener para mudanças futuras
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log(`[AuthContext] Auth event: ${event}`);
            setSession(newSession);

            if (newSession?.user) {
              setUser(newSession.user as User);
              await fetchUserProfile(newSession.user);
            } else {
              setUser(null);
              setProfile(null);
              setIsAdmin(false);
              setTeamId(null);
              setActiveTeam(null);
              setTeamLoading(false);
              if (event === 'SIGNED_OUT') {
                clearAllUserCaches();
              }
            }
          }
        );

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[AuthContext] Erro crítico na inicialização:', error);
        setAuthInitialized(true);
        setIsLoading(false);
        setTeamLoading(false);
      }
    };

    const cleanup = initAuth();

    return () => {
      cleanup.then(cleanupFn => {
        if (cleanupFn) cleanupFn();
      });
    };
  }, [fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Aguardar um momento para o listener processar
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('[AuthContext] Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    termsAccepted: boolean,
    inviteId?: string | null,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const credentials: SignUpWithPasswordCredentials = {
        email,
        password,
        options: {
          data: { 
            full_name: fullName, 
            terms_accepted: termsAccepted, 
            terms_accepted_at: termsAccepted ? new Date().toISOString() : null 
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      };
      
      if (inviteId && credentials.options?.data) {
        (credentials.options.data as Record<string, any>)['invite_id'] = inviteId;
      }
      
      const { error } = await supabase.auth.signUp(credentials);
      if (error) throw error;
    } catch (error) {
      console.error('[AuthContext] Erro no registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      clearAllUserCaches();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('[AuthContext] Erro no logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile?tab=security`,
      });
      if (error) throw error;
    } catch (error) {
      console.error('[AuthContext] Erro no reset:', error);
      throw error;
    }
  };

  const refreshData = useCallback(async () => {
    if (!user) return;
    await fetchUserProfile(user);
  }, [user, fetchUserProfile]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAdmin,
        isLoading,
        authInitialized,
        teamId,
        activeTeam,
        teamLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
