import express from 'express';
import { auth } from '../middlewares/auth.js';
import {
  validateRouteParams,
  validateQueryParams,
  validateMaliciousContent
} from '../middlewares/inputValidation.js';
import {
  listarAlertas,
  buscarAlerta,
  marcarComoLido,
  marcarMultiplosComoLidos,
  removerAlerta,
  estatisticasAlertas
} from '../controllers/alertController.js';

const router = express.Router();

// Middleware de validação de conteúdo malicioso para todas as rotas
router.use(validateMaliciousContent);

// Todas as rotas de alertas requerem autenticação
router.use(auth);

// CRUD de alertas
router.get('/', validateQueryParams(['page', 'limit', 'status', 'priority', 'search']), listarAlertas);
router.get('/stats', estatisticasAlertas);
router.get('/:id', validateRouteParams({ id: { type: 'number', required: true } }), buscarAlerta);
router.patch('/:id/read', validateRouteParams({ id: { type: 'number', required: true } }), marcarComoLido);
router.patch('/mark-multiple', marcarMultiplosComoLidos);
router.delete('/:id', validateRouteParams({ id: { type: 'number', required: true } }), removerAlerta);

export default router;
