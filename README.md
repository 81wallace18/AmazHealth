# AmazHealth (Frontend)

Aplicação web do **AmazHealth** (HIS/Sistema Hospitalar) — interface de recepção, triagem, prontuário, prescrições e farmácia.

## Stack
- React + Vite + TypeScript
- Tailwind + shadcn/ui
- Axios (`src/lib/api.ts`)
- E2E: Playwright (`e2e/`)

---

## Variáveis de ambiente

- `VITE_API_URL` (base da API)
  - Desenvolvimento (local): `http://localhost:18080/api/v1`
  - Produção (mesma origem via reverse proxy): `/api/v1`
  - Produção (API em outro domínio): `https://api.seudominio.com/api/v1`

Arquivo de referência: `.env.example`.

---

## Rodar em desenvolvimento (recomendado)

Pré-requisitos: Docker + Docker Compose.

1) Subir **backend + banco** (no repositório `AmazHealth-backend`):
```bash
cd ../AmazHealth-backend
cp .env.example .env
# ajuste JWT_SECRET (>= 32 chars) e demais variáveis se necessário
docker compose -f docker/docker-compose.yml up -d --build
```

2) Subir **frontend dev (Vite)**:
```bash
cd ../AmazHealth
docker compose -f docker-compose.yml --profile dev up -d web-dev
```

Acessos:
- Frontend: `http://localhost:5173`
- API: `http://localhost:18080/api/v1`

---

## Rodar local sem Docker (frontend apenas)

Pré-requisitos: Node.js 20+.

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Defina `VITE_API_URL` apontando para um backend acessível (local ou remoto).

---

## Build de produção

```bash
npm ci
npm run build
```

---

## Rodar “prod-like” local (Nginx)

Pré-requisito: backend rodando em `http://localhost:18080`.

```bash
VITE_API_URL=http://localhost:18080/api/v1 docker compose -f docker-compose.yml --profile prod up -d --build web
```

Acesso: `http://localhost:8081`

Observação:
- O `docker/frontend.Dockerfile` aceita `VITE_API_URL` via `--build-arg` (usado pelo compose).
- Em produção real, o padrão mais simples é usar `VITE_API_URL=/api/v1` com reverse proxy roteando `/api/` para o backend.

---

## E2E (Playwright)

Pré-requisitos: backend + frontend rodando.

Variáveis suportadas:
- `E2E_BACKEND_URL` (default: `http://localhost:18080/api/v1`)
- `E2E_FRONTEND_URL` (default: `http://localhost:5173`)

```bash
npx playwright install
npx playwright test e2e/mvp-pa-fluxo.spec.ts --project=chromium
```

Frontend web do AmazHealth HIS em React + Vite + TypeScript.

## Stack
- React 18
- Vite 5
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query + React Router

## Requisitos
- Node 20+
- npm

## Configuracao
Copie `.env.example` para `.env` e ajuste:

- `VITE_API_URL` (padrao: `http://localhost:18080/api/v1`)

## Comandos

```bash
npm ci
npm run dev
```

Outros:

```bash
npm run lint
npm run build
npm run preview
```

## Integracao com backend
- Em dev local: `VITE_API_URL=http://localhost:18080/api/v1`
- Em producao via NGINX: usar `VITE_API_URL=/api/v1`
