// backend/src/routes/notificationPreferencesRoutes.js
import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
  getNotificationStats,
} from '../controllers/notificationPreferencesController.js';
import { validateMaliciousContent } from '../middlewares/inputValidation.js';

const router = Router();

// Middleware de validação de conteúdo malicioso para todas as rotas
router.use(validateMaliciousContent);

// Todas as rotas de preferências de notificação requerem autenticação
router.use(auth);

// Rotas para gerenciar preferências de notificação

// Obter preferências do usuário logado
router.get('/', getNotificationPreferences);

// Atualizar preferências do usuário logado
router.put('/', updateNotificationPreferences);

// Redefinir preferências para valores padrão
router.post('/reset', resetNotificationPreferences);

// Obter estatísticas (apenas para admin)
router.get('/stats', getNotificationStats);

export default router;
