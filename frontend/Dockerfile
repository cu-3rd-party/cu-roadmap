FROM oven/bun:1-alpine AS base

WORKDIR /app

FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile


FROM base AS build
COPY --from=install /app/node_modules /app/node_modules
COPY . .
RUN bun run build


FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=install /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY index.html /app/

EXPOSE 5173

CMD ["bun", "x", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]