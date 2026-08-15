# Build context is the REPO ROOT (see docker-compose.yml), not admin/ —
# this is a pnpm workspace and the build needs the root lockfile plus
# packages/ui, which admin depends on via workspace:*.
FROM node:24-alpine AS base

WORKDIR /app

# pnpm via corepack (pinned to match pnpm-lock.yaml lockfileVersion 9.0)
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate


# Manifests first so the install layer caches independently of source changes.
FROM base AS install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/ui/package.json ./packages/ui/
COPY frontend/package.json ./frontend/
COPY admin/package.json ./admin/
RUN pnpm install --frozen-lockfile --filter cu-roadmap-frontend-admin...


FROM install AS build
COPY packages/ui ./packages/ui
COPY admin ./admin
RUN pnpm --filter cu-roadmap-frontend-admin build


FROM build AS runner
ENV NODE_ENV=production
WORKDIR /app/admin

# nginx proxies to admin:5173 (see nginx/nginx.conf).
EXPOSE 5173

CMD ["pnpm", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
