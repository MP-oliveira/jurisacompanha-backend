// backend/src/routes/emailNotificationRoutes.js
import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import {
  sendTestEmailNotification,
  sendAlertEmail,
  sendProcessUpdateEmail,
  sendReportCompletedEmail,
  sendCustomEmail,
} from '../controllers/emailNotificationController.js';
import {
  testNotificationSystem,
  getNotificationTypes,
} from '../controllers/testNotificationController.js';
import { validateMaliciousContent } from '../middlewares/inputValidation.js';

const router = Router();

// Middleware de validação de conteúdo malicioso para todas as rotas
router.use(validateMaliciousContent);

// Todas as rotas de notificações por email requerem autenticação
router.use(auth);

// Rotas para envio de emails

// Enviar email de teste
router.post('/test', sendTestEmailNotification);

// Enviar notificação de alerta por email
router.post('/alert/:alertId', sendAlertEmail);

// Enviar notificação de processo atualizado por email
router.post('/process/:processoId', sendProcessUpdateEmail);

// Enviar notificação de relatório concluído por email
router.post('/report/:relatorioId', sendReportCompletedEmail);

// Enviar email personalizado
router.post('/custom', sendCustomEmail);

// Rotas de teste (funcionam sem SMTP configurado)
router.post('/test-system', testNotificationSystem);
router.get('/test-types', getNotificationTypes);

export default router;
