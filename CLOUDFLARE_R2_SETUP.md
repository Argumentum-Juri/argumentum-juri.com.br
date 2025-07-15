# Cloudflare R2 Integration - Setup Guide

## Overview

Este sistema utiliza **Cloudflare R2** para armazenamento de documentos de petições, substituindo o antigo sistema R2-upload. A implementação utiliza assinatura AWS4-SigV4 para upload direto do cliente.

## 🚀 Configuração Inicial

### 1. Variáveis de Ambiente

Configure as seguintes variáveis no seu arquivo `.env`:

```env
# Cloudflare R2 Configuration
CF_ACCOUNT_ID=sua-cloudflare-account-id
CF_ACCESS_KEY_ID=sua-access-key-id  
CF_SECRET_ACCESS_KEY=sua-secret-access-key
CF_BUCKET_NAME=seu-bucket-name
CF_ENDPOINT=https://sua-account-id.r2.cloudflarestorage.com
```

### 2. Configuração do Bucket no Dashboard R2

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com/) > R2 Object Storage
2. Crie um novo bucket ou use um existente
3. Configure **CORS** para permitir requisições do seu domínio front-end:

```json
[
  {
    "AllowedOrigins": [
      "https://seu-dominio.com",
      "https://preview.lovable.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

4. Gere API Token com permissões:
   - **Object Storage:Edit** 
   - **Zone:Zone Settings:Read**

## 📁 Estrutura de Arquivos

Os documentos são organizados da seguinte forma no R2:

```
petition-files/
├── {petitionId}/
│   └── documents/
│       ├── {timestamp}-{sanitized-filename}.pdf
│       ├── {timestamp}-{sanitized-filename}.docx
│       └── ...
```

## 🔧 Funcionalidades Implementadas

### Upload de Documentos
- ✅ Validação de tamanho (max 50MB)
- ✅ Validação de tipos permitidos (PDF, Word, TXT, Imagens)
- ✅ Assinatura AWS4-SigV4 para URLs presigned
- ✅ Retry automático com backoff exponencial
- ✅ Detecção de clock skew (erro 403)
- ✅ Cleanup automático em caso de falha no DB

### Download de Documentos
- ✅ URLs diretas para documentos R2
- ✅ Compatibilidade com Supabase Storage (legacy)

### Exclusão de Documentos
- ✅ Remoção do R2 + registro do banco
- ✅ Support para múltiplos storage providers

## 🛡️ Validações e Limites

### Tipos de Arquivo Aceitos
```typescript
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png', 
  'image/gif'
];
```

### Configurações de Retry
```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000   // 5 seconds  
};
```

## 🔍 Monitoramento e Debug

### Logs Estruturados
Todos os erros são logados com detalhes estruturados para facilitar monitoramento:

```typescript
const errorDetails = {
  petitionId,
  fileName: file.name,
  fileSize: file.size, 
  error: error.message,
  timestamp: new Date().toISOString()
};
```

### Principais Pontos de Log
- `[uploadDocument Service]` - Upload process
- `[deleteDocument Service]` - Delete operations
- `[retryWithBackoff]` - Retry attempts
- `[getDocumentDownloadUrl]` - URL generation

## 🧪 Testes Recomendados

### Teste de Upload
1. Upload de arquivo válido (PDF < 50MB)
2. Upload de arquivo inválido (tipo não permitido)
3. Upload de arquivo muito grande (> 50MB)
4. Falha de conexão durante upload
5. Falha no banco após upload (rollback)

### Teste de Download  
1. Download de documento R2
2. Download de documento Supabase (legacy)
3. Download com path inválido

### Teste de Exclusão
1. Exclusão de documento R2
2. Exclusão de documento Supabase
3. Exclusão com ID inexistente

## 🚨 Troubleshooting

### Erro 403 - RequestTimeTooSkewed
```
Clock skew detectado. Sincronize o relógio do sistema.
```
**Solução:** Sincronize o relógio do servidor/cliente com NTP.

### Erro de CORS
```
Access to fetch at 'https://...' from origin '...' has been blocked by CORS policy
```
**Solução:** Configure CORS no Dashboard R2 conforme seção 2.

### Variáveis de Ambiente Não Encontradas
```
Cloudflare R2 environment variables not configured
```
**Solução:** Verifique se todas as variáveis CF_* estão definidas.

## 📊 Compatibilidade

### Storage Providers Suportados
- ✅ **Cloudflare R2** (novo - padrão)
- ✅ **Supabase Storage** (legacy - compatibilidade)

### Migração de Dados
Documentos antigos do Supabase Storage continuam funcionando. Novos uploads vão para R2.

## 🔐 Segurança

### Assinatura de Requisições
- Todas as operações PUT/DELETE usam AWS4-SigV4
- URLs presigned têm validade limitada
- Payload hash verificado na assinatura

### Validação de Arquivos
- Validação de MIME type no client
- Validação de tamanho máximo
- Sanitização de nomes de arquivo

## 📈 Performance

### Otimizações Implementadas
- Upload direto do cliente para R2 (sem proxy)
- Retry com backoff exponencial
- URLs públicas diretas para download
- Cleanup assíncrono em caso de falha

---

## 🆘 Support

Em caso de problemas:
1. Verifique os logs do console browser
2. Confirme configuração CORS no R2
3. Valide variáveis de ambiente
4. Teste conectividade com R2 endpoint

---

*Última atualização: Janeiro 2025*