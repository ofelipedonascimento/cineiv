# 📱 Configuração WhatsApp — Cine IV Studio

## Pré-requisito: Docker
Instale o Docker Desktop: https://www.docker.com/products/docker-desktop

## Passo 1 — Iniciar Evolution API
```bash
npm run evolution
```
Aguarde ~30 segundos. Acesse http://localhost:8080 para confirmar.

## Passo 2 — Parear o WhatsApp
1. Acesse o sistema: http://192.168.0.22:3000
2. Clique no badge **"○ WhatsApp"** no cabeçalho
3. Escaneie o QR Code com o WhatsApp do celular
   - WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho

## Passo 3 — Cadastrar números da equipe
Acesse o perfil de cada usuário no sistema e preencha o campo **WhatsApp** no formato:
```
5516999998888  (55 + DDD + número)
```

## Alertas automáticos
Os alertas rodam automaticamente a cada hora:
- 🔴 Projeto atrasado → avisa o responsável
- 🟡 Prazo em 24h → avisa o responsável
- ⚠️ Projeto parado +2 dias → cobra o responsável
- ✅ Projeto entregue → parabéns ao responsável
- 💰 Orçamento aprovado → avisa quem criou
- 🌅 Resumo diário → todo dia às 8h para toda a equipe

## Disparar alertas manualmente
No painel de alertas do sistema, clique em **"Disparar alertas agora"**
ou acesse: `POST /api/alerts/check/atrasados`

## Variáveis de ambiente (opcional)
Crie um arquivo `.env` na raiz do projeto:
```
EVOLUTION_URL=http://localhost:8080
EVOLUTION_KEY=cineiv-evolution-key
EVOLUTION_INSTANCE=cineiv
```
