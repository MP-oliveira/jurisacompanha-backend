import axios from 'axios';
import logger from '../config/logger.js';

class DatajudService {
  constructor() {
    this.baseURL = process.env.DATAJUD_BASE;
    this.token = process.env.DATAJUD_TOKEN;
    this.isConfigured = !!(this.baseURL && this.token);
  }

  /**
   * Consulta um processo na API do DataJud
   * @param {string} numero - Número do processo
   * @returns {Object} Dados do processo normalizados
   */
  async consultarProcesso(numero) {
    if (!this.isConfigured) {
      throw new Error('Serviço DataJud não configurado');
    }

    try {
      logger.info(`Consultando processo ${numero} no DataJud`);
      
      const response = await axios.get(`${this.baseURL}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        params: {
          q: `numero:${numero}`,
          size: 1
        },
        timeout: 10000
      });

      if (!response.data || !response.data.hits || !response.data.hits.hits) {
        return null;
      }

      const processo = response.data.hits.hits[0]?._source;
      if (!processo) {
        return null;
      }

      return this.normalizarProcesso(processo);
    } catch (error) {
      logger.error('Erro ao consultar DataJud:', {
        error: error.message,
        numero,
        status: error.response?.status
      });

      if (error.response?.status === 401) {
        throw new Error('Token de acesso inválido');
      }
      if (error.response?.status === 404) {
        return null;
      }
      
      throw new Error('Erro ao consultar processo externo');
    }
  }

  /**
   * Normaliza os dados do processo para o formato interno
   * @param {Object} processo - Dados brutos da API
   * @returns {Object} Dados normalizados
   */
  normalizarProcesso(processo) {
    try {
      return {
        numero: processo.numero || processo.numeroProcesso || '',
        classe: processo.classe || processo.tipoProcesso || '',
        assunto: processo.assunto || processo.materia || '',
        tribunal: processo.tribunal || processo.orgao || '',
        comarca: processo.comarca || processo.localizacao || '',
        dataDistribuicao: processo.dataDistribuicao || processo.dataInicial || null,
        movimentacoes: this.normalizarMovimentacoes(processo.movimentacoes || processo.historico || []),
        status: this.determinarStatus(processo.status || processo.situacao),
        ultimaAtualizacao: processo.ultimaAtualizacao || new Date().toISOString()
      };
    } catch (error) {
      logger.error('Erro ao normalizar processo:', error);
      return {
        numero: processo.numero || '',
        classe: 'Não informado',
        assunto: 'Não informado',
        tribunal: 'Não informado',
        comarca: 'Não informado',
        movimentacoes: [],
        status: 'ativo',
        ultimaAtualizacao: new Date().toISOString()
      };
    }
  }

  /**
   * Normaliza as movimentações do processo
   * @param {Array} movimentacoes - Lista de movimentações
   * @returns {Array} Movimentações normalizadas
   */
  normalizarMovimentacoes(movimentacoes) {
    if (!Array.isArray(movimentacoes)) return [];
    
    return movimentacoes.map(mov => ({
      data: mov.data || mov.dataMovimentacao || null,
      tipo: mov.tipo || mov.natureza || 'Não informado',
      descricao: mov.descricao || mov.texto || 'Movimentação não detalhada'
    })).filter(mov => mov.data);
  }

  /**
   * Determina o status do processo baseado nos dados
   * @param {string} status - Status da API
   * @returns {string} Status normalizado
   */
  determinarStatus(status) {
    if (!status) return 'ativo';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('arquivado') || statusLower.includes('extinto')) {
      return 'arquivado';
    }
    if (statusLower.includes('suspenso') || statusLower.includes('paralisado')) {
      return 'suspenso';
    }
    
    return 'ativo';
  }

  /**
   * Verifica se o serviço está configurado
   * @returns {boolean} True se configurado
   */
  isServiceConfigured() {
    return this.isConfigured;
  }

  /**
   * Retorna informações de configuração do serviço
   * @returns {Object} Status da configuração
   */
  getServiceStatus() {
    return {
      configured: this.isConfigured,
      baseURL: this.baseURL ? 'Configurado' : 'Não configurado',
      token: this.token ? 'Configurado' : 'Não configurado'
    };
  }
}

export default new DatajudService();
