// web <---> server WS
import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import { connect as connectEWeLink, onState, sendUpdate } from "./ewelinkWs.ts";
import { config } from "../config.ts";

const webClients = new Set<WebSocket>();

export function setupWsServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/open-api/ws" });

  // eWeLink 云端推送的消息 → 转发 web
  onState(({ action, deviceid, params }) =>
    broadcastToWeb({ action, deviceid, params }),
  );

  wss.on("connection", (ws) => {
    webClients.add(ws);
    console.log("web ws connected");

    let isAlive = true;
    // 监听 pong 响应，重置存活标志
    ws.on("pong", () => {
      isAlive = true;
      console.log("web->server pong");
    });

    // 每隔 30 秒发送一次 ping
    const heartbeatInterval = setInterval(() => {
      if (isAlive === false) {
        console.warn("web ws timeout");
        ws.terminate(); // 关闭底层连接
        webClients.delete(ws);
        clearInterval(heartbeatInterval);
        return;
      }

      isAlive = false;
      ws.ping();
      console.log('server->web ping');
    }, 30000);

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        // web ws 握手 (转发到云端 ws)
        if (msg.action === "userOnline" && msg.at && msg.apikey) {
          connectEWeLink({
            at: msg.at,
            apikey: msg.apikey,
            appid: config.appId,
          }).catch((err: Error) =>
            console.error("ewelink ws userOnline err", err),
          );
          return;
        }
        // update{ action:'update', deviceid, params }
        if (msg.action === "update" && msg.deviceid && msg.params) {
          // 前端 ws 推送信息转发到云端 ws
          const webSeq = String(msg.sequence);
          sendUpdate(msg.deviceid, msg.params)
            .then((res) =>
              ws.send(JSON.stringify({ ...res, sequence: webSeq })),
            )
            .catch((err: Error) =>
              ws.send(
                JSON.stringify({
                  error: -1,
                  sequence: webSeq,
                  msg: err.message,
                }),
              ),
            );
        }
      } catch {}
    });

    ws.on("close", () => {
      webClients.delete(ws);
      clearInterval(heartbeatInterval);
      console.log("web ws closed");
    });
    ws.on("error", () => {
      webClients.delete(ws);
      clearInterval(heartbeatInterval);
    });
  });
}

export function broadcastToWeb(data: Record<string, any>) {
  const payload = JSON.stringify(data);
  for (const ws of webClients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  }
}

export function closeClients() {
  for (const ws of webClients) {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
      ws.terminate();
    }
  }
  webClients.clear();
}