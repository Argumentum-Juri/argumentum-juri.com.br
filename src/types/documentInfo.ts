
export interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  success: boolean;
  error?: string;
  file?: File;  // Adicionar file opcional se for necessário
  logo?: string; // Para permitir o uso de logo em outros contextos
}
