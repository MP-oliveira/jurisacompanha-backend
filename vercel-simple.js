import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();

console.log('🚀 Iniciando backend simples...');

// CORS - Permitir todas as origens
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  console.log('✅ Health check chamado');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Backend simples funcionando'
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
    const decoded = jwt.verify(token, 'fallback-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Erro na autenticação do token:', error);
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

// Usuário hardcoded para teste
const testUser = {
  id: 1,
  nome: 'Guilherme Fernandes',
  email: 'guilherme@jurisacompanha.com',
  role: 'user',
  ativo: true,
  password: '$2b$10$rQZ8K9vXyL2mN3pO4qR5e.abcdefghijklmnopqrstuvwxyz' // senha: Gui@2025
};

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Tentativa de login:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Verificar se é o usuário de teste
    if (email === testUser.email) {
      // Para teste, aceitar qualquer senha ou verificar se é Gui@2025
      if (password === 'Gui@2025') {
        const token = jwt.sign(
          { id: testUser.id, email: testUser.email, role: testUser.role },
          'fallback-secret-key',
          { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = testUser;

        console.log('✅ Login bem-sucedido para:', email);
        res.json({
          message: 'Login realizado com sucesso',
          token,
          user: userWithoutPassword
        });
        return;
      }
    }

    console.error('❌ Credenciais inválidas para:', email);
    res.status(401).json({ error: 'Email ou senha inválidos' });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter perfil do usuário
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    console.log('👤 Buscando perfil para usuário:', req.user.id);
    
    const { password: _, ...userWithoutPassword } = testUser;
    console.log('✅ Perfil encontrado:', userWithoutPassword.email);
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mock de dados para o dashboard
app.get('/api/processos', authenticateToken, (req, res) => {
  try {
    console.log('📄 Buscando processos para usuário:', req.user.id);
    
    const processos = [
      {
        id: 1,
        numero: '1234567-89.2024.8.26.0001',
        titulo: 'Processo de Teste',
        status: 'ativo',
        user_id: req.user.id,
        created_at: new Date().toISOString()
      }
    ];

    console.log('✅ Processos encontrados:', processos.length);
    res.json({ processos });
  } catch (error) {
    console.error('❌ Erro ao buscar processos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/alerts', authenticateToken, (req, res) => {
  try {
    console.log('🚨 Buscando alertas para usuário:', req.user.id);
    
    const alertas = [
      {
        id: 1,
        titulo: 'Alerta de Teste',
        descricao: 'Este é um alerta de teste',
        tipo: 'info',
        lido: false,
        user_id: req.user.id,
        created_at: new Date().toISOString()
      }
    ];

    console.log('✅ Alertas encontrados:', alertas.length);
    res.json({ alertas });
  } catch (error) {
    console.error('❌ Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/relatorios', authenticateToken, (req, res) => {
  try {
    console.log('📊 Buscando relatórios para usuário:', req.user.id);
    
    const relatorios = [];

    console.log('✅ Relatórios encontrados:', relatorios.length);
    res.json({ relatorios });
  } catch (error) {
    console.error('❌ Erro ao buscar relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/relatorios/stats', authenticateToken, (req, res) => {
  try {
    console.log('📊 Buscando stats de relatórios para usuário:', req.user.id);
    
    const stats = {
      total: 0,
      concluidos: 0,
      pendentes: 0,
      estaSemana: 0
    };

    console.log('✅ Stats encontrados:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar stats de relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend simples rodando na porta ${PORT}`);
});

export default app;
