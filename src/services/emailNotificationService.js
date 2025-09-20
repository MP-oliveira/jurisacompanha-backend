// backend/src/services/emailNotificationService.js
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

// Configuração do transporter de email
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Envia notificação por email para um usuário específico
 * @param {string} to - Email do destinatário
 * @param {string} subject - Assunto do email
 * @param {string} htmlContent - Conteúdo HTML do email
 * @param {Object} data - Dados adicionais (opcional)
 */
export const sendEmailNotification = async (to, subject, htmlContent, data = {}) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"JurisAcompanha" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      // Anexos opcionais
      ...(data.attachments && { attachments: data.attachments }),
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info('✅ Email de notificação enviado com sucesso', {
      to,
      subject,
      messageId: result.messageId,
    });
    
    return {
      success: true,
      messageId: result.messageId,
      to,
      subject,
    };
  } catch (error) {
    logger.error('❌ Erro ao enviar email de notificação:', {
      to,
      subject,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Envia notificação de alerta por email
 * @param {Object} user - Dados do usuário
 * @param {Object} alert - Dados do alerta
 * @param {Object} processo - Dados do processo (opcional)
 */
export const sendAlertEmailNotification = async (user, alert, processo = null) => {
  const subject = `🚨 Alerta JurisAcompanha: ${alert.titulo}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .alert-card { background: white; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .priority-high { border-left-color: #ef4444; }
        .priority-medium { border-left-color: #f59e0b; }
        .priority-low { border-left-color: #10b981; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 JurisAcompanha</h1>
          <p>Notificação de Alerta</p>
        </div>
        
        <div class="content">
          <h2>Olá, ${user.nome}!</h2>
          
          <div class="alert-card priority-${alert.prioridade}">
            <h3>${alert.titulo}</h3>
            <p><strong>Tipo:</strong> ${alert.tipo}</p>
            <p><strong>Prioridade:</strong> ${alert.prioridade.toUpperCase()}</p>
            <p><strong>Data de Vencimento:</strong> ${new Date(alert.dataVencimento).toLocaleDateString('pt-BR')}</p>
            <p><strong>Mensagem:</strong></p>
            <p>${alert.mensagem}</p>
            
            ${processo ? `
              <hr style="margin: 15px 0;">
              <h4>📋 Processo Relacionado:</h4>
              <p><strong>Número:</strong> ${processo.numero}</p>
              <p><strong>Classe:</strong> ${processo.classe}</p>
              <p><strong>Assunto:</strong> ${processo.assunto}</p>
              <p><strong>Tribunal:</strong> ${processo.tribunal}</p>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL}/alertas" class="button">
              📋 Ver Alertas
            </a>
            ${processo ? `
              <a href="${process.env.FRONTEND_URL}/processos/${processo.id}" class="button">
                📄 Ver Processo
              </a>
            ` : ''}
          </div>
        </div>
        
        <div class="footer">
          <p>Este é um email automático do sistema JurisAcompanha.</p>
          <p>Para desativar notificações por email, acesse suas configurações.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(user.email, subject, htmlContent);
};

/**
 * Envia notificação de processo atualizado por email
 * @param {Object} user - Dados do usuário
 * @param {Object} processo - Dados do processo
 * @param {string} tipoAtualizacao - Tipo da atualização
 */
export const sendProcessUpdateEmailNotification = async (user, processo, tipoAtualizacao) => {
  const subject = `📄 Processo Atualizado: ${processo.numero}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .process-card { background: white; border: 1px solid #e5e7eb; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .update-badge { display: inline-block; background: #059669; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 JurisAcompanha</h1>
          <p>Atualização de Processo</p>
        </div>
        
        <div class="content">
          <h2>Olá, ${user.nome}!</h2>
          
          <div class="process-card">
            <span class="update-badge">${tipoAtualizacao.toUpperCase()}</span>
            <h3>${processo.numero}</h3>
            <p><strong>Classe:</strong> ${processo.classe}</p>
            <p><strong>Assunto:</strong> ${processo.assunto}</p>
            <p><strong>Tribunal:</strong> ${processo.tribunal}</p>
            <p><strong>Status:</strong> ${processo.status}</p>
            
            ${processo.dataSentenca ? `
              <p><strong>Data da Sentença:</strong> ${new Date(processo.dataSentenca).toLocaleDateString('pt-BR')}</p>
            ` : ''}
            
            ${processo.observacoes ? `
              <p><strong>Observações:</strong></p>
              <p style="background: #f1f5f9; padding: 10px; border-radius: 4px;">${processo.observacoes}</p>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL}/processos/${processo.id}" class="button">
              📄 Ver Processo Completo
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Este é um email automático do sistema JurisAcompanha.</p>
          <p>Para desativar notificações por email, acesse suas configurações.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(user.email, subject, htmlContent);
};

/**
 * Envia notificação de relatório concluído por email
 * @param {Object} user - Dados do usuário
 * @param {Object} relatorio - Dados do relatório
 */
export const sendReportCompletedEmailNotification = async (user, relatorio) => {
  const subject = `📊 Relatório Concluído: ${relatorio.tipo}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .report-card { background: white; border: 1px solid #e5e7eb; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 JurisAcompanha</h1>
          <p>Relatório Concluído</p>
        </div>
        
        <div class="content">
          <h2>Olá, ${user.nome}!</h2>
          
          <div class="report-card">
            <h3>📊 ${relatorio.tipo}</h3>
            <p><strong>Status:</strong> ${relatorio.status}</p>
            <p><strong>Data de Criação:</strong> ${new Date(relatorio.createdAt).toLocaleDateString('pt-BR')}</p>
            <p><strong>Período:</strong> ${relatorio.periodo || 'N/A'}</p>
            
            ${relatorio.observacoes ? `
              <p><strong>Observações:</strong></p>
              <p style="background: #f1f5f9; padding: 10px; border-radius: 4px;">${relatorio.observacoes}</p>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL}/relatorios/${relatorio.id}" class="button">
              📊 Baixar Relatório
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Este é um email automático do sistema JurisAcompanha.</p>
          <p>Para desativar notificações por email, acesse suas configurações.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(user.email, subject, htmlContent);
};

/**
 * Envia email de teste
 * @param {string} to - Email do destinatário
 */
export const sendTestEmail = async (to) => {
  const subject = '🧪 Teste de Email - JurisAcompanha';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .success { background: #dcfce7; border: 1px solid #16a34a; color: #166534; padding: 15px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧪 JurisAcompanha</h1>
          <p>Teste de Configuração de Email</p>
        </div>
        
        <div class="content">
          <div class="success">
            <h3>✅ Configuração de Email Funcionando!</h3>
            <p>Se você está recebendo este email, significa que a configuração de notificações por email do JurisAcompanha está funcionando corretamente.</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <p>A partir de agora, você receberá notificações automáticas sobre:</p>
          <ul>
            <li>🚨 Novos alertas e prazos</li>
            <li>📄 Atualizações de processos</li>
            <li>📊 Relatórios concluídos</li>
            <li>🔔 Outras notificações importantes</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(to, subject, htmlContent);
};
