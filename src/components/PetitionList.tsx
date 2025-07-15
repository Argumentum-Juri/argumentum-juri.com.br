
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PetitionListComponent from './PetitionListComponent';
import PetitionListAPI from './PetitionListAPI';

const PetitionList = () => {
  const [useNewAPI, setUseNewAPI] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🚀 Nova API - Migração em Andamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Estamos implementando uma nova camada de API mais segura. 
            Use o switch abaixo para alternar entre a implementação atual e a nova API.
          </p>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="api-mode"
              checked={useNewAPI}
              onCheckedChange={setUseNewAPI}
            />
            <Label htmlFor="api-mode" className="text-sm font-medium">
              {useNewAPI ? 'Nova API (Segura)' : 'API Atual (Legacy)'}
            </Label>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <strong>Nova API:</strong> Requisições seguras via Edge Functions, sem exposição do Supabase<br/>
            <strong>API Atual:</strong> Requisições diretas ao Supabase (para comparação)
          </div>
        </CardContent>
      </Card>

      {useNewAPI ? <PetitionListAPI /> : <PetitionListComponent />}
    </div>
  );
};

export default PetitionList;
