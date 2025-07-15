
# Argumentum Backend Go

Backend em Go para a aplicação Argumentum, fornecendo APIs REST para autenticação e gerenciamento de dados.

## 🚀 Início Rápido

### Pré-requisitos
- Go 1.21 ou superior
- Acesso ao projeto Supabase

### Instalação

1. **Clone e navegue para o diretório:**
```bash
cd backend-go
```

2. **Instale as dependências:**
```bash
go mod tidy
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Execute o servidor:**
```bash
go run main.go
```

O servidor estará rodando em `http://localhost:8080`

## 📋 Variáveis de Ambiente Necessárias

```env
SUPABASE_URL=https://mefgswdpeellvaggvttc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your_jwt_secret_here
PORT=8080
```

## 🔗 Endpoints Principais

### Autenticação
- `POST /auth/login` - Login do usuário
- `POST /auth/register` - Registro de novo usuário
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Renovar token
- `POST /auth/reset-password` - Reset de senha

### Perfil
- `GET /profile` - Buscar perfil do usuário
- `PUT /profile` - Atualizar perfil

### Petições
- `GET /petitions` - Listar petições
- `POST /petitions` - Criar petição
- `GET /petitions/:id` - Buscar petição específica

### Verificação de Saúde
- `GET /health` - Status do servidor

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
backend-go/
├── main.go              # Ponto de entrada do servidor
├── handlers/            # Handlers das rotas
│   ├── auth.go         # Autenticação
│   ├── petition.go     # Petições
│   ├── profile.go      # Perfil do usuário
│   └── storage.go      # Upload/storage
├── middleware/          # Middlewares
│   └── auth.go         # Middleware de autenticação
├── models/             # Estruturas de dados
│   └── user.go         # Modelos do usuário
├── utils/              # Utilitários
│   └── jwt.go          # Gestão de JWT
└── go.mod              # Dependências
```

### Testando os Endpoints

**Health Check:**
```bash
curl http://localhost:8080/health
```

**Login:**
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Logs
O servidor registra todas as operações importantes. Verifique o console para:
- Erros de autenticação
- Problemas de conexão com Supabase
- Requests recebidos

## 🔒 Segurança

- JWT tokens com expiração de 24 horas
- CORS configurado para frontend em localhost:5173
- Service role key do Supabase protegida no backend
- Middleware de autenticação para rotas protegidas

## 🚨 Resolução de Problemas

### Erro "Failed to fetch" no frontend:
1. Certifique-se que o servidor está rodando na porta 8080
2. Verifique se o CORS está configurado corretamente
3. Confirme que as variáveis de ambiente estão corretas

### Problemas de autenticação:
1. Verifique o SUPABASE_SERVICE_ROLE_KEY
2. Confirme que o usuário existe na tabela profiles
3. Verifique logs do servidor para erros específicos

### Performance:
- O servidor usa Gin (framework web rápido)
- Conexões com Supabase são reutilizadas
- JWT tokens reduzem consultas ao banco

## 🔄 Próximos Passos

1. **Implementar endpoints completos de petições**
2. **Adicionar upload de arquivos**
3. **Implementar gestão de equipes**
4. **Adicionar testes unitários**
5. **Configurar CI/CD**
