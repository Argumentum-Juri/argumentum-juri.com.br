
/**
 * Formats a date string to a localized format
 * @param dateString - ISO date string or any date string that can be parsed by Date constructor
 * @returns Formatted date string
 */
export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'Data não disponível';
  
  try {
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Data inválida recebida:', dateString);
      return 'Data inválida';
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Input:', dateString);
    return 'Data inválida';
  }
};
