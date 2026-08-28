# 执行 pnpm build:deploy 后，拿到编译的 JS 和 Web dist
FROM node:22-bullseye-slim
RUN corepack enable
WORKDIR /app

# server 构建产物：TS 编译后的 JS + Web dist + package.json
COPY thirdparty-req-server/dist /app/thirdparty-req-server/dist
COPY thirdparty-req-server/public /app/thirdparty-req-server/public
COPY thirdparty-req-server/package.json /app/thirdparty-req-server/package.json

# 安装生产依赖
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod --filter thirdparty-req-server

ENV NODE_ENV=production
ENV PORT=3001

# 挂载卷
VOLUME /app/thirdparty-req-server/data

EXPOSE 3001
WORKDIR /app/thirdparty-req-server
CMD ["node", "dist/index.js"]
