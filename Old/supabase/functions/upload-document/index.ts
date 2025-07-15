import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Content-Type, Authorization',
};

// File validation constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif'
];

function sanitizeFilenameForStorage(filename: string): string {
  let sanitized = filename.replace(/[\s()\[\]{}'"\\\/+?&=#%]/g, '_');
  sanitized = sanitized.replace(/_{2,}/g, '_');
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  return sanitized || 'arquivo_sanitizado';
}

// Parse FormData (preserva dados binários)
async function parseFormData(request: Request): Promise<{ petitionId: string; file: File }> {
  console.log('[parseFormData] Iniciando parsing com FormData API nativa');
  
  try {
    const formData = await request.formData();
    
    const petitionId = formData.get('petitionId') as string;
    const file = formData.get('file') as File;
    
    console.log('[parseFormData] Dados extraídos:', {
      petitionId,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    });
    
    if (!petitionId || !file) {
      throw new Error('Missing petitionId or file in FormData');
    }
    
    return { petitionId, file };
  } catch (error) {
    console.error('[parseFormData] Erro ao fazer parsing:', error);
    throw new Error(`Erro ao processar FormData: ${error.message}`);
  }
}

// AWS V4 Signature helpers
async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

async function sha256(data: string | Uint8Array): Promise<string> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<Uint8Array> {
  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + key), dateStamp);
  const kRegion = await hmacSha256(kDate, regionName);
  const kService = await hmacSha256(kRegion, serviceName);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  return kSigning;
}

// Upload direto para R2 com autenticação AWS V4
async function uploadToR2Direct(
  key: string, 
  fileBuffer: Uint8Array, 
  contentType: string
): Promise<void> {
  console.log('[uploadToR2Direct] Iniciando upload direto com AWS V4');
  
  const accountId = Deno.env.get('R2_ACCOUNT_ID');
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
  const bucketName = Deno.env.get('R2_BUCKET_NAME') ?? 'argumentum';
  
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Credenciais R2 não configuradas completamente');
  }
  
  const region = 'auto';
  const service = 's3';
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const url = `https://${host}/${bucketName}/${key}`;
  
  console.log('[uploadToR2Direct] URL de upload:', url);
  console.log('[uploadToR2Direct] Host:', host);
  console.log('[uploadToR2Direct] Bucket:', bucketName);
  console.log('[uploadToR2Direct] Key:', key);
  
  // Data e hora atual (UTC)
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substr(0, 8);
  
  console.log('[uploadToR2Direct] AMZ Date:', amzDate);
  console.log('[uploadToR2Direct] Date Stamp:', dateStamp);
  
  // Calcular SHA256 real do conteúdo
  const payloadHash = await sha256(fileBuffer);
  console.log('[uploadToR2Direct] Payload SHA256:', payloadHash);
  
  // Criar headers canônicos (ordenados alfabeticamente)
  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`
  ].join('\n') + '\n';
  
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  
  // Criar requisição canônica
  const canonicalRequest = [
    'PUT',
    `/${bucketName}/${key}`,
    '', // query string (vazio)
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  console.log('[uploadToR2Direct] Canonical Request:', canonicalRequest);
  
  // String para assinatura
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    await sha256(canonicalRequest)
  ].join('\n');
  
  console.log('[uploadToR2Direct] String to Sign:', stringToSign);
  
  // Criar assinatura
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = Array.from(await hmacSha256(signingKey, stringToSign))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('[uploadToR2Direct] Signature:', signature);
  
  // Header de autorização
  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  console.log('[uploadToR2Direct] Authorization Header:', authorizationHeader);
  
  const headers = {
    'Host': host,
    'X-Amz-Date': amzDate,
    'X-Amz-Content-Sha256': payloadHash,
    'Authorization': authorizationHeader,
    'Content-Type': contentType,
    'Content-Length': fileBuffer.length.toString()
  };
  
  console.log('[uploadToR2Direct] Request Headers:', headers);
  
  // Fazer upload
  const uploadResponse = await fetch(url, {
    method: 'PUT',
    body: fileBuffer,
    headers
  });
  
  console.log('[uploadToR2Direct] Response Status:', uploadResponse.status);
  console.log('[uploadToR2Direct] Response Headers:', Object.fromEntries(uploadResponse.headers.entries()));
  
  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('[uploadToR2Direct] Erro do R2:', errorText);
    throw new Error(`Upload R2 falhou: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
  }
  
  console.log('[uploadToR2Direct] Upload direto para R2 concluído com sucesso');
}

