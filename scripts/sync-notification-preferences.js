// backend/scripts/sync-notification-preferences.js

/**
 * Script para sincronizar a tabela de notification preferences
 * com as configurações simplificadas para advocacia
 */

import sequelize from '../src/config/database.js';
import NotificationPreferences from '../src/models/NotificationPreferences.js';

async function syncNotificationPreferences() {
  try {
    console.log('🔄 Sincronizando tabela notification_preferences...');
    
    // Sincronizar com alterações (isso vai atualizar a estrutura da tabela)
    await NotificationPreferences.sync({ alter: true });
    console.log('✅ Tabela notification_preferences sincronizada com sucesso!');

    // Opcional: Verificar se a tabela realmente existe
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type LIKE '%TABLE' AND table_name != 'spatial_ref_sys';"
    );
    
    if (results.some(table => table.table_name === 'notification_preferences')) {
      console.log('✅ Tabela notification_preferences existe no banco de dados');
      
      // Mostrar estrutura da tabela
      const [columns] = await sequelize.query(
        "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'notification_preferences' ORDER BY ordinal_position;"
      );
      
      console.log('📋 Colunas da tabela:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.error('❌ Erro: Tabela notification_preferences não encontrada após sincronização.');
    }

  } catch (error) {
    console.error('❌ Erro ao sincronizar tabela notification_preferences:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

syncNotificationPreferences();