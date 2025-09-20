import sequelize from '../config/database.js';
import User from './User.js';
import Processo from './Processo.js';
import Alert from './Alert.js';
import Consulta from './Consulta.js';
import Relatorio from './Relatorio.js';

// Definindo associações
User.hasMany(Processo, { foreignKey: 'userId', as: 'processos' });
Processo.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Processo.hasMany(Alert, { foreignKey: 'processoId', as: 'alertas' });
Alert.belongsTo(Processo, { foreignKey: 'processoId', as: 'processo' });

User.hasMany(Alert, { foreignKey: 'userId', as: 'alertas' });
Alert.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Consulta, { foreignKey: 'userId', as: 'consultas' });
Consulta.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Relatorio, { foreignKey: 'userId', as: 'relatorios' });
Relatorio.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { sequelize, User, Processo, Alert, Consulta, Relatorio };
