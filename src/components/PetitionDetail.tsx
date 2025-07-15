
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PetitionDetailComponent from './PetitionDetailComponent';
import PetitionDetailAPI from './PetitionDetailAPI';

const PetitionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [useNewAPI, setUseNewAPI] = useState(false);

  if (!id) {
    return <div>ID da petição não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🚀 Nova API - Detalhes da Petição
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Compare a implementação atual com a nova API segura.
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
        </CardContent>
      </Card>

      {useNewAPI ? (
        <PetitionDetailAPI petitionId={id} />
      ) : (
        <PetitionDetailComponent petitionId={id} />
      )}
    </div>
  );
};

export default PetitionDetail;
