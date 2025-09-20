/**
 * Serviço para atualização de processos baseado em emails do TRF1
 */

import { Processo, Alert } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

class ProcessUpdater {
  constructor() {
    this.logger = logger;
  }

  /**
   * Atualiza um processo com base nas informações do email
   * @param {Object} parsedEmail - Email parseado
   * @param {number} userId - ID do usuário
   * @returns {Object} Resultado da atualização
   */
  async updateProcessFromEmail(parsedEmail, userId) {
    try {
      // Busca o processo pelo número
      const existingProcess = await Processo.findOne({
        where: {
          numero: parsedEmail.numero,
          userId: userId
        }
      });

      if (!existingProcess) {
        this.logger.warn(`Processo ${parsedEmail.numero} não encontrado para o usuário ${userId}`);
        return {
          success: false,
          message: 'Processo não encontrado',
          processNumber: parsedEmail.numero
        };
      }

      // Atualiza as informações básicas se disponíveis
      const updateData = {};
      
      // Atualiza campos básicos se disponíveis
      if (parsedEmail.classe) {
        updateData.classe = parsedEmail.classe;
      }
      
      if (parsedEmail.assunto) {
        updateData.assunto = parsedEmail.assunto;
      }

      if (parsedEmail.dataAutuacao) {
        updateData.dataDistribuicao = parsedEmail.dataAutuacao;
      }

      // Atualiza tribunal e comarca se especificado no email
      if (parsedEmail.orgao) {
        updateData.tribunal = parsedEmail.orgao;
        updateData.comarca = parsedEmail.orgao;
      }

      // Atualiza status baseado nas movimentações
      if (parsedEmail.movimentacoes && parsedEmail.movimentacoes.length > 0) {
        // Verifica se há movimentações que indicam mudança de status
        const hasSentenca = parsedEmail.movimentacoes.some(m => 
          m.movimento.toLowerCase().includes('sentença') || 
          m.movimento.toLowerCase().includes('sentenca')
        );
        
        // Por enquanto mantém sempre como ativo (status permitido no banco)
        updateData.status = 'ativo';
        
        // Verifica se há movimentações que indicam sentença
        if (hasSentenca) {
          // Define data da sentença como a data da movimentação mais recente
          const sentencaMovement = parsedEmail.movimentacoes.find(m => 
            m.movimento.toLowerCase().includes('sentença') || 
            m.movimento.toLowerCase().includes('sentenca')
          );
          if (sentencaMovement) {
            updateData.dataSentenca = sentencaMovement.data;
          }
        }
      }

      // Adiciona timestamp de atualização
      updateData.updatedAt = new Date();

      // Atualiza observações com informações do email
      const observacoesAtualizadas = this.updateObservations(
        existingProcess.observacoes,
        parsedEmail
      );
      updateData.observacoes = observacoesAtualizadas;

      // Atualiza o processo
      await existingProcess.update(updateData);

      // Processa as movimentações e cria alertas se necessário
      await this.processMovements(existingProcess, parsedEmail.movimentacoes);

      this.logger.info(`Processo ${parsedEmail.numero} atualizado com sucesso via email`);

      return {
        success: true,
        message: 'Processo atualizado com sucesso',
        processNumber: parsedEmail.numero,
        processId: existingProcess.id,
        movementsProcessed: parsedEmail.movimentacoes.length
      };

    } catch (error) {
      this.logger.error('Erro ao atualizar processo via email:', error);
      return {
        success: false,
        message: 'Erro interno ao atualizar processo',
        error: error.message
      };
    }
  }