// Fallback para Supabase Storage
async function uploadToSupabaseStorage(
  key: string,
  fileBuffer: Uint8Array,
  contentType: string,
  petitionId: string
): Promise<string> {
  console.log('[uploadToSupabaseStorage] Iniciando fallback para Supabase Storage');
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  const storagePath = `petition-files/${petitionId}/documents/${Date.now()}-${key.split('/').pop()}`;
  
  const { data, error } = await supabase.storage
    .from('petition-assets')
    .upload(storagePath, fileBuffer, {
      contentType,
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw new Error(`Erro no Supabase Storage: ${error.message}`);
  }
  
  const { data: urlData } = supabase.storage
    .from('petition-assets')
    .getPublicUrl(data.path);
  
  console.log('[uploadToSupabaseStorage] Upload para Supabase Storage concluído');
  return urlData.publicUrl;
}

export default {
  async fetch(req: Request, env: any, ctx: any) {
    console.log("[upload-document] === INÍCIO DA REQUISIÇÃO ===");
    console.log("[upload-document] Method:", req.method);
    console.log("[upload-document] URL:", req.url);
    console.log("[upload-document] Headers:", Object.fromEntries(req.headers.entries()));
    console.log("[upload-document] Env disponível:", env ? Object.keys(env) : 'env is undefined');
    console.log("[upload-document] R2 Binding disponível:", env && env.ARGUMENTUM ? 'SIM' : 'NÃO');
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log("[upload-document] Processando requisição OPTIONS (CORS preflight)");
      return new Response(null, { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (req.method !== 'POST') {
      console.log("[upload-document] Método não permitido:", req.method);
      return new Response(JSON.stringify({
        success: false,
        error: 'Método não permitido. Use POST.'
      }), { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      console.log("[upload-document] === PROCESSANDO UPLOAD ===");
      
      // Initialize Supabase client
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      console.log("[upload-document] Supabase client inicializado");

      // Parse FormData usando API nativa (preserva dados binários)
      console.log("[upload-document] Iniciando parsing do FormData...");
      const { petitionId, file } = await parseFormData(req);
      
      console.log(`[upload-document] Arquivo processado:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        petitionId
      });

      // Validate file
      if (file.size > MAX_FILE_SIZE) {
        console.log(`[upload-document] Arquivo muito grande: ${file.size} bytes`);
        return new Response(JSON.stringify({
          success: false,
          error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        console.log(`[upload-document] Tipo de arquivo não permitido: ${file.type}`);
        return new Response(JSON.stringify({
          success: false,
          error: 'Tipo de arquivo não permitido. Tipos aceitos: PDF, Word, TXT, Imagens'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate key for R2
      const timestamp = Date.now();
      const sanitized = sanitizeFilenameForStorage(file.name);
      const key = `petition-files/${petitionId}/documents/${timestamp}-${sanitized}`;
      
      console.log(`[upload-document] Chave gerada para R2: ${key}`);

      // Get file buffer para upload
      const fileBuffer = new Uint8Array(await file.arrayBuffer());
      console.log(`[upload-document] Buffer do arquivo preparado: ${fileBuffer.length} bytes`);

      // Estratégia multi-level de upload
      let uploadSuccess = false;
      let publicUrl = '';
      let storageProvider = 'cloudflare';
      
      // Verificar credenciais R2 primeiro
      const hasR2Credentials = Deno.env.get('R2_ACCOUNT_ID') && 
                              Deno.env.get('R2_ACCESS_KEY_ID') && 
                              Deno.env.get('R2_SECRET_ACCESS_KEY');
      
      console.log(`[upload-document] === INICIANDO ESTRATÉGIA DE UPLOAD ===`);
      console.log(`[upload-document] R2 credentials available: ${hasR2Credentials ? 'YES' : 'NO'}`);
      console.log(`[upload-document] R2 binding available: ${env && env.ARGUMENTUM ? 'YES' : 'NO'}`);
      console.log(`[upload-document] R2_PUBLIC_URL: ${Deno.env.get('R2_PUBLIC_URL') || 'NOT SET'}`);
      
      // TENTATIVA 1: R2 Binding (se disponível)
      if (env && env.ARGUMENTUM) {
        try {
          console.log('[upload-document] === TENTATIVA 1: R2 BINDING ===');
          console.log(`[upload-document] Fazendo upload da chave: ${key}`);
          console.log(`[upload-document] Tamanho do buffer: ${fileBuffer.length} bytes`);
          console.log(`[upload-document] Content-Type: ${file.type}`);
          
          await env.ARGUMENTUM.put(key, fileBuffer, {
            httpMetadata: { contentType: file.type }
          });
          
          const endpoint = Deno.env.get('R2_PUBLIC_URL');
          console.log(`[upload-document] R2_PUBLIC_URL obtido: ${endpoint}`);
          
          if (endpoint) {
            publicUrl = `${endpoint}/${key}`;
            uploadSuccess = true;
            storageProvider = 'cloudflare';
            console.log(`[upload-document] ✅ Upload via R2 binding bem-sucedido! URL: ${publicUrl}`);
            console.log(`[upload-document] 🎯 FLUXO CONCLUÍDO - Método: R2 Binding, Status: SUCCESS`);
          } else {
            console.error('[upload-document] ❌ R2_PUBLIC_URL não configurado');
            throw new Error('R2_PUBLIC_URL não configurado');
          }
        } catch (bindingError) {
          console.error('[upload-document] ❌ Erro no R2 binding:', bindingError);
          console.error('[upload-document] Stack trace do binding:', bindingError.stack);
          uploadSuccess = false;
        }
      } else {
        console.log('[upload-document] R2 binding não disponível - env ou ARGUMENTUM não encontrados');
      }
      
      // TENTATIVA 2: R2 Direto com AWS V4 (apenas se primeira tentativa falhou)
      if (!uploadSuccess && hasR2Credentials) {
        try {
          console.log('[upload-document] === TENTATIVA 2: R2 DIRETO ===');
          await uploadToR2Direct(key, fileBuffer, file.type);
          const endpoint = Deno.env.get('R2_PUBLIC_URL');
          if (endpoint) {
            publicUrl = `${endpoint}/${key}`;
            uploadSuccess = true;
            storageProvider = 'cloudflare';
            console.log('[upload-document] ✅ Upload R2 direto bem-sucedido! URL: ${publicUrl}');
            console.log('[upload-document] 🎯 FLUXO CONCLUÍDO - Método: R2 Direto, Status: SUCCESS');
          } else {
            console.error('[upload-document] ❌ R2_PUBLIC_URL não configurado para método direto');
            throw new Error('R2_PUBLIC_URL não configurado');
          }
        } catch (r2Error) {
          console.error('[upload-document] ❌ Erro no R2 direto:', r2Error);
          uploadSuccess = false;
        }
      } else if (!uploadSuccess) {
        console.log('[upload-document] Pulando R2 direto - credenciais não disponíveis ou já teve sucesso');
      }
      
      // TENTATIVA 3: Supabase Storage (apenas se todas as tentativas R2 falharam)
      if (!uploadSuccess) {
        try {
          console.log('[upload-document] === TENTATIVA 3: SUPABASE STORAGE (FALLBACK) ===');
          console.log('[upload-document] ⚠️  Todas as tentativas R2 falharam, usando fallback Supabase');
          publicUrl = await uploadToSupabaseStorage(key, fileBuffer, file.type, petitionId);
          storageProvider = 'supabase';
          uploadSuccess = true;
          console.log('[upload-document] ✅ Upload Supabase Storage bem-sucedido! URL: ${publicUrl}');
          console.log('[upload-document] 🎯 FLUXO CONCLUÍDO - Método: Supabase Fallback, Status: SUCCESS');
        } catch (supabaseError) {
          console.error('[upload-document] ❌ Erro no Supabase Storage:', supabaseError);
          uploadSuccess = false;
          throw new Error(`Falha em todos os métodos de upload: ${supabaseError.message}`);
        }
      } else {
        console.log('[upload-document] ✅ Upload já realizado com sucesso via R2, pulando Supabase Storage');
      }

      // Verificação final
      if (!uploadSuccess || !publicUrl) {
        console.error('[upload-document] ❌ FALHA CRÍTICA: uploadSuccess:', uploadSuccess, 'publicUrl:', publicUrl);
        throw new Error('Nenhum método de upload funcionou ou URL não foi gerada');
      }
      
      console.log(`[upload-document] 🎉 SUCESSO FINAL: Método=${storageProvider}, URL=${publicUrl}`);

      console.log('[upload-document] === SALVANDO METADADOS NO DB ===');
      console.log(`[upload-document] URL pública gerada: ${publicUrl}`);
      
      // Save to database
      const { data: docData, error: docError } = await supabase
        .from('petition_documents')
        .insert([{
          petition_id: petitionId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: key,
          file_url: publicUrl,
          storage_path: key,
          storage_provider: storageProvider,
          r2_key: storageProvider === 'cloudflare' ? key : null
        }])
        .select()
        .single();

      if (docError) {
        console.error('[upload-document] ❌ Erro ao salvar metadados no DB:', docError);
        
        // Cleanup: Try to delete from R2
        try {
          console.log('[upload-document] Tentando limpar arquivo do R2...');
          if (env && env.ARGUMENTUM) {
            await env.ARGUMENTUM.delete(key);
            console.log('[upload-document] Arquivo removido do R2 via binding');
          } else {
            console.log('[upload-document] Cleanup via HTTP não implementado (seria necessário signed URL DELETE)');
          }
        } catch (cleanupError) {
          console.error('[upload-document] Falha ao remover do R2 após erro DB:', cleanupError);
        }
        
        throw new Error(`Erro ao salvar no banco de dados: ${docError.message}`);
      }

      console.log(`[upload-document] ✅ Documento salvo com sucesso no DB, ID: ${docData.id}`);
      console.log("[upload-document] === SUCESSO COMPLETO ===");

      return new Response(JSON.stringify({
        success: true,
        id: docData.id,
        file_name: docData.file_name,
        file_type: docData.file_type,
        petition_id: docData.petition_id,
        file_url: publicUrl
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      console.error('[upload-document] ❌ ERRO GERAL:', error);
      console.error('[upload-document] Stack trace:', error.stack);
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido ao fazer upload do documento'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};