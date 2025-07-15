
import { environment } from '@/config/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  isAdmin: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface DocumentUploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

class GoApiClient {
  private baseUrl: string;
  private anonKey: string;

  constructor() {
    this.baseUrl = 'https://mefgswdpeellvaggvttc.supabase.co/functions/v1';
    this.anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZmdzd2RwZWVsbHZhZ2d2dHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NDQ1NTAsImV4cCI6MjA2MTMyMDU1MH0.9-PrOlsvyrYr8ZUq5C72B_W9L74stkpyqwBkc5xsq8Q";
    console.log('[GoApiClient] 🚀 Inicializado com baseUrl:', this.baseUrl);
  }

  // Método para obter o token atual do localStorage
  private getCurrentToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  // Método para obter o refresh token atual do localStorage
  private getCurrentRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  // Método público para definir tokens diretamente na instância (mantido para compatibilidade)
  setTokens(token: string, refreshToken: string) {
    this.saveTokensToStorage(token, refreshToken);
    console.log('[GoApiClient] 🔑 Tokens atualizados via setTokens');
  }

  // Método para definir o token externamente (mantido para compatibilidade)
  setToken(token: string | null) {
    if (typeof window !== 'undefined' && token) {
      localStorage.setItem('auth_token', token);
      console.log('[GoApiClient] 🔑 Token definido externamente');
    }
  }

