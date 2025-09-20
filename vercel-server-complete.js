import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

// Configurar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middlewares de segurança
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
}));

// CORS
app.use(cors({
  origin: [
    'https://jurisacompanha.vercel.app',
    'https://acompanhamento-processual-aca9g7cey.vercel.app',
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
});
app.use(limiter);

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    // Buscar usuário no Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .eq('ativo', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor completo com Supabase funcionando'
  });
});

// Rota de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário no Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    // Remover senha do retorno
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para obter perfil do usuário
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Rota para listar processos
app.get('/api/processos', authenticateToken, async (req, res) => {
  try {
    const { data: processos, error } = await supabase
      .from('processos')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ processos: processos || [] });
  } catch (error) {
    console.error('Erro ao buscar processos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar processo
app.post('/api/processos', authenticateToken, async (req, res) => {
  try {
    const processoData = {
      ...req.body,
      user_id: req.user.id
    };

    const { data: processo, error } = await supabase
      .from('processos')
      .insert([processoData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(processo);
  } catch (error) {
    console.error('Erro ao criar processo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar alertas
app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const { data: alertas, error } = await supabase
      .from('alertas')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ alertas: alertas || [] });
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para marcar alerta como lido
app.patch('/api/alerts/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: alerta, error } = await supabase
      .from('alertas')
      .update({ lido: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(alerta);
  } catch (error) {
    console.error('Erro ao marcar alerta como lido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para estatísticas de relatórios
app.get('/api/relatorios/stats', authenticateToken, async (req, res) => {
  try {
    const { data: relatorios, error } = await supabase
      .from('relatorios')
      .select('status')
      .eq('user_id', req.user.id);

    if (error) {
      throw error;
    }

    const stats = {
      total: relatorios.length,
      concluidos: relatorios.filter(r => r.status === 'concluido').length,
      pendentes: relatorios.filter(r => r.status === 'pendente').length,
      estaSemana: 0 // Implementar lógica de data
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar stats de relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar usuários (admin)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, nome, email, role, ativo, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ users: users || [] });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar usuário (admin)
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { nome, email, password, role = 'user' } = req.body;

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        nome,
        email,
        password: hashedPassword,
        role,
        ativo: true
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ error: 'Email já cadastrado' });
      }
      throw error;
    }

    // Remover senha do retorno
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Inicialização
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor completo com Supabase rodando na porta ${PORT}`);
});

export default app;
