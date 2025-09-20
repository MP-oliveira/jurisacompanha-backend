import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

/**
 * Middleware para verificar autenticação JWT
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token de acesso requerido'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Erro na verificação do token:', error);
    return res.status(403).json({
      error: 'Token inválido ou expirado'
    });
  }
};

/**
 * Middleware para verificar se o usuário é admin
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado. Permissões de administrador necessárias.'
    });
  }
  next();
};
