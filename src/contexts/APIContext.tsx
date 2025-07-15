
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface APIContextType {
  useNewPetitionsAPI: boolean;
  useNewProfileAPI: boolean;
  useNewTeamsAPI: boolean;
  useNewDocumentsAPI: boolean;
  setUseNewPetitionsAPI: (value: boolean) => void;
  setUseNewProfileAPI: (value: boolean) => void;
  setUseNewTeamsAPI: (value: boolean) => void;
  setUseNewDocumentsAPI: (value: boolean) => void;
}

const APIContext = createContext<APIContextType | undefined>(undefined);

export const useAPIContext = () => {
  const context = useContext(APIContext);
  if (context === undefined) {
    throw new Error('useAPIContext must be used within an APIProvider');
  }
  return context;
};

interface APIProviderProps {
  children: ReactNode;
}

export const APIProvider: React.FC<APIProviderProps> = ({ children }) => {
  // Definir todos os valores padrão com Nova API habilitada
  const [useNewPetitionsAPI, setUseNewPetitionsAPI] = useState(true);
  const [useNewProfileAPI, setUseNewProfileAPI] = useState(true);
  const [useNewTeamsAPI, setUseNewTeamsAPI] = useState(true);
  const [useNewDocumentsAPI, setUseNewDocumentsAPI] = useState(true);

  return (
    <APIContext.Provider
      value={{
        useNewPetitionsAPI,
        useNewProfileAPI,
        useNewTeamsAPI,
        useNewDocumentsAPI,
        setUseNewPetitionsAPI,
        setUseNewProfileAPI,
        setUseNewTeamsAPI,
        setUseNewDocumentsAPI,
      }}
    >
      {children}
    </APIContext.Provider>
  );
};
