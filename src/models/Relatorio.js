import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Relatorio extends Model {}

Relatorio.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.ENUM('processos', 'prazos', 'alertas', 'consultas', 'usuarios'),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  periodo: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('processando', 'concluido', 'erro'),
    allowNull: false,
    defaultValue: 'processando'
  },
  dados: {
    type: DataTypes.JSON,
    allowNull: true
  },
  arquivo: {
    type: DataTypes.STRING(500),
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
  modelName: 'Relatorio',
  tableName: 'relatorios'
});

export default Relatorio;
