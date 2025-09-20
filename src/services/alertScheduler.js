import cron from 'node-cron';
import { Op } from 'sequelize';
import { Alert, Processo, User } from '../models/index.js';
import { addBusinessDays, formatDate } from '../utils/date.js';
import logger from '../config/logger.js';

class AlertScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Inicia o agendador de alertas
   */
  start() {
    if (this.isRunning) {
      logger.warn('Agendador de alertas já está rodando');
      return;
    }

    logger.info('Iniciando agendador de alertas');
    
    // Executa a cada hora
    this.jobs.set('hourly', cron.schedule('0 * * * *', () => {
      this.processarAlertas();
    }));

    // Executa todos os dias às 8h
    this.jobs.set('daily', cron.schedule('0 8 * * *', () => {
      this.processarAlertas();
    }));

    this.isRunning = true;
    logger.info('Agendador de alertas iniciado com sucesso');
  }

  /**
   * Para o agendador de alertas
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Agendador de alertas não está rodando');
      return;
    }

    logger.info('Parando agendador de alertas');
    
    this.jobs.forEach(job => job.stop());
    this.jobs.clear();
    this.isRunning = false;
    
    logger.info('Agendador de alertas parado');
  }

  /**
   * Processa todos os alertas pendentes
   */
  async processarAlertas() {
    try {
      logger.info('Processando alertas pendentes');
      
      const hoje = new Date();
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      // Busca processos com prazos próximos
      const processosComPrazos = await Processo.findAll({
        where: {
          status: 'ativo',
          [Op.or]: [
            { proximaAudiencia: { [Op.between]: [hoje, amanha] } },
            { prazoRecurso: { [Op.between]: [hoje, amanha] } },
            { prazoEmbargos: { [Op.between]: [hoje, amanha] } },
            { dataDistribuicao: { [Op.between]: [hoje, amanha] } }
          ]
        },
        include: [{ model: User, as: 'user' }]
      });

      for (const processo of processosComPrazos) {
        await this.criarAlertasParaProcesso(processo);
      }

      logger.info(`Processados ${processosComPrazos.length} processos com prazos próximos`);
    } catch (error) {
      logger.error('Erro ao processar alertas:', error);
    }
  }

  /**
   * Cria alertas para um processo específico
   * @param {Processo} processo - Processo para criar alertas
   */
  async criarAlertasParaProcesso(processo) {
    try {
      const hoje = new Date();
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      // Alerta para audiência (1 dia antes)
      if (processo.proximaAudiencia && 
          processo.proximaAudiencia >= hoje && 
          processo.proximaAudiencia <= amanha) {
        await this.criarAlerta({
          tipo: 'audiencia',
          titulo: 'Audiência Agendada',
          mensagem: `Audiência agendada para ${formatDate(processo.proximaAudiencia)} no processo ${processo.numero}`,
          dataVencimento: processo.proximaAudiencia,
          dataNotificacao: hoje,
          prioridade: 'alta',
          userId: processo.userId,
          processoId: processo.id
        });
      }

      // Alerta para prazo de recurso (1 dia antes)
      if (processo.prazoRecurso && 
          processo.prazoRecurso >= hoje && 
          processo.prazoRecurso <= amanha) {
        await this.criarAlerta({
          tipo: 'prazo_recurso',
          titulo: 'Prazo de Recurso',
          mensagem: `Prazo para interposição de recurso vence em ${formatDate(processo.prazoRecurso)} no processo ${processo.numero}`,
          dataVencimento: processo.prazoRecurso,
          dataNotificacao: hoje,
          prioridade: 'urgente',
          userId: processo.userId,
          processoId: processo.id
        });
      }

      // Alerta para prazo de embargos (1 dia antes)
      if (processo.prazoEmbargos && 
          processo.prazoEmbargos >= hoje && 
          processo.prazoEmbargos <= amanha) {
        await this.criarAlerta({
          tipo: 'prazo_embargos',
          titulo: 'Prazo de Embargos',
          mensagem: `Prazo para embargos de declaração vence em ${formatDate(processo.prazoEmbargos)} no processo ${processo.numero}`,
          dataVencimento: processo.prazoEmbargos,
          dataNotificacao: hoje,
          prioridade: 'urgente',
          userId: processo.userId,
          processoId: processo.id
        });
      }

      // Alerta para data de distribuição (1 dia antes)
      if (processo.dataDistribuicao && 
          processo.dataDistribuicao >= hoje && 
          processo.dataDistribuicao <= amanha) {
        await this.criarAlerta({
          tipo: 'distribuicao',
          titulo: 'Data de Distribuição',
          mensagem: `Data de distribuição do processo ${processo.numero} é ${formatDate(processo.dataDistribuicao)}`,
          dataVencimento: processo.dataDistribuicao,
          dataNotificacao: hoje,
          prioridade: 'media',
          userId: processo.userId,
          processoId: processo.id
        });
      }

    } catch (error) {
      logger.error(`Erro ao criar alertas para processo ${processo.id}:`, error);
    }
  }

  /**
   * Cria um alerta no banco de dados
   * @param {Object} alertaData - Dados do alerta
   */
  async criarAlerta(alertaData) {
    try {
      // Verifica se já existe um alerta similar
      const alertaExistente = await Alert.findOne({
        where: {
          tipo: alertaData.tipo,
          processoId: alertaData.processoId,
          dataVencimento: alertaData.dataVencimento,
          lido: false
        }
      });

      if (!alertaExistente) {
        await Alert.create(alertaData);
        logger.info(`Alerta criado: ${alertaData.titulo} para processo ${alertaData.processoId}`);
      }
    } catch (error) {
      logger.error('Erro ao criar alerta:', error);
    }
  }

  /**
   * Agenda alertas quando uma sentença é registrada
   * @param {Processo} processo - Processo com sentença
   */
  async agendarAlertasSentenca(processo) {
    if (!processo.dataSentenca) return;

    try {
      const prazoRecurso = addBusinessDays(processo.dataSentenca, 10);
      const prazoEmbargos = addBusinessDays(processo.dataSentenca, 5);

      // Atualiza o processo com os novos prazos
      await processo.update({
        prazoRecurso,
        prazoEmbargos
      });

      logger.info(`Prazos calculados para processo ${processo.numero}: Recurso ${formatDate(prazoRecurso)}, Embargos ${formatDate(prazoEmbargos)}`);
    } catch (error) {
      logger.error(`Erro ao agendar alertas para sentença do processo ${processo.id}:`, error);
    }
  }

  /**
   * Agenda alertas quando uma data de distribuição é registrada
   * @param {Processo} processo - Processo com data de distribuição
   */
  async agendarAlertasDistribuicao(processo) {
    if (!processo.dataDistribuicao) return;

    try {
      const hoje = new Date();
      const dataDistribuicao = new Date(processo.dataDistribuicao);
      
      // Se a data de distribuição é hoje ou amanhã, cria alerta imediatamente
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      
      if (dataDistribuicao >= hoje && dataDistribuicao <= amanha) {
        await this.criarAlerta({
          tipo: 'distribuicao',
          titulo: 'Data de Distribuição',
          mensagem: `Data de distribuição do processo ${processo.numero} é ${formatDate(processo.dataDistribuicao)}`,
          dataVencimento: processo.dataDistribuicao,
          dataNotificacao: hoje,
          prioridade: 'media',
          userId: processo.userId,
          processoId: processo.id
        });
      }

      logger.info(`Alertas de distribuição agendados para processo ${processo.numero}`);
    } catch (error) {
      logger.error(`Erro ao agendar alertas para distribuição do processo ${processo.id}:`, error);
    }
  }

  /**
   * Retorna o status do agendador
   * @returns {Object} Status do agendador
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      totalJobs: this.jobs.size
    };
  }
}

export default new AlertScheduler();
