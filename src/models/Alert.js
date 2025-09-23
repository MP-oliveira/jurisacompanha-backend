import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Alert extends Model {}

Alert.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.ENUM('audiencia', 'prazo_recurso', 'prazo_embargos', 'despacho', 'distribuicao'),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  dataVencimento: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dataNotificacao: {
    type: DataTypes.DATE,
    allowNull: false
  },
  lido: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  prioridade: {
    type: DataTypes.ENUM('baixa', 'media', 'alta', 'urgente'),
    defaultValue: 'media'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  processoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'processos',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Alert',
  tableName: 'alertas'
});

export default Alert;
