import { useState, useEffect, useCallback, useRef } from 'react';
import { goApiClient } from '@/lib/goApiClient';
import { toast } from 'sonner';
import { useGoAuth } from '@/contexts/GoAuthContext';

export const useGoPetitionsAPI = () => {
  const [petitions, setPetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchPetitions = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id) {
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    console.log(`[useGoPetitionsAPI] 🚀 Fetching petitions via Go API`);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await goApiClient.getPetitions();
      
      if (isMountedRef.current) {
        if (apiError) {
          setError(apiError);
          toast.error("Erro ao carregar petições");
        } else {
          console.log(`[useGoPetitionsAPI] ✅ Success: ${data?.length || 0} petitions`);
          setPetitions(data || []);
          setError(null);
          hasFetchedRef.current = true;
        }
      }
      
    } catch (err) {
      console.error(`[useGoPetitionsAPI] ❌ Error:`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        toast.error("Erro ao carregar petições");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, authInitialized, authLoading]);

  const refreshPetitions = useCallback(() => {
    console.log(`[useGoPetitionsAPI] 🔄 Manual refresh requested`);
    hasFetchedRef.current = false;
    fetchPetitions(true);
  }, [fetchPetitions]);

  useEffect(() => {
    console.log(`[useGoPetitionsAPI] 🎯 Main effect triggered`);
    
    if (authInitialized && !authLoading && user?.id) {
      fetchPetitions(false);
    } else if (authInitialized && !authLoading && !user?.id) {
      setPetitions([]);
      setError(null);
      setIsLoading(false);
    }
  }, [authInitialized, authLoading, user?.id, fetchPetitions]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { 
    petitions, 
    isLoading, 
    error,
    refreshPetitions
  };
};

export const useGoPetitionDetailAPI = (id: string) => {
  const [petition, setPetition] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchPetitionData = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id || !id) {
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    console.log(`[useGoPetitionDetailAPI] 🚀 Fetching petition ${id} via Go API`);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await goApiClient.getPetitionById(id);
      
      if (isMountedRef.current) {
        if (apiError) {
          setError(apiError);
          toast.error("Erro ao carregar detalhes da petição");
        } else {
          console.log(`[useGoPetitionDetailAPI] ✅ Success: ${data?.title}`);
          setPetition(data);
          setError(null);
          hasFetchedRef.current = true;
        }
      }
      
    } catch (err) {
      console.error(`[useGoPetitionDetailAPI] ❌ Error:`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        toast.error("Erro ao carregar detalhes da petição");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [id, user?.id, authInitialized, authLoading]);

  const refresh = useCallback(async () => {
    console.log(`[useGoPetitionDetailAPI] 🔄 Manual refresh`);
    hasFetchedRef.current = false;
    await fetchPetitionData(true);
  }, [fetchPetitionData]);

  useEffect(() => {
    console.log(`[useGoPetitionDetailAPI] 🎯 Main effect triggered for ID: ${id}`);
    hasFetchedRef.current = false;
    
    if (authInitialized && !authLoading && user?.id && id) {
      fetchPetitionData(false);
    }
  }, [id, authInitialized, authLoading, user?.id, fetchPetitionData]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    petition,
    isLoading,
    error,
    refresh
  };
};

export const useGoProfileAPI = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id) {
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    console.log(`[useGoProfileAPI] 🚀 Fetching profile via Go API`);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await goApiClient.getProfile();
      
      if (isMountedRef.current) {
        if (apiError) {
          setError(apiError);
          toast.error("Erro ao carregar perfil");
        } else {
          console.log(`[useGoProfileAPI] ✅ Success: Profile loaded`);
          setProfile(data);
          setError(null);
          hasFetchedRef.current = true;
        }
      }
      
    } catch (err) {
      console.error(`[useGoProfileAPI] ❌ Error:`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        toast.error("Erro ao carregar perfil");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, authInitialized, authLoading]);

  const updateProfile = useCallback(async (data: any) => {
    if (!user?.id) return null;

    console.log(`[useGoProfileAPI] 📝 Updating profile via Go API`);
    setError(null);

    try {
      const { data: updatedProfile, error: apiError } = await goApiClient.updateProfile(data);
      
      if (isMountedRef.current) {
        if (apiError) {
          setError(apiError);
          toast.error("Erro ao atualizar perfil");
          return null;
        } else {
          console.log(`[useGoProfileAPI] ✅ Profile updated successfully`);
          setProfile(updatedProfile);
          toast.success("Perfil atualizado com sucesso");
          return updatedProfile;
        }
      }
      
    } catch (err) {
      console.error(`[useGoProfileAPI] ❌ Update error:`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        toast.error("Erro ao atualizar perfil");
      }
      return null;
    }
  }, [user?.id]);

  const refreshProfile = useCallback(async () => {
    console.log(`[useGoProfileAPI] 🔄 Manual refresh`);
    hasFetchedRef.current = false;
    await fetchProfile(true);
  }, [fetchProfile]);

  useEffect(() => {
    console.log(`[useGoProfileAPI] 🎯 Main effect triggered`);
    
    if (authInitialized && !authLoading && user?.id) {
      fetchProfile(false);
    }
  }, [authInitialized, authLoading, user?.id, fetchProfile]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refreshProfile
  };
};

export const useGoTeamsAPI = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchTeams = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id) {
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    console.log(`[useGoTeamsAPI] 🚀 Fetching teams via Go API`);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await goApiClient.getTeams();
      
      if (isMountedRef.current) {
        if (apiError) {
          setError(apiError);
          toast.error("Erro ao carregar equipes");
        } else {
          console.log(`[useGoTeamsAPI] ✅ Success: ${data?.length || 0} teams`);
          setTeams(data || []);
          setError(null);
          hasFetchedRef.current = true;
        }
      }
      
    } catch (err) {
      console.error(`[useGoTeamsAPI] ❌ Error:`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        toast.error("Erro ao carregar equipes");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, authInitialized, authLoading]);

  const refreshTeams = useCallback(async () => {
    console.log(`[useGoTeamsAPI] 🔄 Manual refresh`);
    hasFetchedRef.current = false;
    await fetchTeams(true);
  }, [fetchTeams]);

  useEffect(() => {
    console.log(`[useGoTeamsAPI] 🎯 Main effect triggered`);
    
    if (authInitialized && !authLoading && user?.id) {
      fetchTeams(false);
    }
  }, [authInitialized, authLoading, user?.id, fetchTeams]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    teams,
    isLoading,
    error,
    refreshTeams
  };
};
