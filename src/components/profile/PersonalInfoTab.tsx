
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, User } from 'lucide-react';
import { ProfileData } from '@/types/profile';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface PersonalInfoTabProps {
  profileData: ProfileData;
  user: User | null;
  isSubmitting: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handlePersonTypeChange: (value: 'fisica' | 'juridica') => void;
  handleUpdateProfile: (e: React.FormEvent) => Promise<void>;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  profileData,
  user,
  isSubmitting,
  handleInputChange,
  handlePersonTypeChange,
  handleUpdateProfile,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Pessoais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6 mb-6">
          <div className="mb-4 md:mb-0">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user?.email ? user.email[0].toUpperCase() : <User />}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-medium">{profileData.name || user?.name || user?.email}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            
            <div className="mt-4">
              <Button variant="outline" size="sm">
                <UploadCloud className="h-4 w-4 mr-2" />
                Alterar Foto
              </Button>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input 
              id="name" 
              name="name"
              placeholder="Seu nome completo" 
              value={profileData.name} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={user?.email || ''} 
              disabled
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Número de Telefone</Label>
            <Input 
              id="phone" 
              name="phone"
              placeholder="(00) 00000-0000" 
              value={profileData.phone} 
              onChange={handleInputChange} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oab_number">Número da OAB</Label>
            <Input 
              id="oab_number" 
              name="oab_number"
              placeholder="Ex: 123456/UF" 
              value={profileData.oab_number} 
              onChange={handleInputChange} 
            />
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Label>Tipo de Pessoa</Label>
            <RadioGroup 
              value={profileData.person_type} 
              onValueChange={(value) => handlePersonTypeChange(value as 'fisica' | 'juridica')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fisica" id="fisica" />
                <Label htmlFor="fisica">Pessoa Física</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="juridica" id="juridica" />
                <Label htmlFor="juridica">Pessoa Jurídica</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">
              {profileData.person_type === 'fisica' ? 'CPF' : 'CNPJ'}
            </Label>
            <Input 
              id="document" 
              name="document"
              placeholder={profileData.person_type === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'} 
              value={profileData.document} 
              onChange={handleInputChange} 
            />
          </div>

          <Separator className="my-4" />
          
          <h3 className="font-medium text-lg">Endereço</h3>
          
          <div className="space-y-2">
            <Label htmlFor="address">Logradouro</Label>
            <Input 
              id="address" 
              name="address"
              placeholder="Rua, Avenida, etc." 
              value={profileData.address} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input 
                id="city" 
                name="city"
                placeholder="Sua cidade" 
                value={profileData.city} 
                onChange={handleInputChange} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input 
                id="state" 
                name="state"
                placeholder="UF" 
                value={profileData.state} 
                onChange={handleInputChange} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input 
                id="zip_code" 
                name="zip_code"
                placeholder="00000-000" 
                value={profileData.zip_code} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
          
          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoTab;
