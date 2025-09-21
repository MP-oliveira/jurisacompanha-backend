// Supabase Configuration for Backend
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Debug somente em desenvolvimento para não vazar variáveis em produção
if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 Debug das variáveis de ambiente:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
  console.log('Diretório atual:', process.cwd());
}

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.error('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY);
  throw new Error('Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
}

// Criar o cliente Supabase para operações normais
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Para uso em servidor
      detectSessionInUrl: false
    }
  }
);

// Criar o cliente Supabase para operações admin (se service role key estiver disponível)
let supabaseAdmin = null;
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  );
  console.log('✅ Cliente admin do Supabase criado com sucesso!');
} else {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY não definida. Operações admin podem não funcionar.');
}

// Função para testar a conexão
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .single();
    
    if (error) {
      console.error('Erro ao testar conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro na conexão com Supabase:', err.message);
    return false;
  }
};

export {
  supabase,
  supabaseAdmin,
  testConnection
};

export default supabase;
