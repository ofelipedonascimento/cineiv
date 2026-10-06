// Parser de CSV sem dependências (aceita ; ou , e campos entre aspas).
function parseCSV(texto, sep) {
  texto = texto.replace(/^﻿/, '');
  if (!sep) {
    const primeira = texto.split(/\r?\n/).find(l => l.trim()) || '';
    sep = (primeira.match(/;/g) || []).length >= (primeira.match(/,/g) || []).length ? ';' : ',';
  }
  const linhas = [];
  let linha = [], campo = '', aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas.filter(l => l.some(v => v.trim()));
}

// "R$ 123.456,78" -> 123456.78 ; "123456.78" -> 123456.78
function numeroBR(v) {
  if (v == null) return NaN;
  if (typeof v === 'number') return v;
  let s = String(v).replace(/[R$\s%]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  return Number(s);
}

// Normaliza cabeçalho: minúsculo, sem acento, sem símbolos.
function chave(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function paraObjetos(linhas, indiceCabecalho = 0) {
  const cab = linhas[indiceCabecalho].map(chave);
  return linhas.slice(indiceCabecalho + 1).map(l => Object.fromEntries(cab.map((c, i) => [c, (l[i] ?? '').trim()])));
}

module.exports = { parseCSV, numeroBR, chave, paraObjetos };
