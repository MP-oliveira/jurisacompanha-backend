/**
 * Middleware de validação de entrada
 * Aplica validação e sanitização em rotas específicas
 */

import { validateInput, VALIDATION_SCHEMAS } from '../utils/inputValidator.js';
import logger from '../config/logger.js';

/**
 * Middleware para validação de criação de processo
 */
export const validateCreateProcesso = validateInput(VALIDATION_SCHEMAS.CREATE_PROCESSO);

/**
 * Middleware para validação de atualização de processo
 */
export const validateUpdateProcesso = validateInput(VALIDATION_SCHEMAS.UPDATE_PROCESSO);

/**
 * Middleware para validação de criação de usuário
 */
export const validateCreateUser = validateInput(VALIDATION_SCHEMAS.CREATE_USER);

/**
 * Middleware para validação de atualização de usuário
 */
export const validateUpdateUser = validateInput(VALIDATION_SCHEMAS.UPDATE_USER);

/**
 * Middleware para validação de criação de alerta
 */
export const validateCreateAlert = validateInput(VALIDATION_SCHEMAS.CREATE_ALERT);

/**
 * Middleware para validação de parâmetros de query
 */
export const validateQueryParams = (allowedParams = []) => {
  return (req, res, next) => {
    try {
      const queryKeys = Object.keys(req.query);
      const invalidParams = queryKeys.filter(key => !allowedParams.includes(key));
      
      if (invalidParams.length > 0) {
        logger.warn('Parâmetros de query inválidos:', {
          ip: req.ip,
          invalidParams,
          query: req.query
        });
        
        return res.status(400).json({
          error: 'Parâmetros de query inválidos',
          details: invalidParams.map(param => `${param} não é um parâmetro válido`)
        });
      }
      
      // Sanitiza parâmetros válidos
      for (const param of allowedParams) {
        if (req.query[param]) {
          req.query[param] = req.query[param].trim();
        }
      }
      
      next();
    } catch (error) {
      logger.error('Erro na validação de query params:', error);
      res.status(500).json({
        error: 'Erro interno na validação'
      });
    }
  };
};

/**
 * Middleware para validação de parâmetros de rota
 */
export const validateRouteParams = (paramSchema) => {
  return (req, res, next) => {
    try {
      const errors = [];
      
      for (const [param, rules] of Object.entries(paramSchema)) {
        const value = req.params[param];
        
        if (rules.required && (!value || value.trim() === '')) {
          errors.push(`${param} é obrigatório`);
          continue;
        }
        
        if (value) {
          // Validação básica de tipo
          if (rules.type === 'number' && isNaN(Number(value))) {
            errors.push(`${param} deve ser um número válido`);
          } else if (rules.type === 'uuid' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
            errors.push(`${param} deve ser um UUID válido`);
          }
        }
      }
      
      if (errors.length > 0) {
        logger.warn('Parâmetros de rota inválidos:', {
          ip: req.ip,
          errors,
          params: req.params
        });
        
        return res.status(400).json({
          error: 'Parâmetros de rota inválidos',
          details: errors
        });
      }
      
      next();
    } catch (error) {
      logger.error('Erro na validação de route params:', error);
      res.status(500).json({
        error: 'Erro interno na validação'
      });
    }
  };
};

/**
 * Middleware para validação de arquivos
 */
