// Utilitário de admin: cria (ou promove a admin) uma conta com senha
// definida na hora. Usado quando a conta de administradora não existe mais
// no banco (ex.: banco recriado do zero) e não há nenhum outro admin pra
// usar a tela de "Cadastrar cliente" pra resolver isso.
// Uso (rodar no Console do Railway, dentro do container em produção):
//   node scripts/create-admin.js email@exemplo.com "senha123" "Nome"
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../src/db');

const email = (process.argv[2] || '').toLowerCase().trim();
const password = process.argv[3] || '';
const name = process.argv[4] || 'Admin';

if (!email || password.length < 6) {
  console.error('Uso: node scripts/create-admin.js email@exemplo.com "senha123" "Nome"');
  console.error('A senha precisa ter pelo menos 6 caracteres.');
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(password, 10);
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

if (existing) {
  db.prepare(
    `UPDATE users SET password_hash = ?, role = 'admin', status = 'active', updated_at = datetime('now') WHERE id = ?`
  ).run(passwordHash, existing.id);
  console.log('Conta existente promovida a admin e senha atualizada: ' + email);
} else {
  const id = uuidv4();
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, 'admin', 'active')`
  ).run(id, name, email, passwordHash);
  console.log('Conta admin criada: ' + email);
}
