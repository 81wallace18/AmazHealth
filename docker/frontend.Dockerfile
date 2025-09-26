FROM node:20-alpine AS build
WORKDIR /app

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

