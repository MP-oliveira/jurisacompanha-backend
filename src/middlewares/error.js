import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Erro na aplicação:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  });

  // Erros de validação Joi
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  // Erros do Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.errors.map(error => ({
        field: error.path,
        message: error.message
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Dados duplicados',
      field: err.errors[0].path
    });
  }

  // Erro padrão
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path
  });
};
