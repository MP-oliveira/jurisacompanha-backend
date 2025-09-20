import sequelize from '../src/config/database.js';
import Consulta from '../src/models/Consulta.js';
import User from '../src/models/User.js';

async function createTestConsultas() {
  try {
    console.log('🔄 Criando consultas de teste...');
    
    // Buscar o usuário admin
    const user = await User.findOne({ where: { email: 'plain@test.com' } });
    
    if (!user) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }
    
    console.log(`✅ Usuário encontrado: ${user.nome} (${user.email})`);
    
    // Criar consultas de teste
    const consultas = [
      {
        tipo: 'processo',
        numero: '1000000-12.2023.4.01.3300',
        classe: 'PROCEDIMENTO DO JUIZADO ESPECIAL CÍVEL',
        tribunal: '15ª Vara Federal de Juizado Especial Cível da SJBA',
        comarca: '15ª Vara Federal de Juizado Especial Cível da SJBA',
        status: 'encontrado',
        dataConsulta: new Date(),
        resultado: {
          status: 'ativo',
          ultimaMovimentacao: new Date().toISOString(),
          valorCausa: 'R$ 5.000,00',
          partes: ['João da Silva', 'Maria Santos']
        },
        observacoes: 'Consulta realizada com sucesso',
        userId: user.id
      },
      {
        tipo: 'processo',
        numero: '2000000-23.2023.4.01.3300',
        classe: 'AÇÃO DE COBRANÇA',
        tribunal: '2ª Vara Federal Cível da SJBA',
        comarca: '2ª Vara Federal Cível da SJBA',
        status: 'encontrado',
        dataConsulta: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ontem
        resultado: {
          status: 'ativo',
          ultimaMovimentacao: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          valorCausa: 'R$ 15.000,00',
          partes: ['Maria Silva Santos', 'João Carlos Oliveira']
        },
        observacoes: 'Processo em andamento',
        userId: user.id
      },
      {
        tipo: 'pessoa',
        numero: '12345678901',
        classe: '',
        tribunal: '',
        comarca: '',
        status: 'nao_encontrado',
        dataConsulta: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
        resultado: null,
        observacoes: 'CPF não encontrado no sistema',
        userId: user.id
      },
      {
        tipo: 'empresa',
        numero: '12345678000195',
        classe: '',
        tribunal: '',
        comarca: '',
        status: 'encontrado',
        dataConsulta: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 semana atrás
        resultado: {
          razaoSocial: 'Empresa Teste LTDA',
          situacao: 'Ativa',
          ultimaAtualizacao: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        observacoes: 'CNPJ encontrado e ativo',
        userId: user.id
      },
      {
        tipo: 'processo',
        numero: '3000000-34.2023.4.01.3300',
        classe: 'AÇÃO DE INDENIZAÇÃO',
        tribunal: '3ª Vara Federal Cível da SJBA',
        comarca: '3ª Vara Federal Cível da SJBA',
        status: 'erro',
        dataConsulta: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 mês atrás
        resultado: null,
        observacoes: 'Erro na consulta - sistema indisponível',
        userId: user.id
      }
    ];
    
    // Inserir consultas
    for (const consultaData of consultas) {
      await Consulta.create(consultaData);
      console.log(`✅ Consulta criada: ${consultaData.numero} (${consultaData.tipo})`);
    }
    
    console.log(`🎉 ${consultas.length} consultas de teste criadas com sucesso!`);
    
    // Verificar total
    const total = await Consulta.count({ where: { userId: user.id } });
    console.log(`📊 Total de consultas do usuário: ${total}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar consultas de teste:', error);
  } finally {
    await sequelize.close();
  }
}

createTestConsultas();
