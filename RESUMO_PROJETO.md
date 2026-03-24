# 🎬 Cine IV Studio — Sistema de Gestão Interno
## Documentação Completa do Projeto

---

## 📌 Visão Geral

Sistema de gestão interna desenvolvido para a **Cine IV Studio**, produtora audiovisual de Batatais-SP.
Construído para uso local em rede LAN, com arquitetura preparada para evolução SaaS.

**Stack:** Node.js + Express + SQLite + HTML/CSS/JS puro + PWA

---

## 🏗️ Arquitetura

```
cineiv/
├── server.js                  ← Servidor principal Express
├── database/
│   ├── db.js                  ← Schema + migrations + seed
│   └── pricing.js             ← Engine de precificação
├── routes/
│   ├── auth.js                ← Login/logout/sessão
│   ├── users.js               ← Usuários + perfil + WhatsApp
│   ├── companies.js           ← Empresas (multi-tenant)
│   ├── events.js              ← Agenda
│   ├── budgets.js             ← Orçamentos
│   ├── clients.js             ← Clientes
│   ├── projects.js            ← Projetos (Kanban)
│   ├── followups.js           ← Followups de clientes
│   └── alerts.js              ← Alertas WhatsApp
├── services/
│   ├── budgetService.js       ← Stats + sugestões de orçamento
│   ├── clientService.js       ← Stats de clientes
│   ├── projectService.js      ← XP + ranking + bloqueadores
│   ├── alertService.js        ← Motor de alertas WhatsApp
│   └── whatsappService.js     ← Integração Evolution API
├── public/
│   ├── index.html             ← SPA principal
│   ├── tv.html                ← Dashboard TV
│   ├── css/main.css
│   └── js/
│       ├── app.js             ← Core + navegação + agenda
│       ├── budgets.js         ← Módulo orçamentos
│       ├── clients.js         ← Módulo clientes + followups
│       ├── projects.js        ← Módulo projetos (Kanban)
│       └── alerts.js          ← WhatsApp status + configuração
└── assets/
    ├── logo.png               ← Logo branca (fundo escuro)
    ├── logo-dark.png          ← Logo preta (propostas/fundo claro)
    └── icons/                 ← Ícones PWA (192, 512, apple)
```

---

## 🗄️ Banco de Dados

### Tabelas
| Tabela | Descrição |
|--------|-----------|
| `companies` | Empresas (multi-tenant) |
| `users` | Usuários com WhatsApp |
| `events` | Eventos da agenda |
| `budgets` | Orçamentos |
| `clients` | Clientes com followup |
| `projects` | Projetos Kanban |
| `followups` | Histórico de contatos |
| `xp_log` | Gamificação — pontos XP |
| `notifications` | Histórico de alertas enviados |

### Multi-Tenant
Todas as tabelas têm `company_id`.
Todas as queries filtram por `WHERE company_id = ?`.
Cine IV Studio = empresa ID 1, slug `cineiv`, plano `pro`.

---

## 👤 Usuários

| Login | Senha | Papel | Cor | WhatsApp |
|-------|-------|-------|-----|----------|
| felipe | felipecineiv | admin | 🔴 #E63946 | 5516992914561 |
| nico | nicocineiv | member | 🔵 #2196F3 | 5492995107851 |
| ricardo | ricardocineiv | member | 🟢 #4CAF50 | 5516991684869 |
| janderson | jandersoncineiv | member | 🟡 #E8A020 | 5516991698557 |

---

## 📅 Módulo Agenda

- Calendário mensal com drag & drop
- Agenda diária com timeline
- Responsáveis múltiplos (checkboxes)
- Opção "Equipe Cine IV (todos)"
- Filtros por tipo e responsável
- Integração com Projetos (aprovar orçamento → cria evento)

---

## 💰 Módulo Orçamentos

### Engine de Precificação
Dados reais da Cine IV:
- **Equipamentos:** Sony FX30, A7RII, A7SII, RX10III, Insta360 X4, drones DJI/Autel/Avata, workstations, Mac
- **Veículos:** Tiggo 5X Pro (10.5km/l), Mégane 2009 (11.2km/l), Clio 2005 (12.8km/l)
- **Diárias:** R$1.200 sem drone, R$1.800 com drone, +R$700 FPV
- **Edição:** R$500/h + R$300 colorização
- **Pacotes casamento:** Gold R$10.897, Premium R$8.694, Classic R$6.279
- **Pacotes marketing:** Evoluir R$3.500, Desenvolver R$5.700, Full R$6.800, Full+Tráfego R$9.300

### Funcionalidades
- Barra deslizante de margem de lucro
- Reserva automática 10% para equipamentos
- Depreciação calculada por uso
- Deslocamento automático por km e pedágios
- Sugestão automática baseada em histórico do cliente
- Botões rápidos: Enviado / Aprovar→Agenda / Recusar / Duplicar
- Proposta profissional para cliente (PDF)
- Envio pelo WhatsApp com mensagem pronta

---

## 👥 Módulo Clientes

