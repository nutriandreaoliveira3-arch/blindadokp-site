// Utilitário de admin: define exatamente quais produtos uma conta tem
// (remove os que não estão na lista, adiciona os que estão). Útil pra
// corrigir rápido pelo Console do Railway quando o produto errado foi
// marcado no cadastro manual.
// Uso:
//   node scripts/set-user-products.js email@exemplo.com produto_key_1,produto_key_2
// Exemplo:
//   node scripts/set-user-products.js teste@exemplo.com mentoria_blindada_pro
const db = require('../src/db');

const email = (process.argv[2] || '').toLowerCase().trim();
const keysArg = process.argv[3] || '';

if (!email || !keysArg) {
  console.error('Uso: node scripts/set-user-products.js email@exemplo.com produto_key_1,produto_key_2');
  const allProducts = db.prepare('SELECT key, name FROM products ORDER BY sort_order').all();
  console.error('\nProdutos disponíveis:');
  allProducts.forEach((p) => console.error('  ' + p.key + '  ->  ' + p.name));
  process.exit(1);
}

const user = db.prepare('SELECT id, name FROM users WHERE email = ?').get(email);
if (!user) {
  console.error('Nenhuma conta encontrada com o e-mail: ' + email);
  process.exit(1);
}

const keys = keysArg.split(',').map((k) => k.trim()).filter(Boolean);
const products = keys.map((key) => {
  const product = db.prepare('SELECT id, name FROM products WHERE key = ?').get(key);
  if (!product) {
    console.error('Produto não encontrado: ' + key);
    process.exit(1);
  }
  return product;
});

db.prepare('DELETE FROM user_products WHERE user_id = ?').run(user.id);
const grant = db.prepare('INSERT INTO user_products (user_id, product_id) VALUES (?, ?)');
products.forEach((p) => grant.run(user.id, p.id));

console.log('Produtos de ' + user.name + ' (' + email + ') agora são: ' + products.map((p) => p.name).join(', '));
