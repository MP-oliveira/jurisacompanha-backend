#!/usr/bin/env node

// Script para criar alerta no Supabase correto
import { createClient } from '@supabase/supabase-js';

// Configurações corretas do Supabase
const SUPABASE_URL = 'https://zejrnsdshiaipptfopqu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplanJuc2RzaGlhaXBwdGZvcHF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5NDc5MSwiZXhwIjoyMDczOTcwNzkxfQ.bXl9yFF_uAS5nWoNB9E43ybls0JwMzi0jC_i9Z4cD70';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createAlertForGuilherme() {
  console.log('🚀 Criando alerta para o Guilherme no Supabase correto...');
  
  try {
    // Verificar usuários
    console.log('\n👥 VERIFICANDO USUÁRIOS:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    console.log(`✅ ${users.length} usuários encontrados:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.nome} (${user.email}) - ID: ${user.id}`);
    });
    
    // Buscar o usuário do Guilherme
    const guilherme = users.find(user => user.email === 'guilherme@jurisacompanha.com');
    
    if (!guilherme) {
      console.log('❌ Usuário do Guilherme não encontrado');
      return;
    }
    
    console.log(`\n👤 Usuário do Guilherme encontrado: ${guilherme.nome} (ID: ${guilherme.id})`);
    
    // Verificar processos do Guilherme
    console.log('\n📋 VERIFICANDO PROCESSOS DO GUILHERME:');
    const { data: processos, error: processosError } = await supabase
      .from('processos')
      .select('*')
      .eq('user_id', guilherme.id)
      .order('created_at', { ascending: false });
    
    if (processosError) {
      console.error('❌ Erro ao buscar processos:', processosError);
      return;
    }
    
    console.log(`✅ ${processos.length} processos do Guilherme encontrados:`);
    processos.forEach((processo, index) => {
      console.log(`   ${index + 1}. ${processo.numero} - ${processo.classe}`);
    });
    
    // Criar um processo se não existir
    let processoId;
    if (processos.length === 0) {
      console.log('\n📋 Criando processo para o Guilherme...');
      const { data: newProcesso, error: processoError } = await supabase
        .from('processos')
        .insert({
          numero: 'GUILHERME-2025-001',
          classe: 'Ação de Cobrança',
          assunto: 'Processo de teste para alertas',
          tribunal: 'TJ-BA',
          comarca: 'Salvador',
          status: 'ativo',
          user_id: guilherme.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (processoError) {
        console.error('❌ Erro ao criar processo:', processoError);
        return;
      }
      
      console.log('✅ Processo criado:', newProcesso.numero);
      processoId = newProcesso.id;
    } else {
      processoId = processos[0].id;
      console.log(`\n📋 Usando processo existente: ${processos[0].numero}`);
    }
    
    // Criar alerta para o Guilherme
    console.log('\n🔔 CRIANDO ALERTA PARA O GUILHERME:');
    const alertaData = {
      tipo: 'prazo_recurso',
      titulo: 'Alerta de Teste - Guilherme',
      mensagem: 'Este é um alerta de teste criado especificamente para o usuário Guilherme. Prazo para interposição de recurso vence em breve.',
      data_vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
      data_notificacao: new Date().toISOString(),
      lido: false,
      prioridade: 'alta',
      user_id: guilherme.id,
      processo_id: processoId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: alerta, error: alertaError } = await supabase
      .from('alerts')
      .insert(alertaData)
      .select()
      .single();
    
    if (alertaError) {
      console.error('❌ Erro ao criar alerta:', alertaError);
      return;
    }
    
    console.log('🎉 Alerta criado com sucesso!');
    console.log('📊 Detalhes do alerta:');
    console.log('   ID:', alerta.id);
    console.log('   Título:', alerta.titulo);
    console.log('   Tipo:', alerta.tipo);
    console.log('   Prioridade:', alerta.prioridade);
    console.log('   Data de Vencimento:', new Date(alerta.data_vencimento).toLocaleString('pt-BR'));
    console.log('   User ID:', alerta.user_id);
    console.log('   Processo ID:', alerta.processo_id);
    
    // Verificar alertas do Guilherme
    console.log('\n🔔 VERIFICANDO ALERTAS DO GUILHERME:');
    const { data: alertasGuilherme, error: alertasError } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', guilherme.id)
      .order('created_at', { ascending: false });
    
    if (alertasError) {
      console.error('❌ Erro ao buscar alertas:', alertasError);
      return;
    }
    
    console.log(`✅ ${alertasGuilherme.length} alertas do Guilherme encontrados:`);
    alertasGuilherme.forEach((alerta, index) => {
      console.log(`   ${index + 1}. ${alerta.titulo} (${alerta.tipo}) - ${alerta.lido ? 'Lido' : 'Não lido'}`);
      console.log(`      Prioridade: ${alerta.prioridade} - Vencimento: ${new Date(alerta.data_vencimento).toLocaleString('pt-BR')}`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
createAlertForGuilherme().then(() => {
  console.log('\n✅ Teste concluído!');
  console.log('🔍 Verifique o frontend para ver o alerta criado.');
}).catch(error => {
  console.error('❌ Erro no teste:', error);
});