- Cadastro PF/PJ
- Pacotes: Evoluir / Desenvolver / Full / Full+Tráfego / Casamentos
- WhatsApp, aniversário, status do relacionamento
- Status: Ativo / Em negociação / Frio / Pausado / Perdido
- Checklist de entregas mensais com reset automático
- **Sistema de Followup:**
  - Tipos: Ligação, WhatsApp, Email, Reunião, Visita
  - Agendar com data, horário e responsável
  - Ao concluir: registra resultado + agenda próximo automaticamente
  - Histórico completo por cliente

---

## 📋 Módulo Projetos (Kanban)

### Colunas
A fazer → Em andamento → Revisão → Entregue

### Funcionalidades
- Drag & drop entre colunas
- Prioridade: Alta / Média / Baixa
- Destaque visual: 🔴 atrasado / 🟡 vence amanhã / 🟢 ok
- Vinculação com cliente e orçamento

### Gamificação
| Ação | XP |
|------|----|
| Entregar no prazo | +20 xp |
| Revisão aprovada | +10 xp |
| Entregar atrasado | +5 xp |
| Criar projeto | +2 xp |

- Ranking mensal com medalhas 🥇🥈🥉
- Sequência de entregas (streak — bolinhas coloridas)

### Sidebar
- "Quem está travando" — bloqueadores em tempo real
- Projetos parados há mais de 2 dias destacados

---

## 📱 WhatsApp — Alertas Automáticos

### Infraestrutura
- **Evolution API v1.7.4** rodando via Docker
- Instância: `cineiv`
- API Key: `cineiv-evolution-key`
- Porta: `8080`

### 9 Tipos de Alerta
| Alerta | Gatilho |
|--------|---------|
| 🔴 Projeto atrasado | Due date passou |
| 🟡 Prazo em 24h | Vence amanhã |
| ⚠️ Projeto parado | Sem atualização +2 dias |
| 🎬 Projeto iniciado | Status → Em andamento |
| ✅ Projeto entregue | Status → Entregue |
| 💰 Orçamento aprovado | Status → Aprovado |
| 📞 Followup do dia | Data do followup = hoje |
| 🎂 Aniversário do cliente | Data de aniversário |
| 🌅 Resumo diário | Todo dia às 8h |

**Anti-spam:** cada alerta enviado no máximo 1x a cada 12h por registro.

### Iniciar Evolution API
```bash
docker run -d --name evolution-api -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=cineiv-evolution-key \
  -e DATABASE_ENABLED=false \
  atendai/evolution-api:v1.7.4
```

---

## 📺 Dashboard TV

### Layout 3 Faixas
**Faixa 1 — Barra KPI:**
Eventos no mês · Hoje · Projetos entregues · Atrasados · Orçamentos · Clientes · MRR

**Faixa 2 — 4 Painéis:**
- Projetos: status kanban + atrasados
- Clientes: progresso de entregas + quem está travando
- Agenda: hoje + próximos 7 dias
- Ranking XP + orçamentos

**Faixa 3 — Rodapé:**
- Mapa de calor do mês
- Carga por membro da equipe

### URLs
```
http://192.168.0.22:3000/tv          ← padrão
http://192.168.0.22:3000/tv/cineiv   ← por slug (sem login)
```

### Recursos
- Olhinho para ocultar valores financeiros (MRR)
- localStorage — lembra estado após reload
- Polling a cada 15s
- Multi-empresa por slug (SaaS-ready)

---

## 🚀 Arquitetura SaaS

### O que está pronto
- `company_id` em todas as tabelas
- Queries filtradas por empresa
- TV por slug: `/tv/:slug`
- Rota `/api/companies` para gerenciar empresas
- Planos: `free` / `pro` / `enterprise`
- Sessão guarda `company_id` e dados da empresa

### Para adicionar nova empresa
```
POST /api/companies
{ "name": "Nova Produtora", "slug": "nova-produtora", "plan": "pro" }
```

### Roadmap de Evolução
| Fase | Ação |
|------|------|
| 1 | Port forwarding + No-IP DDNS (já configurado: cineiv.ddns.net) |
| 2 | HTTPS + domínio próprio (VPS + Nginx + Let's Encrypt) |
| 3 | Painel admin multi-empresa |
| 4 | Sistema de pagamento (Stripe/PagSeguro) |
| 5 | Migrar SQLite → PostgreSQL |

---

## 📲 PWA — Progressive Web App

Instalável em:
- ✅ Windows (Chrome/Edge) — ícone na área de trabalho
- ✅ Android (Chrome) — ícone na tela inicial
- ✅ iOS (Safari) — ícone na tela inicial

---

## 🌐 Acesso em Rede

```
Sistema:   http://192.168.0.22:3000
TV:        http://192.168.0.22:3000/tv
TV slug:   http://192.168.0.22:3000/tv/cineiv
DDNS:      http://cineiv.ddns.net:3000 (requer port forwarding)
```

---

## ⚡ Como Rodar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar Evolution API (WhatsApp)
docker run -d --name evolution-api -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=cineiv-evolution-key \
  -e DATABASE_ENABLED=false \
  atendai/evolution-api:v1.7.4

# 3. Iniciar sistema
node server.js
```

**Banco de dados** é criado automaticamente no primeiro start.
