import app, { initializeApp } from './src/app.js';
import logger from './src/config/logger.js';

// Inicialização para o Vercel
let isInitialized = false;

const initApp = async () => {
  if (!isInitialized) {
    try {
      await initializeApp();
      isInitialized = true;
      logger.info('✅ Aplicação inicializada no Vercel');
    } catch (error) {
      logger.error('❌ Erro ao inicializar aplicação no Vercel:', error);
      throw error;
    }
  }
};

// Handler principal para o Vercel
export default async (req, res) => {
  try {
    // Inicializa a aplicação se ainda não foi inicializada
    await initApp();
    
    // Delega a requisição para o Express
    return app(req, res);
  } catch (error) {
    logger.error('❌ Erro no handler do Vercel:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
};
