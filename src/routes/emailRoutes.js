/**
 * Rotas para processamento de emails
 */

import express from 'express';
import { auth as authenticateToken } from '../middlewares/auth.js';
import emailController from '../controllers/emailController.js';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

/**
 * @swagger
 * /api/email/process:
 *   post:
 *     summary: Processa um email recebido
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from
 *               - to
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
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/process', emailController.processEmail);

/**
 * @swagger
 * /api/email/test-parser:
 *   post:
 *     summary: Testa o parser de email
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailContent
 *             properties:
 *               emailContent:
 *                 type: string
 *                 description: Conteúdo do email para teste
 *     responses:
 *       200:
 *         description: Teste realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 parsed:
 *                   type: object
 *                 isTRF1Notification:
 *                   type: boolean
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/test-parser', emailController.testParser);

/**
 * @swagger
 * /api/email/processed:
 *   get:
 *     summary: Lista emails processados recentemente
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de emails processados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 emails:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/processed', emailController.getProcessedEmails);

export default router;
