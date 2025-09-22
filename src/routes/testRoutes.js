/**
 * Rotas para testes de email e dados base
 */

import express from 'express';
import { auth as authenticateToken } from '../middlewares/auth.js';
import testController from '../controllers/testController.js';

const router = express.Router();

// Endpoint de teste sem autenticação
router.get('/db-test', testController.testDatabaseConnection);

// Todas as outras rotas de teste requerem autenticação
router.use(authenticateToken);

/**
 * @swagger
 * /api/test/create-base-process:
 *   post:
 *     summary: Cria um processo base para testes
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Processo base criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 process:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     numero:
 *                       type: string
 *                     classe:
 *                       type: string
 *                     assunto:
 *                       type: string
 *                     tribunal:
 *                       type: string
 *                     comarca:
 *                       type: string
 *                     status:
 *                       type: string
 *                     dataDistribuicao:
 *                       type: string
 *                       format: date
 *                     prazoRecurso:
 *                       type: string
 *                       format: date
 *                     prazoEmbargos:
 *                       type: string
 *                       format: date
 *                     proximaAudiencia:
 *                       type: string
 *                       format: date
 *       409:
 *         description: Processo base já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/create-base-process', testController.createBaseProcess);

/**
 * @swagger
 * /api/test/send-test-email:
 *   post:
 *     summary: Envia email de teste para webhook
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Email de destino
 *                 default: mau_oliver@hotmail.com
 *               processNumber:
 *                 type: string
 *                 description: Número do processo
 *                 default: 1000000-12.2023.4.01.3300
 *               movements:
 *                 type: array
 *                 description: Lista de movimentações personalizadas
 *                 items:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                     time:
 *                       type: string
 *                     movement:
 *                       type: string
 *     responses:
 *       200:
 *         description: Email de teste enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                 emailData:
 *                   type: object
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/send-test-email', testController.sendTestEmail);

/**
 * @swagger
 * /api/test/list-processes:
 *   get:
 *     summary: Lista processos de teste do usuário
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de processos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 processes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       numero:
 *                         type: string
 *                       classe:
 *                         type: string
 *                       assunto:
 *                         type: string
 *                       status:
 *                         type: string
 *                       dataDistribuicao:
 *                         type: string
 *                         format: date
 *                       prazoRecurso:
 *                         type: string
 *                         format: date
 *                       prazoEmbargos:
 *                         type: string
 *                         format: date
 *                       proximaAudiencia:
 *                         type: string
 *                         format: date
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/list-processes', testController.listTestProcesses);

export default router;
