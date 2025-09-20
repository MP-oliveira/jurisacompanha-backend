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
    'https://frontend-glx5w9c74-mauricio-silva-oliveiras-projects.vercel.app',
    'https://acompanhamento-processual-kbqpox4iz.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor simplificado funcionando'
  });
});

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios'
      });
    }

    // Busca o usuário
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });
    }

    // Verifica se está ativo
    if (!user.ativo) {
      return res.status(401).json({
        error: 'Usuário inativo'
      });
    }

    // Para simplificar, vamos aceitar a senha diretamente
    // Em produção, deveria usar bcrypt.compare()
    if (password !== 'Gui@2025') {
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
      'fallback-secret-key',
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
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
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
    const decoded = jwt.verify(token, 'fallback-secret-key');
    const user = users.find(u => u.id === decoded.id);
    
    if (!user || !user.ativo) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Rota protegida de teste
app.get('/api/user/profile', authenticateToken, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Rota para listar usuários (admin)
app.get('/api/users', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json({ users: usersWithoutPasswords });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mock de processos para o dashboard
app.get('/api/processos', authenticateToken, (req, res) => {
  const mockProcessos = [
    {
      id: 1,
      numero: '1001234-56.2025.1.01.0001',
      classe: 'Ação de Cobrança',
      status: 'ativo',
      proximaAudiencia: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      prazoRecurso: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      prazoEmbargos: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      numero: '1001235-56.2025.1.01.0001',
      classe: 'Execução Fiscal',
      status: 'ativo',
      proximaAudiencia: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      prazoRecurso: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      prazoEmbargos: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.json({ processos: mockProcessos });
});

// Mock de alertas para o dashboard
app.get('/api/alerts', authenticateToken, (req, res) => {
  const mockAlertas = [
    {
      id: 1,
      titulo: 'Prazo próximo - Audiência',
      descricao: 'Audiência agendada para próxima semana',
      tipo: 'prazo',
      lido: false,
      prioridade: 'alta',
      dataPrazo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      titulo: 'Processo atualizado',
      descricao: 'Novo despacho no processo',
      tipo: 'atualizacao',
      lido: true,
      prioridade: 'media',
      dataPrazo: null,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.json({ alertas: mockAlertas });
});

// Mock de relatórios stats
app.get('/api/relatorios/stats', authenticateToken, (req, res) => {
  res.json({
    total: 5,
    concluidos: 3,
    pendentes: 2,
    estaSemana: 1
  });
});

// Mock de perfil do usuário
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Inicialização
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor simplificado rodando na porta ${PORT}`);
});

export default app;
