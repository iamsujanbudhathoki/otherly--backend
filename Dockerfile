# Multi-stage production build
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install

COPY . .

# Generate TSOA OpenAPI spec & routes, then compile TypeScript
RUN pnpm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/schema.gql* ./

# Ensure uploads directory exists
RUN mkdir -p /app/public/uploads /app/public/uploads/temp

EXPOSE 4000

CMD ["node", "dist/server.js"]
