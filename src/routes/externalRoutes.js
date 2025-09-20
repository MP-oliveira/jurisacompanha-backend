import { Router } from 'express';
import datajudService from '../services/datajudService.js';

const router = Router();

/**
 * Consulta um processo na API externa (DataJud)
 * GET /external/processos/:numero
 */
router.get('/processos/:numero', async (req, res) => {
  try {
    const { numero } = req.params;

    if (!numero || numero.length < 10) {
      return res.status(400).json({
        error: 'Número do processo inválido',
        message: 'O número do processo deve ter pelo menos 10 caracteres'
      });
    }

    // Verifica se o serviço está configurado
    if (!datajudService.isServiceConfigured()) {
      return res.status(503).json({
        error: 'Serviço externo não configurado',
        message: 'As variáveis de ambiente DATAJUD_BASE e DATAJUD_TOKEN não estão configuradas',
        serviceStatus: datajudService.getServiceStatus()
      });
    }

    // Consulta o processo na API externa
    const processo = await datajudService.consultarProcesso(numero);

    if (!processo) {
      return res.status(404).json({
        error: 'Processo não encontrado',
        message: `O processo ${numero} não foi encontrado na base de dados externa`
      });
    }

    res.json({
      message: 'Processo consultado com sucesso',
      processo,
      source: 'DataJud API',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error.message === 'Serviço DataJud não configurado') {
      return res.status(503).json({
        error: 'Serviço externo não configurado',
        message: 'Configuração pendente para integração com API externa',
        serviceStatus: datajudService.getServiceStatus()
      });
    }

    if (error.message === 'Token de acesso inválido') {
      return res.status(401).json({
        error: 'Erro de autenticação',
        message: 'Token de acesso inválido para a API externa'
      });
    }

    res.status(500).json({
      error: 'Erro ao consultar processo externo',
      message: error.message
    });
  }
});

/**
 * Retorna o status do serviço externo
 * GET /external/status
 */
router.get('/status', (req, res) => {
  const status = datajudService.getServiceStatus();
  
  res.json({
    service: 'DataJud Integration',
    status,
    timestamp: new Date().toISOString()
  });
});

export default router;
