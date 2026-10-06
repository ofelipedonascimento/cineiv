// Regras do negócio. Tudo que define "o que é oportunidade" fica aqui.
module.exports = {
  // Só entram leilões dessas origens.
  origensPermitidas: {
    receita_federal: 'Receita Federal (mercadorias apreendidas)',
    recuperacao_financiamento: 'Recuperação de financiamento (alienação fiduciária / retomada bancária)',
  },

  // Lance inicial máximo, em fração do valor de avaliação (0.05 = 5%).
  // Pode ser trocado pela variável de ambiente LANCE_MAX_PCT.
  lanceMaxPct: Number(process.env.LANCE_MAX_PCT || 0.05),

  categorias: {
    imoveis: 'Imóveis',
    veiculos: 'Veículos',
    eletronicos: 'Eletroeletrônicos',
    outros: 'Outros',
  },

  // Premissas de custo e revenda por categoria.
  // custoPct: custos sobre o lance (ITBI, registro, transferência, frete, impostos...)
  // custoFixo: custo fixo médio em R$ (pátio, vistoria, cartório, transporte...)
  // revendaPct: por quanto se revende, em fração da avaliação, para girar rápido
  // diasGiro: prazo médio entre arrematar e receber da revenda
  premissas: {
    imoveis:     { custoPct: 0.05, custoFixo: 3000, revendaPct: 0.80, diasGiro: 120 },
    veiculos:    { custoPct: 0.03, custoFixo: 1500, revendaPct: 0.85, diasGiro: 30 },
    eletronicos: { custoPct: 0.10, custoFixo: 150,  revendaPct: 0.60, diasGiro: 15 },
    outros:      { custoPct: 0.10, custoFixo: 300,  revendaPct: 0.50, diasGiro: 45 },
  },

  comissaoLeiloeiroPct: 0.05, // padrão de mercado sobre o valor arrematado

  // Lucro mínimo desejado sobre o capital: define o lance máximo recomendado.
  lucroAlvoPct: Number(process.env.LUCRO_ALVO_PCT || 0.30),

  // Riscos que pesam no prazo e no custo.
  riscos: {
    ocupado:       { diasExtra: 180, custoPctAvaliacao: 0.05, label: 'Imóvel ocupado (desocupação)' },
    debitos:       { diasExtra: 0,   custoPctAvaliacao: 0.03, label: 'Débitos (IPTU/condomínio/IPVA) por conta do arrematante' },
    sem_visitacao: { diasExtra: 0,   custoPctAvaliacao: 0.02, label: 'Sem visitação' },
    sinistro:      { diasExtra: 15,  custoPctAvaliacao: 0.10, label: 'Veículo sinistrado/recuperado' },
  },
};
