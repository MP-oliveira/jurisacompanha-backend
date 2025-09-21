import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const server = createServer(app);

// Configurar Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      'https://jurisacompanha.vercel.app',
      'https://jurisacompanha-frontend.vercel.app',
      'https://jurisacompanha-frontend-chim9pjw3.vercel.app',
      'https://frontend-glx5w9c74-mauricio-silva-oliveiras-projects.vercel.app',
      'https://acompanhamento-processual-kbqpox4iz.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configurar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zejrnsdshiaipptfopqu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplanJuc2RzaGlhaXBwdGZvcHF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5NDc5MSwiZXhwIjoyMDczOTcwNzkxfQ.bXl9yFF_uAS5nWoNB9E43ybls0JwMzi0jC_i9Z4cD70'
);

console.log('🔗 Supabase URL:', process.env.SUPABASE_URL || 'https://zejrnsdshiaipptfopqu.supabase.co');
console.log('🔑 Service Role Key configurada:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Middlewares de segurança
app.use(cors({
  origin: [
    'https://jurisacompanha.vercel.app',
    'https://jurisacompanha-frontend.vercel.app',
    'https://jurisacompanha-frontend-chim9pjw3.vercel.app',
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 100000,
  message: 'Muitas requisições de IP, tente novamente após 15 minutos',
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    return false;
  }
});
app.use(limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor com WebSocket funcionando'
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
      console.error('Erro ao buscar usuário no Supabase:', error);
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    if (!user.ativo) {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
    if (existingUserError && existingUserError.code !== 'PGRST116') {
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

// Rota para obter perfil do usuário
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
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
    const { data: alertas, error } = await supabase
      .from('alertas')
      .select('*')
      .eq('user_id', req.user.id)
      .limit(10);

    if (error) {
      console.error('Erro ao buscar alertas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json({ alertas: alertas || [] });
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar relatórios
app.get('/api/relatorios', authenticateToken, async (req, res) => {
  try {
    const { data: relatorios, error } = await supabase
      .from('relatorios')
      .select('*')
      .eq('user_id', req.user.id)
      .limit(50);

    if (error) {
      console.error('Erro ao buscar relatórios:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json({ relatorios: relatorios || [] });
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mock de relatórios stats
app.get('/api/relatorios/stats', authenticateToken, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('relatorios')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Erro ao buscar stats de relatórios:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    res.json({
      total: count || 0,
      concluidos: Math.floor((count || 0) * 0.7),
      pendentes: Math.floor((count || 0) * 0.3),
      estaSemana: Math.floor((count || 0) * 0.1)
    });
  } catch (error) {
    console.error('Erro ao buscar stats de relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Configuração do Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Token de autenticação necessário'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('Erro na autenticação do WebSocket:', error);
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Usuário conectado via WebSocket: ${socket.userEmail} (${socket.userId})`);
  
  // Entrar na sala do usuário
  socket.join(`user_${socket.userId}`);
  
  // Entrar na sala de admins se for admin
  if (socket.userRole === 'admin') {
    socket.join('admin');
  }

  // Evento de ping/pong para manter conexão ativa
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Eventos de processo
  socket.on('processo:create', (processo) => {
    console.log(`📄 Novo processo criado: ${processo.numero}`);
    socket.broadcast.to(`user_${socket.userId}`).emit('processo:created', processo);
  });

  socket.on('processo:update', (processo) => {
    console.log(`📄 Processo atualizado: ${processo.numero}`);
    socket.broadcast.to(`user_${socket.userId}`).emit('processo:updated', processo);
  });

  // Eventos de alerta
  socket.on('alerta:create', (alerta) => {
    console.log(`🚨 Novo alerta criado: ${alerta.titulo}`);
    socket.broadcast.to(`user_${socket.userId}`).emit('alerta:created', alerta);
  });

  socket.on('alerta:update', (alerta) => {
    console.log(`🚨 Alerta atualizado: ${alerta.titulo}`);
    socket.broadcast.to(`user_${socket.userId}`).emit('alerta:updated', alerta);
  });

  // Desconexão
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Usuário desconectado: ${socket.userEmail} - Motivo: ${reason}`);
  });
});

// Iniciar o servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor com WebSocket rodando na porta ${PORT}`);
});

export default app;