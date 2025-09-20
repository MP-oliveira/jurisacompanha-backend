/**
 * Serviço para envio de emails de teste
 */

import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

class EmailSender {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Inicializa o transporter de email
   */
  initializeTransporter() {
    // Configuração para Gmail (você pode usar outros provedores)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'seu-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'sua-senha-app'
      }
    });
  }

  /**
   * Envia um email de teste do TRF1
   * @param {Object} options - Opções do email
   * @returns {Promise<Object>}
   */
  async sendTestTRF1Email(options = {}) {
    try {
      const {
        to = 'mau_oliver@hotmail.com',
        processNumber = '1000000-12.2023.4.01.3300',
        movements = []
      } = options;

      // Template do email TRF1
      const emailTemplate = this.generateTRF1EmailTemplate(processNumber, movements);

      const mailOptions = {
        from: 'naoresponda.pje.push1@trf1.jus.br',
        to: to,
        subject: `Movimentação processual do processo ${processNumber}`,
        html: emailTemplate.html,
        text: emailTemplate.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email TRF1 de teste enviado para ${to}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        to: to,
        subject: mailOptions.subject
      };

    } catch (error) {
      logger.error('Erro ao enviar email de teste:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gera o template do email TRF1
   * @param {string} processNumber - Número do processo
   * @param {Array} movements - Movimentações
   * @returns {Object}
   */
  generateTRF1EmailTemplate(processNumber, movements) {
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

    const text = `JUSTIÇA FEDERAL DA 1ª REGIÃO

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

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Movimentação Processual - TRF1</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #1e3a8a; color: white; padding: 15px; text-align: center; }
        .content { margin: 20px 0; }
        .process-info { background-color: #f3f4f6; padding: 15px; margin: 10px 0; }
        .movements-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .movements-table th, .movements-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .movements-table th { background-color: #e5e7eb; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h2>JUSTIÇA FEDERAL DA 1ª REGIÃO</h2>
        <p>PJe Push - Serviço de Acompanhamento automático de processos</p>
    </div>
    
    <div class="content">
        <p>Prezado(a) ,</p>
        
        <p>Informamos que o processo a seguir sofreu movimentação:</p>
        
        <div class="process-info">
            <strong>Número do Processo:</strong> ${processNumber}<br>
            <strong>Polo Ativo:</strong> Xxx da Silva<br>
            <strong>Polo Passivo:</strong> zzzz Augusto<br>
            <strong>Classe Judicial:</strong> PROCEDIMENTO DO JUIZADO ESPECIAL CÍVEL<br>
            <strong>Órgão:</strong> 15ª Vara Federal de Juizado Especial Cível da SJBA<br>
            <strong>Data de Autuação:</strong> 19/06/2023<br>
            <strong>Tipo de Distribuição:</strong> sorteio<br>
            <strong>Assunto:</strong> Indenização por Dano Material
        </div>
        
        <table class="movements-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Movimento</th>
                    <th>Documento</th>
                </tr>
            </thead>
            <tbody>
                ${movementsToUse.map(m => `
                    <tr>
                        <td>${m.date} ${m.time}</td>
                        <td>${m.movement}</td>
                        <td></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="footer">
        <p>Este é um email automático, não responda.</p>
        <p>Atenciosamente,<br>Sistema PJe Push - TRF1</p>
    </div>
</body>
</html>`;

    return { text, html };
  }

  /**
   * Envia email para webhook local (para testes)
   * @param {Object} emailData - Dados do email
   * @returns {Promise<Object>}
   */
  async sendToWebhook(emailData) {
    try {
      const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3001/api/email/webhook';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();
      
      logger.info(`Email enviado para webhook: ${response.status}`);
      
      return {
        success: response.ok,
        status: response.status,
        result: result
      };

    } catch (error) {
      logger.error('Erro ao enviar para webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new EmailSender();
