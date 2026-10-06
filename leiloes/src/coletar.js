// Coleta das fontes automáticas. Uso:
//   node src/coletar.js                 -> Caixa, UFs da variável UFS (padrão SP)
//   UFS=SP,MG,RJ node src/coletar.js
const caixa = require('./connectors/caixa');
const store = require('./store');

async function coletarTudo(ufs = (process.env.UFS || 'SP').split(',').map(s => s.trim().toUpperCase())) {
  const relatorio = [];
  try {
    const lotes = await caixa.coletar(ufs);
    relatorio.push({ fonte: 'caixa', ok: true, lidos: lotes.length, ...store.upsertLotes(lotes) });
  } catch (e) {
    relatorio.push({ fonte: 'caixa', ok: false, erro: e.message });
  }
  return relatorio;
}

if (require.main === module) {
  coletarTudo().then(r => console.log(JSON.stringify(r, null, 2)));
}

module.exports = { coletarTudo };
