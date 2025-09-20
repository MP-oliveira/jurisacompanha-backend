import AuditLogger from '../services/auditLogger.js';
import { validationResult } from 'express-validator';

/**
 * Controller para gerenciar logs de auditoria
 */
class AuditController {
  
  /**
   * Lista logs de auditoria com filtros
   */
  static async getLogs(req, res) {
    try {
      const {
        userId,
        action,
        resource,
        status,
        severity,
        startDate,
        endDate,
        limit = 100,
        offset = 0
      } = req.query;

      // Validação de parâmetros
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros inválidos',
          errors: errors.array()
        });
      }

      // Verificar permissões (apenas admins podem ver logs de auditoria)
      if (req.user.role !== 'admin') {
        await AuditLogger.logUnauthorized(
          req.user.id,
          'AUDIT_LOG',
          { action: 'ACCESS_AUDIT_LOGS' },
          req.auditData.ipAddress,
          req.auditData.userAgent
        );
        
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Apenas administradores podem visualizar logs de auditoria.'
        });
      }

      const logs = await AuditLogger.getLogs({
        userId: userId ? parseInt(userId) : null,
        action,
        resource,
        status,
        severity,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Log da consulta
      await AuditLogger.logAccess(
        req.user.id,
        'AUDIT_LOG',
        null,
        {
          filters: { userId, action, resource, status, severity, startDate, endDate },
          resultCount: logs.count
        },
        req.auditData.ipAddress,
        req.auditData.userAgent
      );

      res.json({
        success: true,
        data: {
          logs: logs.rows,
          total: logs.count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      console.error('❌ Erro ao buscar logs de auditoria:', error);
      
      await AuditLogger.logError(
        error,
        req.user?.id,
        'AUDIT_LOG',
        { action: 'GET_LOGS' },
        req.auditData.ipAddress,
        req.auditData.userAgent
      );

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Busca estatísticas de auditoria
   */
  static async getStats(req, res) {
    try {
      // Verificar permissões
      if (req.user.role !== 'admin') {
        await AuditLogger.logUnauthorized(
          req.user.id,
          'AUDIT_STATS',
          { action: 'ACCESS_AUDIT_STATS' },
          req.auditData.ipAddress,
          req.auditData.userAgent
        );
        
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Apenas administradores podem visualizar estatísticas de auditoria.'
        });
      }

      const days = parseInt(req.query.days) || 30;
      const stats = await AuditLogger.getStats(days);

      // Log da consulta
      await AuditLogger.logAccess(
        req.user.id,
        'AUDIT_STATS',
        null,
        { days, resultCount: stats.length },
        req.auditData.ipAddress,
        req.auditData.userAgent
      );

      res.json({
        success: true,
        data: {
          period: `${days} dias`,
          stats
        }
      });

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de auditoria:', error);
      
      await AuditLogger.logError(
        error,
        req.user?.id,
        'AUDIT_STATS',
        { action: 'GET_STATS' },
        req.auditData.ipAddress,
        req.auditData.userAgent
      );

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Busca logs de um usuário específico
   */
  static async getUserLogs(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Verificar permissões - usuário pode ver seus próprios logs ou admin pode ver qualquer log
      if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
        await AuditLogger.logUnauthorized(
          req.user.id,
          'USER_AUDIT_LOG',
          { targetUserId: userId },
          req.auditData.ipAddress,
          req.auditData.userAgent
        );
        
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Você só pode visualizar seus próprios logs.'
        });
      }

      const logs = await AuditLogger.getLogs({
        userId: parseInt(userId),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Log da consulta
      await AuditLogger.logAccess(
        req.user.id,
        'USER_AUDIT_LOG',
        parseInt(userId),
        { targetUserId: userId, resultCount: logs.count },
        req.auditData.ipAddress,
        req.auditData.userAgent
      );

      res.json({
        success: true,
        data: {
          logs: logs.rows,
          total: logs.count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      console.error('❌ Erro ao buscar logs do usuário:', error);
      
      await AuditLogger.logError(
        error,
        req.user?.id,
        'USER_AUDIT_LOG',
        { action: 'GET_USER_LOGS', userId: req.params.userId },
        req.auditData.ipAddress,
        req.auditData.userAgent
      );

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Busca logs de segurança (tentativas de acesso não autorizado, falhas de login, etc.)
   */
  static async getSecurityLogs(req, res) {
    try {
      // Verificar permissões
      if (req.user.role !== 'admin') {
        await AuditLogger.logUnauthorized(
          req.user.id,
          'SECURITY_AUDIT_LOG',
          { action: 'ACCESS_SECURITY_LOGS' },
          req.auditData.ipAddress,
          req.auditData.userAgent
        );
        
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Apenas administradores podem visualizar logs de segurança.'
        });
      }

      const { limit = 100, offset = 0, days = 7 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const logs = await AuditLogger.getLogs({
        severity: 'HIGH',
        startDate,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Filtrar apenas logs relacionados à segurança
      const securityActions = ['LOGIN', 'UNAUTHORIZED_ACCESS', 'PASSWORD_RESET', 'PASSWORD_CHANGE', 'ERROR'];
      const securityLogs = logs.rows.filter(log => 
        securityActions.includes(log.action) || 
        log.severity === 'CRITICAL' || 
        log.status === 'FAILED'
      );

      // Log da consulta
      await AuditLogger.logAccess(
        req.user.id,
        'SECURITY_AUDIT_LOG',
        null,
        { days, resultCount: securityLogs.length },
        req.auditData.ipAddress,
        req.auditData.userAgent
      );

      res.json({
        success: true,
        data: {
          logs: securityLogs,
          total: securityLogs.length,
          period: `${days} dias`,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      console.error('❌ Erro ao buscar logs de segurança:', error);
      
      await AuditLogger.logError(
        error,
        req.user?.id,
        'SECURITY_AUDIT_LOG',
        { action: 'GET_SECURITY_LOGS' },
        req.auditData.ipAddress,
        req.auditData.userAgent
      );

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default AuditController;
