# AmazHealth (Frontend)

Aplicacao web do AmazHealth (HIS/Sistema Hospitalar), implementada em React + Vite para recepcao, triagem, atendimento, prescricoes, farmacia e gestao operacional.

## Stack

- React 18
- Vite 5
- TypeScript
- Tailwind CSS + shadcn/ui
- React Router
- React Query
- Axios
- Playwright para E2E

## Pre-requisitos

- Docker + Docker Compose (recomendado para o fluxo completo)
- Node.js 20+ e npm (apenas para execucao fora de container)

## Variaveis de ambiente

Arquivo de referencia: `.env.example`.

Variavel principal:

- `VITE_API_URL`

Exemplos:

- desenvolvimento local: `http://localhost:8080/api/v1` ou a porta publicada pelo compose ativo
- producao por reverse proxy: `/api/v1`
- API externa: `https://api.seudominio.com/api/v1`

## Fluxo recomendado com Docker

Suba backend + banco no repositorio de backend:

```bash
docker compose -f AmazHealth-backend/docker/docker-compose.yml up --build
```

Em outro terminal, suba apenas o frontend dev:

```bash
docker compose -f AmazHealth/docker-compose.yml --profile dev up web-dev
```

Acessos comuns:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8080/actuator/health`

## Docker neste repositorio

Frontend com hot reload:

```bash
docker compose --profile dev up web-dev
```

Build prod-like com NGINX:

```bash
docker compose --profile prod up --build web
```

Banco local deste compose:

```bash
docker compose --profile backend up db
```

Use o banco deste compose apenas quando nao estiver usando o banco do compose do backend.

## Execucao local sem Docker

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

## Build e qualidade

```bash
npm run lint
npm run build
```

## E2E

Com backend e frontend rodando:

```bash
npx playwright install
npx playwright test e2e/mvp-pa-fluxo.spec.ts --project=chromium
```

Variaveis suportadas:

- `E2E_BACKEND_URL`
- `E2E_FRONTEND_URL`

## Troubleshooting

- `EADDRINUSE: 8080`: backend ja ocupa a porta; rode o frontend em `5173`.
- Conflito em `5432`: nao suba dois servicos `db` ao mesmo tempo.
- Login falhando: confirme backend ativo e `VITE_API_URL` correto.
- CORS bloqueado: confira se a origem do frontend esta permitida no backend.

Guia complementar no meta-repo: `../docs/INICIALIZACAO_COMPOSES.md`.
