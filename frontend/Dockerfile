FROM node:22-alpine AS base

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable
RUN corepack prepare pnpm@11.1.2 --activate

FROM base AS install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile


FROM base AS build
COPY --from=install /app/node_modules /app/node_modules
COPY . .
RUN pnpm build


FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=install /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY index.html /app/
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/

EXPOSE 5173

CMD ["pnpm", "preview", "--host", "0.0.0.0", "--port", "5173"]
