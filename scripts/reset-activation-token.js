// Utilitário de admin: gera um novo token de ativação pra uma conta e
// imprime o link de "definir senha". Usado quando alguém esquece a senha e
// o site ainda não tem um fluxo de "esqueci minha senha" próprio.
// Uso (rodar no Console do Railway, dentro do container em produção):
//   node scripts/reset-activation-token.js email@exemplo.com
const { v4: uuidv4 } = require('uuid');
const db = require('../src/db');

const email = (process.argv[2] || '').toLowerCase().trim();
if (!email) {
  console.error('Uso: node scripts/reset-activation-token.js email@exemplo.com');
  process.exit(1);
}

const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
if (!user) {
  console.error('Nenhuma conta encontrada com o e-mail: ' + email);
  process.exit(1);
}

const token = uuidv4();
db.prepare('UPDATE users SET activation_token = ? WHERE id = ?').run(token, user.id);

console.log('Token gerado com sucesso.');
console.log('TOKEN=' + token);
