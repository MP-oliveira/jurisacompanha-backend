/**
 * Calcula uma data adicionando dias úteis (excluindo finais de semana)
 * @param {Date} startDate - Data inicial
 * @param {number} businessDays - Número de dias úteis a adicionar
 * @returns {Date} Nova data
 */
export function addBusinessDays(startDate, businessDays) {
  const date = new Date(startDate);
  let addedDays = 0;
  
  while (addedDays < businessDays) {
    date.setDate(date.getDate() + 1);
    
    // Pula finais de semana (0 = domingo, 6 = sábado)
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      addedDays++;
    }
  }
  
  return date;
}

/**
 * Calcula o número de dias úteis entre duas datas
 * @param {Date} startDate - Data inicial
 * @param {Date} endDate - Data final
 * @returns {number} Número de dias úteis
 */
export function getBusinessDaysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let businessDays = 0;
  
  while (start <= end) {
    if (start.getDay() !== 0 && start.getDay() !== 6) {
      businessDays++;
    }
    start.setDate(start.getDate() + 1);
  }
  
  return businessDays;
}

/**
 * Verifica se uma data é um dia útil
 * @param {Date} date - Data a verificar
 * @returns {boolean} True se for dia útil
 */
export function isBusinessDay(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/**
 * Formata uma data para exibição
 * @param {Date} date - Data a formatar
 * @returns {string} Data formatada
 */
export function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formata uma data e hora para exibição
 * @param {Date} date - Data a formatar
 * @returns {string} Data e hora formatada
 */
export function formatDateTime(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calcula a data de vencimento para recursos (10 dias úteis)
 * @param {Date} dataSentenca - Data da sentença
 * @returns {Date} Data de vencimento
 */
export function calcularPrazoRecurso(dataSentenca) {
  return addBusinessDays(dataSentenca, 10);
}

/**
 * Calcula a data de vencimento para embargos (5 dias úteis)
 * @param {Date} dataSentenca - Data da sentença
 * @returns {Date} Data de vencimento
 */
export function calcularPrazoEmbargos(dataSentenca) {
  return addBusinessDays(dataSentenca, 5);
}
