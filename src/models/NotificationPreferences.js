// backend/src/models/NotificationPreferences.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const NotificationPreferences = sequelize.define('NotificationPreferences', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // Um usuário tem apenas um conjunto de preferências
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'CASCADE',
    field: 'user_id',
  },
  
  // Preferências de Email - Simplificadas para Advocacia
  emailEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'email_enabled',
  },
  emailCriticalAlerts: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'email_critical_alerts',
  },
  
  // Preferências de Push Notification - Simplificadas
  pushEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'push_enabled',
  },
  pushCriticalAlerts: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'push_critical_alerts',
  },
  
  // Configurações de frequência
  alertFrequency: {
    type: DataTypes.ENUM('immediate', 'daily', 'weekly'),
    defaultValue: 'immediate',
    field: 'alert_frequency',
  },
  
  // Horário preferido
  preferredTime: {
    type: DataTypes.TIME,
    defaultValue: '09:00:00', // Ex: 9 AM
    field: 'preferred_time',
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'America/Sao_Paulo',
  },
}, {
  tableName: 'notification_preferences',
  timestamps: true,
  underscored: true,
});

// Associações
NotificationPreferences.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(NotificationPreferences, { foreignKey: 'userId', as: 'notificationPreferences' });

export default NotificationPreferences;