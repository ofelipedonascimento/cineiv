const express  = require('express');
const session  = require('express-session');
const path     = require('path');
const os       = require('os');
const { initDb } = require('./database/db');

const app    = express();
const PORT   = process.env.PORT || 3000;
const SECRET = process.env.SESSION_SECRET || 'cineiv-studio-2025-' + Math.random().toString(36).slice(2);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000, httpOnly: true }
}));

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, fp) => {
    if (fp.endsWith('manifest.json')) res.setHeader('Content-Type', 'application/manifest+json');
  }
}));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// ── API ──
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/events',    require('./routes/events'));
app.use('/api/budgets',   require('./routes/budgets'));
app.use('/api/clients',   require('./routes/clients'));
app.use('/api/alerts',    require('./routes/alerts'));
app.use('/api/projects',  require('./routes/projects'));
app.use('/api/followups', require('./routes/followups'));

// ── TV: suporta /tv e /tv/:slug ──
app.get('/tv',       (req, res) => res.sendFile(path.join(__dirname, 'public', 'tv.html')));
app.get('/tv/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public', 'tv.html')));

// ── SPA fallback ──
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function getLocalIPs() {
  return Object.values(os.networkInterfaces()).flat()
    .filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address);
}

async function start() {
  await initDb();
  // Inicia backup automático
  const { iniciarBackupAutomatico } = require('./services/backupService');
  iniciarBackupAutomatico();

  // Inicia scheduler de alertas WhatsApp
  const { iniciarScheduler } = require('./services/alertService');
  iniciarScheduler();

  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🎬  Cine IV Studio — SaaS-Ready System');
    console.log('=======================================');
    console.log(`📍  Local:     http://localhost:${PORT}`);
    getLocalIPs().forEach(ip => {
      console.log(`🌐  LAN:       http://${ip}:${PORT}`);
      console.log(`📺  Dashboard: http://${ip}:${PORT}/tv`);
      console.log(`📺  TV Slug:   http://${ip}:${PORT}/tv/cineiv`);
    });
    console.log('\n👤  felipe/felipecineiv · nico/nicocineiv · ricardo/ricardocineiv · janderson/jandersoncineiv');
    console.log('🏢  Empresa: Cine IV Studio (ID 1, plano: pro)');
    console.log('📱  WhatsApp:   http://localhost:'+PORT+'/api/alerts/whatsapp/status');
    console.log('✅  Sistema pronto!\n');
  });
}

start();
