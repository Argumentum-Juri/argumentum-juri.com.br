# Configuração do Webhook Stripe - Guia Completo

## Passo 1: Acesse o Dashboard do Stripe

1. Acesse [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
2. Faça login na sua conta
3. **IMPORTANTE**: Verifique se você está no ambiente correto (Test ou Live)

## Passo 2: Criar/Atualizar o Webhook Endpoint

1. No menu lateral, clique em **"Developers"**
2. Clique em **"Webhooks"**
3. Se já existe um webhook para o seu projeto:
   - Clique no webhook existente
   - Vá para o **Passo 3**
4. Se não existe, clique em **"Add endpoint"**

### URL do Endpoint
Use a URL completa do seu projeto:
```
https://mefgswdpeellvaggvttc.supabase.co/functions/v1/webhook-stripe
```

## Passo 3: Configurar Eventos

Certifique-se de que o evento `checkout.session.completed` está selecionado:

1. Na seção **"Select events to listen to"**
2. Procure por `checkout.session.completed`
3. Marque apenas este evento (pode desmarcar outros se existirem)
4. Clique em **"Add events"**

## Passo 4: Obter o Webhook Secret

1. Após criar/atualizar o webhook, clique no webhook na lista
2. Na seção **"Signing secret"**, clique em **"Reveal"**
3. Copie o valor que começa com `whsec_...`
4. **Este é o valor que deve ser colocado no STRIPE_WEBHOOK_SECRET**

## Passo 5: Testar o Webhook

### Teste Manual no Stripe Dashboard
1. No webhook criado, vá para a aba **"Test"**
2. Clique em **"Send test webhook"**
3. Selecione `checkout.session.completed`
4. Clique em **"Send test webhook"**

### Logs para Verificar
Após o teste, verifique os logs no Supabase:
- Acesse: [https://supabase.com/dashboard/project/mefgswdpeellvaggvttc/functions/webhook-stripe/logs](https://supabase.com/dashboard/project/mefgswdpeellvaggvttc/functions/webhook-stripe/logs)

## Passo 6: Atualizar Secrets no Supabase

Se você gerou um novo webhook secret:

1. Acesse: [https://supabase.com/dashboard/project/mefgswdpeellvaggvttc/settings/functions](https://supabase.com/dashboard/project/mefgswdpeellvaggvttc/settings/functions)
2. Encontre `STRIPE_WEBHOOK_SECRET`
3. Clique em **"Edit"**
4. Cole o novo valor (que começa com `whsec_...`)
5. Clique em **"Save"**

## Diagnóstico de Problemas

### Status 400 - Bad Request
Se o webhook retorna status 400, verifique:

1. **Webhook Secret incorreto**: O valor deve começar com `whsec_`
2. **Metadata ausente**: Certifique-se de que o checkout session inclui metadata com tokens
3. **Email do cliente**: Verifique se o email está sendo passado corretamente

### Como Verificar se Está Funcionando

1. **Logs do Webhook**: 
   - Acesse os logs no Supabase (link acima)
   - Procure por mensagens de sucesso com timestamps

2. **Teste Real**:
   - Faça uma compra de teste
   - Verifique se os tokens foram creditados
   - Confira se a transação foi registrada

3. **Stripe Dashboard**:
   - Em "Webhooks", clique no seu endpoint
   - Vá para "Recent deliveries"
   - Verifique se aparecem tentativas de entrega com status 200

## Troubleshooting Comum

### Erro: "Invalid signature"
- **Causa**: STRIPE_WEBHOOK_SECRET incorreto
- **Solução**: Regenerar o webhook secret no Stripe e atualizar no Supabase

### Erro: "Invalid token amount"
- **Causa**: Metadata não está sendo enviada corretamente no checkout
- **Solução**: Verificar se o token-checkout está enviando os metadados corretos

### Erro: "User not found"
- **Causa**: Email do cliente não existe no perfil do usuário
- **Solução**: Verificar se o usuário tem perfil criado com o email correto

## Informações Importantes

- **Ambiente**: Certifique-se de usar o webhook secret do ambiente correto (Test/Live)
- **URL**: A URL deve apontar para o ambiente correto do Supabase
- **Eventos**: Apenas `checkout.session.completed` é necessário
- **Timeout**: Webhooks têm timeout de 30 segundos

## Links Úteis

- [Stripe Webhook Dashboard](https://dashboard.stripe.com/webhooks)
- [Supabase Function Logs](https://supabase.com/dashboard/project/mefgswdpeellvaggvttc/functions/webhook-stripe/logs)
- [Supabase Secrets](https://supabase.com/dashboard/project/mefgswdpeellvaggvttc/settings/functions)