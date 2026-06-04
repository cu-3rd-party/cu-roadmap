FROM node:24-alpine AS base

WORKDIR /app

# pnpm via corepack (pinned to match pnpm-lock.yaml lockfileVersion 9.0)
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate


FROM base AS install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile


FROM base AS build
COPY --from=install /app/node_modules /app/node_modules
COPY . .
RUN pnpm run build


FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-workspace.yaml ./
COPY --from=install /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY index.html /app/

EXPOSE 5173

CMD ["node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
