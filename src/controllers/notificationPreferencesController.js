// backend/src/controllers/notificationPreferencesController.js
import NotificationPreferences from '../models/NotificationPreferences.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Obtém as preferências de notificação do usuário
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    let preferences = await NotificationPreferences.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nome', 'email'],
        },
      ],
    });

    // Se não existir preferências, criar com valores padrão
    if (!preferences) {
      preferences = await NotificationPreferences.create({
        userId,
        // Valores padrão já estão definidos no modelo
      });
      
      logger.info('Preferências de notificação criadas com valores padrão', { userId });
    }

    return res.status(200).json({
      preferences,
    });
  } catch (error) {
    logger.error('Erro ao obter preferências de notificação:', {
      userId: req.user.id,
      error: error.message,
    });
    return res.status(500).json({ error: 'Erro interno do servidor ao obter preferências.' });
  }
};

/**
 * Atualiza as preferências de notificação do usuário
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Validar dados de entrada - Simplificado para advocacia
    const allowedFields = [
      'emailEnabled',
      'emailCriticalAlerts',
      'pushEnabled',
      'pushCriticalAlerts',
      'alertFrequency',
      'preferredTime',
      'timezone',
    ];

    // Filtrar apenas campos permitidos
    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    // Validar valores de enum
    if (filteredData.alertFrequency && !['immediate', 'daily', 'weekly'].includes(filteredData.alertFrequency)) {
      return res.status(400).json({ error: 'Valor inválido para alertFrequency.' });
    }

    // Validar formato de tempo
    if (filteredData.preferredTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(filteredData.preferredTime)) {
      return res.status(400).json({ error: 'Formato inválido para preferredTime. Use HH:MM.' });
    }

    // Buscar ou criar preferências
    let preferences = await NotificationPreferences.findOne({
      where: { userId },
    });

    if (preferences) {
      await preferences.update(filteredData);
      logger.info('Preferências de notificação atualizadas', { userId, updatedFields: Object.keys(filteredData) });
    } else {
      preferences = await NotificationPreferences.create({
        userId,
        ...filteredData,
      });
      logger.info('Preferências de notificação criadas', { userId, fields: Object.keys(filteredData) });
    }

    return res.status(200).json({
      message: 'Preferências de notificação atualizadas com sucesso.',
      preferences,
    });
  } catch (error) {
    logger.error('Erro ao atualizar preferências de notificação:', {
      userId: req.user.id,
      error: error.message,
    });
    return res.status(500).json({ error: 'Erro interno do servidor ao atualizar preferências.' });
  }
};

/**
 * Redefine as preferências de notificação para valores padrão
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
export const resetNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    // Deletar preferências existentes
    await NotificationPreferences.destroy({
      where: { userId },
    });

    // Criar novas preferências com valores padrão
    const preferences = await NotificationPreferences.create({
      userId,
      // Valores padrão já estão definidos no modelo
    });

    logger.info('Preferências de notificação redefinidas para valores padrão', { userId });

    return res.status(200).json({
      message: 'Preferências de notificação redefinidas para valores padrão.',
      preferences,
    });
  } catch (error) {
    logger.error('Erro ao redefinir preferências de notificação:', {
      userId: req.user.id,
      error: error.message,
    });
    return res.status(500).json({ error: 'Erro interno do servidor ao redefinir preferências.' });
  }
};

/**
 * Obtém estatísticas das preferências de notificação (apenas para admin)
 * @param {object} req - Objeto de requisição
 * @param {object} res - Objeto de resposta
 */
export const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar se é admin
    const user = await User.findByPk(userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem ver estatísticas.' });
    }

    // Obter estatísticas
    const totalUsers = await User.count();
    const totalPreferences = await NotificationPreferences.count();

    const emailStats = await NotificationPreferences.findAll({
      attributes: [
        'emailEnabled',
        'emailCriticalAlerts',
      ],
      raw: true,
    });

    const pushStats = await NotificationPreferences.findAll({
      attributes: [
        'pushEnabled',
        'pushCriticalAlerts',
      ],
      raw: true,
    });

    // Calcular estatísticas
    const stats = {
      totalUsers,
      totalPreferences,
      email: {
        enabled: emailStats.filter(p => p.emailEnabled).length,
        criticalAlerts: emailStats.filter(p => p.emailCriticalAlerts).length,
      },
      push: {
        enabled: pushStats.filter(p => p.pushEnabled).length,
        criticalAlerts: pushStats.filter(p => p.pushCriticalAlerts).length,
      },
    };

    return res.status(200).json({
      stats,
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas de notificação:', {
      userId: req.user.id,
      error: error.message,
    });
    return res.status(500).json({ error: 'Erro interno do servidor ao obter estatísticas.' });
  }
};