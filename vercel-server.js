import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Criar app Express
const app = express();

// Middlewares básicos
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://frontend-5zmzxuyiq-mauricio-mp-oliveiras-projects.vercel.app',
    'https://frontend-d7kg7zgrf-mauricio-silva-oliveiras-projects.vercel.app',
    'https://frontend-dvww2ij17-mauricio-mp-oliveiras-projects.vercel.app',
    'https://frontend-m0v0sd7z8-mauricio-mp-oliveiras-projects.vercel.app',
    'https://frontend-9omio356t-mauricio-mp-oliveiras-projects.vercel.app',
    'https://jurisacompanha.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para lidar com requisições OPTIONS (preflight)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Rate limiting removido para evitar problemas no Vercel

// Rota para a raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Juris Acompanha Backend funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      api: '/api',
      health: '/api/health',
      login: '/api/auth/login',
      processos: '/api/processos'
    }
  });
});

// Rotas básicas
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Juris Acompanha API funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Rota de login básica (sem banco por enquanto)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email e senha são obrigatórios' 
    });
  }
  
  // Resposta temporária - sem validação real
  res.json({
    message: 'Login endpoint funcionando',
    email: email,
    timestamp: new Date().toISOString()
  });
});

// Rota para processos (temporária)
app.get('/api/processos', (req, res) => {
  res.json({
    message: 'Endpoint de processos funcionando',
    processos: [],
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl 
  });
});

// Handler para o Vercel
export default app;
