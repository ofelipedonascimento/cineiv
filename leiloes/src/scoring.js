const config = require('./config');

const round2 = n => Math.round(n * 100) / 100;

// Diz se o lote entra no radar e, se não entrar, por quê.
function elegibilidade(lote, cfg = config) {
  const motivos = [];
  if (!cfg.origensPermitidas[lote.origem]) motivos.push('origem fora do escopo');
  if (!(lote.valorAvaliacao > 0)) motivos.push('sem valor de avaliação');
  if (!(lote.lanceInicial > 0)) motivos.push('sem lance inicial');
  const pct = lote.valorAvaliacao > 0 ? lote.lanceInicial / lote.valorAvaliacao : Infinity;
  if (pct > cfg.lanceMaxPct) {
    motivos.push(`lance inicial em ${(pct * 100).toFixed(1)}% da avaliação (máx. ${(cfg.lanceMaxPct * 100).toFixed(0)}%)`);
  }
  if (lote.dataLeilao && new Date(lote.dataLeilao) < new Date(new Date().toDateString())) {
    motivos.push('leilão já encerrado');
  }
  return { elegivel: motivos.length === 0, motivos };
}

// Estima custo total, revenda, lucro, ROI e prazo de giro.
function analisar(lote, cfg = config) {
  const p = cfg.premissas[lote.categoria] || cfg.premissas.outros;
  const lance = lote.lanceInicial;
  const aval = lote.valorAvaliacao;

  let custoRiscos = 0;
  let dias = p.diasGiro;
  for (const r of lote.riscos || []) {
    const risco = cfg.riscos[r];
    if (!risco) continue;
    custoRiscos += aval * risco.custoPctAvaliacao;
    dias += risco.diasExtra;
  }
  const custoPorReal = cfg.comissaoLeiloeiroPct + p.custoPct;
  const custos = lance * custoPorReal + p.custoFixo + custoRiscos;

  const capital = lance + custos;
  const revenda = aval * p.revendaPct;
  const lucro = revenda - capital;
  const roi = capital > 0 ? lucro / capital : 0;
  const roiMensal = roi / Math.max(dias / 30, 0.5);
  // Até onde subir o lance e ainda ter o lucro alvo:
  // revenda = (1 + alvo) * (L * (1 + custoPorReal) + fixos)
  const lanceMax = (revenda / (1 + cfg.lucroAlvoPct) - p.custoFixo - custoRiscos) / (1 + custoPorReal);

  // Parcelamento: quanto sai do bolso na arrematação.
  const parc = lote.parcelamento || {};
  const entrada = parc.permitido ? lance * (parc.entradaPct ?? 0.25) + custos : capital;

  return {
    descontoPct: round2((1 - lance / aval) * 100),
    lancePctAvaliacao: round2((lance / aval) * 100),
    custos: round2(custos),
    capitalTotal: round2(capital),
    desembolsoInicial: round2(entrada),
    revendaEstimada: round2(revenda),
    lucroEstimado: round2(lucro),
    roiPct: round2(roi * 100),
    roiMensalPct: round2(roiMensal * 100),
    diasGiro: dias,
    lanceMaximoRecomendado: Math.max(0, Math.floor(lanceMax / 100) * 100),
    score: score({ roiMensal, desconto: 1 - lance / aval, parcelado: !!parc.permitido, lote }),
  };
}

// Nota de 0 a 100. Pesa giro rápido (ROI ao mês), desconto, parcelamento,
// ticket baixo (mais gente consegue entrar) e urgência do leilão.
function score({ roiMensal, desconto, parcelado, lote }) {
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  let s = 0;
  s += clamp(roiMensal / 1.0, 0, 1) * 45;      // 100% ao mês ou mais = nota cheia
  s += clamp(desconto, 0, 1) * 25;
  s += parcelado ? 10 : 0;
  s += lote.lanceInicial <= 5000 ? 10 : lote.lanceInicial <= 30000 ? 6 : lote.lanceInicial <= 100000 ? 3 : 0;
  if (lote.dataLeilao) {
    const dias = (new Date(lote.dataLeilao) - Date.now()) / 86400000;
    s += dias >= 0 && dias <= 7 ? 10 : dias <= 30 ? 5 : 0;
  }
  s -= (lote.riscos || []).length * 4;
  return Math.round(clamp(s, 0, 100));
}

function avaliar(lote, cfg = config) {
  return { ...lote, ...elegibilidade(lote, cfg), analise: analisar(lote, cfg) };
}

module.exports = { elegibilidade, analisar, avaliar, score };
