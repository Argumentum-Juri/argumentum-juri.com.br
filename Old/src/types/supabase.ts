
import { PetitionStatus } from './enums';

// Map application status values to database status values
export const mapAppStatusToDbStatus = (status: PetitionStatus): string => {
  // Garantir que o status seja um dos valores válidos para o banco de dados
  const validStatuses = [
    PetitionStatus.PENDING,
    PetitionStatus.IN_REVIEW,
    PetitionStatus.REVIEW,
    PetitionStatus.APPROVED,
    PetitionStatus.REJECTED,
    PetitionStatus.PROCESSING,
    PetitionStatus.COMPLETE
  ];
  
  if (!validStatuses.includes(status)) {
    console.warn(`Status inválido: ${status}. Usando 'pending' como fallback.`);
    return PetitionStatus.PENDING;
  }
  
  return status;
};

// Map database status values to application status values
export const mapDbStatusToAppStatus = (dbStatus: string): PetitionStatus => {
  // Mapeamento de strings para valores de enum
  const statusMap: Record<string, PetitionStatus> = {
    'pending': PetitionStatus.PENDING,
    'in_review': PetitionStatus.IN_REVIEW,
    'review': PetitionStatus.REVIEW,
    'approved': PetitionStatus.APPROVED,
    'rejected': PetitionStatus.REJECTED,
    'processing': PetitionStatus.PROCESSING,
    'complete': PetitionStatus.COMPLETE
  };
  
  if (!dbStatus || !statusMap[dbStatus]) {
    console.warn(`Status de banco inválido: ${dbStatus}. Usando 'pending' como fallback.`);
    return PetitionStatus.PENDING;
  }
  
  return statusMap[dbStatus];
};
