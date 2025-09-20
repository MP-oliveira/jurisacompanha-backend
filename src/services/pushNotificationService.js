import webpush from 'web-push';
import { vapidKeys } from '../config/vapid.js';

/**
 * Serviço para notificações push
 */
class PushNotificationService {
  constructor() {
    // Configurar VAPID
    webpush.setVapidDetails(
      vapidKeys.email,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  }

  /**
   * Enviar notificação push para um usuário
   */
  async sendNotification(subscription, payload) {
    try {
      const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
      return { success: true, statusCode: result.statusCode };
    } catch (error) {
      console.error('❌ Erro ao enviar notificação push:', error);
      
      // Se a subscription expirou, retornar erro específico
      if (error.statusCode === 410) {
        return { success: false, expired: true, error: 'Subscription expired' };
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificação para múltiplos usuários
   */
  async sendBulkNotification(subscriptions, payload) {
    const results = await Promise.allSettled(
      subscriptions.map(subscription => this.sendNotification(subscription, payload))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length;


    return {
      total: subscriptions.length,
      successful,
      failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
    };
  }

  /**
   * Criar payload padrão para notificações
   */
  createPayload(title, body, options = {}) {
    return {
      title,
      body,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      tag: options.tag || 'juris-acompanha',
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      vibrate: options.vibrate || [200, 100, 200],
      data: {
        url: options.url || '/',
        timestamp: Date.now(),
        ...options.data
      },
      actions: options.actions || [
        {
          action: 'view',
          title: 'Ver',
          icon: '/icons/action-view.svg'
        },
        {
          action: 'dismiss',
          title: 'Dispensar',
          icon: '/icons/action-dismiss.svg'
        }
      ]
    };
  }

  /**
   * Criar payload para alertas de processo
   */
  createProcessAlertPayload(alerta, processo) {
    return this.createPayload(
      `🚨 ${alerta.titulo}`,
      `Processo: ${processo.numero}\n${alerta.mensagem}`,
      {
        tag: `alerta-${alerta.id}`,
        requireInteraction: alerta.prioridade === 'alta',
        url: `/processos/${processo.id}`,
        data: {
          alertId: alerta.id,
          processId: processo.id,
          priority: alerta.prioridade,
          type: 'process-alert'
        }
      }
    );
  }

  /**
   * Criar payload para prazos próximos
   */
  createDeadlinePayload(processo, tipo, prazo) {
    const tipos = {
      audiencia: 'Audiência',
      recurso: 'Prazo para Recurso',
      embargos: 'Prazo para Embargos'
    };

    return this.createPayload(
      `⏰ ${tipos[tipo]} - ${processo.numero}`,
      `${tipos[tipo]} em ${prazo} dias`,
      {
        tag: `prazo-${processo.id}-${tipo}`,
        requireInteraction: prazo <= 3,
        url: `/processos/${processo.id}`,
        data: {
          processId: processo.id,
          deadlineType: tipo,
          daysLeft: prazo,
          type: 'deadline'
        }
      }
    );
  }

  /**
   * Criar payload para notificações de sistema
   */
  createSystemNotificationPayload(title, message, options = {}) {
    return this.createPayload(
      `🔔 ${title}`,
      message,
      {
        tag: options.tag || 'system',
        requireInteraction: options.important || false,
        url: options.url || '/dashboard',
        data: {
          type: 'system',
          ...options.data
        }
      }
    );
  }
}

export default new PushNotificationService();
