
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { Profile } from '@/types/profile';

export const useProfileAPI = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
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

    console.log(`[useProfileAPI] 🚀 Fetching profile via API`);
    setIsLoading(true);
    setError(null);

    try {
      const profileData = await apiClient.getProfile();
      
      if (isMountedRef.current) {
        console.log(`[useProfileAPI] ✅ Success: Profile loaded`);
        setProfile(profileData);
        setError(null);
        hasFetchedRef.current = true;
      }
      
    } catch (err) {
      console.error(`[useProfileAPI] ❌ Error:`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        
        if (!errorMessage.includes('autorizado')) {
          toast.error("Erro ao carregar perfil");
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, authInitialized, authLoading]);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!user?.id) return null;

    console.log(`[useProfileAPI] 📝 Updating profile via API`);
    setError(null);

    try {
      const updatedProfile = await apiClient.updateProfile(data);
      
      if (isMountedRef.current) {
        console.log(`[useProfileAPI] ✅ Profile updated successfully`);
        setProfile(updatedProfile);
        toast.success("Perfil atualizado com sucesso");
        return updatedProfile;
      }
      
    } catch (err) {
      console.error(`[useProfileAPI] ❌ Update error:`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        toast.error("Erro ao atualizar perfil");
      }
      return null;
    }
  }, [user?.id]);

  const refreshProfile = useCallback(async () => {
    console.log(`[useProfileAPI] 🔄 Manual refresh`);
    hasFetchedRef.current = false;
    await fetchProfile(true);
  }, [fetchProfile]);

  useEffect(() => {
    console.log(`[useProfileAPI] 🎯 Main effect triggered`);
    
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
