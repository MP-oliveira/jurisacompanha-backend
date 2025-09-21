import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

// Configurar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zejrnsdshiaipptfopqu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplanJuc2RzaGlhaXBwdGZvcHF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5NDc5MSwiZXhwIjoyMDczOTcwNzkxfQ.bXl9yFF_uAS5nWoNB9E43ybls0JwMzi0jC_i9Z4cD70'
);

console.log('🔗 Supabase URL:', process.env.SUPABASE_URL || 'https://zejrnsdshiaipptfopqu.supabase.co');
console.log('🔑 Service Role Key configurada:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Middlewares básicos
app.use(cors({
  origin: [
    'https://jurisacompanha.vercel.app',
    'https://jurisacompanha-frontend.vercel.app',
    'https://jurisacompanha-frontend-chim9pjw3.vercel.app',
    'https://jurisacompanha-frontend-nnrcu8uvk.vercel.app',
    'https://frontend-glx5w9c74-mauricio-silva-oliveiras-projects.vercel.app',
    'https://acompanhamento-processual-kbqpox4iz.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor Supabase funcionando'
  });
});

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', { email: req.body.email, hasPassword: !!req.body.password });
    console.log('🌐 Request headers:', req.headers);
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        error: 'Email e senha são obrigatórios'
      });
    }

    // Busca o usuário no Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)
      .limit(1);

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }

    if (!users || users.length === 0) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });
    }

    const user = users[0];
    console.log('✅ User found:', { id: user.id, email: user.email, ativo: user.ativo });

    // Verifica a senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔑 Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    // Remove a senha do retorno
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para criar usuário (registro)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Usuário com este email já existe' });
    }
    if (existingUserError && existingUserError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Erro ao verificar usuário existente:', existingUserError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        { nome, email, password: hashedPassword, role: 'user', ativo: true }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir usuário no Supabase:', error);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'Usuário criado com sucesso', user: userWithoutPassword });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Perfil do usuário
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nome, email, role, ativo, created_at, updated_at')
      .eq('id', req.user.id)
      .eq('ativo', true)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mock de processos para o dashboard
app.get('/api/processos', authenticateToken, async (req, res) => {
  try {
    const { data: processos, error } = await supabase
      .from('processos')
      .select('*')
      .eq('user_id', req.user.id)
      .limit(10);

    if (error) {
      console.error('Erro ao buscar processos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json({ processos: processos || [] });
  } catch (error) {
    console.error('Erro ao buscar processos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mock de alertas para o dashboard
app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    console.log('🔔 Buscando alertas para usuário:', req.user.id);
    
    // Por enquanto, retornar dados mockados para o dashboard funcionar
    const mockAlertas = [
      {
        id: 1,
        titulo: 'Prazo de Contestação',
        descricao: 'Prazo para contestação vence em 5 dias',
        tipo: 'prazo',
        lido: false,
        created_at: new Date().toISOString()
      }
    ];
    
    console.log('✅ Retornando alertas mockados:', mockAlertas.length);
    res.json({ alertas: mockAlertas });
  } catch (error) {
    console.error('❌ Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar relatórios
app.get('/api/relatorios', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Buscando relatórios para usuário:', req.user.id);
    
    const { data: relatorios, error } = await supabase
      .from('relatorios')
      .select('*')
      .eq('user_id', req.user.id)
      .limit(50);

    if (error) {
      console.error('❌ Erro ao buscar relatórios:', error);
      // Se a tabela não existir, retornar array vazio em vez de erro 500
      if (error.code === 'PGRST106' || error.message.includes('relation "relatorios" does not exist')) {
        console.log('📝 Tabela relatorios não existe, retornando array vazio');
        return res.json({ relatorios: [] });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    console.log('✅ Relatórios encontrados:', relatorios?.length || 0);
    res.json({ relatorios: relatorios || [] });
  } catch (error) {
    console.error('❌ Erro ao buscar relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mock de relatórios stats
app.get('/api/relatorios/stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Buscando stats de relatórios para usuário:', req.user.id);
    
    // Por enquanto, retornar stats mockados para o dashboard funcionar
    const mockStats = {
      total: 5,
      concluidos: 3,
      pendentes: 2,
      estaSemana: 1
    };
    
    console.log('✅ Retornando stats mockados:', mockStats);
    res.json(mockStats);
  } catch (error) {
    console.error('❌ Erro ao buscar stats de relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar usuário de teste (apenas para desenvolvimento)
app.post('/api/auth/create-test-user', async (req, res) => {
  try {
    const { email, password, nome } = req.body;

    if (!email || !password || !nome) {
      return res.status(400).json({
        error: 'Email, senha e nome são obrigatórios'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário no Supabase
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        nome,
        role: 'user',
        ativo: true
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({
        error: 'Erro ao criar usuário'
      });
    }

    // Remove a senha do retorno
    const { password: _, ...userWithoutPassword } = data;

    res.json({
      message: 'Usuário criado com sucesso',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Supabase rodando na porta ${PORT}`);
});

export default app;
