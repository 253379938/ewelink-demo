#### docker 常用命令

##### 镜像操作

- `docker images`或`docker image ls`：查看本地镜像
- `docker search`：从 docker hub 搜索镜像
- `docker pull`：拉取镜像
- `docker build -t <镜像名>:<标签> .`：根据 Dockerfile 构建
- `docker buildx build --platfrom <amd64/xxx> -t <镜像名>:<标签> .`：指定构建平台
- `docker rmi`：删除镜像
- `docker push`：推送镜像

##### 容器操作

- `docker ps`：查看运行容器
- `docker ps -a`：查看本地所有容器
- `docker start`：启动容器
- `docker run (-d/-p/-e/-v)`：基于某镜像创建容器并启动
- `docker rm`：删除容器
- `docker stop`：停止容器
- `docker restart`：重新启动容器
- `docker logs`：查看容器日志
- `docker exec -it <container> bash`：进入容器内部
- `docker stop`：停止容器

##### 卷

- ` docker volume ls`：查看本地卷
- ` docker volume create`：创建卷
- ` docker volume rm `：删除卷

#### dockerfile

dockerfile 是一种基于文本的文件，用于创建容器镜像。包含了关于镜像构建过程的指令，比如要运行的命令、需要复制的文件、启动命令等。

- `FROM`：声明基础镜像
- `RUN`：镜像构建过程中执行命令
- `COPY`：从构建上下文复制文件到镜像
- `WORKDIR`：声明工作目录
- `CMD`：默认启动命令
- `ENV`：设置环境变量
- `ARG`：构建变量
- `EXPOSE`：声明容器启动端口，仅语义
- `VOLUME`：创建挂载卷

**docker 镜像的构建流程：**

1. 执行 `build`命令，根据指定的路径 + `dockerignore` 打包构建上下文
2. 向 docker 引擎发送构建上下文信息
3. docker 引擎创建临时目录，将上下文解压进去
4. 基于基础镜像运行一个容器
5. 执行每一层命令，每个命令代表一个镜像层
6.  镜像层合成最终镜像

#### iHost 拉取镜像

在 iHost Docker上 添加 Add-on ，找到对应镜像名称添加然后进行安装。安装完成之后运行：

- 填写端口映射，`5173:3001`，如果主机端口更改，下方 `SERVER_ADDRESS`也要更改；容器端口更改，下方需要新增`PORT`环境变量指定服务监听端口

- 填写环境变量
  - `APP_ID`和`APP_SECRET`
  - `SERVER_ADDRESS`：同步设备回调地址，`iHost + port`
  - `PORT`：可选，服务监听端口，默认`3001`

#### 遇到的问题

##### 环境变量

​	`APP_Id`和`APP_SECRET`需要以环境变量的形式注入，在`Web`端需要先构建打包。不能将`APP_Id`和`APP_SECRET`在此时注入，所以需要在运行时动态注入。所以在`Server`端挂载静态资源时添加了一个中间件拦截非`api`的`get`请求，此处对要返回的`index.html`处理注入环境变量。

thirdparty-req-server\src\app.ts

```typescript
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { env } from 'node:process'
import express from 'express'
import { routes } from './routes/index.ts'
import { errorHandler, notFound } from './middleware/error.ts'

// dist路径
const distDir = join(import.meta.dirname, '../../dist')

let indexHtml = ''
try {
  indexHtml = readFileSync(join(distDir, 'index.html'), 'utf-8')
} catch {
  
}

// 运行时注入 script 读取环境变量
function injectRuntimeConfig(html: string): string {
  const config = { APP_ID: env.APP_ID || '', APP_SECRET: env.APP_SECRET || '' }
  const script = `<script>window.__APP_CONFIG__ = ${JSON.stringify(config)}</script>`
  return html.replace('</head>', `${script}</head>`)
}

export function createApp() {
  const app = express()

  app.use(express.json())

  // 设备同步 open-api router
  app.use(routes)

  // 静态资源(若访问'/',不会默认返回 index,进入下一中间件)
  app.use(express.static(distDir, { index: false }))

  // 非 API 的 GET 请求返回注入环境变量的 index
  app.use((req, res, next) => {
    if (
      req.method !== 'GET' ||
      req.path.startsWith('/open-api') ||
      req.path.startsWith('/api') ||
      !indexHtml
    ) {
      return next()
    }
    res.type('html').send(injectRuntimeConfig(indexHtml))
  })

  // 错误处理
  app.use(notFound)
  app.use(errorHandler)

  return app
}
```

##### docker stop code 137

​	在 iHost 启动容器之后，点击关闭容器没有正常关闭，而是超时未关闭被强制杀死进程，`code:137`。是因为`docker stop`向进程发送`SIGTERM`信号，`server`端没有处理，`ws.close`可能未及时得到响应(TCP4次挥手)或其他原因，对应长连接依旧挂起。所以在`index`监听对应信号，进行处理调用`ws.terminate`强制关闭`TCP`连接。

    thirdparty-req-server\src\app.ts

```typescript
// 处理 docker stop 137
function shutdown(signal: string) {
  console.log(`shutdown,: ${signal}`);

  server.close(() => {
    process.exit(0);
  });

  // 关闭 ws 长连接
  ewelinkWs.close();
  closeClients(); 
  
  // 销毁所有 http 连接
  if (server.closeAllConnections) {
    server.closeAllConnections();
  }
}

// 监听 SIGTERM 和 SIGINT
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```
