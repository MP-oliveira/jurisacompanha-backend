import AuditLog from '../models/AuditLog.js';
import { Op } from 'sequelize';

/**
 * Serviço de auditoria para registrar ações importantes no sistema
 */
class AuditLogger {
  
  /**
   * Registra uma ação de auditoria
   * @param {Object} logData - Dados do log
   * @param {number} logData.userId - ID do usuário
   * @param {string} logData.action - Ação realizada
   * @param {string} logData.resource - Recurso afetado
   * @param {number} logData.resourceId - ID do recurso
   * @param {Object} logData.details - Detalhes adicionais
   * @param {string} logData.ipAddress - Endereço IP
   * @param {string} logData.userAgent - User Agent
   * @param {string} logData.status - Status da ação (SUCCESS, FAILED, WARNING)
   * @param {string} logData.severity - Severidade (LOW, MEDIUM, HIGH, CRITICAL)
   */
  static async log({
    userId = null,
    action,
    resource,
    resourceId = null,
    details = {},
    ipAddress = null,
    userAgent = null,
    status = 'SUCCESS',
    severity = 'MEDIUM'
  }) {
    try {
      const auditLog = await AuditLog.create({
        userId,
        action: action.toUpperCase(),
        resource: resource.toUpperCase(),
        resourceId,
        details,
        ipAddress,
        userAgent,
        status: status.toUpperCase(),
        severity: severity.toUpperCase(),
        timestamp: new Date()
      });

      // Log no console para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
      }

      return auditLog;
    } catch (error) {
      console.error('❌ Erro ao registrar log de auditoria:', error);
      // Não falha a operação principal se o log falhar
    }
  }

  /**
   * Registra tentativa de login
   */
  static async logLogin(userId, email, ipAddress, userAgent, status = 'SUCCESS') {
    return this.log({
      userId,
      action: 'LOGIN',
      resource: 'USER',
      resourceId: userId,
      details: { email },
      ipAddress,
      userAgent,
      status,
      severity: status === 'FAILED' ? 'HIGH' : 'MEDIUM'
    });
  }

  /**
   * Registra logout
   */
  static async logLogout(userId, ipAddress, userAgent) {
    return this.log({
      userId,
      action: 'LOGOUT',
      resource: 'USER',
      resourceId: userId,
      ipAddress,
      userAgent,
      severity: 'LOW'
    });
  }

  /**
   * Registra criação de recurso
   */
  static async logCreate(userId, resource, resourceId, details = {}, ipAddress, userAgent) {
    return this.log({
      userId,
      action: 'CREATE',
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      severity: 'MEDIUM'
    });
  }

  /**
   * Registra atualização de recurso
   */
  static async logUpdate(userId, resource, resourceId, details = {}, ipAddress, userAgent) {
    return this.log({
      userId,
      action: 'UPDATE',
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      severity: 'MEDIUM'
    });
  }

  /**
   * Registra exclusão de recurso
   */
  static async logDelete(userId, resource, resourceId, details = {}, ipAddress, userAgent) {
    return this.log({
      userId,
      action: 'DELETE',
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      severity: 'HIGH'
    });
  }

  /**
   * Registra acesso a recurso sensível
   */
  static async logAccess(userId, resource, resourceId, details = {}, ipAddress, userAgent) {
    return this.log({
      userId,
      action: 'ACCESS',
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      severity: 'MEDIUM'
    });
  }

  /**
   * Registra erro crítico
   */
  static async logError(error, userId = null, resource = 'SYSTEM', details = {}, ipAddress, userAgent) {
    return this.log({
      userId,
      action: 'ERROR',
      resource,
      details: {
        error: error.message,
        stack: error.stack,
        ...details
      },
      ipAddress,
      userAgent,
      status: 'FAILED',
      severity: 'CRITICAL'
    });
  }

  /**
   * Registra tentativa de acesso não autorizado
   */
  static async logUnauthorized(userId, resource, details = {}, ipAddress, userAgent) {
    return this.log({
      userId,
      action: 'UNAUTHORIZED_ACCESS',
      resource,
      details,
      ipAddress,
      userAgent,
      status: 'FAILED',
      severity: 'HIGH'
    });
  }

  /**
   * Registra mudança de senha
   */
  static async logPasswordChange(userId, ipAddress, userAgent, status = 'SUCCESS') {
    return this.log({
      userId,
      action: 'PASSWORD_CHANGE',
      resource: 'USER',
      resourceId: userId,
      ipAddress,
      userAgent,
      status,
      severity: 'HIGH'
    });
  }

  /**
   * Registra tentativa de recuperação de senha
   */
  static async logPasswordReset(email, ipAddress, userAgent, status = 'SUCCESS') {
    return this.log({
      action: 'PASSWORD_RESET',
      resource: 'USER',
      details: { email },
      ipAddress,
      userAgent,
      status,
      severity: status === 'SUCCESS' ? 'HIGH' : 'MEDIUM'
    });
  }

  /**
   * Busca logs de auditoria com filtros
   */
  static async getLogs({
    userId = null,
    action = null,
    resource = null,
    status = null,
    severity = null,
    startDate = null,
    endDate = null,
    limit = 100,
    offset = 0
  } = {}) {
    try {
      const where = {};

      if (userId) where.userId = userId;
      if (action) where.action = action.toUpperCase();
      if (resource) where.resource = resource.toUpperCase();
      if (status) where.status = status.toUpperCase();
      if (severity) where.severity = severity.toUpperCase();
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp[Op.gte] = startDate;
        if (endDate) where.timestamp[Op.lte] = endDate;
      }

      const logs = await AuditLog.findAndCountAll({
        where,
        order: [['timestamp', 'DESC']],
        limit,
        offset
      });

      return logs;
    } catch (error) {
      console.error('❌ Erro ao buscar logs de auditoria:', error);
      throw error;
    }
  }

  /**
   * Estatísticas de auditoria
   */
  static async getStats(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sequelizeInstance = await import('../config/database.js');
      
      const stats = await AuditLog.findAll({
        where: {
          timestamp: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          'action',
          'status',
          'severity',
          [sequelizeInstance.default.fn('COUNT', sequelizeInstance.default.col('id')), 'count']
        ],
        group: ['action', 'status', 'severity'],
        raw: true
      });

      return stats;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de auditoria:', error);
      throw error;
    }
  }
}

export default AuditLogger;
