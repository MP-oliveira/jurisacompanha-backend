# 📧 Configuração de Email - JurisAcompanha

## 🔧 Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `backend/.env`:

```env
# Configurações SMTP para envio de emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app

# URL do frontend para links nos emails
FRONTEND_URL=http://localhost:5174
```

## 📋 Configurações por Provedor

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
```

**⚠️ Importante:** Para Gmail, você precisa:
1. Ativar a verificação em 2 etapas
2. Gerar uma "Senha de App" específica
3. Usar a senha de app no lugar da senha normal

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@outlook.com
SMTP_PASS=sua_senha
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@yahoo.com
SMTP_PASS=sua_senha_de_app
```

### SendGrid (Recomendado para Produção)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=sua_api_key_do_sendgrid
```

## 🚀 Como Testar

1. **Configure as variáveis** no arquivo `.env`
2. **Reinicie o backend**: `npm start`
3. **Acesse**: Configurações > Notificações > "Enviar Email de Teste"
4. **Verifique** sua caixa de entrada

## 🔒 Segurança

- **Nunca** commite o arquivo `.env` no Git
- Use **senhas de app** para Gmail/Yahoo
- Para produção, considere usar **SendGrid** ou **AWS SES**
- Configure **rate limiting** para evitar spam

## 📧 Templates Disponíveis

O sistema inclui templates profissionais para:

- ✅ **Alertas e Prazos** - Notificações urgentes
- ✅ **Atualizações de Processos** - Mudanças importantes
- ✅ **Relatórios Concluídos** - Documentos prontos
- ✅ **Email de Teste** - Verificação de configuração
- ✅ **Resumo Semanal** - Digest de atividades

## 🎯 Próximos Passos

1. Configure as variáveis SMTP
2. Teste o envio de emails
3. Configure as preferências de notificação
4. Teste as notificações automáticas

## ❓ Problemas Comuns

### "Authentication failed"
- Verifique se a senha está correta
- Para Gmail, use senha de app
- Verifique se a verificação em 2 etapas está ativa

### "Connection timeout"
- Verifique o host e porta SMTP
- Teste a conectividade de rede
- Verifique firewall/proxy

### "Email não chega"
- Verifique a pasta de spam
- Confirme o endereço de email
- Teste com um email diferente
