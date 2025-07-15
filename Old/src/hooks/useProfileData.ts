
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { ProfileData, Profile } from '@/types/profile';

export const useProfileData = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    phone: '',
    oab_number: '',
    person_type: 'fisica',
    document: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    office_areas: '',
    delegation_areas: '',
    team_size: '',
    purchase_reason: '',
    delegation_intent: '',
    choice_reason: '',
    social_media: ''
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      // Buscar os dados do perfil do usuário
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Erro ao buscar dados do perfil:', error);
            return;
          }

          if (data) {
            setProfileData({
              name: data.name || '',
              phone: data.phone || '',
              oab_number: data.oab_number || '',
              person_type: (data.person_type as 'fisica' | 'juridica') || 'fisica',
              document: data.document || '',
              address: data.address || '',
              city: data.city || '',
              state: data.state || '',
              zip_code: data.zip_code || '',
              office_areas: data.office_areas || '',
              delegation_areas: data.delegation_areas || '',
              team_size: data.team_size || '',
              purchase_reason: data.purchase_reason || '',
              delegation_intent: data.delegation_intent || '',
              choice_reason: data.choice_reason || '',
              social_media: data.social_media || ''
            });
          }
        } catch (error) {
          console.error('Erro ao buscar perfil:', error);
        }
      };

      fetchProfile();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePersonTypeChange = (value: 'fisica' | 'juridica') => {
    setProfileData(prev => ({
      ...prev,
      person_type: value,
      document: '' // Limpar o documento ao mudar o tipo
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          phone: profileData.phone,
          oab_number: profileData.oab_number,
          person_type: profileData.person_type,
          document: profileData.document,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          zip_code: profileData.zip_code,
          office_areas: profileData.office_areas,
          delegation_areas: profileData.delegation_areas,
          team_size: profileData.team_size,
          purchase_reason: profileData.purchase_reason,
          delegation_intent: profileData.delegation_intent,
          choice_reason: profileData.choice_reason,
          social_media: profileData.social_media
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      toast.success('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast.error('Erro ao atualizar senha. Verifique se a senha atual está correta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    isSubmitting,
    profileData,
    currentPassword,
    newPassword,
    confirmPassword,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    handleInputChange,
    handleSelectChange,
    handlePersonTypeChange,
    handleUpdateProfile,
    handleUpdatePassword,
  };
};
