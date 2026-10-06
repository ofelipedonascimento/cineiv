// Importação por planilha (CSV). Serve para:
//  - lotes de editais da Receita Federal (SLE: https://www25.receita.fazenda.gov.br/sle-sociedade/portal)
//  - lotes de leiloeiros de veículos/eletrônicos de retomada bancária
// Colunas aceitas (cabeçalho, sem diferenciar acento/maiúscula):
//  id, titulo, categoria, origem, uf, cidade, leiloeiro, valor_avaliacao, lance_inicial,
//  data_leilao (AAAA-MM-DD), parcelamento (sim/nao), entrada_pct, parcelas, riscos (separados por |), url, descricao
const { parseCSV, numeroBR, paraObjetos } = require('./csv');

const CATEGORIAS = { imovel: 'imoveis', imoveis: 'imoveis', veiculo: 'veiculos', veiculos: 'veiculos', carro: 'veiculos', moto: 'veiculos', eletronico: 'eletronicos', eletronicos: 'eletronicos', eletroeletronicos: 'eletronicos' };
const ORIGENS = { receita: 'receita_federal', receita_federal: 'receita_federal', rfb: 'receita_federal', financiamento: 'recuperacao_financiamento', recuperacao_financiamento: 'recuperacao_financiamento', alienacao_fiduciaria: 'recuperacao_financiamento', banco: 'recuperacao_financiamento' };

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, '_');

function converter(textoCSV, fonte = 'planilha') {
  return paraObjetos(parseCSV(textoCSV)).map((r, i) => {
    const parcela = /^(s|sim|true|1)/i.test(r.parcelamento || '');
    const pct = numeroBR(r.entrada_pct);
    return {
      fonte,
      idExterno: r.id || `${fonte}-${i + 1}`,
      titulo: r.titulo,
      descricao: r.descricao || '',
      categoria: CATEGORIAS[norm(r.categoria)] || 'outros',
      origem: ORIGENS[norm(r.origem)] || norm(r.origem),
      uf: (r.uf || '').toUpperCase(),
      cidade: r.cidade,
      leiloeiro: r.leiloeiro,
      valorAvaliacao: numeroBR(r.valor_avaliacao),
      lanceInicial: numeroBR(r.lance_inicial),
      dataLeilao: r.data_leilao || null,
      parcelamento: parcela
        ? { permitido: true, entradaPct: Number.isFinite(pct) ? (pct > 1 ? pct / 100 : pct) : 0.25, parcelas: Number(r.parcelas) || 30, condicoes: r.condicoes || '' }
        : { permitido: false },
      riscos: (r.riscos || '').split('|').map(norm).filter(Boolean),
      url: r.url,
    };
  }).filter(l => l.titulo);
}

module.exports = { converter };
