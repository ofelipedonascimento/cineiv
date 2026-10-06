# Radar de Leilões

Encontra e ranqueia oportunidades de giro rápido em leilões no Brasil, para revender a informação a investidores.

**Regra fixa:**
- Só entram leilões da **Receita Federal** (mercadorias apreendidas) ou de **recuperação de financiamento** (alienação fiduciária, retomada bancária).
- O **lance inicial** precisa ser de **no máximo 5% do valor de avaliação**.
- Categorias: imóveis, veículos, eletroeletrônicos.

## Como rodar

```bash
cd leiloes
npm install
npm run seed                                # opcional: carrega 9 lotes FICTÍCIOS de demonstração
ADMIN_PASSWORD=sua-senha npm start          # abre em http://localhost:3100
```

Variáveis opcionais: `PORT` (3100), `LANCE_MAX_PCT` (0.05), `LUCRO_ALVO_PCT` (0.30), `DATA_DIR` (./data).

## O que cada lote mostra

| Campo | Como é calculado |
|---|---|
| Nota (0 a 100) | retorno ao mês (45 pts), desconto (25), aceita parcelamento (10), ticket baixo (10), leilão próximo (10), menos 4 por risco |
| Custos estimados | comissão do leiloeiro 5% + custos da categoria (ITBI/registro, transferência, frete) + custos fixos + riscos |
| Desembolso inicial | se parcela: entrada + custos; senão: tudo à vista |
| Revenda estimada | % da avaliação para vender rápido (imóvel 80%, veículo 85%, eletrônico 60%) |
| Retorno ao mês | retorno total dividido pelo prazo de giro |
| **Lance máx. recomendado** | até quanto subir o lance e ainda ter 30% de lucro (o lance inicial quase nunca é o preço final) |

Todas as premissas ficam em `src/config.js`. Ajuste com a sua experiência real.

## De onde vêm os dados

| Fonte | Como entra |
|---|---|
| **Caixa** (imóveis retomados, Lei 9.514) | Automático: botão "Coletar agora" ou `UFS=SP,MG npm run coletar`. Lê `venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_<UF>.csv` e mantém só as modalidades de leilão. Também aceita o CSV baixado manualmente. |
| **Receita Federal** (SLE) | Importação por planilha CSV a partir dos editais em `www25.receita.fazenda.gov.br/sle-sociedade/portal`. |
| **Leiloeiros de veículos/eletrônicos de retomada** | Importação por planilha CSV. |

Formato da planilha (separador `;` ou `,`):

```
id;titulo;categoria;origem;uf;cidade;leiloeiro;valor_avaliacao;lance_inicial;data_leilao;parcelamento;entrada_pct;parcelas;riscos;url;descricao
L12;40 smartphones lacrados;eletronicos;receita;SP;Santos;RFB ALF Santos;48.000,00;2.200,00;2026-11-10;nao;;;sem_visitacao;https://...;
```

Riscos aceitos: `ocupado`, `debitos`, `sem_visitacao`, `sinistro`.

## Investidores

A aba "Investidores" guarda o perfil de cada cliente (categoria, UF, ticket máximo, só parcelados) e mostra quantas oportunidades batem com ele agora, com um boletim CSV filtrado para enviar.

## Testes

```bash
npm test
```
