// Armazenamento em arquivos JSON. Simples de rodar em qualquer máquina;
// dá para trocar por Postgres/Supabase depois sem mexer no resto.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

function arquivo(nome) { return path.join(DIR, `${nome}.json`); }

function ler(nome) {
  try { return JSON.parse(fs.readFileSync(arquivo(nome), 'utf8')); }
  catch { return []; }
}

function gravar(nome, dados) {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = arquivo(nome) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(dados, null, 2));
  fs.renameSync(tmp, arquivo(nome));
}

// Insere ou atualiza lotes pela chave fonte+idExterno (evita duplicar na recoleta).
function upsertLotes(novos) {
  const atuais = ler('lotes');
  const idx = new Map(atuais.map((l, i) => [`${l.fonte}:${l.idExterno}`, i]));
  let inseridos = 0, atualizados = 0;
  for (const n of novos) {
    const chave = `${n.fonte}:${n.idExterno}`;
    if (idx.has(chave)) {
      const i = idx.get(chave);
      atuais[i] = { ...atuais[i], ...n, atualizadoEm: new Date().toISOString() };
      atualizados++;
    } else {
      atuais.push({ id: crypto.randomUUID(), ...n, coletadoEm: new Date().toISOString() });
      idx.set(chave, atuais.length - 1);
      inseridos++;
    }
  }
  gravar('lotes', atuais);
  return { inseridos, atualizados, total: atuais.length };
}

module.exports = { ler, gravar, upsertLotes };