  /**
   * Atualiza as observações do processo com informações do email
   * @param {string} currentObservations - Observações atuais
   * @param {Object} parsedEmail - Email parseado
   * @returns {string}
   */
  updateObservations(currentObservations, parsedEmail) {
    const timestamp = new Date().toLocaleString('pt-BR');
    let observations = currentObservations || '';

    // Adiciona cabeçalho se não existir
    if (!observations.includes('=== ATUALIZAÇÕES VIA EMAIL ===')) {
      observations += `\n\n=== ATUALIZAÇÕES VIA EMAIL ===\n`;
    }

    // Adiciona informações do email com formatação melhorada
    observations += `\n\n═══════════════════════════════════════\n`;
    observations += `📧 EMAIL RECEBIDO DO TRF1\n`;
    observations += `⏰ [${timestamp}]\n\n`;
    observations += `📋 ASSUNTO: ${parsedEmail.emailInfo.subject}\n\n`;
    
    if (parsedEmail.movimentacoes.length > 0) {
      observations += `📊 MOVIMENTAÇÕES ENCONTRADAS: ${parsedEmail.movimentacoes.length}\n\n`;
      
      // Adiciona todas as movimentações com formatação melhorada
      parsedEmail.movimentacoes.forEach((movement, index) => {
        if (movement.data && movement.movimento) {
          const movementDate = movement.data.toLocaleDateString('pt-BR');
          const movementTime = movement.data.toLocaleTimeString('pt-BR');
          const documentInfo = movement.documento ? `\n   📄 Documento: ${movement.documento}` : '';
          
          observations += `   ${index + 1}. 📅 DATA: ${movementDate} às ${movementTime}\n`;
          observations += `      📝 MOVIMENTO: ${movement.movimento}${documentInfo}\n\n`;
        }
      });
    }

    // Adiciona informações extras do processo se disponíveis
    if (parsedEmail.dataAutuacao || parsedEmail.tipoDistribuicao || parsedEmail.poloAtivo || parsedEmail.poloPassivo) {
      observations += `📋 INFORMAÇÕES DO PROCESSO:\n`;
      
      if (parsedEmail.dataAutuacao) {
        const dataAutuacao = parsedEmail.dataAutuacao.toLocaleDateString('pt-BR');
        observations += `   📅 Data de Autuação: ${dataAutuacao}\n`;
      }

      if (parsedEmail.tipoDistribuicao) {
        observations += `   ⚖️  Tipo de Distribuição: ${parsedEmail.tipoDistribuicao}\n`;
      }

      if (parsedEmail.poloAtivo) {
        observations += `   👤 Polo Ativo: ${parsedEmail.poloAtivo}\n`;
      }

      if (parsedEmail.poloPassivo) {
        observations += `   👥 Polo Passivo: ${parsedEmail.poloPassivo}\n`;
      }
      
      observations += `\n═══════════════════════════════════════\n`;
    }

    return observations;
  }

  /**
   * Processa as movimentações e cria alertas se necessário
   * @param {Processo} processo - Processo atualizado
   * @param {Array} movements - Movimentações do email
   */
  async processMovements(processo, movements) {
    try {
      for (const movement of movements) {
        if (!movement.data || !movement.movimento) continue;

        // Verifica se já existe um alerta para esta movimentação
        const existingAlert = await Alert.findOne({
          where: {
            processoId: processo.id,
            mensagem: {
              [Op.like]: `%${movement.movimento}%`
            }
          }
        });

        if (!existingAlert) {
          // Cria novo alerta para a movimentação
          await Alert.create({
            tipo: 'despacho',
            titulo: 'Nova Movimentação',
            mensagem: `Movimentação em ${movement.data.toLocaleDateString('pt-BR')}: ${movement.movimento}`,
            dataVencimento: movement.data,
            dataNotificacao: new Date(),
            prioridade: 'media',
            lido: false,
            userId: processo.userId,
            processoId: processo.id
          });

          this.logger.info(`Alerta criado para movimentação do processo ${processo.numero}`);
        }

        // Verifica se a movimentação indica novos prazos
        await this.checkForNewDeadlines(processo, movement);
      }
    } catch (error) {
      this.logger.error('Erro ao processar movimentações:', error);
    }
  }

