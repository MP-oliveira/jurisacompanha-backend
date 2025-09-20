import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from './src/models/index.js';

const app = express();

// Middlewares básicos
app.use(helmet());
app.use(cors({
  origin: ['https://jurisacompanha.vercel.app', 'https://frontend-glx5w9c74-mauricio-silva-oliveiras-projects.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting mais permissivo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // muito permissivo
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Registro de usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, password, role = 'user' } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: [{ field: 'required', message: 'Nome, email e senha são obrigatórios' }]
      });
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }

    // Verifica se o email já existe
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(409).json({
        error: 'Email já cadastrado'
      });
    }

    // Cria o usuário
    const user = await User.create({
      nome,
      email,
      password,
      role
    });

    // Remove a senha do retorno
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: userWithoutPassword,
      passwordStrength: 75
    });

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
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
    const user = await User.findOne({ where: { email } });
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

    // Verifica a senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
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
    const { password: _, ...userWithoutPassword } = user.toJSON();

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
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findByPk(decoded.id);
    
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
  const { password, ...userWithoutPassword } = req.user.toJSON();
  res.json({ user: userWithoutPassword });
});

// Rota para listar usuários (admin)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const users = await User.findAll({
      attributes: ['id', 'nome', 'email', 'role', 'ativo', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Inicialização simplificada
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor simplificado rodando na porta ${PORT}`);
});

export default app;
