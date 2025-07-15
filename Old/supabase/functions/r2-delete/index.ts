
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("R2 delete function started (v2 - Direct R2 Delete with CORS fix)");

// Configurações do Cloudflare R2
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID") || "";
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") || "";
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") || "";
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME") || "argumentum";

// Headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Formato da resposta
interface Response {
  success: boolean;
  error?: string;
}

// Função para assinar o request seguindo o padrão SigV4
async function signRequest(method: string, path: string): Promise<Record<string, string>> {
  try {
    // Variáveis de tempo
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);
    
    // Região e serviço
    const region = 'auto';
    const service = 's3';
    
    // Headers para o request
    const headers = {
      'host': `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD'
    };
    
    // Componentes da autenticação
    const signedHeaders = Object.keys(headers).sort().join(';').toLowerCase();
    const canonicalRequest = [
      method,
      path,
      '',
      ...Object.entries(headers).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k.toLowerCase()}:${v}`),
      '',
      signedHeaders,
      'UNSIGNED-PAYLOAD'
    ].join('\n');
    
    // Hash do request canônico
    const canonicalRequestHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(canonicalRequest)
    );
    const canonicalRequestHex = Array.from(new Uint8Array(canonicalRequestHash))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    // String para assinar
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHex}`;
    
    // Função para assinar com HMAC
    async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign']
      );
      return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
    }
    
    // Gerar a chave de assinatura
    let signingKey = await hmacSha256(
      new TextEncoder().encode(`AWS4${R2_SECRET_ACCESS_KEY}`),
      dateStamp
    );
    signingKey = await hmacSha256(signingKey, region);
    signingKey = await hmacSha256(signingKey, service);
    signingKey = await hmacSha256(signingKey, 'aws4_request');
    
    // Gerar a assinatura
    const signature = await hmacSha256(signingKey, stringToSign);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Montar o header de autenticação
    const authHeader = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;
    
    return {
      ...headers,
      'Authorization': authHeader
    };
  } catch (error) {
    console.error("Erro ao assinar requisição:", error);
    throw new Error(`Falha ao assinar requisição: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Função principal para excluir um objeto do R2
async function deleteFromR2(key: string): Promise<boolean> {
  try {
    console.log(`Tentando excluir objeto com key: ${key}`);
    
    // Verificar se as credenciais estão disponíveis
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error("Credenciais R2 não configuradas");
    }
    
    // Endpoint da API do R2
    const endpoint = `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
    
    // Assinar o request com credenciais AWS Sig v4
    const headers = await signRequest('DELETE', `/${key}`);
    
    // Fazer o request DELETE para o R2
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: headers
    });
    
    // Verificar resposta
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`Erro ao excluir: ${response.status} ${response.statusText}`, responseText);
      throw new Error(`Falha na exclusão (${response.status}): ${responseText}`);
    }
    
    console.log(`Objeto ${key} excluído com sucesso`);
    return true;
  } catch (error) {
    console.error(`Erro ao excluir objeto ${key}:`, error);
    throw error;
  }
}

// Handler principal
serve(async (req) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.error("Missing R2 configuration environment variables");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Configuração do R2 incompleta. Verifique as variáveis de ambiente no servidor."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    if (req.method === "POST") {
      console.log("Processing POST request");
      
      const body = await req.json();
      const { key } = body;

      // Validar entrada
      if (!key || typeof key !== "string") {
        console.error("Key not provided or invalid");
        return new Response(
          JSON.stringify({ success: false, error: "Chave do arquivo não fornecida ou inválida" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      try {
        console.log(`Deleting file from R2: ${key}`);
        
        // Chamar a função de exclusão
        await deleteFromR2(key);
        
        console.log("Delete from R2 completed successfully");

        // Retornar sucesso
        const response: Response = {
          success: true,
        };

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (deleteError: any) {
        console.error("R2 delete error:", deleteError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erro ao excluir do R2: ${deleteError?.message || String(deleteError)}`
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    } else {
      console.error(`Unsupported method: ${req.method}`);
      return new Response(
        JSON.stringify({ success: false, error: "Método não suportado" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 405,
        }
      );
    }
  } catch (error) {
    console.error("Error in R2 delete function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno no servidor',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
