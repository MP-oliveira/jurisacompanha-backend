import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar se as variáveis de ambiente necessárias estão definidas
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não está definida nas variáveis de ambiente');
}

// Importar rotas reais
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import processoRoutes from './src/routes/processoRoutes.js';
import alertRoutes from './src/routes/alertRoutes.js';
import relatorioRoutes from './src/routes/relatorioRoutes.js';
import consultaRoutes from './src/routes/consultaRoutes.js';

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
    'http://localhost:5176',
    'https://frontend-5zmzxuyiq-mauricio-mp-oliveiras-projects.vercel.app',
    'https://frontend-d7kg7zgrf-mauricio-silva-oliveiras-projects.vercel.app',
    'https://frontend-dvww2ij17-mauricio-mp-oliveiras-projects.vercel.app',
    'https://frontend-m0v0sd7z8-mauricio-mp-oliveiras-projects.vercel.app',
    'https://frontend-9omio356t-mauricio-mp-oliveiras-projects.vercel.app',
    'https://frontend-6g4y7ne7q-mauricio-mp-oliveiras-projects.vercel.app',
    'https://frontend-8jipb5gtk-mauricio-mp-oliveiras-projects.vercel.app',
    'https://frontend-83sba8eo7-mauricio-mp-oliveiras-projects.vercel.app',
    'https://frontend-14ttv3go7-mauricio-mp-oliveiras-projects.vercel.app',
    'https://frontend-hdj0hmmx0-mauricio-mp-oliveiras-projects.vercel.app',
    'https://jurisacompanha.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware OPTIONS removido - deixando apenas o CORS do express

// Rota para a raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Juris Acompanha Backend funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      api: '/api',
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      processos: '/api/processos',
      alerts: '/api/alerts',
      relatorios: '/api/relatorios',
      consultas: '/api/consultas'
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

// Usar rotas reais do backend com tratamento de erro
try {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/processos', processoRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/relatorios', relatorioRoutes);
  app.use('/api/consultas', consultaRoutes);
} catch (error) {
  console.error('Erro ao configurar rotas:', error);
  // Rota de fallback para quando há problemas com o banco
  app.use('/api/*', (req, res) => {
    res.status(503).json({ 
      error: 'Serviço temporariamente indisponível',
      message: 'Problemas de conexão com o banco de dados'
    });
  });
}

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
