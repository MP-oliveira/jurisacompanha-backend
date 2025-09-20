#!/usr/bin/env node

/**
 * Script para sincronizar a tabela de push subscriptions
 */

import sequelize from '../src/config/database.js';
import PushSubscription from '../src/models/PushSubscription.js';

async function syncPushSubscriptions() {
  try {
    console.log('🔄 Sincronizando tabela push_subscriptions...');
    
    // Sincronizar apenas esta tabela
    await PushSubscription.sync({ force: false });
    
    console.log('✅ Tabela push_subscriptions sincronizada com sucesso!');
    
    // Verificar se a tabela foi criada
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    if (tableExists.includes('push_subscriptions')) {
      console.log('✅ Tabela push_subscriptions existe no banco de dados');
    } else {
      console.log('❌ Tabela push_subscriptions não foi criada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao sincronizar tabela push_subscriptions:', error);
  } finally {
    await sequelize.close();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  syncPushSubscriptions();
}

export default syncPushSubscriptions;
