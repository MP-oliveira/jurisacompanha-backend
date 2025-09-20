import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Consulta extends Model {}

Consulta.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.ENUM('processo', 'pessoa', 'empresa'),
    allowNull: false
  },
  numero: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  classe: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  tribunal: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  comarca: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('encontrado', 'nao_encontrado', 'erro'),
    allowNull: false
  },
  dataConsulta: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  resultado: {
    type: DataTypes.JSON,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Consulta',
  tableName: 'consultas'
});

export default Consulta;
