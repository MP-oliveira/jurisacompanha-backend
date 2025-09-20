/**
 * Validador de senhas com política de segurança
 * Permite senhas simples apenas para usuários de teste específicos
 */

// Senhas comuns que devem ser bloqueadas
const COMMON_PASSWORDS = [
  '123456', 'password', '123456789', '12345678', '12345',
  '1234567', '1234567890', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234', 'dragon',
  'master', 'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1'
];

// Emails de usuários de teste que podem usar senhas simples
const TEST_USERS = [
  'plain@test.com',
  'admin@teste.com',
  'teste@teste.com'
];

/**
 * Valida se a senha atende aos critérios de segurança
 * @param {string} password - Senha a ser validada
 * @param {string} email - Email do usuário (para verificar se é teste)
 * @returns {Object} - Resultado da validação
 */
export function validatePassword(password, email = '') {
  const result = {
    isValid: true,
    errors: []
  };

  // Se for usuário de teste, permite senhas simples
  if (TEST_USERS.includes(email.toLowerCase())) {
    if (password.length < 6) {
      result.errors.push('Senha deve ter pelo menos 6 caracteres');
      result.isValid = false;
    }
    return result;
  }

  // Validações para usuários normais (política rigorosa)
  
  // 1. Tamanho mínimo
  if (password.length < 8) {
    result.errors.push('Senha deve ter pelo menos 8 caracteres');
    result.isValid = false;
  }

  // 2. Tamanho máximo
  if (password.length > 128) {
    result.errors.push('Senha deve ter no máximo 128 caracteres');
    result.isValid = false;
  }

  // 3. Pelo menos uma letra minúscula
  if (!/[a-z]/.test(password)) {
    result.errors.push('Senha deve conter pelo menos uma letra minúscula');
    result.isValid = false;
  }

  // 4. Pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(password)) {
    result.errors.push('Senha deve conter pelo menos uma letra maiúscula');
    result.isValid = false;
  }

  // 5. Pelo menos um número
  if (!/\d/.test(password)) {
    result.errors.push('Senha deve conter pelo menos um número');
    result.isValid = false;
  }

  // 6. Pelo menos um caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.errors.push('Senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    result.isValid = false;
  }

  // 7. Não pode ser uma senha comum
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    result.errors.push('Esta senha é muito comum. Escolha uma senha mais segura');
    result.isValid = false;
  }

  // 8. Não pode conter sequências simples
  if (hasSimpleSequence(password)) {
    result.errors.push('Senha não pode conter sequências simples (123, abc, etc)');
    result.isValid = false;
  }

  // 9. Não pode conter repetições excessivas
  if (hasExcessiveRepetition(password)) {
    result.errors.push('Senha não pode conter muitas repetições do mesmo caractere');
    result.isValid = false;
  }

  return result;
}

/**
 * Verifica se a senha contém sequências simples
 */
function hasSimpleSequence(password) {
  const sequences = [
    '123', '234', '345', '456', '567', '678', '789', '890',
    'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk', 'jkl', 'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs', 'rst', 'stu', 'tuv', 'uvw', 'vwx', 'wxy', 'xyz',
    'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop',
    'asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'jkl',
    'zxc', 'xcv', 'cvb', 'vbn', 'bnm'
  ];

  const lowerPassword = password.toLowerCase();
  return sequences.some(seq => lowerPassword.includes(seq));
}

/**
 * Verifica se a senha contém repetições excessivas
 */
function hasExcessiveRepetition(password) {
  // Verifica se há mais de 2 caracteres consecutivos iguais
  return /(.)\1{2,}/.test(password);
}

/**
 * Calcula a força da senha (0-100)
 */
export function calculatePasswordStrength(password, email = '') {
  let score = 0;

  // Se for usuário de teste, score base
  if (TEST_USERS.includes(email.toLowerCase())) {
    score = 50;
    if (password.length >= 6) score += 10;
    return Math.min(score, 100);
  }

  // Comprimento
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Caracteres diferentes
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

  // Pontuação negativa
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) score -= 30;
  if (hasSimpleSequence(password)) score -= 20;
  if (hasExcessiveRepetition(password)) score -= 15;

  return Math.max(0, Math.min(100, score));
}

/**
 * Gera sugestões de melhoria para a senha
 */
export function getPasswordSuggestions(password, email = '') {
  const suggestions = [];

  // Se for usuário de teste, não dá sugestões
  if (TEST_USERS.includes(email.toLowerCase())) {
    return suggestions;
  }

  if (password.length < 8) {
    suggestions.push('Use pelo menos 8 caracteres');
  }

  if (!/[a-z]/.test(password)) {
    suggestions.push('Adicione letras minúsculas (a-z)');
  }

  if (!/[A-Z]/.test(password)) {
    suggestions.push('Adicione letras maiúsculas (A-Z)');
  }

  if (!/\d/.test(password)) {
    suggestions.push('Adicione números (0-9)');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    suggestions.push('Adicione caracteres especiais (!@#$%^&*)');
  }

  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    suggestions.push('Evite senhas muito comuns');
  }

  if (hasSimpleSequence(password)) {
    suggestions.push('Evite sequências simples (123, abc)');
  }

  if (hasExcessiveRepetition(password)) {
    suggestions.push('Evite repetições excessivas (aaa, 111)');
  }

  return suggestions;
}
