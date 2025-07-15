
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProfileData } from '@/types/profile';

interface OfficeInfoTabProps {
  profileData: ProfileData;
  isSubmitting: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleUpdateProfile: (e: React.FormEvent) => Promise<void>;
  teamSizeOptions: string[];
  purchaseReasonOptions: string[];
}

const OfficeInfoTab: React.FC<OfficeInfoTabProps> = ({
  profileData,
  isSubmitting,
  handleInputChange,
  handleSelectChange,
  handleUpdateProfile,
  teamSizeOptions,
  purchaseReasonOptions,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Escritório</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="office_areas">
              1. Quais as áreas de atuação do seu escritório?
            </Label>
            <p className="text-xs text-muted-foreground">Especifique as áreas jurídicas de atuação do seu escritório</p>
            <Input 
              id="office_areas" 
              name="office_areas"
              placeholder="Ex: Direito Civil, Direito Trabalhista, Direito Tributário" 
              value={profileData.office_areas} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delegation_areas">
              2. Quais áreas você pretende delegar para o Argumentum?
            </Label>
            <p className="text-xs text-muted-foreground">Especifique as áreas que deseja terceirizar para nossa plataforma</p>
            <Input 
              id="delegation_areas" 
              name="delegation_areas"
              placeholder="Ex: Direito Civil, Direito do Consumidor" 
              value={profileData.delegation_areas} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="team_size">
              3. Quantos profissionais atuam em seu escritório?
            </Label>
            <p className="text-xs text-muted-foreground">Selecione o tamanho da equipe jurídica</p>
            <Select 
              value={profileData.team_size} 
              onValueChange={(value) => handleSelectChange('team_size', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tamanho da equipe" />
              </SelectTrigger>
              <SelectContent>
                {teamSizeOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purchase_reason">
              4. Qual foi o principal motivo para utilizar nossos serviços?
            </Label>
            <p className="text-xs text-muted-foreground">Selecione o motivo principal para a contratação</p>
            <Select 
              value={profileData.purchase_reason} 
              onValueChange={(value) => handleSelectChange('purchase_reason', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {purchaseReasonOptions.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delegation_intent">
              5. Você pretende delegar todas as suas petições para nossa plataforma?
            </Label>
            <p className="text-xs text-muted-foreground">Informe sua intenção quanto ao volume de trabalho a ser delegado</p>
            <Input 
              id="delegation_intent" 
              name="delegation_intent"
              placeholder="Ex: Apenas petições de maior complexidade" 
              value={profileData.delegation_intent} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="choice_reason">
              6. Por que você escolheu nossa plataforma?
            </Label>
            <p className="text-xs text-muted-foreground">Descreva os fatores que influenciaram sua decisão pela contratação</p>
            <Textarea 
              id="choice_reason" 
              name="choice_reason"
              placeholder="Ex: Qualidade do serviço, otimização do tempo para atendimento aos clientes, etc." 
              value={profileData.choice_reason} 
              onChange={handleInputChange} 
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="social_media">
              7. Redes sociais do escritório
            </Label>
            <p className="text-xs text-muted-foreground">Ex: LinkedIn, Instagram profissional</p>
            <Input 
              id="social_media" 
              name="social_media"
              placeholder="linkedin.com/company/escritorio-juridico" 
              value={profileData.social_media} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Informações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default OfficeInfoTab;
