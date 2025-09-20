import { Processo, Alert } from '../src/models/index.js';
import logger from '../src/config/logger.js';

async function cleanDatabase() {
  try {
    console.log('🧹 Iniciando limpeza do banco de dados...');
    
    // Conta registros antes da limpeza
    const processosCount = await Processo.count();
    const alertasCount = await Alert.count();
    
    console.log(`📊 Encontrados: ${processosCount} processos e ${alertasCount} alertas`);
    
    if (processosCount > 0) {
      // Deleta todos os alertas primeiro (por causa da foreign key)
      await Alert.destroy({ where: {} });
      console.log('✅ Alertas deletados');
      
      // Deleta todos os processos
      await Processo.destroy({ where: {} });
      console.log('✅ Processos deletados');
    }
    
    // Verifica se ficou limpo
    const processosRestantes = await Processo.count();
    const alertasRestantes = await Alert.count();
    
    console.log(`🎉 Limpeza concluída! Restantes: ${processosRestantes} processos e ${alertasRestantes} alertas`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Erro ao limpar banco de dados:', error);
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
