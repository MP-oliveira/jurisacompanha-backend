import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { body } from 'express-validator';
import pushNotificationController from '../controllers/pushNotificationController.js';

const router = Router();

// Middleware de validação para subscription
const validateSubscription = [
  body('endpoint').isURL().withMessage('Endpoint deve ser uma URL válida'),
  body('keys.p256dh').notEmpty().withMessage('Chave p256dh é obrigatória'),
  body('keys.auth').notEmpty().withMessage('Chave auth é obrigatória')
];

// Middleware de validação para notificação de teste
const validateTestNotification = [
  body('message').optional().isString().withMessage('Mensagem deve ser uma string')
];

// Rotas públicas (não requerem autenticação)
router.get('/vapid-public-key', pushNotificationController.getVapidPublicKey);

// Rotas protegidas (requerem autenticação)
router.use(auth);

// Gerenciar subscriptions
router.post('/subscribe', validateSubscription, pushNotificationController.subscribe);
router.post('/unsubscribe', pushNotificationController.unsubscribe);
router.get('/subscriptions', pushNotificationController.getUserSubscriptions);

// Enviar notificações
router.post('/test', validateTestNotification, pushNotificationController.sendTestNotification);
router.post('/alert/:alertId', pushNotificationController.sendProcessAlert);

export default router;
