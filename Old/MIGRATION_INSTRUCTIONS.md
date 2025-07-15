
# Migração para Arquitetura Totalmente Desacoplada - Argumentum

Este documento contém as instruções para completar a migração da aplicação Argumentum para uma arquitetura que **oculta completamente o Supabase do frontend** usando Edge Functions como API intermediária.

## 🎯 Objetivo Final

**Zero chamadas diretas ao Supabase visíveis no frontend** - toda comunicação acontece através de Edge Functions que atuam como uma API backend completa.

## ✅ O que foi implementado

### 1. Nova Edge Function de Autenticação (`api-auth`)
- **Endpoints completos**: `/login`, `/register`, `/logout`, `/refresh`, `/reset-password`, `/verify`
- **JWTs customizados**: Não usa tokens Supabase no frontend
- **Autenticação interna**: Edge Function usa Supabase Admin internamente
- **CORS configurado**: Permite chamadas do frontend

### 2. Cliente API Atualizado (`src/lib/goApiClient.ts`)
- **Base URL**: Agora aponta para Edge Functions (`https://mefgswdpeellvaggvttc.supabase.co/functions/v1`)
- **Autenticação JWT**: Usa tokens customizados (não tokens Supabase)
- **Renovação automática**: Sistema de refresh tokens
- **Endpoints completos**: Auth, petições, perfil, equipes, documentos, storage

### 3. Sistema de Autenticação Atualizado (`_shared/auth.ts`)
- **Verificação JWT customizada**: Não depende mais de tokens Supabase
- **Middleware atualizado**: Para uso pelas Edge Functions existentes
- **Segurança mantida**: RLS e permissões preservadas

### 4. Contexto Go Auth (`src/contexts/GoAuthContext.tsx`)
- **100% independente do Supabase**: Usa apenas goApiClient
- **Gestão de estado local**: Usuario e sessão mantidos no frontend
- **Tokens seguros**: Armazenados em localStorage

## 🚨 Status Atual - ARQUITETURA DESACOPLADA IMPLEMENTADA

### ✅ Funcionalidades Implementadas:
- ✅ **Edge Function api-auth** com todos os endpoints de autenticação
- ✅ **goApiClient atualizado** para usar Edge Functions
- ✅ **Sistema JWT customizado** (não usa tokens Supabase no frontend)
- ✅ **Autenticação middleware** atualizado nas Edge Functions
- ✅ **CORS configurado** para permitir chamadas do frontend

### ⚠️ Próximos Passos Obrigatórios:

#### 1. Testar a Nova Arquitetura
```bash
# Verificar se as Edge Functions estão funcionando:
# 1. Ir para /auth e tentar fazer login
# 2. Verificar DevTools - Network tab
# 3. Confirmar que APENAS aparecem calls para:
#    - https://mefgswdpeellvaggvttc.supabase.co/functions/v1/api-auth/*
#    - Nenhuma call direta para *.supabase.co/rest/v1/*
```

#### 2. Atualizar Edge Functions Existentes
As Edge Functions `api-petitions`, `api-documents`, `api-teams` precisam ser atualizadas para usar o novo sistema de autenticação:

```typescript
// Elas devem importar de _shared/auth.ts atualizado
import { authenticateRequest } from '../_shared/auth.ts';
```

#### 3. Migrar Componentes Restantes (42+ arquivos)
Ainda existem componentes usando `import { useAuth } from '@/contexts/AuthContext'` que precisam migrar para:
```typescript
import { useGoAuth } from '@/contexts/GoAuthContext'
```

#### 4. Remover Dependências Supabase do Frontend
Após confirmar que tudo funciona:
- Remover `src/integrations/supabase/client.ts` 
- Remover imports de `@supabase/supabase-js` do frontend
- Atualizar imports para usar apenas `goApiClient`

## 🔧 Configurações Necessárias

