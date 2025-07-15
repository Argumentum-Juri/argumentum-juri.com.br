
import React, { useState } from 'react';
import { adminService } from '@/services/adminService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const CreateAdminForm = ({ onAdminCreated }: { onAdminCreated: () => void }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);
    
    try {
      const result = await adminService.createAdminUser(email, password, name);
      
      if (result.success) {
        toast({
          title: "Administrador criado",
          description: "A conta de administrador foi criada com sucesso."
        });
        setName('');
        setEmail('');
        setPassword('');
        onAdminCreated();
      } else {
        setError(result.error?.message || 'Erro ao criar administrador');
      }
    } catch (err: any) {
      console.error('Erro ao criar administrador:', err);
      setError(err.message || 'Erro ao criar o usuário administrador');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Administrador</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="admin-name">Nome</Label>
            <Input 
              id="admin-name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input 
              id="admin-email" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Senha</Label>
            <Input 
              id="admin-password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? 'Criando...' : 'Criar Administrador'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateAdminForm;
