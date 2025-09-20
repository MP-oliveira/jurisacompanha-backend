import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

/**
 * Configuração do Socket.io para comunicação em tempo real
 */
export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Middleware de autenticação para Socket.io
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Token de autenticação não fornecido'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      socket.userRole = decoded.role;
      
      logger.info('Usuário conectado via WebSocket', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        socketId: socket.id
      });
      
      next();
    } catch (error) {
      logger.error('Erro de autenticação WebSocket:', error);
      next(new Error('Token inválido'));
    }
  });

  // Eventos de conexão
  io.on('connection', (socket) => {
    logger.info('Nova conexão WebSocket estabelecida', {
      userId: socket.userId,
      socketId: socket.id
    });

    // Adicionar usuário a uma sala específica
    socket.join(`user_${socket.userId}`);
    
    // Se for admin, adicionar à sala de admins
    if (socket.userRole === 'admin') {
      socket.join('admins');
    }

    // Evento para atualizações de processos
    socket.on('subscribe_process_updates', (data) => {
      if (data.processId) {
        socket.join(`process_${data.processId}`);
        logger.info('Usuário inscrito em atualizações de processo', {
          userId: socket.userId,
          processId: data.processId
        });
      }
    });

    // Evento para atualizações de alertas
    socket.on('subscribe_alert_updates', () => {
      socket.join(`alerts_${socket.userId}`);
      logger.info('Usuário inscrito em atualizações de alertas', {
        userId: socket.userId
      });
    });

    // Evento para atualizações gerais do dashboard
    socket.on('subscribe_dashboard_updates', () => {
      socket.join(`dashboard_${socket.userId}`);
      logger.info('Usuário inscrito em atualizações do dashboard', {
        userId: socket.userId
      });
    });

    // Evento de desconexão
    socket.on('disconnect', (reason) => {
      logger.info('Usuário desconectado do WebSocket', {
        userId: socket.userId,
        socketId: socket.id,
        reason
      });
    });

    // Evento de ping/pong para manter conexão ativa
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  return io;
};

/**
 * Emitir evento para um usuário específico
 */
export const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
  logger.info('Evento enviado para usuário', { userId, event });
};

/**
 * Emitir evento para todos os admins
 */
export const emitToAdmins = (io, event, data) => {
  io.to('admins').emit(event, data);
  logger.info('Evento enviado para admins', { event });
};

/**
 * Emitir evento para usuários de um processo específico
 */
export const emitToProcessUsers = (io, processId, event, data) => {
  io.to(`process_${processId}`).emit(event, data);
  logger.info('Evento enviado para usuários do processo', { processId, event });
};

/**
 * Emitir evento para todos os usuários conectados
 */
export const emitToAll = (io, event, data) => {
  io.emit(event, data);
  logger.info('Evento enviado para todos os usuários', { event });
};
