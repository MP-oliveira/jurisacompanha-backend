import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { validateQueryParams } from '../middlewares/inputValidation.js';
import {
  listarRelatorios,
  buscarRelatorio,
  gerarRelatorio,
  atualizarRelatorio,
  removerRelatorio,
  estatisticasRelatorios
} from '../controllers/relatorioController.js';

const router = Router();

// Todas as rotas de relatórios requerem autenticação
router.use(auth);

// CRUD de relatórios
router.get('/', validateQueryParams(['page', 'limit', 'search', 'tipo', 'status']), listarRelatorios);
router.get('/stats', estatisticasRelatorios);
router.get('/:id', buscarRelatorio);
router.post('/', gerarRelatorio);
router.put('/:id', atualizarRelatorio);
router.delete('/:id', removerRelatorio);

export default router;
