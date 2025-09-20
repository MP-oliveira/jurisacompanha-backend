/**
 * Utilitário para validação e sanitização de entrada
 * Protege contra ataques de injeção e dados maliciosos
 */

import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';
import logger from '../config/logger.js';

/**
 * Configurações de validação para diferentes tipos de dados
 */
const VALIDATION_CONFIG = {
  // Números de processo - formato específico do TRF1
  PROCESSO_NUMERO: {
    pattern: /^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$/,
    message: 'Número do processo deve estar no formato: 1234567-12.2023.4.01.3300'
  },
  
  // CPF - formato brasileiro
  CPF: {
    pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    message: 'CPF deve estar no formato: 123.456.789-00'
  },
  
  // CNPJ - formato brasileiro
  CNPJ: {
    pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
    message: 'CNPJ deve estar no formato: 12.345.678/0001-90'
  },
  
  // Nomes - apenas letras, espaços e acentos
  NOME: {
    pattern: /^[a-zA-ZÀ-ÿ\u0100-\u017F\u1E00-\u1EFF\s]{2,100}$/,
    message: 'Nome deve conter apenas letras, espaços e acentos (2-100 caracteres)'
  },
  
  // Texto jurídico - permite caracteres especiais necessários
  TEXTO_JURIDICO: {
    pattern: /^[a-zA-ZÀ-ÿ\u0100-\u017F\u1E00-\u1EFF0-9\s.,;:!?()\-'"]{1,5000}$/,
    message: 'Texto jurídico contém caracteres não permitidos'
  },
  
  // URLs - validação rigorosa
  URL: {
    pattern: /^https?:\/\/(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)?$/,
    message: 'URL deve ser válida e usar HTTPS'
  },
  
  // Data - formato brasileiro
  DATA_BRASILEIRA: {
    pattern: /^\d{2}\/\d{2}\/\d{4}$/,
    message: 'Data deve estar no formato: DD/MM/AAAA'
  }
};

/**
 * Caracteres perigosos que devem ser removidos/bloqueados
 */
const DANGEROUS_PATTERNS = [
  // Scripts maliciosos
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  
  // SQL Injection
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/gi,
  
  // Path Traversal
  /\.\.\//g,
  /\.\.\\/g,
  
  // Comandos do sistema
  /\b(cat|ls|dir|type|del|rm|mkdir|rmdir|copy|move|exec|system|eval)\b/gi
];

/**
 * Sanitiza texto removendo caracteres perigosos
 */
export const sanitizeText = (input, options = {}) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const {
    allowHtml = false,
    maxLength = 5000,
    preserveLineBreaks = false
  } = options;

  let sanitized = input.trim();

  // Remove caracteres perigosos
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove caracteres de controle
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Sanitiza HTML se necessário
  if (!allowHtml) {
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: preserveLineBreaks ? ['br', 'p'] : [],
      ALLOWED_ATTR: []
    });
  }

  // Limita tamanho
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Valida número de processo
 */
export const validateProcessoNumero = (numero) => {
  if (!numero || typeof numero !== 'string') {
    return { isValid: false, message: 'Número do processo é obrigatório' };
  }

  const cleanNumero = numero.trim();
  
  if (!VALIDATION_CONFIG.PROCESSO_NUMERO.pattern.test(cleanNumero)) {
    return { 
      isValid: false, 
      message: VALIDATION_CONFIG.PROCESSO_NUMERO.message 
    };
  }

  return { isValid: true, value: cleanNumero };
};

/**
 * Valida CPF
 */
export const validateCPF = (cpf) => {
  if (!cpf || typeof cpf !== 'string') {
    return { isValid: false, message: 'CPF é obrigatório' };
  }

  const cleanCPF = cpf.trim().replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) {
    return { isValid: false, message: 'CPF deve ter 11 dígitos' };
  }

  // Validação do algoritmo do CPF
  if (cleanCPF === '00000000000' || cleanCPF === '11111111111' || 
      cleanCPF === '22222222222' || cleanCPF === '33333333333' ||
      cleanCPF === '44444444444' || cleanCPF === '55555555555' ||
      cleanCPF === '66666666666' || cleanCPF === '77777777777' ||
      cleanCPF === '88888888888' || cleanCPF === '99999999999') {
    return { isValid: false, message: 'CPF inválido' };
  }

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleanCPF.charAt(9))) {
    return { isValid: false, message: 'CPF inválido' };
  }

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleanCPF.charAt(10))) {
    return { isValid: false, message: 'CPF inválido' };
  }

  return { isValid: true, value: cleanCPF };
};

/**
 * Valida CNPJ
 */
