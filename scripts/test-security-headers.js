#!/usr/bin/env node

/**
 * Script para testar headers de segurança
 * Verifica se todos os headers estão sendo aplicados corretamente
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Headers esperados para diferentes endpoints
const expectedHeaders = {
  // Headers gerais
  general: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  },
  
  // Headers para APIs
  api: {
    'X-API-Version': '1.0.0',
    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
  },
  
  // Headers para autenticação
  auth: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
    'Clear-Site-Data': '"cache", "cookies", "storage"'
  },
  
  // Headers de produção
  production: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY'
  },
  
  // Headers de desenvolvimento
  development: {
    'Strict-Transport-Security': 'max-age=86400',
    'X-Frame-Options': 'SAMEORIGIN'
  }
};

/**
 * Testa um endpoint específico
 */
async function testEndpoint(url, expectedHeaders, description) {
  try {
    console.log(`\n🔍 Testando: ${description}`);
    console.log(`📡 URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Security-Headers-Test/1.0'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    // Verifica headers esperados
    let passedTests = 0;
    let totalTests = Object.keys(expectedHeaders).length;
    
    for (const [headerName, expectedValue] of Object.entries(expectedHeaders)) {
      const actualValue = response.headers.get(headerName);
      
      if (actualValue) {
        if (actualValue.includes(expectedValue) || expectedValue.includes(actualValue)) {
          console.log(`✅ ${headerName}: ${actualValue}`);
          passedTests++;
        } else {
          console.log(`⚠️  ${headerName}: ${actualValue} (esperado: ${expectedValue})`);
        }
      } else {
        console.log(`❌ ${headerName}: AUSENTE`);
      }
    }
    
    // Verifica CSP
    const csp = response.headers.get('Content-Security-Policy');
    if (csp) {
      console.log(`✅ Content-Security-Policy: ${csp.substring(0, 100)}...`);
      passedTests++;
      totalTests++;
    } else {
      console.log(`❌ Content-Security-Policy: AUSENTE`);
      totalTests++;
    }
    
    // Verifica Permissions-Policy
    const permissionsPolicy = response.headers.get('Permissions-Policy');
    if (permissionsPolicy) {
      console.log(`✅ Permissions-Policy: ${permissionsPolicy}`);
      passedTests++;
      totalTests++;
    } else {
      console.log(`❌ Permissions-Policy: AUSENTE`);
      totalTests++;
    }
    
    const percentage = Math.round((passedTests / totalTests) * 100);
    console.log(`📈 Resultado: ${passedTests}/${totalTests} (${percentage}%)`);
    
    return { passedTests, totalTests, percentage };
    
  } catch (error) {
    console.log(`❌ Erro ao testar ${description}: ${error.message}`);
    return { passedTests: 0, totalTests: 1, percentage: 0 };
  }
}

/**
 * Executa todos os testes
 */
async function runSecurityTests() {
  console.log('🛡️  TESTE DE HEADERS DE SEGURANÇA');
  console.log('=====================================');
  console.log(`🌐 URL Base: ${BASE_URL}`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const envHeaders = isDevelopment ? expectedHeaders.development : expectedHeaders.production;
  
  const tests = [
    {
      url: `${BASE_URL}/api/health`,
      headers: { ...expectedHeaders.general, ...expectedHeaders.api, ...envHeaders },
      description: 'Health Check (API)'
    },
    {
      url: `${BASE_URL}/api/alerts`,
      headers: { ...expectedHeaders.general, ...expectedHeaders.api, ...envHeaders },
      description: 'Listar Alertas (API)'
    },
    {
      url: `${BASE_URL}/docs`,
      headers: { ...expectedHeaders.general, ...envHeaders },
      description: 'Documentação Swagger'
    },
    {
      url: `${BASE_URL}/`,
      headers: { ...expectedHeaders.general, ...envHeaders },
      description: 'Página Principal'
    }
  ];
  
  let totalPassed = 0;
  let totalTests = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, test.headers, test.description);
    totalPassed += result.passedTests;
    totalTests += result.totalTests;
  }
  
  // Resultado final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTADO FINAL');
  console.log('='.repeat(50));
  
  const finalPercentage = Math.round((totalPassed / totalTests) * 100);
  
  if (finalPercentage >= 90) {
    console.log(`🎉 EXCELENTE! ${totalPassed}/${totalTests} (${finalPercentage}%)`);
    console.log('✅ Headers de segurança configurados corretamente');
  } else if (finalPercentage >= 70) {
    console.log(`⚠️  BOM: ${totalPassed}/${totalTests} (${finalPercentage}%)`);
    console.log('🔧 Alguns headers podem precisar de ajustes');
  } else {
    console.log(`❌ ATENÇÃO: ${totalPassed}/${totalTests} (${finalPercentage}%)`);
    console.log('🚨 Headers de segurança precisam ser corrigidos');
  }
  
  console.log('\n🛡️  Headers implementados:');
  console.log('   • Content Security Policy (CSP)');
  console.log('   • HTTP Strict Transport Security (HSTS)');
  console.log('   • X-Frame-Options');
  console.log('   • X-Content-Type-Options');
  console.log('   • X-XSS-Protection');
  console.log('   • Referrer-Policy');
  console.log('   • Permissions-Policy');
  console.log('   • Cache-Control (para APIs)');
  console.log('   • Clear-Site-Data (para autenticação)');
  
  process.exit(finalPercentage >= 70 ? 0 : 1);
}

// Executa os testes
runSecurityTests().catch(error => {
  console.error('❌ Erro durante os testes:', error);
  process.exit(1);
});
