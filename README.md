# AmazHealth Frontend

Frontend React + Vite do AmazHealth.

## Visão geral
- App web para o fluxo hospitalar.
- Consome API do backend via `VITE_API_URL` (default no código: `http://localhost:8080/api/v1`).
- No Docker de desenvolvimento, o serviço `web-dev` já injeta `VITE_API_URL=http://localhost:8080/api/v1`.

> Estado atual de integração: autenticação (`/auth/*`) já usa backend; vários módulos de negócio ainda usam Supabase diretamente.

## Pré-requisitos
- Docker + Docker Compose (recomendado para fluxo completo).
- Node.js 20+ e npm (para rodar fora de container).

## Fluxo recomendado (desenvolvimento com backend + frontend)
Use os dois repositórios juntos sem conflito:

1. Suba backend + banco no repositório de backend:
```bash
docker compose -f AmazHealth-backend/docker/docker-compose.yml up --build
```

2. Em outro terminal, suba **apenas** o frontend dev:
```bash
docker compose -f AmazHealth/docker-compose.yml --profile dev up web-dev
```

3. Acesse:
- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8080/actuator/health`

## Docker (neste repositório)

### Perfil `dev` (frontend com hot reload)
```bash
docker compose --profile dev up web-dev
```
- Porta publicada: `5173`.
- Não suba o `db` daqui se já estiver usando o DB do compose do backend.

### Perfil `prod` (build + NGINX)
```bash
docker compose --profile prod up --build web
```
- Frontend servido em `http://localhost:8081`.

### Perfil `backend` (apenas banco local deste compose)
```bash
docker compose --profile backend up db
```
- Use só quando **não** estiver usando o banco do compose do backend.

## Execução local (sem Docker)
```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

### Build e qualidade
```bash
npm run lint
npm run build
```

## Variáveis de ambiente
Exemplo local (`.env.local`):
```env
VITE_API_URL=http://localhost:8080/api/v1
```

## Troubleshooting
- `EADDRINUSE: 8080`: backend já ocupa `8080`; rode o frontend local em `5173` (como acima).
- Conflito em `5432`: não suba os dois serviços `db` ao mesmo tempo (compose do frontend e compose do backend).
- Frontend sobe mas login falha: confirme backend ativo em `http://localhost:8080/actuator/health` e `VITE_API_URL` correto.
- CORS bloqueado: o backend permite `http://localhost:5173`, `http://localhost:3000` e `http://localhost:8081`.

## Documentação complementar
- Guia unificado de inicialização dos dois composes (na raiz do workspace): `../docs/INICIALIZACAO_COMPOSES.md`