export const validateFileUpload = (options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
    maxFiles = 5
  } = options;
  
  return (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return next();
      }
      
      const files = Array.isArray(req.files) ? req.files : [req.files];
      
      if (files.length > maxFiles) {
        return res.status(400).json({
          error: `Máximo de ${maxFiles} arquivos permitidos`
        });
      }
      
      for (const file of files) {
        // Verifica tamanho
        if (file.size > maxSize) {
          return res.status(400).json({
            error: `Arquivo ${file.name} excede o tamanho máximo de ${maxSize / 1024 / 1024}MB`
          });
        }
        
        // Verifica tipo
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            error: `Tipo de arquivo ${file.mimetype} não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
          });
        }
        
        // Verifica extensão
        const allowedExtensions = allowedTypes.map(type => {
          switch (type) {
            case 'image/jpeg': return 'jpg';
            case 'image/png': return 'png';
            case 'application/pdf': return 'pdf';
            default: return '';
          }
        });
        
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({
            error: `Extensão de arquivo .${fileExtension} não permitida`
          });
        }
      }
      
      next();
    } catch (error) {
      logger.error('Erro na validação de arquivos:', error);
      res.status(500).json({
        error: 'Erro interno na validação de arquivos'
      });
    }
  };
};

/**
 * Middleware para validação de headers
 */
export const validateHeaders = (requiredHeaders = []) => {
  return (req, res, next) => {
    try {
      const missingHeaders = requiredHeaders.filter(header => !req.get(header));
      
      if (missingHeaders.length > 0) {
        logger.warn('Headers obrigatórios ausentes:', {
          ip: req.ip,
          missingHeaders,
          headers: req.headers
        });
        
        return res.status(400).json({
          error: 'Headers obrigatórios ausentes',
          details: missingHeaders.map(header => `${header} é obrigatório`)
        });
      }
      
      next();
    } catch (error) {
      logger.error('Erro na validação de headers:', error);
      res.status(500).json({
        error: 'Erro interno na validação'
      });
    }
  };
};

/**
 * Middleware para validação de rate limiting customizado
 */
export const validateRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos
    maxRequests = 100,
    skipSuccessfulRequests = false
  } = options;
  
  const requests = new Map();
  
  return (req, res, next) => {
    try {
      const ip = req.ip;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Limpa requests antigas
      if (requests.has(ip)) {
        const userRequests = requests.get(ip).filter(timestamp => timestamp > windowStart);
        requests.set(ip, userRequests);
      } else {
        requests.set(ip, []);
      }
      
      const userRequests = requests.get(ip);
      
      if (userRequests.length >= maxRequests) {
        logger.warn('Rate limit excedido:', {
          ip,
          requests: userRequests.length,
          maxRequests,
          windowMs
        });
        
        return res.status(429).json({
          error: 'Muitas tentativas. Tente novamente em alguns minutos.',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      // Adiciona request atual
      userRequests.push(now);
      requests.set(ip, userRequests);
      
      next();
    } catch (error) {
      logger.error('Erro no rate limiting customizado:', error);
      next(); // Continua em caso de erro
    }
  };
};

/**
 * Middleware para validação de conteúdo malicioso
 */
export const validateMaliciousContent = (req, res, next) => {
  try {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /eval\(/i,
      /document\.cookie/i,
      /window\.location/i,
      /alert\(/i
    ];
    
    const checkContent = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(value)) {
              logger.warn('Conteúdo suspeito detectado:', {
                ip: req.ip,
                path: path ? `${path}.${key}` : key,
                value: value.substring(0, 100),
                pattern: pattern.toString()
              });
              
              return res.status(400).json({
                error: 'Conteúdo suspeito detectado',
                message: 'O conteúdo contém caracteres ou padrões não permitidos'
              });
            }
          }
        } else if (typeof value === 'object' && value !== null) {
          const result = checkContent(value, path ? `${path}.${key}` : key);
          if (result) return result;
        }
      }
      return null;
    };
    
    // Verifica body, query e params
    if (req.body && typeof req.body === 'object') {
      const result = checkContent(req.body, 'body');
      if (result) return result;
    }
    
    if (req.query && typeof req.query === 'object') {
      const result = checkContent(req.query, 'query');
      if (result) return result;
    }
    
    if (req.params && typeof req.params === 'object') {
      const result = checkContent(req.params, 'params');
      if (result) return result;
    }
    
    next();
  } catch (error) {
    logger.error('Erro na validação de conteúdo malicioso:', error);
    next(); // Continua em caso de erro
  }
};
