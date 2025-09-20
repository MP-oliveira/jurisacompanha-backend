import app, { initializeApp } from './app.js';
import logger from './config/logger.js';
import { setupSocket } from './config/socket.js';

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Inicializa a aplicação (banco, agendador, etc.)
    await initializeApp();

    // Inicia o servidor HTTP
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📚 Documentação disponível em http://localhost:${PORT}/docs`);
      logger.info(`🔗 API disponível em http://localhost:${PORT}/api`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info('🛠️  Modo de desenvolvimento ativo');
        logger.info('📊 Logs detalhados habilitados');
      }
    });

    // Configurar Socket.io
    const io = setupSocket(server);
    logger.info('🔌 Socket.io configurado com sucesso');
    
    // Tornar io disponível globalmente
    global.io = io;

  } catch (error) {
    logger.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Inicia o servidor
startServer();
