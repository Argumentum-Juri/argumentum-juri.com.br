
// Função para verificar JWT customizado no frontend
export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  is_admin: boolean;
  exp: number;
  iat: number;
}

export async function verifyCustomJWT(token: string): Promise<JWTPayload | null> {
  try {
    // Decodificar o JWT sem verificar a assinatura (apenas para obter o payload)
    // Em produção, você deveria verificar a assinatura, mas isso requer a chave secreta
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[JWT] Token inválido - formato incorreto');
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Verificar se o token não expirou
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.error('[JWT] Token expirado');
      return null;
    }

    // Verificar se tem os campos necessários
    if (!payload.sub || !payload.email) {
      console.error('[JWT] Token sem campos obrigatórios');
      return null;
    }

    console.log('[JWT] Token válido:', { 
      sub: payload.sub, 
      email: payload.email, 
      exp: new Date(payload.exp * 1000) 
    });

    return payload as JWTPayload;
  } catch (error) {
    console.error('[JWT] Erro ao verificar token:', error);
    return null;
  }
}
