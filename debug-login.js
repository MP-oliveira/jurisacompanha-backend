import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const supabaseUrl = 'https://ejrnrdsihiaipptfopqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplanJuc2RzaGlhaXBwdGZvcHF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5NDc5MSwiZXhwIjoyMDczOTcwNzkxfQ.bXl9yFF_uAS5nWoNB9E43ybls0JwMzi0jC_i9Z4cD70';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLogin() {
  try {
    console.log('🔍 Debugando login...');
    
    // Buscar usuário no banco
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'guilhermefernandes.adv@hotmail.com');
    
    if (error) {
      console.log('❌ Erro ao buscar usuário:', error);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    const user = users[0];
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
      ativo: user.ativo,
      passwordHash: user.password.substring(0, 20) + '...'
    });
    
    // Testar senha
    const password = 'Gui@2025!';
    const isValid = await bcrypt.compare(password, user.password);
    
    console.log('🔐 Teste de senha:');
    console.log('- Senha testada:', password);
    console.log('- Hash no banco:', user.password);
    console.log('- Senha válida:', isValid);
    
    // Gerar novo hash para comparação
    const newHash = await bcrypt.hash(password, 10);
    console.log('- Novo hash gerado:', newHash);
    
  } catch (err) {
    console.log('❌ Erro geral:', err);
  }
}

debugLogin();
