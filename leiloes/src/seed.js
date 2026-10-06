// Dados de DEMONSTRAÇÃO (fictícios) para ver o sistema funcionando.
// Não são leilões reais. Rode: npm run seed
const store = require('./store');

const em = dias => new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);

const demo = [
  { idExterno: 'd1', titulo: 'Lote 12: 40 smartphones Android lacrados', categoria: 'eletronicos', origem: 'receita_federal', uf: 'SP', cidade: 'Santos', leiloeiro: 'Receita Federal - ALF Santos', valorAvaliacao: 48000, lanceInicial: 2200, dataLeilao: em(5), parcelamento: { permitido: false }, riscos: [] },
  { idExterno: 'd2', titulo: 'Lote 3: 120 fones bluetooth + 60 smartwatches', categoria: 'eletronicos', origem: 'receita_federal', uf: 'PR', cidade: 'Foz do Iguaçu', leiloeiro: 'Receita Federal - DRF Foz', valorAvaliacao: 26000, lanceInicial: 1100, dataLeilao: em(9), parcelamento: { permitido: false }, riscos: ['sem_visitacao'] },
  { idExterno: 'd3', titulo: 'Lote 7: 15 notebooks i5 usados', categoria: 'eletronicos', origem: 'receita_federal', uf: 'SP', cidade: 'Guarulhos', leiloeiro: 'Receita Federal - ALF GRU', valorAvaliacao: 30000, lanceInicial: 4500, dataLeilao: em(12), parcelamento: { permitido: false }, riscos: [] },
  { idExterno: 'd4', titulo: 'Fiat Argo 2021 (retomada de financiamento)', categoria: 'veiculos', origem: 'recuperacao_financiamento', uf: 'MG', cidade: 'Contagem', leiloeiro: 'Leiloeiro Oficial (exemplo)', valorAvaliacao: 62000, lanceInicial: 3000, dataLeilao: em(3), parcelamento: { permitido: true, entradaPct: 0.25, parcelas: 30, condicoes: '25% de entrada + 30x (art. 895 CPC)' }, riscos: ['debitos'] },
  { idExterno: 'd5', titulo: 'Honda CG 160 2022 (retomada)', categoria: 'veiculos', origem: 'recuperacao_financiamento', uf: 'GO', cidade: 'Goiânia', leiloeiro: 'Leiloeiro Oficial (exemplo)', valorAvaliacao: 14500, lanceInicial: 700, dataLeilao: em(6), parcelamento: { permitido: false }, riscos: [] },
  { idExterno: 'd6', titulo: 'Toyota Corolla 2019 (recuperado de sinistro)', categoria: 'veiculos', origem: 'recuperacao_financiamento', uf: 'SP', cidade: 'Campinas', leiloeiro: 'Leiloeiro Oficial (exemplo)', valorAvaliacao: 98000, lanceInicial: 39000, dataLeilao: em(8), parcelamento: { permitido: false }, riscos: ['sinistro'] },
  { idExterno: 'd7', titulo: 'Apartamento 2 dorm. 52m² - 2º leilão', categoria: 'imoveis', origem: 'recuperacao_financiamento', uf: 'SP', cidade: 'Ribeirão Preto', leiloeiro: 'Banco (exemplo) - Lei 9.514', valorAvaliacao: 240000, lanceInicial: 11500, dataLeilao: em(14), parcelamento: { permitido: true, entradaPct: 0.25, parcelas: 30, condicoes: '25% de entrada + 30 parcelas corrigidas' }, riscos: ['ocupado'] },
  { idExterno: 'd8', titulo: 'Casa 3 dorm. 150m² - 2º leilão', categoria: 'imoveis', origem: 'recuperacao_financiamento', uf: 'SP', cidade: 'Batatais', leiloeiro: 'Banco (exemplo) - Lei 9.514', valorAvaliacao: 380000, lanceInicial: 171000, dataLeilao: em(20), parcelamento: { permitido: true, entradaPct: 0.20, parcelas: 360, condicoes: 'Aceita financiamento' }, riscos: [] },
  { idExterno: 'd9', titulo: 'Terreno 300m² - leilão judicial', categoria: 'imoveis', origem: 'judicial', uf: 'SP', cidade: 'Franca', leiloeiro: 'Leilão judicial (exemplo)', valorAvaliacao: 120000, lanceInicial: 5000, dataLeilao: em(10), parcelamento: { permitido: true, entradaPct: 0.25, parcelas: 30 }, riscos: [] },
].map(l => ({ ...l, fonte: 'demo', descricao: 'DADO DE DEMONSTRAÇÃO - não é um leilão real.', url: '' }));

if (require.main === module) {
  console.log(store.upsertLotes(demo));
}

module.exports = { demo };
