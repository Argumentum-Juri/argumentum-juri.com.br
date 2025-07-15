
import { useAPIContext } from '@/contexts/APIContext';
import { useProfileAPI } from '@/hooks/useProfileAPI';
import { useProfileData } from '@/hooks/useProfileData';

export const useProfile = () => {
  const { useNewProfileAPI } = useAPIContext();
  
  // Hook da nova API usando Edge Functions
  const newAPIHook = useProfileAPI();
  
  // Hook legacy usando Supabase direto (baseado no useProfileData)
  const legacyHook = {
    profile: null, // será implementado se necessário
    isLoading: false,
    error: null,
    updateProfile: async () => null,
    refreshProfile: async () => {}
  };
  
  // Retornar o hook apropriado baseado no contexto
  return useNewProfileAPI ? newAPIHook : legacyHook;
};
