# Build stage — compila TS e o addon nativo do sweph
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# Runtime stage — copia apenas o necessário
FROM node:20-alpine AS runner
WORKDIR /app
# node_modules inclui o addon nativo compilado no stage anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
# Pasta de efemérides opcional (montar como volume em produção)
RUN mkdir -p ephe
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
ENV LOG_LEVEL=info
ENV EPHE_PATH=
CMD ["node", "dist/app.js"]
