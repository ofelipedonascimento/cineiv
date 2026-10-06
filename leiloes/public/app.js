const $ = s => document.querySelector(s);
const brl = n => (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let CFG = {};

async function api(url, opts = {}) {
  const r = await fetch(url, { credentials: 'same-origin', ...opts });
  if (r.status === 401 && !url.endsWith('/login')) { mostrarLogin(); throw new Error('não autenticado'); }
  const j = await r.json();
  if (!r.ok) throw new Error(j.erro || r.statusText);
  return j;
}

function mostrarLogin() { $('#login').classList.remove('oculto'); $('#app').classList.add('oculto'); }

$('#login').onsubmit = async e => {
  e.preventDefault();
  try {
    await api('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha: $('#senha').value }) });
    iniciar();
  } catch (err) { $('#loginErro').textContent = err.message; }
};

document.querySelectorAll('header nav button').forEach(b => b.onclick = () => {
  document.querySelectorAll('header nav button').forEach(x => x.classList.toggle('ativo', x === b));
  document.querySelectorAll('main > section').forEach(s => s.classList.toggle('oculto', s.id !== `aba-${b.dataset.aba}`));
  if (b.dataset.aba === 'investidores') carregarInvestidores();
});

function filtros() {
  const q = new URLSearchParams();
  for (const k of ['busca', 'categoria', 'origem', 'uf', 'maxLance', 'ordem']) { const v = $(`#f-${k}`).value.trim(); if (v) q.set(k, v); }
  if ($('#f-parcelado').checked) q.set('parcelado', '1');
  if ($('#f-todos').checked) q.set('todos', '1');
  return q;
}

function corScore(s) { return s >= 70 ? 'background:#14532d;color:#86efac' : s >= 45 ? 'background:#713f12;color:#fde68a' : 'background:#3f1d1d;color:#fca5a5'; }

function cartao(l) {
  const a = l.analise;
  const dias = l.dataLeilao ? Math.ceil((new Date(l.dataLeilao) - Date.now()) / 86400000) : null;
  const tags = [
    `<span class="tag">${esc(CFG.categorias[l.categoria] || l.categoria)}</span>`,
    `<span class="tag">${l.origem === 'receita_federal' ? 'Receita Federal' : l.origem === 'recuperacao_financiamento' ? 'Retomada financiamento' : esc(l.origem)}</span>`,
    `<span class="tag ok">${a.lancePctAvaliacao}% da avaliação</span>`,
    l.parcelamento?.permitido ? `<span class="tag ok" title="${esc(l.parcelamento.condicoes)}">Parcela (${Math.round((l.parcelamento.entradaPct ?? 0.25) * 100)}% + ${l.parcelamento.parcelas}x)</span>` : '',
    dias != null ? `<span class="tag ${dias <= 7 ? 'warn' : ''}">${dias <= 0 ? 'hoje' : `em ${dias} dias`}</span>` : '',
    ...(l.riscos || []).map(r => `<span class="tag bad">${esc(CFG.riscos[r] || r)}</span>`),
    l.fonte === 'demo' ? '<span class="tag warn">DEMO</span>' : '',
  ].join('');
  return `<div class="lote ${l.elegivel ? '' : 'inelegivel'}">
    <div class="topo"><div><b>${esc(l.titulo)}</b><div class="resumo" style="margin:2px 0 0">${esc(l.cidade)}/${esc(l.uf)} · ${esc(l.leiloeiro)}</div></div>
      <div class="score" style="${corScore(a.score)}" title="Nota de oportunidade">${a.score}</div></div>
    <div class="tags">${tags}</div>
    <div class="nums">
      <span>Avaliação</span><b>${brl(l.valorAvaliacao)}</b>
      <span>Lance inicial</span><b>${brl(l.lanceInicial)}</b>
      <span>Custos estimados</span><b>${brl(a.custos)}</b>
      <span>Desembolso inicial</span><b>${brl(a.desembolsoInicial)}</b>
      <span>Revenda estimada</span><b>${brl(a.revendaEstimada)}</b>
      <span>Lucro estimado</span><b class="${a.lucroEstimado >= 0 ? 'pos' : 'neg'}">${brl(a.lucroEstimado)}</b>
      <span>Retorno / ao mês</span><b class="${a.roiPct >= 0 ? 'pos' : 'neg'}">${a.roiPct}% / ${a.roiMensalPct}%</b>
      <span>Giro estimado</span><b>${a.diasGiro} dias</b>
      <span title="Até esse valor ainda sobra o lucro alvo">Lance máx. recomendado</span><b>${brl(a.lanceMaximoRecomendado)}</b>
    </div>
    ${l.elegivel ? '' : `<div class="resumo" style="color:var(--bad)">Fora da regra: ${esc(l.motivos.join('; '))}</div>`}
    ${l.url ? `<a href="${esc(l.url)}" target="_blank" rel="noopener">Ver edital / lote</a>` : ''}
  </div>`;
}

async function carregar() {
  const r = await api(`/api/oportunidades?${filtros()}`);
  $('#resumo').textContent = `${r.total} oportunidade(s) dentro dos filtros · ${r.base} lote(s) na base`;
  $('#grade').innerHTML = r.itens.map(cartao).join('') || '<div class="resumo">Nenhum lote passou na regra. Importe editais ou rode a coleta.</div>';
}

let t;
document.querySelectorAll('.filtros input, .filtros select').forEach(el => el.addEventListener('input', () => { clearTimeout(t); t = setTimeout(carregar, 250); }));
$('#btnBoletim').onclick = () => { location.href = `/api/boletim.csv?${filtros()}`; };

async function carregarInvestidores() {
  const lista = await api('/api/investidores');
  $('#tInvestidores').innerHTML = lista.map(i => {
    const f = i.filtros || {};
    const perfil = [CFG.categorias[f.categoria], f.uf, f.maxLance && `até ${brl(+f.maxLance)}`, f.parcelado === '1' && 'parcelado'].filter(Boolean).join(' · ') || 'qualquer';
    const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
    return `<tr><td>${esc(i.nome)}</td><td>${esc(i.contato)}</td><td>${esc(perfil)}</td>
      <td>${i.matches} · <a href="/api/boletim.csv?${q}">boletim CSV</a></td>
      <td><button data-del="${i.id}" style="background:none;border:0;color:var(--bad);cursor:pointer">remover</button></td></tr>`;
  }).join('');
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { await api(`/api/investidores/${b.dataset.del}`, { method: 'DELETE' }); carregarInvestidores(); });
}

$('#btnInvestidor').onclick = async () => {
  const filtros = { categoria: $('#i-categoria').value, uf: $('#i-uf').value.trim().toUpperCase(), maxLance: $('#i-maxLance').value, parcelado: $('#i-parcelado').checked ? '1' : '' };
  await api('/api/investidores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: $('#i-nome').value, contato: $('#i-contato').value, filtros }) });
  $('#i-nome').value = $('#i-contato').value = '';
  carregarInvestidores();
};

$('#btnColetar').onclick = async () => {
  $('#c-res').textContent = 'Coletando...';
  const r = await api('/api/coletar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ufs: $('#c-ufs').value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) }) });
  $('#c-res').textContent = r.map(x => x.ok ? `${x.fonte}: ${x.lidos} lidos, ${x.inseridos} novos, ${x.atualizados} atualizados` : `${x.fonte}: erro - ${x.erro}`).join(' | ');
  carregar();
};

$('#btnImportar').onclick = async () => {
  const arq = $('#m-arquivo').files[0];
  if (!arq) return ($('#m-res').textContent = 'Escolha um arquivo.');
  const tipo = $('#m-tipo').value;
  const buf = await arq.arrayBuffer();
  let texto = new TextDecoder('utf-8').decode(buf);
  if (texto.includes('�')) texto = new TextDecoder('latin1').decode(buf); // planilhas do Excel/Caixa
  try {
    const r = await api(`/api/importar?tipo=${tipo}&fonte=${encodeURIComponent($('#m-fonte').value || 'planilha')}`, { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: texto });
    $('#m-res').textContent = `${r.lidos} lidos, ${r.inseridos} novos, ${r.atualizados} atualizados (base: ${r.total})`;
    carregar();
  } catch (e) { $('#m-res').textContent = `Erro: ${e.message}`; }
};

async function iniciar() {
  try { await api('/api/me'); } catch { return; }
  $('#login').classList.add('oculto'); $('#app').classList.remove('oculto');
  CFG = await api('/api/config');
  $('#regra').textContent = `Regra: só Receita Federal e retomada de financiamento · lance inicial ≤ ${Math.round(CFG.lanceMaxPct * 100)}% da avaliação`;
  const opts = o => Object.entries(o).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
  $('#f-categoria').innerHTML += opts(CFG.categorias);
  $('#i-categoria').innerHTML += opts(CFG.categorias);
  $('#f-origem').innerHTML += opts({ receita_federal: 'Receita Federal', recuperacao_financiamento: 'Retomada de financiamento' });
  carregar();
}

iniciar();
