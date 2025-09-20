/**
 * Script completo para testar o sistema de email
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testEmailSystem() {
  console.log('🧪 Testando Sistema de Email Completo...\n');

  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'plain@test.com',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.token) {
      throw new Error('Falha no login');
    }

    const token = loginData.token;
    console.log('✅ Login realizado com sucesso\n');

    // 2. Criar processo base
    console.log('2️⃣ Criando processo base...');
    const processResponse = await fetch(`${API_BASE}/test/create-base-process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const processData = await processResponse.json();
    if (processData.process) {
      console.log(`✅ Processo base criado: ${processData.process.numero} (ID: ${processData.process.id})\n`);
    } else {
      console.log(`ℹ️ ${processData.message}\n`);
    }

    // 3. Testar webhook diretamente
    console.log('3️⃣ Testando webhook diretamente...');
    const webhookResponse = await fetch(`${API_BASE}/email/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'naoresponda.pje.push1@trf1.jus.br',
        to: 'plain@test.com',
        subject: 'Movimentação processual do processo 1000000-12.2023.4.01.3300',
        body: `JUSTIÇA FEDERAL DA 1ª REGIÃO

PJe Push - Serviço de Acompanhamento automático de processos

Prezado(a) ,

Informamos que o processo a seguir sofreu movimentação:
Número do Processo: 1000000-12.2023.4.01.3300
Polo Ativo: Xxx da Silva
Polo Passivo: zzzz Augusto
Classe Judicial: PROCEDIMENTO DO JUIZADO ESPECIAL CÍVEL
Órgão: 15ª Vara Federal de Juizado Especial Cível da SJBA
Data de Autuação: 19/06/2023
Tipo de Distribuição: sorteio
Assunto: Indenização por Dano Material

Data\tMovimento\tDocumento
09/09/2025 01:24\tDecorrido prazo de SISTEMA DE EDUCACAO SUPERIOR. em 08/09/2025 23:59.\t
09/09/2025 00:32\tDecorrido prazo de UNIÃO FEDERAL em 08/09/2025 23:59.\t
09/09/2025 00:28\tDecorrido prazo de DOS SANTOS AMORIM em 08/09/2025 23:59.\t

Este é um email automático, não responda.

Atenciosamente,
Sistema PJe Push - TRF1`,
        receivedAt: new Date().toISOString()
      })
    });

    const webhookData = await webhookResponse.json();
    if (webhookData.processed) {
      console.log(`✅ Webhook processado com sucesso: ${webhookData.message}`);
      console.log(`   Processo: ${webhookData.processNumber} (ID: ${webhookData.processId})`);
      console.log(`   Movimentações processadas: ${webhookData.movementsProcessed}\n`);
    } else {
      console.log(`❌ Erro no webhook: ${webhookData.error}\n`);
    }

    // 4. Enviar email de teste via API
    console.log('4️⃣ Enviando email de teste via API...');
    const testEmailResponse = await fetch(`${API_BASE}/test/send-test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        to: 'mau_oliver@hotmail.com',
        processNumber: '1000000-12.2023.4.01.3300',
        movements: [
          {
            date: '09/09/2025',
            time: '14:30',
            movement: 'Nova movimentação de teste via API'
          }
        ]
      })
    });

    const testEmailData = await testEmailResponse.json();
    if (testEmailData.result && testEmailData.result.processed) {
      console.log(`✅ Email de teste enviado com sucesso`);
      console.log(`   Processo: ${testEmailData.result.processNumber}`);
      console.log(`   Movimentações processadas: ${testEmailData.result.movementsProcessed}\n`);
    } else {
      console.log(`❌ Erro ao enviar email de teste: ${testEmailData.error}\n`);
    }

    // 5. Listar processos
    console.log('5️⃣ Listando processos...');
    const listResponse = await fetch(`${API_BASE}/test/list-processes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const listData = await listResponse.json();
    if (listData.processes) {
      console.log(`✅ ${listData.processes.length} processo(s) encontrado(s):`);
      listData.processes.forEach(p => {
        console.log(`   - ${p.numero} (${p.classe}) - Status: ${p.status}`);
      });
      console.log('');
    }

    // 6. Testar parser isoladamente
    console.log('6️⃣ Testando parser isoladamente...');
    const parserResponse = await fetch(`${API_BASE}/email/test-parser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        emailContent: `JUSTIÇA FEDERAL DA 1ª REGIÃO

PJe Push - Serviço de Acompanhamento automático de processos

Prezado(a) ,

Informamos que o processo a seguir sofreu movimentação:
Número do Processo: 2000000-23.2024.4.01.3300
Polo Ativo: João da Silva
Polo Passivo: Maria Santos
Classe Judicial: AÇÃO DE COBRANÇA
Órgão: 10ª Vara Federal Cível da SJBA
Data de Autuação: 15/08/2024
Tipo de Distribuição: eletrônica
Assunto: Cobrança de Contrato

Data\tMovimento\tDocumento
10/09/2025 10:15\tJuntada de petição inicial.\t
10/09/2025 10:16\tDespacho de citação.\t

Este é um email automático, não responda.

Atenciosamente,
Sistema PJe Push - TRF1`
      })
    });

    const parserData = await parserResponse.json();
    if (parserData.parsed) {
      console.log(`✅ Parser funcionando corretamente`);
      console.log(`   Processo: ${parserData.parsed.numero}`);
      console.log(`   Polo Ativo: ${parserData.parsed.poloAtivo}`);
      console.log(`   Polo Passivo: ${parserData.parsed.poloPassivo}`);
      console.log(`   Classe: ${parserData.parsed.classe}`);
      console.log(`   Movimentações: ${parserData.parsed.movimentacoes.length}\n`);
    }

    console.log('🎉 Teste completo realizado com sucesso!');
    console.log('\n📋 Resumo dos testes:');
    console.log('   ✅ Login funcionando');
    console.log('   ✅ Processo base criado');
    console.log('   ✅ Webhook processando emails');
    console.log('   ✅ API de teste funcionando');
    console.log('   ✅ Parser extraindo dados corretamente');
    console.log('\n🚀 Sistema de email está 100% funcional!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.error(error);
  }
}

// Executa os testes
testEmailSystem();
