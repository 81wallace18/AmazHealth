FROM node:20-alpine AS build
WORKDIR /app

# Permite configurar VITE_API_URL em build-time via docker-compose build args.
# Ex.: VITE_API_URL=/api/v1 (mesma origem) ou https://api.seudominio.com/api/v1
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

# Instala dependências
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copia o restante do app e builda
COPY . .
RUN npm run build

# Etapa de runtime com NGINX estático
FROM nginx:1.27-alpine
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD wget -qO- http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
