import { Relatorio, User, Processo, Alert, Consulta } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';
import Joi from 'joi';

// Schema de validação para criação de relatório
const relatorioSchema = Joi.object({
  tipo: Joi.string().valid('processos', 'prazos', 'alertas', 'consultas', 'usuarios').required(),
  titulo: Joi.string().max(200).required(),
  descricao: Joi.string().allow(''),
  periodo: Joi.string().max(20).required(),
  observacoes: Joi.string().allow('')
});

/**
 * Lista todos os relatórios do usuário
 */
export const listarRelatorios = async (req, res) => {
  try {
    const { page = 1, limit = 20, tipo, status } = req.query;
    const offset = (page - 1) * limit;

    // Construir filtros
    const where = { userId: req.user.id };
    
    if (tipo && tipo !== 'todos') {
      where.tipo = tipo;
    }
    
    if (status && status !== 'todos') {
      where.status = status;
    }

    const { count, rows: relatorios } = await Relatorio.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'nome', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      relatorios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Erro ao listar relatórios:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Busca um relatório específico
 */
export const buscarRelatorio = async (req, res) => {
  try {
    const { id } = req.params;

    const relatorio = await Relatorio.findOne({
      where: { id, userId: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'nome', 'email'] }]
    });

    if (!relatorio) {
      return res.status(404).json({
        error: 'Relatório não encontrado'
      });
    }

    res.json(relatorio);
  } catch (error) {
    logger.error('Erro ao buscar relatório:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Gera um novo relatório
 */
export const gerarRelatorio = async (req, res) => {
  try {
    // Valida os dados de entrada
    const { error, value } = relatorioSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Cria o relatório inicialmente como "processando"
    const relatorio = await Relatorio.create({
      ...value,
      status: 'processando',
      userId: req.user.id
    });

    // Simula processamento assíncrono
    setTimeout(async () => {
      try {
        let dados = {};
        
        // Gera dados baseados no tipo
        switch (value.tipo) {
          case 'processos':
            const processos = await Processo.findAll({
              where: { userId: req.user.id }
            });
            dados = {
              total: processos.length,
              ativos: processos.filter(p => p.status === 'ativo').length,
              arquivados: processos.filter(p => p.status === 'arquivado').length,
              suspensos: processos.filter(p => p.status === 'suspenso').length,
              crescimento: 12.5
            };
            break;
            
          case 'prazos':
            const processosComPrazos = await Processo.findAll({
              where: { 
                userId: req.user.id,
                [Op.or]: [
                  { prazoRecurso: { [Op.not]: null } },
                  { prazoEmbargos: { [Op.not]: null } },
                  { proximaAudiencia: { [Op.not]: null } }
                ]
              }
            });
            const hoje = new Date();
            const vencidos = processosComPrazos.filter(p => 
              (p.prazoRecurso && new Date(p.prazoRecurso) < hoje) ||
              (p.prazoEmbargos && new Date(p.prazoEmbargos) < hoje)
            ).length;
            const proximos = processosComPrazos.filter(p => 
              (p.prazoRecurso && new Date(p.prazoRecurso) >= hoje && new Date(p.prazoRecurso) <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)) ||
              (p.prazoEmbargos && new Date(p.prazoEmbargos) >= hoje && new Date(p.prazoEmbargos) <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000))
            ).length;
            
            dados = {
              vencidos,
              proximos,
              total: processosComPrazos.length,
              crescimento: -5.2
            };
            break;
            
          case 'alertas':
            const alertas = await Alert.findAll({
              where: { userId: req.user.id }
            });
            dados = {
              urgentes: alertas.filter(a => a.prioridade === 'urgente').length,
              altos: alertas.filter(a => a.prioridade === 'alta').length,
              medios: alertas.filter(a => a.prioridade === 'media').length,
              baixos: alertas.filter(a => a.prioridade === 'baixa').length,
              crescimento: 8.3
            };
            break;
            
          case 'consultas':
            const consultas = await Consulta.findAll({
              where: { userId: req.user.id }
            });
            dados = {
              total: consultas.length,
              encontrados: consultas.filter(c => c.status === 'encontrado').length,
              naoEncontrados: consultas.filter(c => c.status === 'nao_encontrado').length,
              crescimento: 15.7
            };
            break;
            
          case 'usuarios':
            // Para usuários, vamos simular dados
            dados = {
              usuariosAtivos: 1,
              logins: 156,
              acoes: 1240,
              crescimento: 22.1
            };
            break;
        }

        // Atualiza o relatório com os dados gerados
        await relatorio.update({
          status: 'concluido',
          dados
        });

        logger.info(`Relatório gerado com sucesso: ${relatorio.titulo} por ${req.user.email}`);
      } catch (error) {
        logger.error('Erro ao processar relatório:', error);
        await relatorio.update({
          status: 'erro',
          observacoes: 'Erro ao processar dados do relatório'
        });
      }
    }, 2000); // Simula 2 segundos de processamento

    logger.info(`Relatório iniciado: ${relatorio.titulo} por ${req.user.email}`);

    res.status(201).json({
      message: 'Relatório sendo gerado',
      relatorio
    });
  } catch (error) {
    logger.error('Erro ao gerar relatório:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Remove um relatório
 */
export const removerRelatorio = async (req, res) => {
  try {
    const { id } = req.params;

    const relatorio = await Relatorio.findOne({
      where: { id, userId: req.user.id }
    });

    if (!relatorio) {
      return res.status(404).json({
        error: 'Relatório não encontrado'
      });
    }

    await relatorio.destroy();

    logger.info(`Relatório removido: ${relatorio.titulo} por ${req.user.email}`);

    res.json({
      message: 'Relatório removido com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao remover relatório:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Estatísticas dos relatórios
 */
export const estatisticasRelatorios = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      total,
      concluidos,
      processando,
      erro
    ] = await Promise.all([
      Relatorio.count({ where: { userId } }),
      Relatorio.count({ where: { userId, status: 'concluido' } }),
      Relatorio.count({ where: { userId, status: 'processando' } }),
      Relatorio.count({ where: { userId, status: 'erro' } })
    ]);

    res.json({
      total,
      concluidos,
      processando,
      erro
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas de relatórios:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};
