# Backend - Sistema de Acompanhamento Processual

Backend completo para gestão e acompanhamento de processos jurídicos com sistema de alertas automáticos.

## 🚀 Funcionalidades

- **Autenticação JWT** com roles (admin/user)
- **CRUD completo** de processos jurídicos
- **Sistema de alertas automáticos** para prazos
- **Integração configurável** com API pública (DataJud)
- **Cálculo automático** de prazos úteis
- **Logs estruturados** com Winston
- **Documentação automática** com Swagger

## 🛠️ Stack Tecnológica

- **Node.js** + **Express**
- **PostgreSQL** + **Sequelize ORM**
- **JWT** para autenticação
- **bcrypt** para hash de senhas
- **Joi** para validação
- **Winston** para logs
- **node-cron** para agendamento
- **Axios** para APIs externas

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações (DB, Logger)
├── models/          # Modelos Sequelize
├── controllers/     # Controladores da API
├── services/        # Lógica de negócio
├── routes/          # Definição de rotas
├── middlewares/     # Middlewares (Auth, Error)
├── utils/           # Utilitários (Datas, etc.)
└── docs/            # Documentação Swagger
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `env.example` para `.env`:

```bash
cp env.example .env
```

Configure as variáveis:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Banco de Dados
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# JWT
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=24h

# API Externa (DataJud) - Opcional
DATAJUD_BASE=https://api-publica.datajud.cnj.jus.br/api_publica_tjba/_search
DATAJUD_TOKEN=seu_token_aqui

# Logs
LOG_LEVEL=info
```

### 2. Instalação

```bash
npm install
```

### 3. Banco de Dados

```bash
# Criar banco PostgreSQL
createdb acompanhamento_processual

# Sincronizar modelos (desenvolvimento)
npm run dev
```

## 🚀 Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário logado
- `PUT /api/auth/profile` - Atualizar perfil

### Processos
- `GET /api/processos` - Listar processos
- `POST /api/processos` - Criar processo
- `GET /api/processos/:id` - Buscar processo
- `PUT /api/processos/:id` - Atualizar processo
- `DELETE /api/processos/:id` - Remover processo
- `PATCH /api/processos/:id/status` - Atualizar status

### Alertas
- `GET /api/alerts` - Listar alertas
- `GET /api/alerts/:id` - Buscar alerta
- `PATCH /api/alerts/:id/read` - Marcar como lido
- `DELETE /api/alerts/:id` - Remover alerta
- `GET /api/alerts/stats/overview` - Estatísticas

### API Externa
- `GET /api/external/processos/:numero` - Consultar DataJud
- `GET /api/external/status` - Status do serviço

## 🔍 Documentação

Acesse a documentação interativa em:
```
http://localhost:3001/docs
```

## ⚠️ Sistema de Alertas

O sistema gera automaticamente alertas para:

- **Audiências**: 1 dia antes
- **Prazos de Recurso**: 10 dias úteis (1 dia antes do vencimento)
- **Prazos de Embargos**: 5 dias úteis (1 dia antes do vencimento)
- **Despachos com prazo**: 1 dia antes do vencimento

## 🚀 Deploy

### Railway
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Variáveis de Produção
Configure no Railway:
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`

## 📊 Monitoramento

- **Health Check**: `/api/health`
- **Logs**: Estruturados com Winston
- **Métricas**: Uptime e status dos serviços

## 🔒 Segurança

- **Helmet** para headers de segurança
- **CORS** configurado
- **Validação** com Joi
- **Hash** de senhas com bcrypt
- **JWT** com expiração configurável

## 🧪 Testes

```bash
# Em desenvolvimento
npm run dev

# Verificar logs
tail -f logs/combined.log
```

## 📝 Licença

MIT License
