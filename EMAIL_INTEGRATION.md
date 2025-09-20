# 📧 Integração de Email - TRF1

## Visão Geral

Este sistema permite processar automaticamente emails de notificação do TRF1 (Tribunal Regional Federal da 1ª Região) e atualizar processos cadastrados com as informações recebidas.

## 🔧 Funcionalidades

### 1. **Parser de Email**
- Detecta emails do TRF1 automaticamente
- Extrai informações do processo (número, partes, classe, etc.)
- Processa movimentações e datas
- Identifica novos prazos e audiências

### 2. **Atualização de Processos**
- Atualiza processos existentes com novas informações
- Cria novos processos se não existirem
- Adiciona movimentações às observações
- Cria alertas para novas movimentações

### 3. **API Endpoints**

#### `POST /api/email/process`
Processa um email completo e atualiza o sistema.

**Request:**
```json
{
  "from": "naoresponda.pje.push1@trf1.jus.br",
  "to": "usuario@email.com",
  "subject": "Movimentação processual do processo 1000000-12.2023.4.01.3300",
  "body": "Conteúdo completo do email...",
  "userId": 16
}
```

**Response:**
```json
{
  "message": "Processo criado com sucesso",
  "processNumber": "1000000-12.2023.4.01.3300",
  "processId": 3,
  "movementsProcessed": 3,
  "processed": true
}
```

#### `POST /api/email/test-parser`
Testa o parser com conteúdo de email.

**Request:**
```json
{
  "emailContent": "Conteúdo do email para teste..."
}
```

#### `GET /api/email/processed`
Lista emails processados recentemente.

## 📋 Exemplo de Email TRF1

```
JUSTIÇA FEDERAL DA 1ª REGIÃO

PJe Push - Serviço de Acompanhamento automático de processos

Prezado(a) ,

Informamos que o processo a seguir sofreu movimentação:
Número do Processo: 1000000-12.2023.4.01.3300
Polo Ativo: Xxx da Silva
Polo Passivo: zzzz Augusto
Classe Judicial: PROCEDIMENTO DO JUIZADO ESPECIAL CÍVEL
Órgão: 15ª Vara Federal de Juizado Especial Cível da SJBA
Data de Autuação: 19/06/2023
Tipo de Distribuição: sorteio
Assunto: Indenização por Dano Material

Data	Movimento	Documento
09/09/2025 01:24	Decorrido prazo de SISTEMA DE EDUCACAO SUPERIOR. em 08/09/2025 23:59.	
09/09/2025 00:32	Decorrido prazo de UNIÃO FEDERAL em 08/09/2025 23:59.	
09/09/2025 00:28	Decorrido prazo de DOS SANTOS AMORIM em 08/09/2025 23:59.	

Este é um email automático, não responda.

Atenciosamente,
Sistema PJe Push - TRF1
```

## 🔍 Informações Extraídas

O sistema extrai automaticamente:

- **Número do Processo**: Formato padrão (ex: 1000000-12.2023.4.01.3300)
- **Polo Ativo**: Requerente
- **Polo Passivo**: Requerido
- **Classe Judicial**: Tipo do processo
- **Órgão**: Vara responsável
- **Data de Autuação**: Data de início
- **Tipo de Distribuição**: Como foi distribuído
- **Assunto**: Matéria do processo
- **Movimentações**: Lista de eventos com datas

## 🚀 Como Usar

### 1. **Teste do Parser**
```bash
curl -X POST http://localhost:3001/api/email/test-parser \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"emailContent": "CONTEUDO_DO_EMAIL"}'
```

### 2. **Processar Email Real**
```bash
curl -X POST http://localhost:3001/api/email/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "from": "naoresponda.pje.push1@trf1.jus.br",
    "to": "usuario@email.com",
    "subject": "Movimentação processual do processo 1000000-12.2023.4.01.3300",
    "body": "CONTEUDO_COMPLETO_DO_EMAIL",
    "userId": 16
  }'
```

## 📊 Resultados

Quando um email é processado com sucesso:

1. **Processo Existente**: Atualiza informações e adiciona movimentações
2. **Processo Novo**: Cria automaticamente com dados do email
3. **Alertas**: Gera alertas para novas movimentações
4. **Observações**: Adiciona histórico no campo observações

## 🔒 Segurança

- Todos os endpoints requerem autenticação JWT
- Validação de dados com Joi
- Logs detalhados de todas as operações
- Verificação de remetente (apenas TRF1)

## 📝 Logs

O sistema registra:
- Emails processados com sucesso
- Erros de parsing
- Processos criados/atualizados
- Alertas gerados

## 🛠️ Manutenção

### Arquivos Principais:
- `src/services/emailParser.js` - Parser de emails
- `src/services/processUpdater.js` - Atualizador de processos
- `src/controllers/emailController.js` - Controller da API
- `src/routes/emailRoutes.js` - Rotas da API

### Testes:
- `scripts/test-email-integration.js` - Script de teste
- `examples/trf1-email-example.json` - Exemplo de email

## 🔄 Próximos Passos

1. **Webhook**: Configurar webhook para receber emails automaticamente
2. **Filtros**: Adicionar filtros por tipo de movimentação
3. **Notificações**: Integrar com sistema de notificações push
4. **Relatórios**: Gerar relatórios de emails processados
