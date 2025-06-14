
// src/utils/cacheUtils.ts
/**
 * Utilitário para gerenciar cache de dados na aplicação
 */

// Duração dos caches em milissegundos
export const CACHE_DURATIONS = {
  SHORT: 5 * 60 * 1000, // 5 minutos
  MEDIUM: 30 * 60 * 1000, // 30 minutos
  LONG: 60 * 60 * 1000 // 1 hora
};

/**
 * Recupera um valor do cache, se for válido (não expirado)
 * @param key Chave do cache
 * @param duration Duração máxima do cache em milissegundos
 * @returns Valor do cache ou null se não encontrado ou expirado
 */
export function getFromCache<T>(key: string, duration: number = CACHE_DURATIONS.MEDIUM): T | null {
  try {
    const cachedValue = localStorage.getItem(key);
    const cachedTimestamp = localStorage.getItem(`${key}_timestamp`);
    const now = Date.now();
    
    if (cachedValue && cachedTimestamp && (now - parseInt(cachedTimestamp)) < duration) {
      try {
        // Tentativa de parsear JSON
        return JSON.parse(cachedValue) as T;
      } catch (e) {
        // Se não for JSON, retorna como string ou outro tipo primitivo
        return cachedValue as unknown as T;
      }
    }
  } catch (error) {
    console.error(`[cacheUtils] Erro ao recuperar cache para ${key}:`, error);
  }
  return null;
}

/**
 * Salva um valor no cache com timestamp atual
 * @param key Chave do cache
 * @param value Valor a ser salvo
 * @param logMessage Mensagem de log opcional
 */
export function saveToCache(key: string, value: any, logMessage?: string): void {
  try {
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : String(value);
    localStorage.setItem(key, valueToStore);
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    if (logMessage) {
      console.log(`[cacheUtils] ${logMessage}`);
    }
  } catch (error) {
    console.error(`[cacheUtils] Erro ao salvar cache para ${key}:`, error);
  }
}

/**
 * Verifica se um usuário é proprietário de uma equipe usando cache
 * @param userId ID do usuário
 * @param teamId ID da equipe
 * @param forceRefresh Força atualização ignorando cache
 * @returns Promise com boolean indicando se é proprietário
 */
export async function checkTeamOwnership(
  userId: string | undefined, 
  teamId: string | undefined, 
  supabase: any,
  forceRefresh = false
): Promise<boolean> {
  if (!userId || !teamId) return false;
  
  // Formato de chave consistente para garantir que o cache seja usado corretamente
  const ownerStatusKey = `owner_status_${userId}_${teamId}`;
  
  // Se não forçar atualização, tenta usar cache
  if (!forceRefresh) {
    const cachedStatus = getFromCache<boolean>(ownerStatusKey, CACHE_DURATIONS.LONG);
    if (cachedStatus !== null) {
      console.log(`[checkTeamOwnership] Usando cache para verificar proprietário (${userId}, ${teamId}): ${cachedStatus}`);
      return cachedStatus;
    }
  }
  
  try {
    console.log(`[checkTeamOwnership] Verificando proprietário no banco de dados (${userId}, ${teamId})`);
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .eq('role', 'owner')
      .maybeSingle();
      
    if (error) {
      console.error(`[checkTeamOwnership] Erro ao verificar proprietário (${userId}, ${teamId}):`, error);
      return false;
    }
    
    const isOwner = !!data;
    // Armazenar o resultado diretamente como booleano para evitar conversão de string
    saveToCache(ownerStatusKey, isOwner, 
      `Status de proprietário para usuário ${userId} na equipe ${teamId}: ${isOwner}`);
    
    return isOwner;
  } catch (error) {
    console.error(`[checkTeamOwnership] Exceção ao verificar proprietário (${userId}, ${teamId}):`, error);
    return false;
  }
}

/**
 * Limpa caches relacionados a uma chave específica
 * @param keyPrefix Prefixo da chave para limpar todos os caches relacionados
 */
export function clearCachesByPrefix(keyPrefix: string): void {
  try {
    console.log(`[cacheUtils] Limpando caches com prefixo: ${keyPrefix}`);
    
    const allKeys = Object.keys(localStorage);
    const keysToRemove = allKeys.filter(key => key.startsWith(keyPrefix));
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
      console.log(`[cacheUtils] Removida chave: ${key}`);
    });
  } catch (error) {
    console.error(`[cacheUtils] Erro ao limpar caches com prefixo ${keyPrefix}:`, error);
  }
}

/**
 * Limpa todos os caches relacionados a usuários, tokens e propriedade de equipes
 */
export function clearAllUserCaches(): void {
  try {
    console.log('[cacheUtils] clearAllUserCaches: Iniciando limpeza de todos os caches de usuário');
    
    // Lista de prefixos e chaves específicas a serem limpas
    const prefixesToClear = [
      'owner_status_',
      'user_admin_status_',
      'team_tokens_',
      'team_details_',
      'auth_last_refresh_attempt'
    ];
    
    const specificKeysToRemove = [
      'user_team_id', 
      'user_team_timestamp',
      'total_investment',
      'user_subscription',
      'petition_form_cache',
      'personal_tokens'
    ];
    
    // Remover chaves específicas e seus timestamps
    specificKeysToRemove.forEach(key => {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
      console.log(`[cacheUtils] Removida chave específica: ${key}`);
    });
    
    // Buscar todas as chaves do localStorage
    const allKeys = Object.keys(localStorage);
    
    // Filtrar e remover chaves que começam com os prefixos
    prefixesToClear.forEach(prefix => {
      const keysToRemove = allKeys.filter(key => key.startsWith(prefix));
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_timestamp`);
        console.log(`[cacheUtils] Removida chave com prefixo: ${key}`);
      });
    });
    
    console.log('[cacheUtils] Limpeza de caches concluída');
  } catch (error) {
    console.error('[cacheUtils] Erro ao limpar caches:', error);
  }
}

// Função para limpar caches específicos da autenticação em casos críticos
export function clearAuthCaches(): void {
  try {
    console.log('[cacheUtils] clearAuthCaches: Limpando caches específicos de autenticação');
    
    // Limpar qualquer token quebrado no localStorage (token Supabase)
    localStorage.removeItem('sb-mefgswdpeellvaggvttc-auth-token');
    
    // Limpar tentativas de refresh
    localStorage.removeItem('auth_last_refresh_attempt');
    
    // Outras chaves relacionadas à autenticação
    localStorage.removeItem('user_admin_status');
    
    console.log('[cacheUtils] Limpeza de caches de autenticação concluída');
  } catch (error) {
    console.error('[cacheUtils] Erro ao limpar caches de autenticação:', error);
  }
}

/**
 * Função utilitária para invalidar cache específico de uma equipe
 */
export function invalidateTeamCache(teamId: string): void {
  const keysToRemove = [
    `team_tokens_${teamId}`,
    `team_tokens_timestamp_${teamId}`,
    `team_details_${teamId}`,
    `team_details_timestamp_${teamId}`
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`[cacheUtils] Cache invalidado: ${key}`);
  });
}

/**
 * Função utilitária para invalidar cache de status de proprietário
 */
export function invalidateOwnerCache(userId: string, teamId: string): void {
  const ownerKey = `owner_status_${userId}_${teamId}`;
  const timestampKey = `${ownerKey}_timestamp`;
  
  localStorage.removeItem(ownerKey);
  localStorage.removeItem(timestampKey);
  
  console.log(`[cacheUtils] Cache de proprietário invalidado para usuário ${userId} na equipe ${teamId}`);
}
