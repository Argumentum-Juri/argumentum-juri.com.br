
import { supabase } from '@/integrations/supabase/client';
import { Petition, PetitionDetail } from '@/types';
import { getGoAuthToken } from '@/contexts/GoAuthContext';

const API_BASE_URL = 'https://mefgswdpeellvaggvttc.supabase.co/functions/v1';

class ApiClient {
  private async getAuthHeaders(useGoAuth = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (useGoAuth) {
      const jwt = getGoAuthToken();
      if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      }
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    useGoAuth = false
  ): Promise<T> {
    const headers = await this.getAuthHeaders(useGoAuth);
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    console.log(`[ApiClient] → ${config.method || 'GET'} ${endpoint} (Auth: ${useGoAuth ? 'Go' : 'Supabase'})`);
    
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `HTTP ${response.status}`);
      console.error(`[ApiClient] ← ${response.status}`, errorData);
      throw error;
    }

    const data = await response.json();
    console.log(`[ApiClient] ← ${response.status} Success`);
    return data as T;
  }

  // Petitions API - usando Go Auth
  async getPetitions(params: {
    page?: number;
    limit?: number;
    status?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}): Promise<{ data: Petition[]; total: number; page: number; limit: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    const query = searchParams.toString();
    return this.request(`api-petitions${query ? `?${query}` : ''}`, {}, true);
  }

  async getPetitionById(id: string): Promise<PetitionDetail> {
    return this.request(`api-petitions/${id}`, {}, true);
  }

  async createPetition(data: any): Promise<Petition> {
    return this.request('api-petitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async updatePetition(id: string, data: any): Promise<Petition> {
    return this.request(`api-petitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  async deletePetition(id: string): Promise<{ success: boolean }> {
    return this.request(`api-petitions/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // Profile API - usando Supabase Auth
  async getProfile(): Promise<any> {
    return this.request('api-profile', {}, false);
  }

  async updateProfile(data: any): Promise<any> {
    return this.request('api-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, false);
  }

  // Teams API - usando Supabase Auth
  async getTeams(): Promise<any[]> {
    return this.request('api-teams', {}, false);
  }

  async getTeamById(id: string): Promise<any> {
    return this.request(`api-teams/${id}`, {}, false);
  }

  async createTeam(data: any): Promise<any> {
    return this.request('api-teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
  }

  async updateTeam(id: string, data: any): Promise<any> {
    return this.request(`api-teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, false);
  }

  async deleteTeam(id: string): Promise<{ success: boolean }> {
    return this.request(`api-teams/${id}`, {
      method: 'DELETE',
    }, false);
  }

  // Documents API - usando Supabase Auth
  async getDocuments(): Promise<any[]> {
    return this.request('api-documents', {}, false);
  }

  async getPetitionDocuments(petitionId: string): Promise<any[]> {
    return this.request(`api-documents?petition_id=${petitionId}`, {}, false);
  }

  async getDocumentById(id: string): Promise<any> {
    return this.request(`api-documents/${id}`, {}, false);
  }

  async createDocument(data: any): Promise<any> {
    return this.request('api-documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
  }

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    return this.request(`api-documents/${id}`, {
      method: 'DELETE',
    }, false);
  }
}

export const apiClient = new ApiClient();