export const validateCNPJ = (cnpj) => {
  if (!cnpj || typeof cnpj !== 'string') {
    return { isValid: false, message: 'CNPJ é obrigatório' };
  }

  const cleanCNPJ = cnpj.trim().replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) {
    return { isValid: false, message: 'CNPJ deve ter 14 dígitos' };
  }

  // Validação do algoritmo do CNPJ
  if (cleanCNPJ === '00000000000000' || cleanCNPJ === '11111111111111' ||
      cleanCNPJ === '22222222222222' || cleanCNPJ === '33333333333333' ||
      cleanCNPJ === '44444444444444' || cleanCNPJ === '55555555555555' ||
      cleanCNPJ === '66666666666666' || cleanCNPJ === '77777777777777' ||
      cleanCNPJ === '88888888888888' || cleanCNPJ === '99999999999999') {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  let tamanho = cleanCNPJ.length - 2;
  let numeros = cleanCNPJ.substring(0, tamanho);
  let digitos = cleanCNPJ.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  tamanho = tamanho + 1;
  numeros = cleanCNPJ.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) {
    return { isValid: false, message: 'CNPJ inválido' };
  }

  return { isValid: true, value: cleanCNPJ };
};

/**
 * Valida email
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Email é obrigatório' };
  }

  const cleanEmail = email.trim().toLowerCase();
  
  if (!validator.isEmail(cleanEmail)) {
    return { isValid: false, message: 'Email inválido' };
  }

  // Verifica domínios suspeitos
  const suspiciousDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
  const domain = cleanEmail.split('@')[1];
  
  if (suspiciousDomains.includes(domain)) {
    return { isValid: false, message: 'Domínio de email temporário não permitido' };
  }

  return { isValid: true, value: cleanEmail };
};

/**
 * Valida nome
 */
export const validateNome = (nome) => {
  if (!nome || typeof nome !== 'string') {
    return { isValid: false, message: 'Nome é obrigatório' };
  }

  const cleanNome = sanitizeText(nome, { maxLength: 100 });
  
  if (!VALIDATION_CONFIG.NOME.pattern.test(cleanNome)) {
    return { 
      isValid: false, 
      message: VALIDATION_CONFIG.NOME.message 
    };
  }

  return { isValid: true, value: cleanNome };
};

/**
 * Valida texto jurídico
 */
export const validateTextoJuridico = (texto) => {
  if (!texto || typeof texto !== 'string') {
    return { isValid: false, message: 'Texto é obrigatório' };
  }

  const cleanTexto = sanitizeText(texto, { maxLength: 5000, preserveLineBreaks: true });
  
  if (!VALIDATION_CONFIG.TEXTO_JURIDICO.pattern.test(cleanTexto)) {
    return { 
      isValid: false, 
      message: VALIDATION_CONFIG.TEXTO_JURIDICO.message 
    };
  }

  return { isValid: true, value: cleanTexto };
};

/**
 * Valida data brasileira
 */
export const validateDataBrasileira = (data) => {
  if (!data || typeof data !== 'string') {
    return { isValid: false, message: 'Data é obrigatória' };
  }

  const cleanData = data.trim();
  
  if (!VALIDATION_CONFIG.DATA_BRASILEIRA.pattern.test(cleanData)) {
    return { 
      isValid: false, 
      message: VALIDATION_CONFIG.DATA_BRASILEIRA.message 
    };
  }

  // Valida se a data é real
  const [dia, mes, ano] = cleanData.split('/').map(Number);
  const dataObj = new Date(ano, mes - 1, dia);
  
  if (dataObj.getDate() !== dia || dataObj.getMonth() !== mes - 1 || dataObj.getFullYear() !== ano) {
    return { isValid: false, message: 'Data inválida' };
  }

  // Verifica se a data não é futura demais (máximo 10 anos)
  const hoje = new Date();
  const dataMaxima = new Date(hoje.getFullYear() + 10, hoje.getMonth(), hoje.getDate());
  
  if (dataObj > dataMaxima) {
    return { isValid: false, message: 'Data não pode ser mais de 10 anos no futuro' };
  }

  return { isValid: true, value: cleanData };
};

/**
 * Valida URL
 */
export const validateURL = (url) => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, message: 'URL é obrigatória' };
  }

  const cleanURL = url.trim();
  
  if (!validator.isURL(cleanURL, { protocols: ['http', 'https'] })) {
    return { isValid: false, message: 'URL inválida' };
  }

  if (!cleanURL.startsWith('https://')) {
    return { isValid: false, message: 'URL deve usar HTTPS' };
  }

  return { isValid: true, value: cleanURL };
};

/**
 * Valida e sanitiza objeto completo
 */