  /**
   * Verifica se a movimentação indica novos prazos
   * @param {Processo} processo - Processo
   * @param {Object} movement - Movimentação
   */
  async checkForNewDeadlines(processo, movement) {
    const movimentoText = movement.movimento.toLowerCase();

    // Verifica se há menção a prazos
    if (movimentoText.includes('prazo') || movimentoText.includes('recurso') || movimentoText.includes('embargos')) {
      // Tenta extrair datas de prazo do texto
      const datePattern = /(\d{2}\/\d{2}\/\d{4})/g;
      const dates = movimentoText.match(datePattern);
      
      if (dates && dates.length > 0) {
        for (const dateStr of dates) {
          const deadlineDate = this.parseDate(dateStr);
          if (deadlineDate && deadlineDate > new Date()) {
            // Atualiza o processo com a nova data de prazo
            if (movimentoText.includes('recurso')) {
              await processo.update({ prazoRecurso: deadlineDate });
              this.logger.info(`Prazo de recurso atualizado para ${deadlineDate.toLocaleDateString('pt-BR')}`);
            } else if (movimentoText.includes('embargos')) {
              await processo.update({ prazoEmbargos: deadlineDate });
              this.logger.info(`Prazo de embargos atualizado para ${deadlineDate.toLocaleDateString('pt-BR')}`);
            }
          }
        }
      }
    }

    // Verifica se há menção a audiências
    if (movimentoText.includes('audiência') || movimentoText.includes('audiencia')) {
      const datePattern = /(\d{2}\/\d{2}\/\d{4})/g;
      const dates = movimentoText.match(datePattern);
      
      if (dates && dates.length > 0) {
        for (const dateStr of dates) {
          const audienceDate = this.parseDate(dateStr);
          if (audienceDate && audienceDate > new Date()) {
            await processo.update({ proximaAudiencia: audienceDate });
            this.logger.info(`Audiência atualizada para ${audienceDate.toLocaleDateString('pt-BR')}`);
          }
        }
      }
    }
  }

  /**
   * Converte string de data para objeto Date
   * @param {string} dateString - String da data
   * @returns {Date|null}
   */
  parseDate(dateString) {
    if (!dateString) return null;

    const match = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      return new Date(year, month - 1, day);
    }

    return null;
  }

  /**
   * Cria um novo processo se não existir
   * @param {Object} parsedEmail - Email parseado
   * @param {number} userId - ID do usuário
   * @returns {Object} Resultado da criação
   */
  async createProcessFromEmail(parsedEmail, userId) {
    try {
      const processData = {
        numero: parsedEmail.numero,
        classe: parsedEmail.classe || 'Não informado',
        assunto: parsedEmail.assunto || 'Não informado',
        tribunal: 'TRF1',
        comarca: parsedEmail.orgao || 'Não informado',
        status: 'ativo',
        dataDistribuicao: parsedEmail.dataAutuacao,
        observacoes: `Processo criado automaticamente via email do TRF1 em ${new Date().toLocaleString('pt-BR')}\n\nInformações do email:\n- Polo Ativo: ${parsedEmail.poloAtivo || 'Não informado'}\n- Polo Passivo: ${parsedEmail.poloPassivo || 'Não informado'}\n- Classe: ${parsedEmail.classe || 'Não informado'}\n- Órgão: ${parsedEmail.orgao || 'Não informado'}`,
        userId: userId
      };

      const newProcess = await Processo.create(processData);

      // Processa as movimentações
      await this.processMovements(newProcess, parsedEmail.movimentacoes);

      this.logger.info(`Processo ${parsedEmail.numero} criado automaticamente via email`);

      return {
        success: true,
        message: 'Processo criado com sucesso',
        processNumber: parsedEmail.numero,
        processId: newProcess.id,
        movementsProcessed: parsedEmail.movimentacoes.length
      };

    } catch (error) {
      this.logger.error('Erro ao criar processo via email:', error);
      return {
        success: false,
        message: 'Erro interno ao criar processo',
        error: error.message
      };
    }
  }
}

export default ProcessUpdater;
