/**
 * Controller para testes de email e criação de dados base
 */

import { auth as authenticateToken } from '../middlewares/auth.js';
import { Processo, User } from '../models/index.js';
import EmailSender from '../services/emailSender.js';
import logger from '../config/logger.js';

class TestController {
  constructor() {
    this.emailSender = EmailSender;
  }

  /**
   * Cria um processo base para testes
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  createBaseProcess = async (req, res) => {
    try {
      const userId = req.user.id;

      // Dados do processo base
      const processData = {
        numero: '1000000-12.2023.4.01.3300',
        classe: 'PROCEDIMENTO DO JUIZADO ESPECIAL CÍVEL',
        assunto: 'Indenização por Dano Material',
        tribunal: 'TRF1',
        comarca: '15ª Vara Federal de Juizado Especial Cível da SJBA',
        status: 'ativo',
        dataDistribuicao: new Date('2023-06-19'),
        prazoRecurso: new Date('2025-10-15'),
        prazoEmbargos: new Date('2025-10-20'),
        proximaAudiencia: new Date('2025-09-25'),
        observacoes: `Processo criado como base para testes de integração de email.

Informações do processo:
- Polo Ativo: Xxx da Silva
- Polo Passivo: zzzz Augusto
- Classe: PROCEDIMENTO DO JUIZADO ESPECIAL CÍVEL
- Órgão: 15ª Vara Federal de Juizado Especial Cível da SJBA
- Data de Autuação: 19/06/2023
- Tipo de Distribuição: sorteio

Este processo foi criado automaticamente para testes do sistema de email.`,
        userId: userId
      };

      // Verifica se já existe um processo com este número
      const existingProcess = await Processo.findOne({
        where: {
          numero: processData.numero,
          userId: userId
        }
      });

      if (existingProcess) {
        return res.status(409).json({
          message: 'Processo base já existe',
          processId: existingProcess.id,
          processNumber: existingProcess.numero
        });
      }

      // Cria o processo
      const newProcess = await Processo.create(processData);

      logger.info(`Processo base criado: ${newProcess.numero} (ID: ${newProcess.id})`);

      res.status(201).json({
        message: 'Processo base criado com sucesso',
        process: {
          id: newProcess.id,
          numero: newProcess.numero,
          classe: newProcess.classe,
          assunto: newProcess.assunto,
          tribunal: newProcess.tribunal,
          comarca: newProcess.comarca,
          status: newProcess.status,
          dataDistribuicao: newProcess.dataDistribuicao,
          prazoRecurso: newProcess.prazoRecurso,
          prazoEmbargos: newProcess.prazoEmbargos,
          proximaAudiencia: newProcess.proximaAudiencia
        }
      });

    } catch (error) {
      logger.error('Erro ao criar processo base:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  /**
   * Envia email de teste para webhook
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  sendTestEmail = async (req, res) => {
    try {
      const {
        to = 'mau_oliver@hotmail.com',
        processNumber = '1000000-12.2023.4.01.3300',
        movements = []
      } = req.body;

      // Dados do email de teste
      const emailData = {
        from: 'naoresponda.pje.push1@trf1.jus.br',
        to: to,
        subject: `Movimentação processual do processo ${processNumber}`,
        body: this.generateTRF1EmailBody(processNumber, movements),
        receivedAt: new Date(),
        userId: req.user.id
      };

      // Envia para o webhook local
      const result = await this.emailSender.sendToWebhook(emailData);

      if (result.success) {
        res.status(200).json({
          message: 'Email de teste enviado com sucesso',
          result: result.result,
          emailData: {
            to: emailData.to,
            subject: emailData.subject,
            processNumber: processNumber
          }
        });
      } else {
        res.status(500).json({
          error: 'Erro ao enviar email de teste',
          details: result.error
        });
      }

    } catch (error) {
      logger.error('Erro ao enviar email de teste:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  /**
   * Gera o corpo do email TRF1
   * @param {string} processNumber - Número do processo
   * @param {Array} movements - Movimentações
   * @returns {string}
   */
  generateTRF1EmailBody(processNumber, movements) {
    const defaultMovements = [
      {
        date: '09/09/2025',
        time: '01:24',
        movement: 'Decorrido prazo de SISTEMA DE EDUCACAO SUPERIOR. em 08/09/2025 23:59.'
      },
      {
        date: '09/09/2025',
        time: '00:32',
        movement: 'Decorrido prazo de UNIÃO FEDERAL em 08/09/2025 23:59.'
      },
      {
        date: '09/09/2025',
        time: '00:28',
        movement: 'Decorrido prazo de DOS SANTOS AMORIM em 08/09/2025 23:59.'
      }
    ];

    const movementsToUse = movements.length > 0 ? movements : defaultMovements;
    const movementsTable = movementsToUse.map(m => 
      `${m.date} ${m.time}\t${m.movement}\t`
    ).join('\n');

    return `JUSTIÇA FEDERAL DA 1ª REGIÃO

PJe Push - Serviço de Acompanhamento automático de processos

Prezado(a) ,

Informamos que o processo a seguir sofreu movimentação:
Número do Processo: ${processNumber}
Polo Ativo: Xxx da Silva
Polo Passivo: zzzz Augusto
Classe Judicial: PROCEDIMENTO DO JUIZADO ESPECIAL CÍVEL
Órgão: 15ª Vara Federal de Juizado Especial Cível da SJBA
Data de Autuação: 19/06/2023
Tipo de Distribuição: sorteio
Assunto: Indenização por Dano Material

Data\tMovimento\tDocumento
${movementsTable}

Este é um email automático, não responda.

Atenciosamente,
Sistema PJe Push - TRF1`;
  }

  /**
   * Lista processos de teste do usuário
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  listTestProcesses = async (req, res) => {
    try {
      const userId = req.user.id;

      const processes = await Processo.findAll({
        where: { userId: userId },
        order: [['created_at', 'DESC']],
        limit: 10
      });

      res.status(200).json({
        message: 'Processos de teste listados',
        processes: processes.map(p => ({
          id: p.id,
          numero: p.numero,
          classe: p.classe,
          assunto: p.assunto,
          status: p.status,
          dataDistribuicao: p.dataDistribuicao,
          prazoRecurso: p.prazoRecurso,
          prazoEmbargos: p.prazoEmbargos,
          proximaAudiencia: p.proximaAudiencia,
          createdAt: p.createdAt
        }))
      });

    } catch (error) {
      logger.error('Erro ao listar processos de teste:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }
}

export default new TestController();
