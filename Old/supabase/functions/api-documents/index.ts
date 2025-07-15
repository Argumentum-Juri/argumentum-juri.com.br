import { authenticateRequest, corsHeaders, createErrorResponse, createSuccessResponse, supabaseAdmin } from '../_shared/auth.ts';

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for settings files

// Cloudflare R2 upload helpers
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
  
  // Data e hora atual (UTC)
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substr(0, 8);
  
  // Calcular SHA256 real do conteúdo
  const payloadHash = await sha256(fileBuffer);
  
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
  
  // String para assinatura
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    await sha256(canonicalRequest)
  ].join('\n');
  
  // Criar assinatura
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = Array.from(await hmacSha256(signingKey, stringToSign))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Header de autorização
  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  const headers = {
    'Host': host,
    'X-Amz-Date': amzDate,
    'X-Amz-Content-Sha256': payloadHash,
    'Authorization': authorizationHeader,
    'Content-Type': contentType,
    'Content-Length': fileBuffer.length.toString()
  };
  
  // Fazer upload
  const uploadResponse = await fetch(url, {
    method: 'PUT',
    body: fileBuffer,
    headers
  });
  
  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('[uploadToR2Direct] Erro do R2:', errorText);
    throw new Error(`Upload R2 falhou: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
  }
  
  console.log('[uploadToR2Direct] Upload direto para R2 concluído com sucesso');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[api-documents] 🚀 Request received: ${req.method} - ${req.url}`);
    
    const auth = await authenticateRequest(req);
    if (!auth) {
      console.log(`[api-documents] ❌ Authentication failed`);
      return createErrorResponse('Não autorizado', 401);
    }

    console.log(`[api-documents] ✅ Authentication successful - User: ${auth.userId}, Admin: ${auth.isAdmin}`);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const documentId = pathParts[pathParts.length - 1];

    // Handle upload route specifically
    if (pathParts.includes('upload') && req.method === 'POST') {
      console.log(`[api-documents] 📤 Processing upload request`);
      return await handleFileUpload(req, auth);
    }

    switch (req.method) {
      case 'GET':
        if (documentId && documentId !== 'api-documents') {
          return await getDocumentById(documentId, auth);
        } else {
          const petitionId = url.searchParams.get('petition_id');
          if (petitionId) {
            return await getPetitionDocuments(petitionId, auth);
          }
          return await getUserDocuments(auth);
        }
      
      case 'POST':
        return await createDocument(req, auth);
      
      case 'DELETE':
        if (!documentId || documentId === 'api-documents') {
          return createErrorResponse('ID do documento é obrigatório');
        }
        return await deleteDocument(documentId, auth);
      
      default:
        return createErrorResponse('Método não permitido', 405);
    }
  } catch (error) {
    console.error('Erro na API de documentos:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
});

async function ensureBucketConfiguration() {
  try {
    console.log('🔧 [bucket] Verificando configuração do bucket petition-assets...');
    
    // Primeiro tenta obter informações do bucket
    const { data: bucketInfo, error: getBucketError } = await supabaseAdmin.storage
      .getBucket('petition-assets');
    
    if (getBucketError && getBucketError.message.includes('Bucket not found')) {
      console.log('🪣 [bucket] Bucket não existe, criando...');
      
      // Cria o bucket com configurações adequadas
      const { data: createData, error: createError } = await supabaseAdmin.storage
        .createBucket('petition-assets', {
          public: true,
          allowedMimeTypes: [
            'image/png',
            'image/jpeg', 
            'image/jpg',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ],
          fileSizeLimit: 10485760 // 10MB
        });
      
      if (createError) {
        console.error('❌ [bucket] Erro ao criar bucket:', createError);
        return false;
      }
      
      console.log('✅ [bucket] Bucket criado com sucesso:', createData);
      return true;
    }
    
    if (getBucketError) {
      console.error('❌ [bucket] Erro ao verificar bucket:', getBucketError);
      return false;
    }
    
    // Se o bucket existe, atualiza as configurações usando camelCase
    console.log('🔄 [bucket] Atualizando configurações do bucket existente...');
    
    const { data: updateData, error: updateError } = await supabaseAdmin.storage
      .updateBucket('petition-assets', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'image/png',
          'image/jpeg',
          'image/jpg', 
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });
    
    if (updateError) {
      console.error('❌ [bucket] Erro ao atualizar bucket:', updateError);
      return false;
    }
    
    console.log('✅ [bucket] Bucket atualizado com sucesso:', updateData);
    
    // Confirma as configurações atuais do bucket
    const { data: verifyBucket, error: verifyError } = await supabaseAdmin.storage
      .getBucket('petition-assets');
    
    if (!verifyError && verifyBucket) {
      console.log('📋 [bucket] Configurações atuais do bucket:', verifyBucket);
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 [bucket] Erro crítico na configuração do bucket:', error);
    return false;
  }
}

