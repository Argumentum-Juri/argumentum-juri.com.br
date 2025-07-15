
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Petition, PetitionSettings } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";

interface PetitionDetailsSidebarProps {
  petition: Petition;
  settings: PetitionSettings | null;
  isLoadingSettings: boolean;
}

const PetitionDetailsSidebar: React.FC<PetitionDetailsSidebarProps> = ({ 
  petition, 
  settings,
  isLoadingSettings
}) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'in_review': return 'bg-purple-500';
      case 'review': return 'bg-purple-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'complete': return 'bg-green-700';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Detalhes da Petição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
            <div className="mt-1">
              <Badge className={getStatusColor(petition.status)}>
                {petition.status.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Título</h3>
            <p className="mt-1">{petition.title}</p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Descrição</h3>
            <p className="mt-1 text-sm">{petition.description}</p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Área Legal</h3>
            <p className="mt-1">{petition.legal_area || 'Não especificado'}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Tipo de Petição</h3>
            <p className="mt-1">{petition.petition_type || 'Não especificado'}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Processo</h3>
            <p className="mt-1">
              {petition.has_process 
                ? `Número: ${petition.process_number}` 
                : 'Petição inicial (sem processo)'}
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Data de Criação</h3>
            <p className="mt-1">
              {new Date(petition.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Solicitante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {petition.user ? (
            <>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Nome</h3>
                <p className="mt-1">{petition.user.name || 'Não especificado'}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
                <p className="mt-1">{petition.user.email}</p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Informações do solicitante não disponíveis</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Configurações do Documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingSettings ? (
            <>
              <Skeleton className="w-full h-4 rounded" />
              <Skeleton className="w-2/3 h-4 rounded" />
              <Skeleton className="w-1/2 h-4 rounded" />
            </>
          ) : settings ? (
            <>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Cabeçalho</h3>
                <p className="mt-1">{settings.use_letterhead ? 'Habilitado' : 'Desabilitado'}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Fonte</h3>
                <p className="mt-1">{settings.font_family || 'Padrão'}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Tamanho</h3>
                <p className="mt-1">{settings.font_size || 'Padrão'}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Espaçamento</h3>
                <p className="mt-1">{settings.line_spacing || 'Padrão'}</p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Configurações padrão serão aplicadas</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PetitionDetailsSidebar;
