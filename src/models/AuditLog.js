import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Ação realizada (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.)'
  },
  resource: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Recurso afetado (USER, PROCESSO, ALERTA, etc.)'
  },
  resourceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'resource_id',
    comment: 'ID do recurso afetado'
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Detalhes adicionais da ação em formato JSON'
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  status: {
    type: DataTypes.ENUM('SUCCESS', 'FAILED', 'WARNING'),
    allowNull: false,
    defaultValue: 'SUCCESS'
  },
  severity: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    allowNull: false,
    defaultValue: 'MEDIUM'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'audit_logs',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['resource']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['status']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['ip_address']
    }
  ]
});

export default AuditLog;