async function handleFileUpload(req: Request, auth: any) {
  try {
    console.log(`🚀 [upload] Iniciando processo de upload para usuário: ${auth.userId}`);
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string || 'logo';
    
    console.log('📋 [upload] === DADOS RECEBIDOS ===');
    console.log(`📋 [upload] fileType recebido: "${fileType}"`);
    console.log(`📋 [upload] arquivo recebido: ${file ? file.name : 'null'}`);
    console.log(`📋 [upload] MIME type do arquivo: "${file?.type}"`);
    console.log(`📋 [upload] tamanho do arquivo: ${file?.size} bytes`);
    console.log(`📋 [upload] usuário: ${auth.userId} (admin: ${auth.isAdmin})`);

    if (!file) {
      console.error('❌ [upload] Nenhum arquivo fornecido no FormData');
      return createErrorResponse('Nenhum arquivo fornecido', 400);
    }

    // Garantir que o bucket está configurado corretamente antes do upload
    const bucketConfigured = await ensureBucketConfiguration();
    if (!bucketConfigured) {
      console.error('❌ [upload] Falha na configuração do bucket');
      return createErrorResponse('Erro na configuração do storage', 500);
    }

    // Define allowed file types based on fileType with explicit validation
    let allowedTypes: string[] = [];
    let maxSize = 5 * 1024 * 1024; // 5MB default
    let folderPath = '';
    let fileTypeLabel = '';
    let allowedExtensions = '';

    console.log(`🔍 [upload] Determinando tipos permitidos para fileType: "${fileType}"`);

    if (fileType === 'logo') {
      allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      folderPath = 'logos';
      fileTypeLabel = 'imagem';
      allowedExtensions = 'PNG, JPG, JPEG, GIF, WEBP';
      console.log('📝 [upload] Configurado para LOGO - apenas imagens');
    } else if (fileType === 'letterhead') {
      // CRITICAL: Allow PDFs, DOCs AND images for letterhead
      allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/webp'
      ];
      folderPath = 'letterheads';
      maxSize = 10 * 1024 * 1024; // 10MB for documents
      fileTypeLabel = 'documento ou imagem';
      allowedExtensions = 'PDF, DOC, DOCX ou imagens (PNG, JPG, GIF, WEBP)';
      console.log('📝 [upload] Configurado para LETTERHEAD - PDFs, DOCs e imagens permitidos');
    } else if (fileType === 'template') {
      // Allow documents for template
      allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      folderPath = 'templates';
      maxSize = 10 * 1024 * 1024; // 10MB for documents
      fileTypeLabel = 'documento';
      allowedExtensions = 'PDF, DOC, DOCX';
      console.log('📝 [upload] Configurado para TEMPLATE - apenas documentos');
    } else {
      console.error(`❌ [upload] FileType desconhecido: "${fileType}"`);
      return createErrorResponse(`Tipo de upload "${fileType}" não reconhecido`, 400);
    }

    console.log(`📋 [upload] === VALIDAÇÃO DE TIPOS ===`);
    console.log(`📋 [upload] fileType: "${fileType}"`);
    console.log(`📋 [upload] file.type: "${file.type}"`);
    console.log(`📋 [upload] allowedTypes: ${JSON.stringify(allowedTypes)}`);
    console.log(`📋 [upload] file.type está no array? ${allowedTypes.includes(file.type)}`);

    // Validate file type with detailed logging
    if (!allowedTypes.includes(file.type)) {
      const errorMessage = `Apenas ${fileTypeLabel} são permitidos. Formatos aceitos: ${allowedExtensions}`;
      console.error(`❌ [upload] TIPO REJEITADO: "${file.type}" para fileType: "${fileType}"`);
      console.error(`❌ [upload] allowedTypes configurados: ${JSON.stringify(allowedTypes)}`);
      console.error(`❌ [upload] Comparação exata: "${file.type}" in [${allowedTypes.map(t => `"${t}"`).join(', ')}] = ${allowedTypes.includes(file.type)}`);
      return createErrorResponse(errorMessage, 400);
    }

    console.log(`✅ [upload] TIPO ACEITO: "${file.type}" para fileType: "${fileType}"`);

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      console.error(`❌ [upload] Arquivo muito grande: ${file.size} bytes (máximo: ${maxSize} bytes)`);
      return createErrorResponse(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`, 400);
    }

    console.log(`✅ [upload] Tamanho do arquivo OK: ${file.size} bytes`);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const prefix = fileType === 'logo' ? 'logo' : 
                   fileType === 'letterhead' ? 'letterhead' : 'template';
    const uniqueFilename = `${prefix}_${auth.userId}_${timestamp}.${fileExtension}`;
    
    console.log(`📂 [upload] Nome único do arquivo: ${uniqueFilename}`);
    
    // Convert file to array buffer
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    // Generate R2 key for settings with organized folder structure
    const r2Key = `petition-settings/${auth.userId}/${fileType}/${timestamp}-${uniqueFilename}`;
    
    console.log(`📂 [upload] R2 Key gerada: ${r2Key}`);

    // Estratégia multi-level de upload para R2
    let uploadSuccess = false;
    let publicUrl = '';
    let storageProvider = 'cloudflare_r2';
    let finalR2Key = r2Key;
    
    // Verificar credenciais R2 primeiro
    const hasR2Credentials = Deno.env.get('R2_ACCOUNT_ID') && 
                            Deno.env.get('R2_ACCESS_KEY_ID') && 
                            Deno.env.get('R2_SECRET_ACCESS_KEY');
    
    console.log(`[upload] === INICIANDO ESTRATÉGIA DE UPLOAD R2 ===`);
    console.log(`[upload] R2 credentials available: ${hasR2Credentials ? 'YES' : 'NO'}`);
    console.log(`[upload] R2_PUBLIC_URL: ${Deno.env.get('R2_PUBLIC_URL') || 'NOT SET'}`);
    
    // TENTATIVA 1: R2 Direto com AWS V4 (método preferido para settings)
    if (hasR2Credentials) {
      try {
        console.log('[upload] === TENTATIVA 1: R2 DIRETO ===');
        await uploadToR2Direct(r2Key, fileBytes, file.type);
        const endpoint = Deno.env.get('R2_PUBLIC_URL');
        if (endpoint) {
          publicUrl = `${endpoint}/${r2Key}`;
          uploadSuccess = true;
          storageProvider = 'cloudflare_r2';
          console.log(`[upload] ✅ Upload R2 direto bem-sucedido! URL: ${publicUrl}`);
          console.log(`[upload] 🎯 FLUXO CONCLUÍDO - Método: R2 Direto, Status: SUCCESS`);
        } else {
          console.error('[upload] ❌ R2_PUBLIC_URL não configurado para método direto');
          throw new Error('R2_PUBLIC_URL não configurado');
        }
      } catch (r2Error) {
        console.error('[upload] ❌ Erro no R2 direto:', r2Error);
        uploadSuccess = false;
      }
    } else {
      console.log('[upload] Pulando R2 direto - credenciais não disponíveis');
    }
    
    // TENTATIVA 2: Supabase Storage (apenas se R2 falhou)
    if (!uploadSuccess) {
      try {
        console.log('[upload] === TENTATIVA 2: SUPABASE STORAGE (FALLBACK) ===');
        console.log('[upload] ⚠️ R2 falhou, usando fallback Supabase');
        
        // Upload to Supabase Storage
        const uploadPath = `${folderPath}/${uniqueFilename}`;
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('petition-assets')
          .upload(uploadPath, fileBytes, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ [upload] Erro ao fazer upload no storage:', uploadError);
          throw new Error(`Erro no upload: ${uploadError.message}`);
        }

        // Get public URL
        publicUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/petition-assets/${uploadData.path}`;
        storageProvider = 'supabase';
        finalR2Key = null; // No R2 key for Supabase
        uploadSuccess = true;
        console.log(`[upload] ✅ Upload Supabase Storage bem-sucedido! URL: ${publicUrl}`);
        console.log(`[upload] 🎯 FLUXO CONCLUÍDO - Método: Supabase Fallback, Status: SUCCESS`);
      } catch (supabaseError) {
        console.error('[upload] ❌ Erro no Supabase Storage:', supabaseError);
        uploadSuccess = false;
        throw new Error(`Falha em todos os métodos de upload: ${supabaseError.message}`);
      }
    } else {
      console.log('[upload] ✅ Upload já realizado com sucesso via R2, pulando Supabase Storage');
    }

    // Verificação final
    if (!uploadSuccess || !publicUrl) {
      console.error('[upload] ❌ FALHA CRÍTICA: uploadSuccess:', uploadSuccess, 'publicUrl:', publicUrl);
      throw new Error('Nenhum método de upload funcionou ou URL não foi gerada');
    }
    
    console.log(`[upload] 🎉 SUCESSO FINAL: Método=${storageProvider}, URL=${publicUrl}`);

    return createSuccessResponse({
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
      path: finalR2Key || `${folderPath}/${uniqueFilename}`,
      r2_key: finalR2Key,
      storage_provider: storageProvider
    });

  } catch (error) {
    console.error('💥 [upload] Erro crítico no handleFileUpload:', error);
    return createErrorResponse(`Erro interno no upload: ${error.message}`, 500);
  }
}

