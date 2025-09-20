import AuditLogger from '../services/auditLogger.js';

/**
 * Middleware para capturar automaticamente dados de auditoria das requisições
 */
const auditMiddleware = (options = {}) => {
  return (req, res, next) => {
    // Armazena dados originais para auditoria
    req.auditData = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      userId: req.user?.id || null
    };

    // Captura resposta para auditoria
    const originalSend = res.send;
    res.send = function(data) {
      req.auditData.response = {
        statusCode: res.statusCode,
        data: data
      };
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Middleware para registrar automaticamente ações baseadas na rota
 */
const autoAuditMiddleware = (options = {}) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Aguarda um pouco para garantir que a resposta foi processada
      setTimeout(async () => {
        try {
          await auditRouteAction(req, res);
        } catch (error) {
          console.error('❌ Erro no middleware de auditoria automática:', error);
        }
      }, 100);
      
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Função para auditar ações baseadas na rota
 */
async function auditRouteAction(req, res) {
  const { method, path, user, auditData } = req;
  
  // Mapeamento de rotas para ações
  const routeMap = {
    // Autenticação
    'POST /api/auth/login': { action: 'LOGIN', resource: 'USER' },
    'POST /api/auth/logout': { action: 'LOGOUT', resource: 'USER' },
    'POST /api/auth/register': { action: 'CREATE', resource: 'USER' },
    'POST /api/auth/forgot-password': { action: 'PASSWORD_RESET', resource: 'USER' },
    'POST /api/auth/reset-password': { action: 'PASSWORD_CHANGE', resource: 'USER' },
    
    // Usuários
    'GET /api/users': { action: 'ACCESS', resource: 'USER' },
    'GET /api/users/:id': { action: 'ACCESS', resource: 'USER' },
    'PUT /api/users/:id': { action: 'UPDATE', resource: 'USER' },
    'DELETE /api/users/:id': { action: 'DELETE', resource: 'USER' },
    
    // Processos
    'GET /api/processos': { action: 'ACCESS', resource: 'PROCESSO' },
    'GET /api/processos/:id': { action: 'ACCESS', resource: 'PROCESSO' },
    'POST /api/processos': { action: 'CREATE', resource: 'PROCESSO' },
    'PUT /api/processos/:id': { action: 'UPDATE', resource: 'PROCESSO' },
    'DELETE /api/processos/:id': { action: 'DELETE', resource: 'PROCESSO' },
    
    // Alertas
    'GET /api/alerts': { action: 'ACCESS', resource: 'ALERTA' },
    'GET /api/alerts/:id': { action: 'ACCESS', resource: 'ALERTA' },
    'PATCH /api/alerts/:id/read': { action: 'UPDATE', resource: 'ALERTA' },
    'DELETE /api/alerts/:id': { action: 'DELETE', resource: 'ALERTA' },
    
    // Relatórios
    'GET /api/relatorios': { action: 'ACCESS', resource: 'RELATORIO' },
    'POST /api/relatorios': { action: 'CREATE', resource: 'RELATORIO' },
    'DELETE /api/relatorios/:id': { action: 'DELETE', resource: 'RELATORIO' }
  };

  const routeKey = `${method} ${path.replace(/\/\d+/g, '/:id')}`;
  const actionConfig = routeMap[routeKey];

  if (actionConfig) {
    const resourceId = extractResourceId(path, method);
    const status = res.statusCode < 400 ? 'SUCCESS' : 'FAILED';
    const severity = determineSeverity(actionConfig.action, status, res.statusCode);

    await AuditLogger.log({
      userId: user?.id || null,
      action: actionConfig.action,
      resource: actionConfig.resource,
      resourceId,
      details: {
        method,
        path,
        statusCode: res.statusCode,
        query: req.query,
        body: sanitizeBody(req.body, actionConfig.action)
      },
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
      status,
      severity
    });
  }
}

/**
 * Extrai ID do recurso da URL
 */
function extractResourceId(path, method) {
  if (method === 'GET' && path.includes('/api/')) {
    const matches = path.match(/\/(\d+)(?:\/|$)/);
    return matches ? parseInt(matches[1]) : null;
  }
  return null;
}

/**
 * Determina a severidade baseada na ação e status
 */
function determineSeverity(action, status, statusCode) {
  if (status === 'FAILED') {
    if (statusCode >= 500) return 'CRITICAL';
    if (statusCode >= 400) return 'HIGH';
  }

  switch (action) {
    case 'DELETE':
    case 'PASSWORD_CHANGE':
    case 'PASSWORD_RESET':
      return 'HIGH';
    case 'CREATE':
    case 'UPDATE':
    case 'LOGIN':
      return 'MEDIUM';
    case 'ACCESS':
    case 'LOGOUT':
      return 'LOW';
    default:
      return 'MEDIUM';
  }
}

/**
 * Sanitiza o body para remover informações sensíveis
 */
function sanitizeBody(body, action) {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  
  // Remove campos sensíveis
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

export {
  auditMiddleware,
  autoAuditMiddleware
};
