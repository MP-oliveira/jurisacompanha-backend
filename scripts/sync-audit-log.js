#!/usr/bin/env node

/**
 * Script para sincronizar a tabela de auditoria
 * Executa: node scripts/sync-audit-log.js
 */

import sequelize from '../src/config/database.js';
import AuditLog from '../src/models/AuditLog.js';

async function syncAuditLog() {
  try {
    console.log('🔄 Sincronizando tabela de auditoria...');
    
    // Força a criação da tabela
    await AuditLog.sync({ force: false });
    
    console.log('✅ Tabela de auditoria sincronizada com sucesso!');
    
    // Verifica se a tabela foi criada
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    if (tableExists.includes('audit_logs')) {
      console.log('📊 Tabela audit_logs encontrada no banco de dados');
      
      // Conta registros existentes
      const count = await AuditLog.count();
      console.log(`📈 Total de logs de auditoria: ${count}`);
    } else {
      console.log('⚠️ Tabela audit_logs não foi encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao sincronizar tabela de auditoria:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexão com banco de dados fechada');
  }
}

// Executa o script
syncAuditLog();