export const validateAndSanitizeObject = (obj, schema) => {
  const result = { isValid: true, data: {}, errors: [] };
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = obj[field];
    
    // Verifica se campo é obrigatório
    if (rules.required && (value === undefined || value === null || value === '')) {
      result.errors.push({ field, message: `${field} é obrigatório` });
      result.isValid = false;
      continue;
    }
    
    // Se campo não é obrigatório e está vazio, pula validação
    if (!rules.required && (value === undefined || value === null || value === '')) {
      result.data[field] = null;
      continue;
    }
    
    // Aplica validação específica
    let validationResult;
    switch (rules.type) {
      case 'processo_numero':
        validationResult = validateProcessoNumero(value);
        break;
      case 'cpf':
        validationResult = validateCPF(value);
        break;
      case 'cnpj':
        validationResult = validateCNPJ(value);
        break;
      case 'email':
        validationResult = validateEmail(value);
        break;
      case 'nome':
        validationResult = validateNome(value);
        break;
      case 'texto_juridico':
        validationResult = validateTextoJuridico(value);
        break;
      case 'data_brasileira':
        validationResult = validateDataBrasileira(value);
        break;
      case 'url':
        validationResult = validateURL(value);
        break;
      case 'string':
        validationResult = { isValid: true, value: sanitizeText(value, { maxLength: rules.maxLength || 255 }) };
        break;
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          validationResult = { isValid: false, message: `${field} deve ser um número válido` };
        } else if (rules.min && num < rules.min) {
          validationResult = { isValid: false, message: `${field} deve ser maior ou igual a ${rules.min}` };
        } else if (rules.max && num > rules.max) {
          validationResult = { isValid: false, message: `${field} deve ser menor ou igual a ${rules.max}` };
        } else {
          validationResult = { isValid: true, value: num };
        }
        break;
      case 'boolean':
        validationResult = { isValid: true, value: Boolean(value) };
        break;
      default:
        validationResult = { isValid: true, value: sanitizeText(String(value)) };
    }
    
    if (!validationResult.isValid) {
      result.errors.push({ field, message: validationResult.message });
      result.isValid = false;
    } else {
      result.data[field] = validationResult.value;
    }
  }
  
  return result;
};

/**
 * Middleware para validação de entrada
 */
export const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const result = validateAndSanitizeObject(req.body, schema);
      
      if (!result.isValid) {
        logger.warn('Validação de entrada falhou:', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          errors: result.errors,
          body: req.body
        });
        
        return res.status(400).json({
          error: 'Dados inválidos',
          details: result.errors
        });
      }
      
      // Substitui req.body pelos dados sanitizados
      req.body = result.data;
      next();
      
    } catch (error) {
      logger.error('Erro na validação de entrada:', error);
      res.status(500).json({
        error: 'Erro interno na validação'
      });
    }
  };
};

/**
 * Schemas de validação para diferentes endpoints
 */
export const VALIDATION_SCHEMAS = {
  // Schema para criação de processo
  CREATE_PROCESSO: {
    numero: { type: 'processo_numero', required: true },
    classe: { type: 'texto_juridico', required: true },
    assunto: { type: 'texto_juridico', required: true },
    tribunal: { type: 'string', required: true, maxLength: 100 },
    comarca: { type: 'string', required: true, maxLength: 100 },
    status: { type: 'string', required: true },
    observacoes: { type: 'texto_juridico', required: false }
  },
  
  // Schema para atualização de processo
  UPDATE_PROCESSO: {
    classe: { type: 'texto_juridico', required: false },
    assunto: { type: 'texto_juridico', required: false },
    tribunal: { type: 'string', required: false, maxLength: 100 },
    comarca: { type: 'string', required: false, maxLength: 100 },
    status: { type: 'string', required: false },
    observacoes: { type: 'texto_juridico', required: false }
  },
  
  // Schema para criação de usuário
  CREATE_USER: {
    nome: { type: 'nome', required: true },
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, maxLength: 255 },
    role: { type: 'string', required: false }
  },
  
  // Schema para atualização de usuário
  UPDATE_USER: {
    nome: { type: 'nome', required: false },
    email: { type: 'email', required: false },
    role: { type: 'string', required: false }
  },
  
  // Schema para criação de alerta
  CREATE_ALERT: {
    tipo: { type: 'string', required: true, maxLength: 50 },
    titulo: { type: 'string', required: true, maxLength: 200 },
    mensagem: { type: 'texto_juridico', required: true },
    prioridade: { type: 'number', required: true, min: 1, max: 5 },
    dataVencimento: { type: 'data_brasileira', required: true }
  }
};
