// Conector Caixa: imóveis retomados de financiamento (Lei 9.514 / SFI).
// A Caixa publica uma lista por UF em CSV:
//   https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_<UF>.csv
// Só aproveitamos as modalidades de LEILÃO (venda direta e licitação ficam fora).
const { parseCSV, numeroBR, paraObjetos } = require('./csv');

const URL_LISTA = uf => `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_${uf}.csv`;

function converter(textoCSV) {
  const linhas = parseCSV(textoCSV, ';');
  const iCab = linhas.findIndex(l => l.some(c => /im[oó]vel/i.test(c)) && l.some(c => /^\s*UF\s*$/i.test(c)));
  if (iCab < 0) throw new Error('Cabeçalho da lista da Caixa não encontrado');

  return paraObjetos(linhas, iCab)
    .filter(r => /leil[aã]o/i.test(r.modalidade_de_venda || ''))
    .map(r => {
      const desc = r.descricao || '';
      const riscos = [];
      if (/ocupad/i.test(desc)) riscos.push('ocupado');
      const financia = /sim/i.test(r.financiamento || '') || /financiamento/i.test(desc);
      return {
        fonte: 'caixa',
        idExterno: (r.n_do_imovel || r.no_do_imovel || r.numero_do_imovel || '').replace(/\D/g, ''),
        origem: 'recuperacao_financiamento',
        categoria: 'imoveis',
        titulo: `${desc.split(',')[0] || 'Imóvel'} - ${r.bairro}, ${r.cidade}/${r.uf}`.trim(),
        descricao: desc,
        uf: r.uf,
        cidade: r.cidade,
        endereco: r.endereco,
        leiloeiro: 'Caixa Econômica Federal',
        modalidade: r.modalidade_de_venda,
        valorAvaliacao: numeroBR(r.valor_de_avaliacao),
        lanceInicial: numeroBR(r.preco),
        dataLeilao: null, // a lista não traz data; vem do edital
        parcelamento: financia ? { permitido: true, entradaPct: 0.20, parcelas: 420, condicoes: 'Aceita financiamento habitacional/FGTS conforme edital' } : { permitido: false },
        riscos,
        url: r.link_de_acesso,
      };
    })
    .filter(l => l.idExterno && l.valorAvaliacao > 0);
}

async function coletar(ufs = ['SP']) {
  const lotes = [];
  for (const uf of ufs) {
    const resp = await fetch(URL_LISTA(uf), { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!resp.ok) throw new Error(`Caixa ${uf}: HTTP ${resp.status}`);
    const texto = new TextDecoder('latin1').decode(await resp.arrayBuffer());
    lotes.push(...converter(texto));
  }
  return lotes;
}

module.exports = { converter, coletar, URL_LISTA };
