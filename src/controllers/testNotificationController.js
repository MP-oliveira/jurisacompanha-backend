// backend/src/controllers/testNotificationController.js
import logger from '../config/logger.js';

/**
 * Testa o sistema de notificações sem enviar email real
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
export const testNotificationSystem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipo } = req.body;

    // Simular diferentes tipos de notificação
    const notifications = {
      alerta: {
        titulo: '🚨 Alerta de Prazo',
        mensagem: 'Você tem um prazo próximo de vencimento.',
        prioridade: 'alta',
        dataVencimento: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      },
      processo: {
        numero: '0001234-56.2024.5.01.0001',
        classe: 'Ação de Cobrança',
        assunto: 'Cobrança de Título',
        status: 'Ativo',
        dataSentenca: new Date(),
      },
      relatorio: {
        tipo: 'Relatório Mensal',
        status: 'concluido',
        periodo: 'Setembro 2024',
        observacoes: 'Relatório gerado com sucesso.',
      },
    };

    const notification = notifications[tipo] || notifications.alerta;

    // Simular envio de notificação
    const result = {
      success: true,
      tipo: tipo || 'alerta',
      dados: notification,
      timestamp: new Date().toISOString(),
      userId,
      simulacao: true,
      mensagem: 'Notificação simulada com sucesso! (SMTP não configurado)',
    };

    logger.info('Sistema de notificação testado', {
      userId,
      tipo: tipo || 'alerta',
      simulacao: true,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Erro ao testar sistema de notificação:', {
      userId: req.user.id,
      error: error.message,
    });
    return res.status(500).json({ error: 'Erro interno do servidor ao testar notificações.' });
  }
};

/**
 * Lista os tipos de notificação disponíveis
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
export const getNotificationTypes = async (req, res) => {
  try {
    const types = [
      {
        id: 'alerta',
        nome: 'Alerta de Prazo',
        descricao: 'Notificação de prazo próximo de vencimento',
        icone: '🚨',
      },
      {
        id: 'processo',
        nome: 'Atualização de Processo',
        descricao: 'Notificação de mudança em processo',
        icone: '📄',
      },
      {
        id: 'relatorio',
        nome: 'Relatório Concluído',
        descricao: 'Notificação de relatório pronto',
        icone: '📊',
      },
    ];

    return res.status(200).json({
      types,
      total: types.length,
    });
  } catch (error) {
    logger.error('Erro ao listar tipos de notificação:', {
      userId: req.user.id,
      error: error.message,
    });
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};
