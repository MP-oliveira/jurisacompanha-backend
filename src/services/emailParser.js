/**
 * Serviço para parsing de emails do TRF1
 * Processa emails de notificação de movimentação processual
 */

class EmailParser {
  constructor() {
    this.senderPattern = /naoresponda\.pje\.push1@trf1\.jus\.br/i;
    this.subjectPattern = /movimentação processual do processo (.+)/i;
    this.processNumberPattern = /(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/;
  }

  /**
   * Verifica se o email é uma notificação do TRF1
   * @param {Object} email - Objeto do email
   * @returns {boolean}
   */
  isTRF1Notification(email) {
    return this.senderPattern.test(email.from) && 
           this.subjectPattern.test(email.subject);
  }

  /**
   * Extrai o número do processo do email
   * @param {Object} email - Objeto do email
   * @returns {string|null}
   */
  extractProcessNumber(email) {
    // Primeiro tenta extrair do assunto
    const subjectMatch = email.subject.match(this.processNumberPattern);
    if (subjectMatch) {
      return subjectMatch[1];
    }

    // Depois tenta extrair do corpo do email
    const bodyMatch = email.body.match(this.processNumberPattern);
    if (bodyMatch) {
      return bodyMatch[1];
    }

    return null;
  }

  /**
   * Extrai informações do processo do corpo do email
   * @param {string} body - Corpo do email
   * @returns {Object}
   */
  extractProcessInfo(body) {
    const info = {
      numero: null,
      poloAtivo: null,
      poloPassivo: null,
      classe: null,
      orgao: null,
      dataAutuacao: null,
      tipoDistribuicao: null,
      assunto: null,
      movimentacoes: []
    };

    // Extrai número do processo
    const processMatch = body.match(this.processNumberPattern);
    if (processMatch) {
      info.numero = processMatch[1];
    }

    // Extrai informações básicas
    const poloAtivoMatch = body.match(/Polo Ativo:\s*(.+)/i);
    if (poloAtivoMatch) {
      info.poloAtivo = poloAtivoMatch[1].trim();
    }

    const poloPassivoMatch = body.match(/Polo Passivo:\s*(.+)/i);
    if (poloPassivoMatch) {
      info.poloPassivo = poloPassivoMatch[1].trim();
    }

    const classeMatch = body.match(/Classe Judicial:\s*(.+)/i);
    if (classeMatch) {
      info.classe = classeMatch[1].trim();
    }

    const orgaoMatch = body.match(/Órgão:\s*(.+)/i);
    if (orgaoMatch) {
      info.orgao = orgaoMatch[1].trim();
    }

    const dataAutuacaoMatch = body.match(/Data de Autuação:\s*(.+)/i);
    if (dataAutuacaoMatch) {
      info.dataAutuacao = this.parseDate(dataAutuacaoMatch[1].trim());
    }

    const tipoDistribuicaoMatch = body.match(/Tipo de Distribuição:\s*(.+)/i);
    if (tipoDistribuicaoMatch) {
      info.tipoDistribuicao = tipoDistribuicaoMatch[1].trim();
    }

    const assuntoMatch = body.match(/Assunto:\s*(.+)/i);
    if (assuntoMatch) {
      info.assunto = assuntoMatch[1].trim();
    }

    // Extrai movimentações
    info.movimentacoes = this.extractMovements(body);

    return info;
  }

  /**
   * Extrai as movimentações do corpo do email
   * @param {string} body - Corpo do email
   * @returns {Array}
   */
  extractMovements(body) {
    const movements = [];
    
    // Procura pela tabela de movimentações
    const tableMatch = body.match(/Data\s+Movimento\s+Documento\s*([\s\S]*?)(?:\n\n|\Z)/);
    if (!tableMatch) {
      return movements;
    }

    const tableContent = tableMatch[1];
    const lines = tableContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Tenta extrair data, movimento e documento
      const dateMatch = trimmedLine.match(/^(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        const movement = {
          data: this.parseDate(dateMatch[1]),
          movimento: null,
          documento: null
        };

        // Remove a data da linha e processa o resto
        const remainingLine = trimmedLine.substring(dateMatch[0].length).trim();
        
        // Se há mais conteúdo, é o movimento
        if (remainingLine) {
          movement.movimento = remainingLine;
        }

        movements.push(movement);
      }
    }

    return movements;
  }

  /**
   * Converte string de data para objeto Date
   * @param {string} dateString - String da data
   * @returns {Date|null}
   */
  parseDate(dateString) {
    if (!dateString) return null;

    // Tenta diferentes formatos
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})/,  // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/,    // DD-MM-YYYY
      /(\d{4})-(\d{2})-(\d{2})/     // YYYY-MM-DD
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        const [, day, month, year] = match;
        return new Date(year, month - 1, day);
      }
    }

    return null;
  }

  /**
   * Processa um email completo
   * @param {Object} email - Objeto do email
   * @returns {Object|null}
   */
  parseEmail(email) {
    if (!this.isTRF1Notification(email)) {
      return null;
    }

    const processNumber = this.extractProcessNumber(email);
    if (!processNumber) {
      return null;
    }

    const processInfo = this.extractProcessInfo(email.body || email.text);

    return {
      numero: processNumber,
      ...processInfo,
      emailInfo: {
        from: email.from,
        subject: email.subject,
        receivedAt: new Date()
      }
    };
  }
}

export default EmailParser;
