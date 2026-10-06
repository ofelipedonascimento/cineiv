const express = require('express');
const path = require('path');
const crypto = require('crypto');
const config = require('./src/config');
const store = require('./src/store');
const { avaliar } = require('./src/scoring');
const planilha = require('./src/connectors/planilha');
const caixa = require('./src/connectors/caixa');
const { coletarTudo } = require('./src/coletar');

const app = express();
const PORT = process.env.PORT || 3100;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'trocar-esta-senha';
const sessoes = new Set();

app.use(express.json({ limit: '1mb' }));
app.use(express.text({ type: ['text/csv', 'text/plain'], limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function cookie(req, nome) {
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|; )${nome}=([^;]+)`));
  return m && m[1];
}
function admin(req, res, next) {
  if (sessoes.has(cookie(req, 'sessao'))) return next();
  res.status(401).json({ erro: 'Faça login' });
}

app.post('/api/login', (req, res) => {
  const ok = typeof req.body.senha === 'string' && req.body.senha.length === ADMIN_PASSWORD.length &&
    crypto.timingSafeEqual(Buffer.from(req.body.senha), Buffer.from(ADMIN_PASSWORD));
  if (!ok) return res.status(401).json({ erro: 'Senha inválida' });
  const token = crypto.randomBytes(24).toString('hex');
  sessoes.add(token);
  res.setHeader('Set-Cookie', `sessao=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`);
  res.json({ ok: true });
});
app.get('/api/me', admin, (req, res) => res.json({ ok: true }));

// Filtra, avalia e ordena oportunidades.
function oportunidades(q = {}) {
  let lotes = store.ler('lotes').map(l => avaliar(l));
  if (q.todos !== '1') lotes = lotes.filter(l => l.elegivel);
  if (q.categoria) lotes = lotes.filter(l => l.categoria === q.categoria);
  if (q.origem) lotes = lotes.filter(l => l.origem === q.origem);
  if (q.uf) lotes = lotes.filter(l => l.uf === String(q.uf).toUpperCase());
  if (q.parcelado === '1') lotes = lotes.filter(l => l.parcelamento?.permitido);
  if (q.maxLance) lotes = lotes.filter(l => l.lanceInicial <= Number(q.maxLance));
  if (q.busca) {
    const b = String(q.busca).toLowerCase();
    lotes = lotes.filter(l => `${l.titulo} ${l.cidade} ${l.descricao}`.toLowerCase().includes(b));
  }
  const ordem = { score: l => -l.analise.score, roi: l => -l.analise.roiMensalPct, desconto: l => -l.analise.descontoPct, lance: l => l.lanceInicial, data: l => l.dataLeilao || '9999' };
  const f = ordem[q.ordem] || ordem.score;
  return lotes.sort((a, b) => (f(a) > f(b) ? 1 : f(a) < f(b) ? -1 : 0));
}

app.get('/api/config', (req, res) => res.json({
  lanceMaxPct: config.lanceMaxPct, origens: config.origensPermitidas, categorias: config.categorias,
  riscos: Object.fromEntries(Object.entries(config.riscos).map(([k, v]) => [k, v.label])),
}));

app.get('/api/oportunidades', admin, (req, res) => {
  const lista = oportunidades(req.query);
  const todos = store.ler('lotes');
  res.json({ total: lista.length, base: todos.length, itens: lista.slice(0, 500) });
});

// Boletim para investidores (CSV) com as melhores oportunidades.
app.get('/api/boletim.csv', admin, (req, res) => {
  const lista = oportunidades(req.query).slice(0, Number(req.query.limite) || 50);
  const cab = ['score', 'titulo', 'categoria', 'origem', 'uf', 'cidade', 'data_leilao', 'avaliacao', 'lance_inicial', 'desconto_pct', 'parcelado', 'capital_total', 'lucro_estimado', 'roi_pct', 'roi_mensal_pct', 'dias_giro', 'lance_maximo_recomendado', 'url'];
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = lista.map(l => [l.analise.score, l.titulo, l.categoria, l.origem, l.uf, l.cidade, l.dataLeilao, l.valorAvaliacao, l.lanceInicial, l.analise.descontoPct, l.parcelamento?.permitido ? 'sim' : 'nao', l.analise.capitalTotal, l.analise.lucroEstimado, l.analise.roiPct, l.analise.roiMensalPct, l.analise.diasGiro, l.analise.lanceMaximoRecomendado, l.url].map(esc).join(';'));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="boletim-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send('﻿' + [cab.join(';'), ...linhas].join('\n'));
});

// Importação: CSV de edital/leiloeiro (formato planilha) ou lista da Caixa.
app.post('/api/importar', admin, (req, res) => {
  try {
    const texto = typeof req.body === 'string' ? req.body : '';
    const tipo = req.query.tipo || 'planilha';
    const lotes = tipo === 'caixa' ? caixa.converter(texto) : planilha.converter(texto, req.query.fonte || 'planilha');
    res.json({ lidos: lotes.length, ...store.upsertLotes(lotes) });
  } catch (e) { res.status(400).json({ erro: e.message }); }
});

app.post('/api/coletar', admin, async (req, res) => res.json(await coletarTudo(req.body?.ufs)));

// Investidores e o que cada um procura.
app.get('/api/investidores', admin, (req, res) => {
  res.json(store.ler('investidores').map(inv => ({ ...inv, matches: oportunidades(inv.filtros || {}).length })));
});
app.post('/api/investidores', admin, (req, res) => {
  const { nome, contato, filtros } = req.body || {};
  if (!nome) return res.status(400).json({ erro: 'Nome obrigatório' });
  const lista = store.ler('investidores');
  const inv = { id: crypto.randomUUID(), nome, contato: contato || '', filtros: filtros || {}, criadoEm: new Date().toISOString() };
  lista.push(inv);
  store.gravar('investidores', lista);
  res.json(inv);
});
app.delete('/api/investidores/:id', admin, (req, res) => {
  store.gravar('investidores', store.ler('investidores').filter(i => i.id !== req.params.id));
  res.json({ ok: true });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Radar de Leilões em http://localhost:${PORT}`);
    if (ADMIN_PASSWORD === 'trocar-esta-senha') console.log('ATENÇÃO: defina ADMIN_PASSWORD antes de expor na internet.');
  });
}

module.exports = { app, oportunidades };
