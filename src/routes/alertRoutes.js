import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import {
  listarAlertas,
  buscarAlerta,
  marcarComoLido,
  marcarMultiplosComoLidos,
  removerAlerta,
  estatisticasAlertas
} from '../controllers/alertController.js';

const router = Router();

// Todas as rotas de alertas requerem autenticação
router.use(auth);

// CRUD de alertas
router.get('/', listarAlertas);
router.get('/:id', buscarAlerta);
router.delete('/:id', removerAlerta);

// Gerenciamento de alertas
router.patch('/:id/read', marcarComoLido);
router.patch('/read-multiple', marcarMultiplosComoLidos);

// Estatísticas
router.get('/stats/overview', estatisticasAlertas);

export default router;
