require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('./db');

const products = [
  { key: 'rota_blindada', name: 'Rota Blindada' },
  { key: 'rota_blindada_pro', name: 'Rota Blindada PRO' },
  { key: 'maquina_de_prompts', name: 'Máquina de Prompts' },
  { key: 'skill_blindada_pro', name: 'Skill Blindada Pro' },
  { key: 'skill_topclaudia', name: 'Skill TopClaudia' },
  { key: 'skill_trafego', name: 'Skill de Tráfego' },
];

const insertProduct = db.prepare(
  'INSERT INTO products (id, key, name, sort_order) VALUES (?, ?, ?, ?)'
);
products.forEach((product, index) => {
  const existing = db.prepare('SELECT id FROM products WHERE key = ?').get(product.key);
  if (!existing) {
    insertProduct.run(uuidv4(), product.key, product.name, index);
  }
});
console.log(`Produtos verificados: ${products.length}.`);

const devEmail = process.env.SEED_ADMIN_EMAIL;
const devPassword = process.env.SEED_ADMIN_PASSWORD;
if (devEmail && devPassword) {
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(devEmail);
  if (!existingUser) {
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'admin', 'active')`
    ).run(uuidv4(), 'Admin', devEmail, bcrypt.hashSync(devPassword, 10));
    console.log(`Usuário admin criado: ${devEmail}`);
  } else {
    console.log('Usuário admin já existe, ignorado.');
  }
}
