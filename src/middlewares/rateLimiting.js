import rateLimit from 'express-rate-limit';

// Rate limiting específico para login - CRÍTICO para segurança
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' ? 100000 : 20, // Mais permissivo em desenvolvimento
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'TOO_MANY_LOGIN_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // não contar logins bem-sucedidos
  skip: (req) => {
    // DESABILITAR completamente em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Em produção, permitir localhost e IPs locais
    if (req.ip === '::1' || 
        req.ip === '127.0.0.1' ||
        req.ip.includes('localhost') ||
        req.ip.includes('192.168') ||
        req.hostname === 'localhost') {
      return true;
    }
    return false;
  }
});

// Rate limiting para reset de senha
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 tentativas por hora
  message: {
    error: 'Muitas tentativas de reset de senha. Tente novamente em 1 hora.',
    code: 'TOO_MANY_RESET_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para registro de usuários
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' ? 100000 : 10, // Mais permissivo em desenvolvimento
  message: {
    error: 'Muitas tentativas de registro. Tente novamente em 15 minutos.',
    code: 'TOO_MANY_REGISTER_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // DESABILITAR completamente em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Em produção, permitir localhost e IPs locais
    if (req.ip === '::1' ||
        req.ip === '127.0.0.1' ||
        req.ip.includes('localhost') ||
        req.ip.includes('192.168') ||
        req.hostname === 'localhost') {
      return true;
    }
    return false;
  }
});

// Rate limiting para endpoints sensíveis
export const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' ? 100000 : 100, // Mais permissivo em desenvolvimento
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // DESABILITAR completamente em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Em produção, permitir localhost e IPs locais
    if (req.ip === '::1' ||
        req.ip === '127.0.0.1' ||
        req.ip.includes('localhost') ||
        req.ip.includes('192.168') ||
        req.hostname === 'localhost') {
      return true;
    }
    return false;
  }
});
