FROM node:22-alpine AS alpine

# ------------------------- BASE -------------------------
FROM alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

# ------------------------- BUILDER -------------------------
FROM base AS builder

RUN apk update
RUN apk add --no-cache gcompat
WORKDIR /app

COPY package*json pnpm-lock.yaml tsconfig.json ./
COPY src ./src

RUN pnpm install --frozen-lockfile && \
    pnpm prune --prod

# ------------------------- RUNNER -------------------------
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/src /app/dist
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

USER hono
EXPOSE 3002

CMD ["node", "/app/dist/app.ts"]