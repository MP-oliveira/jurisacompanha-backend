import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Modelo para subscriptions de push notifications
 */
const PushSubscription = sequelize.define('PushSubscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  endpoint: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  p256dh: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'p256dh'
  },
  auth: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_used'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'push_subscriptions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['endpoint'],
      unique: true
    }
  ]
});

export default PushSubscription;
