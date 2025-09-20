# 📧 Guia Completo de Teste do Sistema de Email

## 🎯 Visão Geral

Este guia explica como testar o sistema completo de integração de email TRF1, incluindo:
- Criação de processos base
- Envio de emails de teste
- Webhook público para receber emails
- Parser de emails TRF1

## 🚀 Como Testar

### 1. **Criar Processo Base**

```bash
# Fazer login primeiro
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"plain@test.com","password":"123456"}'

# Usar o token retornado para criar processo base
curl -X POST http://localhost:3001/api/test/create-base-process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 2. **Enviar Email de Teste**

```bash
# Enviar email de teste para webhook
curl -X POST http://localhost:3001/api/test/send-test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "to": "mau_oliver@hotmail.com",
    "processNumber": "1000000-12.2023.4.01.3300",
    "movements": [
      {
        "date": "09/09/2025",
        "time": "14:30",
        "movement": "Nova movimentação de teste"
      }
    ]
  }'
```

### 3. **Testar Webhook Diretamente**

```bash
# Enviar email diretamente para o webhook
curl -X POST http://localhost:3001/api/email/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "naoresponda.pje.push1@trf1.jus.br",
    "to": "plain@test.com",
    "subject": "Movimentação processual do processo 1000000-12.2023.4.01.3300",
    "body": "CONTEUDO_DO_EMAIL_TRF1",
    "receivedAt": "2025-09-19T18:00:00.000Z"
  }'
```

### 4. **Testar Parser**

```bash
# Testar parser isoladamente
curl -X POST http://localhost:3001/api/email/test-parser \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"emailContent": "CONTEUDO_DO_EMAIL"}'
```

### 5. **Listar Processos**

```bash
# Listar processos de teste
curl -X GET http://localhost:3001/api/test/list-processes \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 🧪 Script Automatizado

Execute o script completo de testes:

```bash
cd backend
node scripts/test-email-system.js
```

## 📋 Endpoints Disponíveis

### **Autenticação**
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Dados do usuário

### **Testes**
- `POST /api/test/create-base-process` - Criar processo base
- `POST /api/test/send-test-email` - Enviar email de teste
- `GET /api/test/list-processes` - Listar processos

### **Email (Protegido)**
- `POST /api/email/process` - Processar email
- `POST /api/email/test-parser` - Testar parser
- `GET /api/email/processed` - Listar emails processados

### **Webhook (Público)**
- `POST /api/email/webhook` - Receber emails via webhook
- `POST /api/email/test` - Testar webhook

## 🔧 Configuração para Emails Reais

### 1. **Configurar Gmail (Opcional)**

Adicione no arquivo `.env`:

```env
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
```

### 2. **Configurar Webhook URL**

```env
WEBHOOK_URL=http://localhost:3001/api/email/webhook
```

## 📧 Formato do Email TRF1

O sistema reconhece automaticamente emails com:

**Remetente:** `naoresponda.pje.push1@trf1.jus.br`
**Assunto:** `Movimentação processual do processo [NÚMERO]`

**Estrutura do corpo:**
```
JUSTIÇA FEDERAL DA 1ª REGIÃO

PJe Push - Serviço de Acompanhamento automático de processos

Prezado(a) ,

Informamos que o processo a seguir sofreu movimentação:
Número do Processo: [NÚMERO]
Polo Ativo: [NOME]
Polo Passivo: [NOME]
Classe Judicial: [CLASSE]
Órgão: [ÓRGÃO]
Data de Autuação: [DATA]
Tipo de Distribuição: [TIPO]
Assunto: [ASSUNTO]

Data	Movimento	Documento
[DATA] [HORA]	[MOVIMENTO]	[DOCUMENTO]

Este é um email automático, não responda.

Atenciosamente,
Sistema PJe Push - TRF1
```

## 🎯 Fluxo de Teste Completo

1. **Iniciar o backend:**
   ```bash
   cd backend && npm start
   ```

2. **Executar script de teste:**
   ```bash
   node scripts/test-email-system.js
   ```

3. **Verificar resultados:**
   - Processo base criado
   - Email processado via webhook
   - Movimentações extraídas
   - Alertas gerados

## 🔍 Debugging

### Logs do Backend
```bash
# Ver logs em tempo real
tail -f logs/combined.log
```

### Testar Componentes Individuais

```bash
# Testar apenas o parser
node scripts/test-email-integration.js

# Testar webhook isoladamente
curl -X POST http://localhost:3001/api/email/test
```

## 📊 Exemplos de Uso

### **Criar Processo e Enviar Email**

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"plain@test.com","password":"123456"}' | jq -r '.token')

# 2. Criar processo base
curl -X POST http://localhost:3001/api/test/create-base-process \
  -H "Authorization: Bearer $TOKEN"

# 3. Enviar email de teste
curl -X POST http://localhost:3001/api/test/send-test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"to": "mau_oliver@hotmail.com"}'
```

### **Simular Email Real**

```bash
# Simular recebimento de email real
curl -X POST http://localhost:3001/api/email/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "naoresponda.pje.push1@trf1.jus.br",
    "to": "plain@test.com",
    "subject": "Movimentação processual do processo 1000000-12.2023.4.01.3300",
    "body": "JUSTIÇA FEDERAL DA 1ª REGIÃO\n\nPJe Push - Serviço de Acompanhamento automático de processos\n\nPrezado(a) ,\n\nInformamos que o processo a seguir sofreu movimentação:\nNúmero do Processo: 1000000-12.2023.4.01.3300\nPolo Ativo: Xxx da Silva\nPolo Passivo: zzzz Augusto\nClasse Judicial: PROCEDIMENTO DO JUIZADO ESPECIAL CÍVEL\nÓrgão: 15ª Vara Federal de Juizado Especial Cível da SJBA\nData de Autuação: 19/06/2023\nTipo de Distribuição: sorteio\nAssunto: Indenização por Dano Material\n\nData\tMovimento\tDocumento\n09/09/2025 01:24\tDecorrido prazo de SISTEMA DE EDUCACAO SUPERIOR. em 08/09/2025 23:59.\t\n\nEste é um email automático, não responda.\n\nAtenciosamente,\nSistema PJe Push - TRF1"
  }'
```

## ✅ Checklist de Teste

- [ ] Backend iniciado corretamente
- [ ] Login funcionando
- [ ] Processo base criado
- [ ] Webhook recebendo emails
- [ ] Parser extraindo dados
- [ ] Processos sendo atualizados
- [ ] Alertas sendo gerados
- [ ] Logs sendo registrados

## 🚨 Troubleshooting

### **Erro de Login**
- Verificar se o usuário existe
- Verificar senha correta
- Verificar se o backend está rodando

### **Erro no Webhook**
- Verificar se o email é do TRF1
- Verificar formato do email
- Verificar logs do backend

### **Erro no Parser**
- Verificar estrutura do email
- Verificar se contém número do processo
- Verificar logs de parsing

## 🎉 Resultado Esperado

Após executar todos os testes, você deve ter:

1. **Processo base criado** com dados de exemplo
2. **Email processado** via webhook
3. **Movimentações extraídas** e salvas
4. **Alertas gerados** automaticamente
5. **Logs detalhados** de todas as operações

O sistema estará pronto para receber emails reais do TRF1!
