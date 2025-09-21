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

// CORS - Permitir todas as origens para debug
app.use(cors({
  origin: true,
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
    message: 'Backend minimalista funcionando'
  });
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
    console.error('Erro na autenticação do token:', error);
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Tentativa de login:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.error('❌ Erro ao buscar usuário:', error);
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    if (!user.ativo) {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.error('❌ Senha incorreta para:', email);
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    console.log('✅ Login bem-sucedido para:', email);
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter perfil do usuário
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    console.log('👤 Buscando perfil para usuário:', req.user.id);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      console.error('❌ Erro ao buscar usuário:', error);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { password, ...userWithoutPassword } = user;
    console.log('✅ Perfil encontrado:', userWithoutPassword.email);
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mock de dados para o dashboard
app.get('/api/processos', authenticateToken, async (req, res) => {
  try {
    console.log('📄 Buscando processos para usuário:', req.user.id);
    
    const { data: processos, error } = await supabase
      .from('processos')
      .select('*')
      .eq('user_id', req.user.id)
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar processos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    console.log('✅ Processos encontrados:', processos?.length || 0);
    res.json({ processos: processos || [] });
  } catch (error) {
    console.error('❌ Erro ao buscar processos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    console.log('🚨 Buscando alertas para usuário:', req.user.id);
    
    const { data: alertas, error } = await supabase
      .from('alertas')
      .select('*')
      .eq('user_id', req.user.id)
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar alertas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    console.log('✅ Alertas encontrados:', alertas?.length || 0);
    res.json({ alertas: alertas || [] });
  } catch (error) {
    console.error('❌ Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

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
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    console.log('✅ Relatórios encontrados:', relatorios?.length || 0);
    res.json({ relatorios: relatorios || [] });
  } catch (error) {
    console.error('❌ Erro ao buscar relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/relatorios/stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Buscando stats de relatórios para usuário:', req.user.id);
    
    const { count, error } = await supabase
      .from('relatorios')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    if (error) {
      console.error('❌ Erro ao buscar stats de relatórios:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    const stats = {
      total: count || 0,
      concluidos: Math.floor((count || 0) * 0.7),
      pendentes: Math.floor((count || 0) * 0.3),
      estaSemana: Math.floor((count || 0) * 0.1)
    };

    console.log('✅ Stats encontrados:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar stats de relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar usuário (registro)
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('👤 Tentativa de registro:', req.body.email);
    
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
    if (existingUserError && existingUserError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar usuário existente:', existingUserError);
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
      console.error('❌ Erro ao inserir usuário:', error);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    const { password: _, ...userWithoutPassword } = newUser;
    console.log('✅ Usuário criado com sucesso:', email);
    res.status(201).json({ message: 'Usuário criado com sucesso', user: userWithoutPassword });

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend minimalista rodando na porta ${PORT}`);
});

export default app;
