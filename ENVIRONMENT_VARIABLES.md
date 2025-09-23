# Variáveis de Ambiente Necessárias

## Configurações do Banco de Dados
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/juris_acompanha
DB_HOST=localhost
DB_PORT=5432
DB_NAME=juris_acompanha
DB_USER=username
DB_PASSWORD=password
```

## Configurações do Supabase
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Configurações de Autenticação
```bash
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
```

## Configurações do Frontend
```bash
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=https://your-frontend.vercel.app
```

## Configurações de Email
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@jurisacompanha.com
```

## Configurações de Push Notifications
```bash
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=mailto:your-email@example.com
```

## Configurações do Servidor
```bash
PORT=3001
NODE_ENV=production
```

## Configurações de Log
```bash
LOG_LEVEL=info
LOG_FILE=logs/combined.log
ERROR_LOG_FILE=logs/error.log
```

## Configurações de Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Configurações de Segurança
```bash
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret
```

## Como configurar no Vercel

1. Acesse o painel do Vercel
2. Vá para o projeto do backend
3. Clique em "Settings" > "Environment Variables"
4. Adicione todas as variáveis acima com os valores corretos
5. Faça o redeploy da aplicação
