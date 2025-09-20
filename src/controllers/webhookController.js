/**
 * Controller para webhook público de emails
 */

import EmailParser from '../services/emailParser.js';
import ProcessUpdater from '../services/processUpdater.js';
import { User } from '../models/index.js';
import logger from '../config/logger.js';

// Esquema de validação para webhook
const webhookSchema = {
  from: 'string',
  to: 'string', 
  subject: 'string',
  body: 'string',
  receivedAt: 'date'
};

class WebhookController {
  constructor() {
    this.emailParser = new EmailParser();
    this.processUpdater = new ProcessUpdater();
  }

  /**
   * Endpoint público para receber emails (webhook)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  processEmailWebhook = async (req, res) => {
    try {
      // Log do webhook recebido
      logger.info('Webhook de email recebido:', {
        from: req.body.from,
        to: req.body.to,
        subject: req.body.subject,
        timestamp: new Date().toISOString()
      });

      // Validação básica
      if (!req.body.from || !req.body.subject || !req.body.body) {
        return res.status(400).json({
          error: 'Dados do email inválidos',
          received: {
            from: !!req.body.from,
            subject: !!req.body.subject,
            body: !!req.body.body
          }
        });
      }

      const emailData = {
        from: req.body.from,
        to: req.body.to || 'sistema@acompanhamento.com',
        subject: req.body.subject,
        body: req.body.body,
        receivedAt: req.body.receivedAt || new Date()
      };

      // Verifica se é um email do TRF1
      if (!this.emailParser.isTRF1Notification(emailData)) {
        logger.info('Email não é do TRF1, ignorando');
        return res.status(200).json({
          message: 'Email não é uma notificação do TRF1',
          processed: false
        });
      }

      // Faz o parsing do email
      const parsedEmail = this.emailParser.parseEmail(emailData);
      if (!parsedEmail) {
        return res.status(400).json({
          error: 'Não foi possível extrair informações do email'
        });
      }

      // Determina o usuário pelo email de destino
      let userId = req.body.userId;
      if (!userId) {
        const user = await User.findOne({
          where: { email: emailData.to }
        });
        
        if (!user) {
          logger.warn(`Usuário não encontrado para email: ${emailData.to}`);
          return res.status(404).json({
            error: 'Usuário não encontrado para o email de destino',
            email: emailData.to
          });
        }
        
        userId = user.id;
      }

      // Tenta atualizar processo existente
      let result = await this.processUpdater.updateProcessFromEmail(parsedEmail, userId);
      
      // Se não encontrou o processo, cria um novo
      if (!result.success && result.message === 'Processo não encontrado') {
        result = await this.processUpdater.createProcessFromEmail(parsedEmail, userId);
      }

      if (result.success) {
        logger.info(`Email processado com sucesso via webhook para processo ${parsedEmail.numero}`);
        return res.status(200).json({
          message: result.message,
          processNumber: result.processNumber,
          processId: result.processId,
          movementsProcessed: result.movementsProcessed,
          processed: true,
          timestamp: new Date().toISOString()
        });
      } else {
        logger.error(`Erro ao processar email via webhook: ${result.message}`);
        return res.status(500).json({
          error: result.message,
          details: result.error
        });
      }

    } catch (error) {
      logger.error('Erro no webhook de email:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Endpoint para teste do webhook
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  testWebhook = async (req, res) => {
    try {
      const testEmail = {
        from: 'naoresponda.pje.push1@trf1.jus.br',
        to: 'teste@acompanhamento.com',
        subject: 'Movimentação processual do processo 1000000-12.2023.4.01.3300',
        body: `JUSTIÇA FEDERAL DA 1ª REGIÃO

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

Data\tMovimento\tDocumento
09/09/2025 01:24\tDecorrido prazo de SISTEMA DE EDUCACAO SUPERIOR. em 08/09/2025 23:59.\t
09/09/2025 00:32\tDecorrido prazo de UNIÃO FEDERAL em 08/09/2025 23:59.\t
09/09/2025 00:28\tDecorrido prazo de DOS SANTOS AMORIM em 08/09/2025 23:59.\t

Este é um email automático, não responda.

Atenciosamente,
Sistema PJe Push - TRF1`,
        receivedAt: new Date()
      };

      // Processa o email de teste
      const result = await this.processEmailWebhook({ body: testEmail }, res);
      
      return result;

    } catch (error) {
      logger.error('Erro no teste do webhook:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }
}

export default new WebhookController();
