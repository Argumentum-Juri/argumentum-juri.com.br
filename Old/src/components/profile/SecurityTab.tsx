
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import DeleteAccount from './DeleteAccount';

interface SecurityTabProps {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isSubmitting: boolean;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  handleUpdatePassword: (e: React.FormEvent) => Promise<void>;
}

const SecurityTab: React.FC<SecurityTabProps> = ({
  currentPassword,
  newPassword,
  confirmPassword,
  isSubmitting,
  setCurrentPassword,
  setNewPassword,
  setConfirmPassword,
  handleUpdatePassword,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Segurança</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <Input 
              id="currentPassword" 
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input 
              id="newPassword" 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input 
              id="confirmPassword" 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          
          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </div>
        </form>
        
        <Separator className="my-8" />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Excluir Conta</h3>
          <p className="text-sm text-muted-foreground">
            Ao excluir sua conta, todos os seus dados serão permanentemente removidos.
            Esta ação não pode ser desfeita.
          </p>
          <DeleteAccount />
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityTab;
