
import { useState, useEffect } from 'react';
import { QuestionOption } from '@/types/petition-form';

// API para buscar as cidades por estado (usando IBGE API)
const fetchCitiesByState = async (uf: string): Promise<QuestionOption[]> => {
  try {
    if (!uf) return [];
    
    // API do IBGE que fornece todas as cidades do Brasil por estado
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
    
    if (!response.ok) {
      throw new Error('Falha ao buscar cidades');
    }
    
    const data = await response.json();
    
    // Formatar os dados no formato esperado pelo combobox
    return data.map((city: { id: number, nome: string }) => ({
      value: city.nome.toLowerCase().replace(' ', '-'),
      label: city.nome
    }));
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    return [];
  }
};

export const useCitiesByState = (uf: string | undefined) => {
  const [cities, setCities] = useState<QuestionOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCities = async () => {
      if (!uf) {
        setCities([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const citiesList = await fetchCitiesByState(uf);
        setCities(citiesList);
      } catch (err) {
        setError('Erro ao carregar cidades');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getCities();
  }, [uf]);

  return { cities, loading, error };
};
