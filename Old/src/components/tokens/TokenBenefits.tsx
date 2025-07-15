
import React from 'react';
import { Gift } from 'lucide-react';

const TokenBenefits: React.FC = () => {
  return (
    <div className="bg-muted p-4 rounded-lg">
      <h3 className="font-semibold flex items-center">
        <Gift className="mr-2 h-5 w-5 text-argumentum-gold" />
        Benefícios dos Tokens
      </h3>
      <ul className="mt-2 space-y-1 text-sm">
        <li>• Use Tokens para solicitar petições personalizadas</li>
        <li>• Diferentes tipos de petição consomem diferentes quantidades de Tokens</li>
        <li>• Tokens não expiram após a compra</li>
        <li>• Adquira pacotes maiores para obter descontos</li>
      </ul>
    </div>
  );
};

export default TokenBenefits;
