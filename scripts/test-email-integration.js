/**
 * Script para testar a integração de email
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importa o EmailParser
import EmailParser from '../src/services/emailParser.js';

async function testEmailParser() {
  console.log('🧪 Testando EmailParser...\n');

  // Carrega o exemplo de email
  const emailExamplePath = path.join(__dirname, '../examples/trf1-email-example.json');
  const emailExample = JSON.parse(fs.readFileSync(emailExamplePath, 'utf8'));

  console.log('📧 Email de exemplo carregado:');
  console.log(`From: ${emailExample.from}`);
  console.log(`To: ${emailExample.to}`);
  console.log(`Subject: ${emailExample.subject}\n`);

  // Cria instância do parser
  const parser = new EmailParser();

  // Testa se é notificação do TRF1
  const isTRF1 = parser.isTRF1Notification(emailExample);
  console.log(`✅ É notificação do TRF1: ${isTRF1}\n`);

  if (isTRF1) {
    // Extrai número do processo
    const processNumber = parser.extractProcessNumber(emailExample);
    console.log(`📋 Número do processo extraído: ${processNumber}\n`);

    // Faz parsing completo
    const parsedResult = parser.parseEmail(emailExample);
    console.log('🔍 Resultado do parsing:');
    console.log(JSON.stringify(parsedResult, null, 2));
  }

  console.log('\n✅ Teste concluído!');
}

// Executa o teste
testEmailParser().catch(console.error);
