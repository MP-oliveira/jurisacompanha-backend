import { Consulta, User } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';
import Joi from 'joi';

// Schema de validação para criação de consulta
const consultaSchema = Joi.object({
  tipo: Joi.string().valid('processo', 'pessoa', 'empresa').required(),
  numero: Joi.string().min(3).max(100).required(),
  classe: Joi.string().max(200).allow(''),
  tribunal: Joi.string().max(100).allow(''),
  comarca: Joi.string().max(100).allow(''),
  observacoes: Joi.string().allow('')
});

/**
 * Lista todas as consultas do usuário
 */
export const listarConsultas = async (req, res) => {
  try {
    const { page = 1, limit = 20, tipo, status, data } = req.query;
    const offset = (page - 1) * limit;

    // Construir filtros
    const where = { userId: req.user.id };
    
    if (tipo && tipo !== 'todos') {
      where.tipo = tipo;
    }
    
    if (status && status !== 'todos') {
      where.status = status;
    }
    
    if (data && data !== 'todos') {
      const now = new Date();
      let startDate;
      
      switch (data) {
        case 'hoje':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          where.dataConsulta = { [Op.gte]: startDate };
          break;
        case 'semana':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          where.dataConsulta = { [Op.gte]: startDate };
          break;
        case 'mes':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          where.dataConsulta = { [Op.gte]: startDate };
          break;
      }
    }

    const { count, rows: consultas } = await Consulta.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'nome', 'email'] }],
      order: [['dataConsulta', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      consultas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Erro ao listar consultas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Busca uma consulta específica
 */
export const buscarConsulta = async (req, res) => {
  try {
    const { id } = req.params;

    const consulta = await Consulta.findOne({
      where: { id, userId: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'nome', 'email'] }]
    });

    if (!consulta) {
      return res.status(404).json({
        error: 'Consulta não encontrada'
      });
    }

    res.json(consulta);
  } catch (error) {
    logger.error('Erro ao buscar consulta:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Cria uma nova consulta
 */
export const criarConsulta = async (req, res) => {
  try {
    // Valida os dados de entrada
    const { error, value } = consultaSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Simula resultado da consulta (em produção, aqui seria feita a consulta real)
    let resultado = null;
    let status = 'nao_encontrado';

    // Simulação baseada no tipo
    if (value.tipo === 'processo') {
      // Simula consulta de processo
      if (value.numero.includes('2025')) {
        status = 'encontrado';
        resultado = {
          status: 'Ativo',
          ultimaMovimentacao: new Date().toISOString(),
          valorCausa: 'R$ 50.000,00',
          partes: ['João Silva (Autor)', 'Empresa XYZ Ltda (Réu)']
        };
      }
    } else if (value.tipo === 'pessoa') {
      // Simula consulta de CPF
      if (value.numero.length >= 11) {
        status = 'encontrado';
        resultado = {
          nome: 'João Silva Santos',
          situacao: 'Regular',
          ultimaAtualizacao: new Date().toISOString()
        };
      }
    } else if (value.tipo === 'empresa') {
      // Simula consulta de CNPJ
      if (value.numero.length >= 14) {
        status = 'encontrado';
        resultado = {
          razaoSocial: 'Empresa XYZ Ltda',
          situacao: 'Ativa',
          ultimaAtualizacao: new Date().toISOString()
        };
      }
    }

    // Cria a consulta
    const consulta = await Consulta.create({
      ...value,
      status,
      resultado,
      userId: req.user.id
    });

    logger.info(`Consulta criada: ${consulta.numero} por ${req.user.email}`);

    res.status(201).json({
      message: 'Consulta realizada com sucesso',
      consulta
    });
  } catch (error) {
    logger.error('Erro ao criar consulta:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Remove uma consulta
 */
export const removerConsulta = async (req, res) => {
  try {
    const { id } = req.params;

    const consulta = await Consulta.findOne({
      where: { id, userId: req.user.id }
    });

    if (!consulta) {
      return res.status(404).json({
        error: 'Consulta não encontrada'
      });
    }

    await consulta.destroy();

    logger.info(`Consulta removida: ${consulta.numero} por ${req.user.email}`);

    res.json({
      message: 'Consulta removida com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao remover consulta:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Estatísticas das consultas
 */
export const estatisticasConsultas = async (req, res) => {
  try {
    const userId = req.user.id;
    const hoje = new Date();
    const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const inicioDaSemana = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const inicioDoMes = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      total,
      encontrados,
      naoEncontrados,
      hojeCount,
      semanaCount,
      mesCount
    ] = await Promise.all([
      Consulta.count({ where: { userId } }),
      Consulta.count({ where: { userId, status: 'encontrado' } }),
      Consulta.count({ where: { userId, status: 'nao_encontrado' } }),
      Consulta.count({ where: { userId, dataConsulta: { [Op.gte]: inicioDoDia } } }),
      Consulta.count({ where: { userId, dataConsulta: { [Op.gte]: inicioDaSemana } } }),
      Consulta.count({ where: { userId, dataConsulta: { [Op.gte]: inicioDoMes } } })
    ]);

    res.json({
      total,
      encontrados,
      naoEncontrados,
      hoje: hojeCount,
      semana: semanaCount,
      mes: mesCount
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas de consultas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};
