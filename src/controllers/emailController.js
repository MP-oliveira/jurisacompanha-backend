/**
 * Controller para processamento de emails do TRF1
 */

import Joi from 'joi';
import EmailParser from '../services/emailParser.js';
import ProcessUpdater from '../services/processUpdater.js';
import { User } from '../models/index.js';
import logger from '../config/logger.js';

// Esquema de validação para o email
const emailSchema = Joi.object({
  from: Joi.string().email().required(),
  to: Joi.string().email().required(),
  subject: Joi.string().required(),
  body: Joi.string().required(),
  receivedAt: Joi.date().optional(),
  userId: Joi.number().integer().optional() // Para identificar o usuário
});

class EmailController {
  constructor() {
    this.emailParser = new EmailParser();
    this.processUpdater = new ProcessUpdater();
  }

  /**
   * Processa um email recebido
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  processEmail = async (req, res) => {
    try {
      // Valida os dados do email
      const { error, value } = emailSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Dados do email inválidos',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      const email = value;
      
      // Verifica se é um email do TRF1
      if (!this.emailParser.isTRF1Notification(email)) {
        return res.status(200).json({
          message: 'Email não é uma notificação do TRF1',
          processed: false
        });
      }

      // Faz o parsing do email
      const parsedEmail = this.emailParser.parseEmail(email);
      if (!parsedEmail) {
        return res.status(400).json({
          error: 'Não foi possível extrair informações do email'
        });
      }

      // Determina o usuário
      let userId = email.userId;
      if (!userId) {
        // Se não especificado, tenta encontrar pelo email de destino
        const user = await User.findOne({
          where: { email: email.to }
        });
        if (!user) {
          return res.status(404).json({
            error: 'Usuário não encontrado para o email de destino'
          });
        }
        userId = user.id;
      }

      // Tenta atualizar processo existente
      let result = await this.processUpdater.updateProcessFromEmail(parsedEmail, userId);
      
      // Se não encontrou o processo, oferece criar um novo
      if (!result.success && result.message === 'Processo não encontrado') {
        result = await this.processUpdater.createProcessFromEmail(parsedEmail, userId);
      }

      if (result.success) {
        logger.info(`Email processado com sucesso para processo ${parsedEmail.numero}`);
        return res.status(200).json({
          message: result.message,
          processNumber: result.processNumber,
          processId: result.processId,
          movementsProcessed: result.movementsProcessed,
          processed: true
        });
      } else {
        logger.error(`Erro ao processar email: ${result.message}`);
        return res.status(500).json({
          error: result.message,
          details: result.error
        });
      }

    } catch (error) {
      logger.error('Erro no processamento de email:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  /**
   * Endpoint para teste do parser de email
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  testParser = async (req, res) => {
    try {
      const { emailContent } = req.body;
      
      if (!emailContent) {
        return res.status(400).json({
          error: 'Conteúdo do email é obrigatório'
        });
      }

      // Cria um objeto email simulado
      const simulatedEmail = {
        from: 'naoresponda.pje.push1@trf1.jus.br',
        subject: 'Movimentação processual do processo 1000000-12.2023.4.01.3300',
        body: emailContent
      };

      // Testa o parser
      const parsedResult = this.emailParser.parseEmail(simulatedEmail);
      
      if (parsedResult) {
        return res.status(200).json({
          message: 'Email parseado com sucesso',
          parsed: parsedResult,
          isTRF1Notification: true
        });
      } else {
        return res.status(400).json({
          message: 'Email não é uma notificação válida do TRF1',
          isTRF1Notification: false
        });
      }

    } catch (error) {
      logger.error('Erro no teste do parser:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  /**
   * Lista emails processados recentemente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getProcessedEmails = async (req, res) => {
    try {
      // Por enquanto, retorna uma lista vazia
      // Em uma implementação completa, isso seria salvo no banco
      return res.status(200).json({
        message: 'Lista de emails processados',
        emails: []
      });

    } catch (error) {
      logger.error('Erro ao buscar emails processados:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }
}

const emailController = new EmailController();
export default emailController;
