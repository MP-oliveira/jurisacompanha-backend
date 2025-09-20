import { Op } from 'sequelize';
import { Alert, Processo } from '../models/index.js';
import logger from '../config/logger.js';

/**
 * Lista todos os alertas do usuário
 */
export const listarAlertas = async (req, res) => {
  try {
    const { page = 1, limit = 20, tipo, lido, prioridade } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    
    if (tipo && tipo !== 'todos') {
      whereClause.tipo = tipo;
    }
    
    if (lido !== undefined) {
      whereClause.lido = lido === 'true';
    }
    
    if (prioridade && prioridade !== 'todos') {
      whereClause.prioridade = prioridade;
    }

    const { count, rows: alertas } = await Alert.findAndCountAll({
      where: whereClause,
      order: [
        ['prioridade', 'DESC'],
        ['dataVencimento', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Processo,
          as: 'processo',
          attributes: ['id', 'numero', 'classe', 'assunto']
        }
      ]
    });

    res.json({
      alertas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Erro ao listar alertas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Busca um alerta específico
 */
export const buscarAlerta = async (req, res) => {
  try {
    const { id } = req.params;

    const alerta = await Alert.findOne({
      where: { 
        id, 
        userId: req.user.id 
      },
      include: [
        {
          model: Processo,
          as: 'processo',
          attributes: ['id', 'numero', 'classe', 'assunto', 'tribunal', 'comarca']
        }
      ]
    });

    if (!alerta) {
      return res.status(404).json({
        error: 'Alerta não encontrado'
      });
    }

    res.json({ alerta });
  } catch (error) {
    logger.error('Erro ao buscar alerta:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Marca um alerta como lido
 */
export const marcarComoLido = async (req, res) => {
  try {
    const { id } = req.params;

    const alerta = await Alert.findOne({
      where: { 
        id, 
        userId: req.user.id 
      }
    });

    if (!alerta) {
      return res.status(404).json({
        error: 'Alerta não encontrado'
      });
    }

    await alerta.update({ lido: true });

    logger.info(`Alerta ${id} marcado como lido por ${req.user.email}`);

    res.json({
      message: 'Alerta marcado como lido',
      alerta
    });
  } catch (error) {
    logger.error('Erro ao marcar alerta como lido:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Marca múltiplos alertas como lidos
 */
export const marcarMultiplosComoLidos = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Lista de IDs é obrigatória'
      });
    }

    const alertas = await Alert.findAll({
      where: { 
        id: ids,
        userId: req.user.id 
      }
    });

    if (alertas.length === 0) {
      return res.status(404).json({
        error: 'Nenhum alerta encontrado'
      });
    }

    await Promise.all(
      alertas.map(alerta => alerta.update({ lido: true }))
    );

    logger.info(`${alertas.length} alertas marcados como lidos por ${req.user.email}`);

    res.json({
      message: `${alertas.length} alertas marcados como lidos`,
      count: alertas.length
    });
  } catch (error) {
    logger.error('Erro ao marcar múltiplos alertas como lidos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Remove um alerta
 */
export const removerAlerta = async (req, res) => {
  try {
    const { id } = req.params;

    const alerta = await Alert.findOne({
      where: { 
        id, 
        userId: req.user.id 
      }
    });

    if (!alerta) {
      return res.status(404).json({
        error: 'Alerta não encontrado'
      });
    }

    await alerta.destroy();

    logger.info(`Alerta ${id} removido por ${req.user.email}`);

    res.json({
      message: 'Alerta removido com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao remover alerta:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Retorna estatísticas dos alertas
 */
export const estatisticasAlertas = async (req, res) => {
  try {
    const totalAlertas = await Alert.count({
      where: { userId: req.user.id }
    });

    const alertasNaoLidos = await Alert.count({
      where: { 
        userId: req.user.id,
        lido: false
      }
    });

    const alertasPorTipo = await Alert.findAll({
      where: { userId: req.user.id },
      attributes: [
        'tipo',
        [Alert.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['tipo']
    });

    const alertasPorPrioridade = await Alert.findAll({
      where: { userId: req.user.id },
      attributes: [
        'prioridade',
        [Alert.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['prioridade']
    });

    const alertasVencendoHoje = await Alert.count({
      where: {
        userId: req.user.id,
        lido: false,
        dataVencimento: {
          [Op.gte]: new Date(),
          [Op.lt]: new Date(new Date().setDate(new Date().getDate() + 1))
        }
      }
    });

    res.json({
      total: totalAlertas,
      naoLidos: alertasNaoLidos,
      porTipo: alertasPorTipo,
      porPrioridade: alertasPorPrioridade,
      vencendoHoje: alertasVencendoHoje
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas dos alertas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};
