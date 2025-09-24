import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { Op } from 'sequelize';
import { User } from '../models/index.js';
import logger from '../config/logger.js';
import { validatePassword, calculatePasswordStrength } from '../utils/passwordValidator.js';
import AuditLogger from '../services/auditLogger.js';

// Esquemas de validação
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'any.required': 'Senha é obrigatória'
  })
});

const registerSchema = Joi.object({
  nome: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ser válido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Senha é obrigatória'
  }),
  role: Joi.string().valid('admin', 'user').default('user')
});

/**
 * Registra um novo usuário
 */
export const register = async (req, res) => {
  try {
    // Valida os dados de entrada
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Valida a senha com política de segurança
    const passwordValidation = validatePassword(value.password, value.email);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Senha não atende aos critérios de segurança',
        details: passwordValidation.errors.map(error => ({
          field: 'password',
          message: error
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

    // Calcula a força da senha para log
    const passwordStrength = calculatePasswordStrength(value.password, value.email);

    // Cria o usuário
    const user = await User.create({
      nome: value.nome,
      email: value.email,
      password: value.password,
      role: value.role
    });

    // Remove a senha do retorno
    const { password, ...userWithoutPassword } = user.toJSON();

    logger.info(`Usuário registrado com sucesso: ${user.email} (Força da senha: ${passwordStrength}%)`);

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: userWithoutPassword,
      passwordStrength: passwordStrength
    });
  } catch (error) {
    logger.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Autentica um usuário
 */
export const login = async (req, res) => {
  try {
    // Valida os dados de entrada
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Busca o usuário pelo email
    const user = await User.findOne({ where: { email: value.email } });
    if (!user) {
      // Log de tentativa de login com email inexistente
      await AuditLogger.logLogin(
        null,
        value.email,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        'FAILED'
      );
      
      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });
    }

    // Verifica se o usuário está ativo
    if (!user.ativo) {
      // Log de tentativa de login com usuário inativo
      await AuditLogger.logLogin(
        user.id,
        value.email,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        'FAILED'
      );
      
      return res.status(401).json({
        error: 'Usuário inativo'
      });
    }

    // Verifica a senha
    const isPasswordValid = await user.comparePassword(value.password);
    if (!isPasswordValid) {
      // Log de tentativa de login com senha incorreta
      await AuditLogger.logLogin(
        user.id,
        value.email,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        'FAILED'
      );
      
      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });
    }

    // Log de login bem-sucedido
    await AuditLogger.logLogin(
      user.id,
      value.email,
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent'),
      'SUCCESS'
    );

    // Gera o token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Remove a senha do retorno
    const { password, ...userWithoutPassword } = user.toJSON();

    // Log de login bem-sucedido
    await AuditLogger.logLogin(
      user.id,
      user.email,
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent'),
      'SUCCESS'
    );

    logger.info(`Usuário autenticado: ${user.email}`);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error('Erro ao fazer login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Retorna os dados do usuário logado
 */
export const me = async (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user.toJSON();
    
    res.json({
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Atualiza os dados do usuário logado
 */
export const updateProfile = async (req, res) => {
  try {
    const { nome, email } = req.body;
    
    // Valida os dados
    if (nome && nome.length < 2) {
      return res.status(400).json({
        error: 'Nome deve ter pelo menos 2 caracteres'
      });
    }

    if (email) {
      const emailSchema = Joi.string().email();
      const { error } = emailSchema.validate(email);
      if (error) {
        return res.status(400).json({
          error: 'Email deve ser válido'
        });
      }

      // Verifica se o email já existe (exceto para o usuário atual)
      const userExists = await User.findOne({ 
        where: { 
          email, 
          id: { [Op.ne]: req.user.id } 
        } 
      });
      if (userExists) {
        return res.status(409).json({
          error: 'Email já cadastrado'
        });
      }
    }

    // Atualiza o usuário
    await req.user.update({
      nome: nome || req.user.nome,
      email: email || req.user.email
    });

    const { password, ...userWithoutPassword } = req.user.toJSON();

    logger.info(`Perfil atualizado: ${req.user.email}`);

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

export const debugLogin = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Busca o usuário
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Retorna informações do usuário (sem a senha completa)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        ativo: user.ativo,
        passwordHash: user.password ? user.password.substring(0, 20) + '...' : 'N/A'
      }
    });
  } catch (error) {
    logger.error('Erro no debug de login:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
};
