import PushSubscription from '../models/PushSubscription.js';
import pushNotificationService from '../services/pushNotificationService.js';
import { vapidKeys } from '../config/vapid.js';

/**
 * Controller para gerenciar push notifications
 */
class PushNotificationController {
  /**
   * Obter chave pública VAPID
   */
  getVapidPublicKey = (req, res) => {
    try {
      res.json({
        success: true,
        publicKey: vapidKeys.publicKey
      });
    } catch (error) {
      console.error('❌ Erro ao obter chave VAPID:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  };

  /**
   * Registrar subscription para push notifications
   */
  subscribe = async (req, res) => {
    try {
      const { userId } = req.user;
      const { endpoint, keys } = req.body;

      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return res.status(400).json({
          success: false,
          message: 'Dados de subscription inválidos'
        });
      }

      // Verificar se já existe uma subscription com este endpoint
      let subscription = await PushSubscription.findOne({
        where: { endpoint }
      });

      if (subscription) {
        // Atualizar subscription existente
        subscription.userId = userId;
        subscription.p256dh = keys.p256dh;
        subscription.auth = keys.auth;
        subscription.userAgent = req.get('User-Agent');
        subscription.isActive = true;
        subscription.lastUsed = new Date();
        await subscription.save();
      } else {
        // Criar nova subscription
        subscription = await PushSubscription.create({
          userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: req.get('User-Agent'),
          isActive: true,
          lastUsed: new Date()
        });
      }


      res.json({
        success: true,
        message: 'Subscription registrada com sucesso',
        subscription: {
          id: subscription.id,
          endpoint: subscription.endpoint,
          isActive: subscription.isActive
        }
      });
    } catch (error) {
      console.error('❌ Erro ao registrar subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  };

  /**
   * Desregistrar subscription
   */
  unsubscribe = async (req, res) => {
    try {
      const { userId } = req.user;
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({
          success: false,
          message: 'Endpoint é obrigatório'
        });
      }

      const subscription = await PushSubscription.findOne({
        where: { userId, endpoint }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription não encontrada'
        });
      }

      subscription.isActive = false;
      await subscription.save();


      res.json({
        success: true,
        message: 'Subscription desregistrada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao desregistrar subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  };

  /**
   * Listar subscriptions do usuário
   */
  getUserSubscriptions = async (req, res) => {
    try {
      const { userId } = req.user;

      const subscriptions = await PushSubscription.findAll({
        where: { userId, isActive: true },
        attributes: ['id', 'endpoint', 'userAgent', 'lastUsed', 'createdAt']
      });

      res.json({
        success: true,
        subscriptions
      });
    } catch (error) {
      console.error('❌ Erro ao listar subscriptions:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  };

  /**
   * Enviar notificação de teste
   */
  sendTestNotification = async (req, res) => {
    try {
      const { userId } = req.user;
      const { message } = req.body;

      // Buscar subscriptions ativas do usuário
      const subscriptions = await PushSubscription.findAll({
        where: { userId, isActive: true }
      });

      if (subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhuma subscription ativa encontrada'
        });
      }

      // Criar payload de teste
      const payload = pushNotificationService.createSystemNotificationPayload(
        'Teste de Notificação',
        message || 'Esta é uma notificação de teste do JurisAcompanha!',
        {
          tag: 'test-notification',
          url: '/dashboard'
        }
      );

      // Enviar notificação para todas as subscriptions
      const results = await Promise.allSettled(
        subscriptions.map(sub => {
          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };
          return pushNotificationService.sendNotification(subscription, payload);
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      // Atualizar lastUsed das subscriptions bem-sucedidas
      const successfulSubscriptions = subscriptions.filter((_, index) => 
        results[index].status === 'fulfilled' && results[index].value.success
      );

      await Promise.all(
        successfulSubscriptions.map(sub => {
          sub.lastUsed = new Date();
          return sub.save();
        })
      );


      res.json({
        success: true,
        message: 'Notificação de teste enviada',
        stats: {
          total: subscriptions.length,
          successful,
          failed
        }
      });
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de teste:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  };

  /**
   * Enviar notificação para alerta de processo
   */
  sendProcessAlert = async (req, res) => {
    try {
      const { alertId } = req.params;
      const { userId } = req.user;

      // Buscar alerta e processo (implementar conforme necessário)
      // Por enquanto, vamos simular
      const alerta = {
        id: alertId,
        titulo: 'Prazo Vencendo',
        mensagem: 'O prazo para este processo está vencendo em breve',
        prioridade: 'alta'
      };

      const processo = {
        id: 1,
        numero: '1234567-89.2024.4.01.3300'
      };

      // Buscar subscriptions ativas do usuário
      const subscriptions = await PushSubscription.findAll({
        where: { userId, isActive: true }
      });

      if (subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhuma subscription ativa encontrada'
        });
      }

      // Criar payload específico para alerta de processo
      const payload = pushNotificationService.createProcessAlertPayload(alerta, processo);

      // Enviar notificação
      const result = await pushNotificationService.sendBulkNotification(
        subscriptions.map(sub => ({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        })),
        payload
      );

      res.json({
        success: true,
        message: 'Notificação de alerta enviada',
        stats: result
      });
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de alerta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  };
}

export default new PushNotificationController();
