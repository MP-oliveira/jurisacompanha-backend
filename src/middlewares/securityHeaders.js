/**
 * Middleware para configurar headers de segurança
 * Implementa CSP, HSTS, X-Frame-Options e outros headers de segurança
 */

/**
 * Configuração de headers de segurança para produção
 */
export const productionSecurityHeaders = (req, res, next) => {
  // Content Security Policy (CSP) - Política rigorosa para produção
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss: ws:",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  // HTTP Strict Transport Security (HSTS) - Força HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // X-Frame-Options - Previne clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - Previne MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection - Proteção contra XSS (para navegadores antigos)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy - Controle de informações de referência
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy - Controle de recursos do navegador
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ');
  res.setHeader('Permissions-Policy', permissionsPolicy);

  // Content Security Policy
  res.setHeader('Content-Security-Policy', cspPolicy);

  // Cache-Control para APIs sensíveis
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

/**
 * Configuração de headers de segurança para desenvolvimento
 */
export const developmentSecurityHeaders = (req, res, next) => {
  // CSP mais flexível para desenvolvimento
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' http://localhost:* https: wss: ws:",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  // HSTS mais flexível para desenvolvimento
  res.setHeader('Strict-Transport-Security', 'max-age=86400'); // 1 dia

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ');
  res.setHeader('Permissions-Policy', permissionsPolicy);

  // Content Security Policy
  res.setHeader('Content-Security-Policy', cspPolicy);

  // Cache-Control para APIs
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

/**
 * Headers de segurança específicos para APIs
 */
export const apiSecurityHeaders = (req, res, next) => {
  // Remove informações do servidor
  res.removeHeader('X-Powered-By');
  
  // Headers específicos para APIs
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Cache-Control para APIs
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
};

/**
 * Headers de segurança para endpoints de autenticação
 */
export const authSecurityHeaders = (req, res, next) => {
  // Headers específicos para autenticação
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Cache-Control rigoroso para autenticação
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Previne cache de dados sensíveis (apenas em logout)
  if (req.path.includes('/logout')) {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  }
  
  next();
};

/**
 * Headers de segurança para upload de arquivos
 */
export const uploadSecurityHeaders = (req, res, next) => {
  // CSP específico para upload
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-src 'none'"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', cspPolicy);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Limite de tamanho de arquivo
  res.setHeader('X-File-Size-Limit', '10MB');
  
  next();
};

/**
 * Middleware para configurar headers baseado no ambiente
 */
export const securityHeaders = (req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    developmentSecurityHeaders(req, res, next);
  } else {
    productionSecurityHeaders(req, res, next);
  }
};

/**
 * Headers de segurança para CORS
 */
export const corsSecurityHeaders = (req, res, next) => {
  // Headers CORS seguros - permitir múltiplas origens
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'https://jurisacompanha.vercel.app',
    'https://acompanhamento-processual-kt8g20752.vercel.app',
    process.env.CORS_ORIGIN || 'https://your-frontend.vercel.app',
    null // Permitir arquivos HTML locais (origin 'null')
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || origin === null) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Headers de segurança adicionais para CORS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
};
