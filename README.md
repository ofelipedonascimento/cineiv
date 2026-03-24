# Cine IV Studio — Sistema de Gestão SaaS-Ready

## Como rodar
```bash
npm install
node server.js
```

## Acessos
- Sistema: http://192.168.0.22:3000
- Dashboard TV: http://192.168.0.22:3000/tv
- Dashboard TV (por slug): http://192.168.0.22:3000/tv/cineiv

## Logins
| Usuário    | Senha           | Papel |
|------------|-----------------|-------|
| felipe     | felipecineiv    | admin |
| nico       | nicocineiv      | member |
| ricardo    | ricardocineiv   | member |
| janderson  | jandersoncineiv | member |

## Arquitetura Multi-Tenant
Cada tabela tem `company_id`. Todas as queries filtram por empresa.
A Cine IV Studio = empresa ID 1, plano `pro`.

Para adicionar nova empresa (via API):
```
POST /api/companies
{ "name": "Nova Empresa", "slug": "nova-empresa", "plan": "free" }
```

---

## 🚀 Roadmap SaaS — Como evoluir

### Fase 1 — Acesso via Internet (hoje possível)
1. **Port forwarding** no roteador (porta 3000 → 192.168.0.22)
2. **No-IP DDNS**: já configurado em `cineiv.ddns.net`
3. URL final: `http://cineiv.ddns.net:3000`

### Fase 2 — HTTPS + Domínio próprio
```
cineiv.com.br → VPS (Nginx reverse proxy) → sistema
```
- Registrar domínio (~R$40/ano no Registro.br)
- VPS básica: DigitalOcean/Hostinger (~R$25/mês)
- SSL grátis: Let's Encrypt (Certbot)
- Nginx como proxy reverso

### Fase 3 — Multi-empresa real (base já está aqui)
- Cada empresa tem seu slug: `/tv/empresa-x`
- Painel admin para criar empresas
- Planos: `free` (limitado), `pro` (completo), `enterprise` (personalizado)

### Fase 4 — Sistema de pagamento
- Stripe ou PagSeguro para cobrar mensalidade
- Webhook atualiza `plan` na tabela `companies`
- Controle de acesso por plano já preparado no código

### Fase 5 — Escala
- Migrar SQLite → PostgreSQL (quando tiver 10+ empresas)
- Deploy em Railway, Render ou AWS
- Separar frontend (Vercel) do backend

---

## Stack
- **Backend**: Node.js + Express + SQLite
- **Frontend**: HTML + CSS + JS puro + Chart.js
- **PWA**: manifest.json + Service Worker
- **Auth**: express-session + bcryptjs
