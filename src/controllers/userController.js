import Joi from 'joi';
import { Op } from 'sequelize';
import { User } from '../models/index.js';
import logger from '../config/logger.js';

// Esquemas de validação
const createUserSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'any.required': 'Senha é obrigatória'
  }),
  role: Joi.string().valid('admin', 'user').default('user')
});

const updateUserSchema = Joi.object({
  nome: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid('admin', 'user').optional(),
  ativo: Joi.boolean().optional()
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Senha atual é obrigatória'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'Nova senha deve ter pelo menos 6 caracteres',
    'any.required': 'Nova senha é obrigatória'
  })
});

/**
 * Lista todos os usuários (apenas admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    // Construir filtros
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { nome: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    if (status !== '') {
      whereClause.ativo = status === 'ativo';
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Busca um usuário por ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Cria um novo usuário (apenas admin)
 */
export const createUser = async (req, res) => {
  try {
    // Valida os dados de entrada
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Verifica se o email já existe
    const userExists = await User.findOne({ where: { email: value.email } });
    if (userExists) {
      return res.status(409).json({
        error: 'Email já cadastrado'
      });
    }

    // Cria o usuário
    const user = await User.create({
      nome: value.nome,
      email: value.email,
      password: value.password,
      role: value.role
    });

    // Remove a senha do retorno
    const { password, ...userWithoutPassword } = user.toJSON();

    logger.info(`Usuário criado: ${user.email} por ${req.user.email}`);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error('Erro ao criar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Atualiza um usuário
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Valida os dados de entrada
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verifica se o email já existe (se estiver sendo alterado)
    if (value.email && value.email !== user.email) {
      const emailExists = await User.findOne({ 
        where: { 
          email: value.email,
          id: { [Op.ne]: id }
        } 
      });
      if (emailExists) {
        return res.status(409).json({
          error: 'Email já cadastrado'
        });
      }
    }

    // Atualiza o usuário
    await user.update(value);

    // Remove a senha do retorno
    const { password, ...userWithoutPassword } = user.toJSON();

    logger.info(`Usuário atualizado: ${user.email} por ${req.user.email}`);

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Atualiza a senha de um usuário
 */
export const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Valida os dados de entrada
    const { error, value } = updatePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Verifica se é o próprio usuário ou admin
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acesso negado'
      });
    }

    // Verifica a senha atual (apenas se não for admin alterando outro usuário)
    if (req.user.id === parseInt(id)) {
      const isCurrentPasswordValid = await user.comparePassword(value.currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          error: 'Senha atual incorreta'
        });
      }
    }

    // Atualiza a senha
    await user.update({ password: value.newPassword });

    logger.info(`Senha atualizada para usuário: ${user.email} por ${req.user.email}`);

    res.json({
      message: 'Senha atualizada com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao atualizar senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Desativa um usuário (soft delete)
 */
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Não permite desativar a si mesmo
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        error: 'Não é possível desativar seu próprio usuário'
      });
    }

    await user.update({ ativo: false });

    logger.info(`Usuário desativado: ${user.email} por ${req.user.email}`);

    res.json({
      message: 'Usuário desativado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao desativar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Ativa um usuário
 */
export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    await user.update({ ativo: true });

    logger.info(`Usuário ativado: ${user.email} por ${req.user.email}`);

    res.json({
      message: 'Usuário ativado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao ativar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Exclui um usuário permanentemente
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Não permite excluir a si mesmo
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        error: 'Não é possível excluir seu próprio usuário'
      });
    }

    // Exclui o usuário permanentemente
    await user.destroy();

    logger.info(`Usuário excluído permanentemente: ${user.email} por ${req.user.email}`);

    res.json({
      message: 'Usuário excluído com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao excluir usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};
