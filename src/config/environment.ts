
/**
 * Configurações de ambiente centralizadas
 * Remove todas as referências diretas ao Supabase do frontend
 */

interface Environment {
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  NODE_ENV: string;
}

export const environment: Environment = {
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.argumentum.com.br' 
    : 'http://localhost:8080',
  APP_NAME: 'Argumentum',
  APP_VERSION: '2.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Configurações específicas da aplicação
export const appConfig = {
  // Configurações de autenticação
  auth: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiration: 24 * 60 * 60 * 1000, // 24 horas em ms
  },
  
  // Configurações de upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
  },
  
  // Configurações de UI
  ui: {
    colors: {
      primary: '#D1A566',
      primaryHover: '#E5C07B',
      dark: '#1C140F',
    },
  },
};
