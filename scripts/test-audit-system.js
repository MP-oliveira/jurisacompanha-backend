#!/usr/bin/env node

/**
 * Script para testar o sistema de auditoria
 * Executa: node scripts/test-audit-system.js
 */

import AuditLogger from '../src/services/auditLogger.js';

async function testAuditSystem() {
  try {
    console.log('🧪 Testando sistema de auditoria...');
    
    // Teste 1: Log de login bem-sucedido
    console.log('📝 Teste 1: Log de login bem-sucedido');
    await AuditLogger.logLogin(
      1,
      'test@example.com',
      '192.168.1.100',
      'Mozilla/5.0 (Test Browser)',
      'SUCCESS'
    );
    console.log('✅ Login bem-sucedido registrado');
    
    // Teste 2: Log de login falhado
    console.log('📝 Teste 2: Log de login falhado');
    await AuditLogger.logLogin(
      null,
      'hacker@example.com',
      '192.168.1.200',
      'Mozilla/5.0 (Suspicious Browser)',
      'FAILED'
    );
    console.log('✅ Login falhado registrado');
    
    // Teste 3: Log de criação de processo
    console.log('📝 Teste 3: Log de criação de processo');
    await AuditLogger.logCreate(
      1,
      'PROCESSO',
      123,
      { numero: '1234567-89.2024.4.01.3300', assunto: 'Teste de auditoria' },
      '192.168.1.100',
      'Mozilla/5.0 (Test Browser)'
    );
    console.log('✅ Criação de processo registrada');
    
    // Teste 4: Log de acesso não autorizado (sem userId para evitar constraint)
    console.log('📝 Teste 4: Log de acesso não autorizado');
    await AuditLogger.log({
      userId: null, // Usuário não autenticado
      action: 'UNAUTHORIZED_ACCESS',
      resource: 'USER',
      details: { attemptedAction: 'DELETE_USER', targetUserId: 1 },
      ipAddress: '192.168.1.200',
      userAgent: 'Mozilla/5.0 (Suspicious Browser)',
      status: 'FAILED',
      severity: 'HIGH'
    });
    console.log('✅ Acesso não autorizado registrado');
    
    // Teste 5: Log de erro crítico
    console.log('📝 Teste 5: Log de erro crítico');
    const testError = new Error('Erro de teste para auditoria');
    await AuditLogger.logError(
      testError,
      1,
      'SYSTEM',
      { component: 'test-audit-system', operation: 'test-error' },
      '192.168.1.100',
      'Mozilla/5.0 (Test Browser)'
    );
    console.log('✅ Erro crítico registrado');
    
    // Teste 6: Buscar logs
    console.log('📝 Teste 6: Buscar logs de auditoria');
    const logs = await AuditLogger.getLogs({ limit: 10 });
    console.log(`✅ Encontrados ${logs.count} logs de auditoria`);
    
    // Mostrar alguns logs
    console.log('📊 Últimos 5 logs:');
    logs.rows.slice(0, 5).forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.action} ${log.resource} - ${log.status} (${log.severity})`);
    });
    
    // Teste 7: Estatísticas
    console.log('📝 Teste 7: Estatísticas de auditoria');
    const stats = await AuditLogger.getStats(7);
    console.log('✅ Estatísticas obtidas:', stats.length, 'grupos de dados');
    
    console.log('\n🎉 Todos os testes de auditoria foram executados com sucesso!');
    console.log('📈 Sistema de auditoria está funcionando corretamente');
    
  } catch (error) {
    console.error('❌ Erro ao testar sistema de auditoria:', error);
    process.exit(1);
  }
}

// Executa o teste
testAuditSystem();