async function getUserDocuments(auth: any) {
  let query = supabaseAdmin
    .from('petition_documents')
    .select(`
      id, file_name, file_type, file_size, created_at,
      petition_id,
      petitions!inner (
        id, title, user_id, team_id
      )
    `);

  // Filtrar documentos por usuário/equipes se não for admin
  if (!auth.isAdmin) {
    const userAndTeamIds = [auth.userId, ...auth.teamIds];
    query = query.or(`petitions.user_id.eq.${auth.userId},petitions.team_id.in.(${auth.teamIds.join(',')})`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar documentos:', error);
    return createErrorResponse('Erro ao buscar documentos');
  }

  return createSuccessResponse(data || []);
}

async function getPetitionDocuments(petitionId: string, auth: any) {
  // Verificar se o usuário tem acesso à petição
  const { data: petition } = await supabaseAdmin
    .from('petitions')
    .select('user_id, team_id')
    .eq('id', petitionId)
    .single();

  if (!petition) {
    return createErrorResponse('Petição não encontrada', 404);
  }

  const hasAccess = auth.isAdmin || 
                   petition.user_id === auth.userId || 
                   (petition.team_id && auth.teamIds.includes(petition.team_id));

  if (!hasAccess) {
    return createErrorResponse('Sem permissão para acessar documentos desta petição', 403);
  }

  const { data, error } = await supabaseAdmin
    .from('petition_documents')
    .select('*')
    .eq('petition_id', petitionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar documentos da petição:', error);
    return createErrorResponse('Erro ao buscar documentos da petição');
  }

  return createSuccessResponse(data || []);
}

async function getDocumentById(id: string, auth: any) {
  const { data: document, error } = await supabaseAdmin
    .from('petition_documents')
    .select(`
      *,
      petitions!inner (
        id, title, user_id, team_id
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createErrorResponse('Documento não encontrado', 404);
    }
    return createErrorResponse('Erro ao buscar documento');
  }

  // Verificar permissões
  const hasAccess = auth.isAdmin || 
                   document.petitions.user_id === auth.userId || 
                   (document.petitions.team_id && auth.teamIds.includes(document.petitions.team_id));

  if (!hasAccess) {
    return createErrorResponse('Sem permissão para acessar este documento', 403);
  }

  return createSuccessResponse(document);
}

async function createDocument(req: Request, auth: any) {
  const body = await req.json();
  
  // Verificar se o usuário tem acesso à petição
  if (body.petition_id) {
    const { data: petition } = await supabaseAdmin
      .from('petitions')
      .select('user_id, team_id')
      .eq('id', body.petition_id)
      .single();

    if (!petition) {
      return createErrorResponse('Petição não encontrada', 404);
    }

    const hasAccess = auth.isAdmin || 
                     petition.user_id === auth.userId || 
                     (petition.team_id && auth.teamIds.includes(petition.team_id));

    if (!hasAccess) {
      return createErrorResponse('Sem permissão para adicionar documentos a esta petição', 403);
    }
  }

  const { data, error } = await supabaseAdmin
    .from('petition_documents')
    .insert(body)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar documento:', error);
    return createErrorResponse('Erro ao criar documento');
  }

  return createSuccessResponse(data);
}

async function deleteDocument(id: string, auth: any) {
  // Verificar permissões primeiro
  const { data: document } = await supabaseAdmin
    .from('petition_documents')
    .select(`
      petition_id,
      petitions!inner (
        user_id, team_id
      )
    `)
    .eq('id', id)
    .single();

  if (!document) {
    return createErrorResponse('Documento não encontrado', 404);
  }

  const hasAccess = auth.isAdmin || 
                   document.petitions.user_id === auth.userId || 
                   (document.petitions.team_id && auth.teamIds.includes(document.petitions.team_id));

  if (!hasAccess) {
    return createErrorResponse('Sem permissão para deletar este documento', 403);
  }

  const { error } = await supabaseAdmin
    .from('petition_documents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar documento:', error);
    return createErrorResponse('Erro ao deletar documento');
  }

  return createSuccessResponse({ success: true });
}
