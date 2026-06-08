# =====================================================================
# Multi-stage build for the React + Vite frontend.
# Stage 1 produces the static bundle; stage 2 ships it via nginx that
# also proxies /api/v1/* to the four Spring Boot services.
# =====================================================================
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------------------------------------------------------------------
FROM nginx:1.27-alpine
COPY --from=build /app/dist           /usr/share/nginx/html
COPY              nginx.conf          /etc/nginx/conf.d/default.conf

EXPOSE 80
