
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import PersonalInfoTab from '@/components/profile/PersonalInfoTab';
import OfficeInfoTab from '@/components/profile/OfficeInfoTab';
import SecurityTab from '@/components/profile/SecurityTab';
import { useProfileData } from '@/hooks/useProfileData';
import { teamSizeOptions, purchaseReasonOptions } from '@/components/profile/ProfileConstants';

const Profile = () => {
  const { user } = useAuth();
  const {
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
  } = useProfileData();

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-semibold text-legal-text mb-6">Meu Perfil</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="office">Escritório</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <PersonalInfoTab 
              profileData={profileData}
              user={user}
              isSubmitting={isSubmitting}
              handleInputChange={handleInputChange}
              handlePersonTypeChange={handlePersonTypeChange}
              handleUpdateProfile={handleUpdateProfile}
            />
          </TabsContent>
          
          <TabsContent value="office">
            <OfficeInfoTab 
              profileData={profileData}
              isSubmitting={isSubmitting}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              handleUpdateProfile={handleUpdateProfile}
              teamSizeOptions={teamSizeOptions}
              purchaseReasonOptions={purchaseReasonOptions}
            />
          </TabsContent>
          
          <TabsContent value="security">
            <SecurityTab 
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              isSubmitting={isSubmitting}
              setCurrentPassword={setCurrentPassword}
              setNewPassword={setNewPassword}
              setConfirmPassword={setConfirmPassword}
              handleUpdatePassword={handleUpdatePassword}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
