// Configurações gerais do app (Admin → Configurações). Hoje só tem
// auto_unlock_enabled — ver comentário em src/lib/settings.js e em
// processFinalDiagnostic.js pra entender o que ele controla.
const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { isAutoUnlockEnabled, setSetting } = require('../lib/settings');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/', (req, res) => {
  res.json({ autoUnlockEnabled: isAutoUnlockEnabled() });
});

router.put('/auto-unlock', (req, res) => {
  const { enabled } = req.body || {};
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Informe "enabled" como true ou false.' });
  }
  setSetting('auto_unlock_enabled', enabled ? 'true' : 'false');
  res.json({ ok: true, autoUnlockEnabled: enabled });
});

module.exports = router;
