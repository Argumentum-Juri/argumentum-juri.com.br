
import { useState, useEffect } from 'react';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { useProfile } from '@/hooks/useProfile';
import { ProfileData, Profile } from '@/types/profile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useProfileData = () => {
  const { user } = useGoAuth();
  const { profile, updateProfile } = useProfile();
  
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
    social_media: '',
    terms_accepted: false,
  });
  
  // Estados para alteração de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Atualizar dados do perfil quando carregados
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        phone: profile.phone || '',
        oab_number: profile.oab_number || '',
        person_type: profile.person_type || 'fisica',
        document: profile.document || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        office_areas: profile.office_areas || '',
        delegation_areas: profile.delegation_areas || '',
        team_size: profile.team_size || '',
        purchase_reason: profile.purchase_reason || '',
        delegation_intent: profile.delegation_intent || '',
        choice_reason: profile.choice_reason || '',
        social_media: profile.social_media || '',
        terms_accepted: profile.terms_accepted || false,
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePersonTypeChange = (value: 'fisica' | 'juridica') => {
    setProfileData(prev => ({
      ...prev,
      person_type: value
    }));
  };

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.id) return;
    
    setIsSubmitting(true);
    try {
      await updateProfile(profileData);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos de senha');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('A confirmação da senha não confere');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      toast.error(`Erro ao atualizar senha: ${error.message}`);
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