### Environment Variables nas Edge Functions
As seguintes variáveis precisam estar configuradas:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` 
- `JWT_SECRET` (para os tokens customizados)

### Endpoints Implementados

#### Autenticação (`api-auth`)
```
POST /api-auth/login        - Login com email/senha
POST /api-auth/register     - Registro de novo usuário  
POST /api-auth/logout       - Logout
POST /api-auth/refresh      - Renovar token
POST /api-auth/reset-password - Reset de senha
GET  /api-auth/verify       - Verificar token
```

#### Dados (usando Edge Functions existentes)
```
GET  /api-petitions         - Listar petições
POST /api-petitions         - Criar petição
GET  /api-profile          - Buscar perfil
PUT  /api-profile          - Atualizar perfil
GET  /api-teams            - Listar equipes
POST /api-teams            - Criar equipe
GET  /api-documents        - Listar documentos
POST /api-documents/upload - Upload de documento
```

## 🛡️ Segurança Implementada

1. **JWTs customizados**: Frontend não tem acesso aos tokens Supabase
2. **Service Role protegida**: Chave fica apenas nas Edge Functions
3. **Middleware de autenticação**: Validação centralizada
4. **CORS restritivo**: Apenas origens permitidas
5. **Refresh automático**: Renovação segura de tokens

## 📋 Checklist de Finalização

### Teste Imediato (CRÍTICO):
- [ ] **Testar login/logout** na página `/auth`
- [ ] **Verificar DevTools** - zero calls para `*.supabase.co/rest/v1/*`
- [ ] **Confirmar tokens** - devem ser JWTs customizados

### Próximas Etapas:
- [ ] Atualizar Edge Functions existentes (`api-petitions`, `api-documents`, `api-teams`)
- [ ] Migrar 42+ componentes restantes para `useGoAuth`
- [ ] Testar todas as funcionalidades (petições, perfil, equipes, documentos)
- [ ] Remover dependências Supabase do frontend
- [ ] Validar zero chamadas diretas ao Supabase

## 🎯 Resultado Final Esperado

Após completar todos os passos:

```
✅ Frontend faz chamadas APENAS para Edge Functions
✅ Edge Functions fazem toda comunicação com Supabase  
✅ URLs, tokens e lógica Supabase 100% ocultos do frontend
✅ Arquitetura completamente desacoplada
✅ Funciona 100% no ambiente online do Lovable
✅ Zero vulnerabilidades de exposição do Supabase
```

## 🚀 Testando a Migração

Para confirmar o sucesso da arquitetura desacoplada:

1. **Abrir DevTools → Network**
2. **Fazer login na aplicação**
3. **Navegar pelas páginas**
4. **Verificar que APENAS aparecem requests para:**
   - `https://mefgswdpeellvaggvttc.supabase.co/functions/v1/*`
5. **ZERO requests devem aparecer para:**
   - `https://mefgswdpeellvaggvttc.supabase.co/rest/v1/*`
   - `https://mefgswdpeellvaggvttc.supabase.co/auth/v1/*`

## 📊 Status da Migração

### ✅ FASE 1 - COMPLETA: Edge Function de Autenticação
- [x] `api-auth/index.ts` criada com todos os endpoints
- [x] JWTs customizados implementados
- [x] CORS configurado
- [x] Integração com Supabase Admin

### ✅ FASE 2 - COMPLETA: Cliente API Atualizado  
- [x] `goApiClient.ts` atualizado para Edge Functions
- [x] Base URL configurada corretamente
- [x] Sistema de refresh tokens
- [x] Todos os métodos implementados

### ✅ FASE 3 - COMPLETA: Sistema de Autenticação
- [x] `_shared/auth.ts` atualizado para JWTs customizados
- [x] Middleware de autenticação atualizado
- [x] Verificação de tokens customizada

### 🔄 FASE 4 - PENDENTE: Testes e Validação
- [ ] Testar login/logout/registro
- [ ] Validar que não há calls diretas ao Supabase
- [ ] Verificar funcionamento das Edge Functions

### 🔄 FASE 5 - PENDENTE: Finalização
- [ ] Atualizar Edge Functions existentes
- [ ] Migrar componentes restantes
- [ ] Remover dependências Supabase do frontend
- [ ] Documentar arquitetura final

---

**⚠️ AÇÃO IMEDIATA NECESSÁRIA:**
1. Teste a funcionalidade de login em `/auth`
2. Verifique no DevTools se as chamadas estão indo para as Edge Functions
3. Confirme que não há calls diretas para `*.supabase.co/rest/v1/*`

Se o login funcionar, a arquitetura desacoplada está operacional! 🎉
