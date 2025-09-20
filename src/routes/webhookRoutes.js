/**
 * Rotas para webhook público de emails
 */

import express from 'express';
import webhookController from '../controllers/webhookController.js';

const router = express.Router();

// Middleware para logs de webhook
router.use((req, res, next) => {
  next();
});

/**
 * @swagger
 * /api/email/webhook:
 *   post:
 *     summary: Webhook público para receber emails
 *     tags: [Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from
 *               - subject
 *               - body
 *             properties:
 *               from:
 *                 type: string
 *                 format: email
 *                 description: Email do remetente
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Email do destinatário
 *               subject:
 *                 type: string
 *                 description: Assunto do email
 *               body:
 *                 type: string
 *                 description: Corpo do email
 *               receivedAt:
 *                 type: string
 *                 format: date-time
 *                 description: Data de recebimento
 *               userId:
 *                 type: integer
 *                 description: ID do usuário (opcional)
 *     responses:
 *       200:
 *         description: Email processado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 processNumber:
 *                   type: string
 *                 processId:
 *                   type: integer
 *                 movementsProcessed:
 *                   type: integer
 *                 processed:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/webhook', webhookController.processEmailWebhook);

/**
 * @swagger
 * /api/email/webhook/test:
 *   post:
 *     summary: Testa o webhook com dados de exemplo
 *     tags: [Webhook]
 *     responses:
 *       200:
 *         description: Teste realizado com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/test', webhookController.testWebhook);

export default router;