  private saveTokensToStorage(token: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('refresh_token', refreshToken);
    }
    console.log('[GoApiClient] 💾 Tokens salvos no storage');
  }

  private clearTokensFromStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
    console.log('[GoApiClient] 🗑️ Tokens removidos do storage');
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getCurrentRefreshToken();
    if (!refreshToken) {
      console.log('[GoApiClient] ❌ Sem refresh token disponível');
      return false;
    }

    try {
      console.log('[GoApiClient] 🔄 Tentando renovar token...');
      
      const response = await fetch(`${this.baseUrl}/api-auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': this.anonKey,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.error('[GoApiClient] ❌ Falha ao renovar token:', response.status);
        this.clearTokensFromStorage();
        return false;
      }

      const data = await response.json();
      
      if (data.token && data.refreshToken) {
        this.saveTokensToStorage(data.token, data.refreshToken);
        console.log('[GoApiClient] ✅ Token renovado com sucesso');
        return true;
      }

      console.error('[GoApiClient] ❌ Resposta inválida do refresh');
      this.clearTokensFromStorage();
      return false;
      
    } catch (error) {
      console.error('[GoApiClient] ❌ Erro ao renovar token:', error);
      this.clearTokensFromStorage();
      return false;
    }
  }

  // Método público para permitir acesso externo ao makeRequest
  async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    withAuth: boolean = true,
    retryOnAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.makeRequestInternal(endpoint, options, withAuth, retryOnAuth);
  }

  private async makeRequestInternal<T>(
    endpoint: string, 
    options: RequestInit = {},
    withAuth: boolean = true,
    retryOnAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    
    // Obter tokens atuais do localStorage a cada requisição
    const currentToken = this.getCurrentToken();
    const currentRefreshToken = this.getCurrentRefreshToken();
    
    console.log(`[GoApiClient] 📤 === INICIANDO REQUISIÇÃO ===`);
    console.log(`[GoApiClient] 🔗 URL Final: ${url}`);
    console.log(`[GoApiClient] 📋 Método: ${options.method || 'GET'}`);
    console.log(`[GoApiClient] 🔐 Com autenticação: ${withAuth}`);
    console.log(`[GoApiClient] 🔑 Token disponível: ${!!currentToken} (length: ${currentToken ? currentToken.length : 0})`);
    
    // Log do body se for POST/PUT/PATCH
    if (options.body && ['POST', 'PUT', 'PATCH'].includes(options.method as string)) {
      console.log(`[GoApiClient] 📦 Body sendo enviado:`, options.body);
    }
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      // Sempre incluir a apikey (anon key)
      'apikey': this.anonKey,
    };

    // Adicionar Content-Type apenas se houver body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    // Adicionar Authorization header baseado no tipo de autenticação
    if (withAuth) {
      if (currentToken) {
        // Se temos token de usuário, usar Bearer com o token
        headers['Authorization'] = `Bearer ${currentToken}`;
        console.log('[GoApiClient] 🔑 Token de usuário adicionado ao Authorization header');
      } else {
        // Se não temos token de usuário, usar Bearer com anon key como fallback
        headers['Authorization'] = `Bearer ${this.anonKey}`;
        console.log('[GoApiClient] 🔑 Anon key adicionada ao Authorization header (fallback)');
      }
    }

    // Adicionar headers customizados
    if (options.headers) {
      const customHeaders = options.headers as Record<string, string>;
      Object.assign(headers, customHeaders);
    }

    console.log('[GoApiClient] 📋 Headers finais:', { 
      ...headers, 
      Authorization: headers.Authorization ? '[REDACTED]' : undefined 
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[GoApiClient] ⏰ Timeout de 60s atingido, abortando...');
        controller.abort();
      }, 60000);

      console.log(`[GoApiClient] ⏱️ Iniciando fetch para: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
      });

      clearTimeout(timeoutId);

      console.log(`[GoApiClient] 📥 === RESPOSTA RECEBIDA ===`);
      console.log(`[GoApiClient] 📊 Status: ${response.status} ${response.statusText}`);
      console.log(`[GoApiClient] 📊 OK: ${response.ok}`);

      // Se 401 e temos refresh token, tentar renovar (apenas se withAuth=true)
      if (response.status === 401 && withAuth && currentRefreshToken && retryOnAuth) {
        console.log('[GoApiClient] 🔄 Token expirado, tentando renovar...');
        
        const refreshSuccess = await this.tryRefreshToken();
        if (refreshSuccess) {
          console.log('[GoApiClient] ✅ Token renovado, repetindo requisição...');
          return this.makeRequestInternal(endpoint, options, withAuth, false); // Não retry novamente
        }
      }

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          console.error(`[GoApiClient] ❌ Erro HTTP ${response.status}:`, errorText);
        } catch (readError) {
          console.error(`[GoApiClient] ❌ Erro ao ler resposta:`, readError);
          errorText = `HTTP ${response.status}: ${response.statusText}`;
        }
        return { error: errorText || `HTTP ${response.status}: ${response.statusText}` };
      }

      const responseText = await response.text();
      console.log(`[GoApiClient] 📄 Texto da resposta (${responseText.length} chars):`, responseText.substring(0, 500));

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
        console.log(`[GoApiClient] ✅ JSON parseado com sucesso:`, data);
      } catch (parseError) {
        console.error(`[GoApiClient] ❌ Erro ao parsear JSON:`, parseError);
        console.error(`[GoApiClient] 📄 Texto original:`, responseText);
        return { error: 'Resposta inválida do servidor' };
      }

      return { data };
    } catch (error) {
      console.error(`[GoApiClient] ❌ === ERRO NA REQUISIÇÃO ===`);
      console.error(`[GoApiClient] ❌ Tipo do erro:`, error.constructor.name);
      console.error(`[GoApiClient] ❌ Mensagem:`, error.message);
      
      if (error.name === 'AbortError') {
        const timeoutError = 'Timeout: Requisição demorou mais que 60 segundos';
        console.error(`[GoApiClient] ⏰ ${timeoutError}`);
        return { error: timeoutError };
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = 'Erro de rede: Verifique se a Edge Function está ativa';
        console.error(`[GoApiClient] 🌐 ${networkError}`);
        return { error: networkError };
      }
      
      const genericError = error instanceof Error ? error.message : 'Erro de rede desconhecido';
      return { error: genericError };
    }
  }

  async testConnection(): Promise<ApiResponse<any>> {
    console.log('[GoApiClient] 🧪 === TESTE DE CONECTIVIDADE INICIADO ===');
    console.log('[GoApiClient] 🔗 Base URL:', this.baseUrl);
    console.log('[GoApiClient] 🎯 Endpoint: api-auth/test');
    
    try {
      const result = await this.makeRequestInternal('api-auth/test', {
        method: 'GET',
      }, false); // Não usar autenticação para teste
      
      if (result.data) {
        console.log('[GoApiClient] ✅ === CONECTIVIDADE ESTABELECIDA ===');
        console.log('[GoApiClient] 📋 Dados:', result.data);
      } else {
        console.error('[GoApiClient] ❌ === FALHA NA CONECTIVIDADE ===');
        console.error('[GoApiClient] 📋 Erro:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('[GoApiClient] 🔥 === ERRO CRÍTICO ===');
      console.error('[GoApiClient] 🔥 Detalhes:', error);
      return { error: 'Erro crítico na conectividade' };
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    console.log('[GoApiClient] 🔐 Tentando login:', { email });
    
    const result = await this.makeRequestInternal<AuthResponse>('api-auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false); // Não usar autenticação para login

    if (result.data) {
      result.data.user.isAdmin = result.data.user.is_admin;
      this.saveTokensToStorage(result.data.token, result.data.refreshToken);
      console.log('[GoApiClient] ✅ Login bem-sucedido');
    } else {
      console.error('[GoApiClient] ❌ Erro no login:', result.error);
    }

    return result;
  }

  async register(email: string, password: string, fullName: string): Promise<ApiResponse<AuthResponse>> {
    console.log('[GoApiClient] 📝 Tentando registro:', { email, fullName });
    
    const result = await this.makeRequestInternal<AuthResponse>('api-auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, termsAccepted: true }),
    }, false); // Não usar autenticação para registro

    if (result.data) {
      result.data.user.isAdmin = result.data.user.is_admin;
      this.saveTokensToStorage(result.data.token, result.data.refreshToken);
      console.log('[GoApiClient] ✅ Registro bem-sucedido');
    } else {
      console.error('[GoApiClient] ❌ Erro no registro:', result.error);
    }

    return result;
  }

  async logout(): Promise<ApiResponse<void>> {
    console.log('[GoApiClient] 👋 Fazendo logout');
    
    const result = await this.makeRequestInternal<void>('api-auth/logout', {
      method: 'POST',
    }, true); // Usar autenticação para logout
    
    this.clearTokensFromStorage();
    return result;
  }

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    return this.makeRequestInternal<void>('api-auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false); // Não usar autenticação para reset de senha
  }

  // MÉTODOS QUE PRECISAM DE AUTENTICAÇÃO
  async getPetitions(params: {
    page?: number;
    limit?: number;
    status?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    sortBy?: string;
  } = {}): Promise<ApiResponse<any[]>> {
    console.log('[GoApiClient] 🎯 getPetitions called with params:', params);
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    const query = searchParams.toString();
    const endpoint = `api-petitions${query ? `?${query}` : ''}`;
    
    console.log('[GoApiClient] 🔗 Final endpoint:', endpoint);
    
    const result = await this.makeRequestInternal<any[]>(endpoint, {}, true); // COM autenticação
    
    console.log('[GoApiClient] 📥 getPetitions result:', result);
    
    return result;
  }

  async getPetitionById(id: string): Promise<ApiResponse<any>> {
    return this.makeRequestInternal(`api-petitions/${id}`, {}, true); // COM autenticação
  }

  async createPetition(data: any): Promise<ApiResponse<any>> {
    console.log('[GoApiClient] 📝 createPetition chamado com dados:', data);
    console.log('[GoApiClient] 📦 Stringificando dados para envio...');
    
    const stringifiedData = JSON.stringify(data);
    console.log('[GoApiClient] ✅ Dados stringificados:', stringifiedData);
    
    return this.makeRequestInternal('api-petitions', {
      method: 'POST',
      body: stringifiedData,
    }, true); // COM autenticação
  }

  async updatePetition(id: string, data: any): Promise<ApiResponse<any>> {
    return this.makeRequestInternal(`api-petitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true); // COM autenticação
  }

  async deletePetition(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequestInternal(`api-petitions/${id}`, {
      method: 'DELETE',
    }, true); // COM autenticação
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.makeRequestInternal('api-profile', {}, true); // COM autenticação
  }

  async updateProfile(data: any): Promise<ApiResponse<any>> {
    return this.makeRequestInternal('api-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true); // COM autenticação
  }

  async getTeams(): Promise<ApiResponse<any[]>> {
    return this.makeRequestInternal('api-teams', {}, true); // COM autenticação
  }

  async getTeamById(id: string): Promise<ApiResponse<any>> {
    return this.makeRequestInternal(`api-teams/${id}`, {}, true); // COM autenticação
  }

  async createTeam(data: any): Promise<ApiResponse<any>> {
    return this.makeRequestInternal('api-teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true); // COM autenticação
  }

  async updateTeam(id: string, data: any): Promise<ApiResponse<any>> {
    return this.makeRequestInternal(`api-teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true); // COM autenticação
  }

  async deleteTeam(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequestInternal(`api-teams/${id}`, {
      method: 'DELETE',
    }, true); // COM autenticação
  }

  // Updated uploadDocument method with retry logic for 401 errors
  async uploadDocument(file: File, fileType: 'logo' | 'letterhead' | 'template'): Promise<{ data?: any; error?: string }> {
    return this.uploadDocumentWithRetry(file, fileType, false);
  }

  private async uploadDocumentWithRetry(file: File, fileType: 'logo' | 'letterhead' | 'template', isRetry: boolean): Promise<{ data?: any; error?: string }> {
    try {
      console.log(`[GoApiClient] 📁 Fazendo upload de documento: ${file.name} (tipo: ${fileType}) ${isRetry ? '(retry)' : ''}`);
      
      // Get current token for authorization
      const currentToken = this.getCurrentToken();
      
      // Check if we have a valid token
      if (!currentToken) {
        console.error(`[GoApiClient] ❌ Token de autenticação não encontrado`);
        return { error: 'Token de autenticação não encontrado. Faça login novamente.' };
      }
      
      console.log(`[GoApiClient] 🔑 Usando token para upload (início: ${currentToken.substring(0, 20)}...)`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);
      
      const response = await fetch(`${this.baseUrl}/api-documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'apikey': this.anonKey,
          // Don't set Content-Type header - let browser set it for FormData
        },
        body: formData,
      });

      const result = await response.json();
      
      // Handle 401 errors with token refresh
      if (response.status === 401 && !isRetry) {
        console.log(`[GoApiClient] 🔄 Token expirado (401), tentando refresh...`);
        
        const refreshSuccess = await this.tryRefreshToken();
        if (refreshSuccess) {
          console.log(`[GoApiClient] ✅ Token refreshed com sucesso, tentando upload novamente...`);
          return this.uploadDocumentWithRetry(file, fileType, true);
        } else {
          console.error(`[GoApiClient] ❌ Falha no refresh do token`);
          return { error: 'Sessão expirada. Faça login novamente.' };
        }
      }
      
      if (!response.ok) {
        console.error(`[GoApiClient] ❌ Erro no upload (${response.status}):`, result);
        return { error: result.error || `HTTP ${response.status}: ${response.statusText}` };
      }

      console.log(`[GoApiClient] ✅ Upload concluído:`, result);
      
      // Ensure we return the data in the expected format
      if (result && result.data) {
        return { data: result.data };
      } else if (result && result.url) {
        // Handle case where response is directly the file info
        return { data: result };
      } else {
        console.error(`[GoApiClient] ❌ Resposta inesperada do upload:`, result);
        return { error: 'Resposta inválida do servidor' };
      }
    } catch (error) {
      console.error(`[GoApiClient] ❌ Erro no upload:`, error);
      return { error: `Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
    }
  }

  async getTeamTokenBalance(teamId: string): Promise<ApiResponse<{ tokens: number }>> {
    console.log('[GoApiClient] 🪙 Buscando saldo de tokens da equipe:', teamId);
    
    // Usar o endpoint POST get-team-token-balance que já funciona
    const result = await this.makeRequestInternal<{ tokens: number }>('get-team-token-balance', {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    }, true);
    
    console.log('[GoApiClient] 📥 getTeamTokenBalance result:', result);
    
    return result;
  }

  async getSubscription(): Promise<ApiResponse<{ subscription: any; user_id: string }>> {
    console.log('[GoApiClient] 📋 Buscando subscription do usuário');
    
    const result = await this.makeRequest<{ subscription: any; user_id: string }>('/api-auth/subscription', {
      method: 'GET',
    }, true);
    
    console.log('[GoApiClient] 📥 getSubscription result:', result);
    
    return result;
  }

  getToken(): string | null {
    return this.getCurrentToken();
  }

  clearToken(): void {
    this.clearTokensFromStorage();
  }

  get isAuthenticated(): boolean {
    return !!this.getCurrentToken();
  }

  get currentToken(): string | null {
    return this.getCurrentToken();
  }
}

export const goApiClient = new GoApiClient();
export default goApiClient;
