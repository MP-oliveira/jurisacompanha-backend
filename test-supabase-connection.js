// Teste simples para verificar conexão com Supabase
import { supabase, supabaseAdmin } from './src/config/supabase.js';

console.log('🔍 Testando conexão com Supabase...');

// Teste com supabase normal
console.log('📡 Testando com supabase normal...');
const { data: normalData, error: normalError } = await supabase
  .from('alertas')
  .select('*')
  .eq('user_id', 4)
  .limit(1);

if (normalError) {
  console.error('❌ Erro com supabase normal:', normalError);
} else {
  console.log('✅ Supabase normal funcionando:', normalData);
}

// Teste com supabaseAdmin
console.log('📡 Testando com supabaseAdmin...');
const { data: adminData, error: adminError } = await supabaseAdmin
  .from('alertas')
  .select('*')
  .eq('user_id', 4)
  .limit(1);

if (adminError) {
  console.error('❌ Erro com supabaseAdmin:', adminError);
} else {
  console.log('✅ SupabaseAdmin funcionando:', adminData);
}

