const test = require('node:test');
const assert = require('node:assert');
const { elegibilidade, analisar } = require('../src/scoring');
const caixa = require('../src/connectors/caixa');
const planilha = require('../src/connectors/planilha');

const futuro = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
const base = { origem: 'receita_federal', categoria: 'eletronicos', valorAvaliacao: 10000, lanceInicial: 500, dataLeilao: futuro };

test('aceita lance de exatamente 5% da avaliação', () => {
  assert.equal(elegibilidade(base).elegivel, true);
});

test('recusa lance acima de 5%', () => {
  const r = elegibilidade({ ...base, lanceInicial: 501 });
  assert.equal(r.elegivel, false);
  assert.match(r.motivos[0], /5,0|5\.0/);
});

test('recusa origem fora do escopo (ex: judicial)', () => {
  assert.equal(elegibilidade({ ...base, origem: 'judicial' }).elegivel, false);
});

test('recusa leilão já encerrado', () => {
  assert.equal(elegibilidade({ ...base, dataLeilao: '2020-01-01' }).elegivel, false);
});

test('análise calcula custos, lucro e desembolso parcelado', () => {
  const a = analisar({ ...base, parcelamento: { permitido: true, entradaPct: 0.25 } });
  // custos: 5% comissão + 10% eletrônicos sobre 500 + 150 fixo = 225
  assert.equal(a.custos, 225);
  assert.equal(a.capitalTotal, 725);
  assert.equal(a.revendaEstimada, 6000);
  assert.equal(a.lucroEstimado, 5275);
  assert.equal(a.desembolsoInicial, 125 + 225);
  assert.equal(a.descontoPct, 95);
});

test('riscos aumentam custo e prazo', () => {
  const sem = analisar({ ...base, categoria: 'imoveis', valorAvaliacao: 200000, lanceInicial: 10000 });
  const com = analisar({ ...base, categoria: 'imoveis', valorAvaliacao: 200000, lanceInicial: 10000, riscos: ['ocupado'] });
  assert.ok(com.custos > sem.custos);
  assert.equal(com.diasGiro, sem.diasGiro + 180);
});

test('conector Caixa lê a lista e mantém só leilões', () => {
  const csv = [
    ' Lista de Imóveis da Caixa;;;;;;;;;;',
    '',
    ' N° do imóvel;UF;Cidade;Bairro;Endereço;Preço;Valor de avaliação;Desconto;Descrição;Modalidade de venda;Link de acesso',
    '8444400000001;SP;RIBEIRAO PRETO;CENTRO;RUA A, N. 1;12.000,00;240.000,00;95,00;Apartamento, 52.00 de área total, 2 qto(s), Imóvel ocupado.;2º Leilão SFI;https://venda-imoveis.caixa.gov.br/x?hdnimovel=8444400000001',
    '8444400000002;SP;FRANCA;JARDIM;RUA B, N. 2;150.000,00;200.000,00;25,00;Casa, 100.00 de área total;Venda Direta Online;https://x',
  ].join('\n');
  const lotes = caixa.converter(csv);
  assert.equal(lotes.length, 1);
  assert.equal(lotes[0].lanceInicial, 12000);
  assert.equal(lotes[0].valorAvaliacao, 240000);
  assert.deepEqual(lotes[0].riscos, ['ocupado']);
  assert.equal(lotes[0].origem, 'recuperacao_financiamento');
});

test('importação por planilha normaliza categoria, origem e parcelamento', () => {
  const csv = 'id;titulo;categoria;origem;uf;cidade;leiloeiro;valor_avaliacao;lance_inicial;data_leilao;parcelamento;entrada_pct;parcelas;riscos;url\n' +
    'L1;"40 celulares; lacrados";Eletrônicos;Receita;sp;Santos;RFB;48.000,00;2.200,00;2030-01-10;não;;;sem_visitacao;https://x\n' +
    'L2;Argo 2021;carro;financiamento;MG;Contagem;Leiloeiro;62000;3000;2030-01-05;sim;25;30;debitos|sinistro;';
  const [a, b] = planilha.converter(csv, 't');
  assert.equal(a.titulo, '40 celulares; lacrados');
  assert.equal(a.categoria, 'eletronicos');
  assert.equal(a.origem, 'receita_federal');
  assert.equal(a.uf, 'SP');
  assert.equal(a.valorAvaliacao, 48000);
  assert.equal(a.parcelamento.permitido, false);
  assert.equal(b.categoria, 'veiculos');
  assert.equal(b.origem, 'recuperacao_financiamento');
  assert.deepEqual(b.parcelamento, { permitido: true, entradaPct: 0.25, parcelas: 30, condicoes: '' });
  assert.deepEqual(b.riscos, ['debitos', 'sinistro']);
});

test('lance máximo recomendado entrega o lucro alvo de 30%', () => {
  const lote = { ...base, categoria: 'veiculos', valorAvaliacao: 62000, lanceInicial: 3000, riscos: ['debitos'] };
  const { lanceMaximoRecomendado: L } = analisar(lote);
  const a = analisar({ ...lote, lanceInicial: L });
  assert.ok(a.roiPct >= 30 && a.roiPct < 31, `roi ${a.roiPct}`);
});
