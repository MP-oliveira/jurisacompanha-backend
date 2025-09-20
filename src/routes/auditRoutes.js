import express from 'express';
import { body, query, param } from 'express-validator';
import AuditController from '../controllers/auditController.js';
import { auth as authenticate } from '../middlewares/auth.js';
import { auditMiddleware } from '../middlewares/auditMiddleware.js';

const router = express.Router();

// Middleware de auditoria para todas as rotas
router.use(auditMiddleware());

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Validações
const validateAuditQuery = [
  query('userId').optional().isInt({ min: 1 }).withMessage('ID do usuário deve ser um número inteiro positivo'),
  query('action').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Ação deve ter entre 1 e 100 caracteres'),
  query('resource').optional().isString().isLength({ min: 1, max: 50 }).withMessage('Recurso deve ter entre 1 e 50 caracteres'),
  query('status').optional().isIn(['SUCCESS', 'FAILED', 'WARNING']).withMessage('Status deve ser SUCCESS, FAILED ou WARNING'),
  query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Severidade deve ser LOW, MEDIUM, HIGH ou CRITICAL'),
  query('startDate').optional().isISO8601().withMessage('Data de início deve estar no formato ISO 8601'),
  query('endDate').optional().isISO8601().withMessage('Data de fim deve estar no formato ISO 8601'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limite deve ser entre 1 e 1000'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset deve ser um número inteiro não negativo'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Dias deve ser entre 1 e 365')
];

const validateUserId = [
  param('userId').isInt({ min: 1 }).withMessage('ID do usuário deve ser um número inteiro positivo')
];

/**
 * @route GET /api/audit/logs
 * @desc Lista logs de auditoria com filtros
 * @access Admin only
 */
router.get('/logs', validateAuditQuery, AuditController.getLogs);

/**
 * @route GET /api/audit/stats
 * @desc Busca estatísticas de auditoria
 * @access Admin only
 */
router.get('/stats', validateAuditQuery, AuditController.getStats);

/**
 * @route GET /api/audit/user/:userId
 * @desc Busca logs de um usuário específico
 * @access User (próprios logs) ou Admin (qualquer usuário)
 */
router.get('/user/:userId', validateUserId, validateAuditQuery, AuditController.getUserLogs);

/**
 * @route GET /api/audit/security
 * @desc Busca logs de segurança
 * @access Admin only
 */
router.get('/security', validateAuditQuery, AuditController.getSecurityLogs);

export default router;
