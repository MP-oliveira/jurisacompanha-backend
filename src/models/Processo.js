import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Processo extends Model {}

Processo.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  classe: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  assunto: {
    type: DataTypes.TEXT,
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
    type: DataTypes.ENUM('ativo', 'arquivado', 'suspenso'),
    defaultValue: 'ativo'
  },
  dataDistribuicao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dataSentenca: {
    type: DataTypes.DATE,
    allowNull: true
  },
  prazoRecurso: {
    type: DataTypes.DATE,
    allowNull: true
  },
  prazoEmbargos: {
    type: DataTypes.DATE,
    allowNull: true
  },
  proximaAudiencia: {
    type: DataTypes.DATE,
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
  modelName: 'Processo',
  tableName: 'processos'
});

export default Processo;
