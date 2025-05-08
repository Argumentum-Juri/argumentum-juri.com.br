
import React from 'react';
import { Feather } from 'lucide-react';

const PetitionListHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-8">
      <div className="flex items-center mb-4 md:mb-0">
        <Feather className="h-7 w-7 text-argumentum-gold mr-3 animate-feather-float" />
        <div>
          <h2 className="text-2xl font-serif text-argumentum-gold">Suas Petições</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie suas petições e acompanhe o status de cada uma.
          </p>
        </div>
      </div>
      <p className="text-sm italic text-argumentum-gold">
        "O êxito começa com um bom argumento"
      </p>
    </div>
  );
};

export default PetitionListHeader;
