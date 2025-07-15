
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface AverageDeliveryCardProps {
  days: number;
}

const AverageDeliveryCard: React.FC<AverageDeliveryCardProps> = ({ days }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tempo Médio de Entrega</CardTitle>
        <CardDescription>Da solicitação até a primeira revisão encaminhada pelo administrador</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center pt-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-argumentum-gold">{days}</div>
          <div className="text-sm text-muted-foreground mt-1">dias</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AverageDeliveryCard;
