# ============ 构建阶段 ============
FROM node:22-bullseye-slim AS build
ENV npm_config_registry=https://registry.npmmirror.com
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
RUN corepack enable
WORKDIR /app

# 分层 & install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY thirdparty-req-server/package.json thirdparty-req-server/
RUN pnpm install

# COPY & build
COPY . .
RUN pnpm build
RUN pnpm -F thirdparty-req-server run build

# ============ 运行阶段 ============
FROM node:22-bullseye-slim AS runtime
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# COPY dist & server & install
COPY --from=build /app/thirdparty-req-server/package.json /app/thirdparty-req-server/package.json
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod --filter thirdparty-req-server
COPY --from=build /app/dist /app/dist
COPY --from=build /app/thirdparty-req-server/dist /app/thirdparty-req-server/dist

# db 挂在 VOLUME 上持久化
VOLUME /app/thirdparty-req-server/data

EXPOSE 3001
WORKDIR /app/thirdparty-req-server
CMD ["node", "dist/index.js"]
