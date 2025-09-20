// backend/src/controllers/emailNotificationController.js
import {
  sendAlertEmailNotification,
  sendProcessUpdateEmailNotification,
  sendReportCompletedEmailNotification,
  sendTestEmail,
  sendEmailNotification,
} from '../services/emailNotificationService.js';
import User from '../models/User.js';
import Alert from '../models/Alert.js';
import Processo from '../models/Processo.js';
import Relatorio from '../models/Relatorio.js';
import logger from '../config/logger.js';

/**
 * Envia email de teste para o usuário logado
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
export const sendTestEmailNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const result = await sendTestEmail(user.email);
    
    logger.info('Email de teste enviado com sucesso', {
      userId,
      email: user.email,
      messageId: result.messageId,
    });

    return res.status(200).json({
      message: 'Email de teste enviado com sucesso.',
      messageId: result.messageId,
    });
  } catch (error) {
    logger.error('Erro ao enviar email de teste:', {
      userId: req.user.id,
      error: error.message,
    });
    return res.status(500).json({ error: 'Erro interno do servidor ao enviar email de teste.' });
  }
};

/**
 * Envia notificação de alerta por email
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
export const sendAlertEmail = async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user.id;

    // Buscar o alerta
    const alert = await Alert.findOne({
      where: { id: alertId, userId },
      include: [
        {
          model: Processo,
          as: 'processo',
          required: false,
        },
      ],
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alerta não encontrado.' });
    }

    // Buscar dados do usuário
    const user = await User.findByPk(userId);

    // Enviar email
    const result = await sendAlertEmailNotification(user, alert, alert.processo);
    
    logger.info('Email de alerta enviado com sucesso', {
      userId,
      alertId,
      messageId: result.messageId,
    });

    return res.status(200).json({
      message: 'Email de alerta enviado com sucesso.',
      messageId: result.messageId,
    });
  } catch (error) {
    logger.error('Erro ao enviar email de alerta:', {
      userId: req.user.id,
      alertId: req.params.alertId,
      error: error.message,
    });
    return res.status(500).json({ error: 'Erro interno do servidor ao enviar email de alerta.' });
  }
};

/**
 * Envia notificação de processo atualizado por email
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
export const sendProcessUpdateEmail = async (req, res) => {
  try {
    const { processoId } = req.params;
    const { tipoAtualizacao = 'atualização' } = req.body;
    const userId = req.user.id;

    // Buscar o processo
    const processo = await Processo.findOne({
      where: { id: processoId, userId },
    });

    if (!processo) {
      return res.status(404).json({ error: 'Processo não encontrado.' });
    }

    // Buscar dados do usuário
    const user = await User.findByPk(userId);

    // Enviar email
    const result = await sendProcessUpdateEmailNotification(user, processo, tipoAtualizacao);
    
    logger.info('Email de atualização de processo enviado com sucesso', {
      userId,
      processoId,
      tipoAtualizacao,
      messageId: result.messageId,
    });

    return res.status(200).json({
      message: 'Email de atualização de processo enviado com sucesso.',
      messageId: result.messageId,
    });
  } catch (error) {
    logger.error('Erro ao enviar email de atualização de processo:', {
      userId: req.user.id,
      processoId: req.params.processoId,
      error: error.message,
    });
    return res.status(500).json({ error: 'Erro interno do servidor ao enviar email de atualização.' });
  }
};

/**
 * Envia notificação de relatório concluído por email
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
export const sendReportCompletedEmail = async (req, res) => {
  try {
    const { relatorioId } = req.params;
    const userId = req.user.id;

    // Buscar o relatório
    const relatorio = await Relatorio.findOne({
      where: { id: relatorioId, userId },
    });

    if (!relatorio) {
      return res.status(404).json({ error: 'Relatório não encontrado.' });
    }

    // Buscar dados do usuário
    const user = await User.findByPk(userId);

    // Enviar email
    const result = await sendReportCompletedEmailNotification(user, relatorio);
    
    logger.info('Email de relatório concluído enviado com sucesso', {
      userId,
      relatorioId,
      messageId: result.messageId,
    });

    return res.status(200).json({
      message: 'Email de relatório concluído enviado com sucesso.',
      messageId: result.messageId,
    });
  } catch (error) {
    logger.error('Erro ao enviar email de relatório concluído:', {
      userId: req.user.id,
      relatorioId: req.params.relatorioId,
      error: error.message,
    });
    return res.status(500).json({ error: 'Erro interno do servidor ao enviar email de relatório.' });
  }
};

/**
 * Envia notificação personalizada por email
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
export const sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, content } = req.body;
    const userId = req.user.id;

    // Validar dados
    if (!to || !subject || !content) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: to, subject, content.' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Formato de email inválido.' });
    }

    // Verificar se o usuário tem permissão (apenas admin ou o próprio usuário)
    const user = await User.findByPk(userId);
    const targetUser = await User.findOne({ where: { email: to } });
    
    if (user.role !== 'admin' && (!targetUser || targetUser.id !== userId)) {
      return res.status(403).json({ 
        error: 'Você só pode enviar emails para seu próprio endereço.' 
      });
    }

    // Enviar email
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
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 JurisAcompanha</h1>
            <p>Notificação Personalizada</p>
          </div>
          
          <div class="content">
            ${content.replace(/\n/g, '<br>')}
          </div>
          
          <div class="footer">
            <p>Este é um email enviado através do sistema JurisAcompanha.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailNotification(to, subject, htmlContent);
    
    logger.info('Email personalizado enviado com sucesso', {
      userId,
      to,
      subject,
      messageId: result.messageId,
    });

    return res.status(200).json({
      message: 'Email personalizado enviado com sucesso.',
      messageId: result.messageId,
    });
  } catch (error) {
    logger.error('Erro ao enviar email personalizado:', {
      userId: req.user.id,
      to: req.body.to,
      error: error.message,
    });
    return res.status(500).json({ error: 'Erro interno do servidor ao enviar email personalizado.' });
  }
};
