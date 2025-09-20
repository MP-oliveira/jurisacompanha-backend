import sequelize from '../src/config/database.js';
import Consulta from '../src/models/Consulta.js';

async function syncConsulta() {
  try {
    console.log('🔄 Sincronizando tabela de consultas...');
    
    await Consulta.sync({ force: false });
    console.log('✅ Tabela de consultas sincronizada com sucesso!');
    
    // Verificar se a tabela foi criada
    const [results] = await sequelize.query("SELECT COUNT(*) as count FROM consultas");
    console.log(`📊 Total de registros na tabela consultas: ${results[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro ao sincronizar tabela de consultas:', error);
  } finally {
    await sequelize.close();
  }
}

syncConsulta();
