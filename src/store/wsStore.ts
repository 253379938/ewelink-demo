import { defineStore } from "pinia";
import { ref } from "vue";
import { appid } from "@/constants";
import { useUserStore } from "@/store/userStore";
import { useThingStore } from "@/store/home/thingStore";

export interface WsUrlBase {
  IP: string;
  port: number;
  domain: string;
  reason: string;
  error: number;
}
export interface WsInterval {
  action: "userOnline";
  version: 8;
  ts?: number;
  at: string;
  userAgent: "app";
  apikey: string;
  appid: string;
  nonce: string;
  sequence: number;
}
export interface HeartbeatConfig {
  hb?: number;
  hbInterval?: number;
}

export const useWsStore = defineStore("ws", () => {
  const wsUrlBase = ref<WsUrlBase | null>(null);
  const wsInstance = ref<WebSocket | null>(null);
  const userStore = useUserStore();
  const thingStore = useThingStore();

  const pongTimeOut = 3000;
  let retryCount = 0;
  const retryTimeOut = 3000;
  const maxRetryTimeOut = 30000;

  let heartbeatTimer: number | null = null;
  let pongTimeoutTimer: number | null = null;

  let reconnectTimer: number | null = null;
  let isReconnect = false;

  // 分配 url
  const getWsUrl = async () => {
    const data = await fetch("https://cn-dispa.coolkit.cn/dispatch/app", {
      method: "GET",
    });
    const res = await data.json();
    if (res.error === 0) {
      wsUrlBase.value = res;
    } else {
      throw new Error(res.msg);
    }
  };

  // 连接后 initMsg 获取 heartbeatTime
  const initSend = () => {
    if (!wsInstance.value) return;
    wsInstance.value.send(
      JSON.stringify({
        action: "userOnline",
        version: 8,
        at: userStore.userData?.at || "",
        userAgent: "app",
        ts: Math.floor(Date.now() / 1000),
        apikey: userStore.userData?.user.apikey || "",
        appid: appid,
        nonce: Math.random().toString(36).slice(2, 10),
        sequence: Date.now(),
      }),
    );
  };

  // 触发 heatBeat
  const startHeartbeat = (config: HeartbeatConfig) => {
    stopHeartbeat();

    try {
      if (config.hb === 1) {
        const interval = ((config.hbInterval || 90) - 7) * 1000;

        heartbeatTimer = setInterval(() => {
          if (wsInstance.value) {
            clearPongTimeout();
            wsInstance.value.send("ping");
            pongTimeoutTimer = setTimeout(() => {
              wsInstance.value?.close();
            }, pongTimeOut);
          } else {
            stopHeartbeat();
          }
        }, interval);
      }
    } catch (e) {}
  };

  // 清理定时器
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };
  const clearPongTimeout = () => {
    if (pongTimeoutTimer) {
      clearTimeout(pongTimeoutTimer);
      pongTimeoutTimer = null;
    }
  };

  // logout 关闭 ws
  const closeWs = () => {
    stopHeartbeat();
    clearPongTimeout();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (wsInstance.value) {
      wsInstance.value.close(1000, "logout");
      wsInstance.value = null;
    }
  };

  // 重连
  const retryConnect = () => {
    if (isReconnect) return;
    retryCount++;
    isReconnect = true;
    let delay = retryTimeOut * Math.pow(2, retryCount - 1);
    delay = Math.min(delay, maxRetryTimeOut);
    reconnectTimer = setTimeout(async () => {
      wsUrlBase.value = null;
      await wsConnect();
    }, delay);
  };

  const wsConnect = async () => {
    if (wsInstance.value || isReconnect) return;
    if (!wsUrlBase.value) {
      await getWsUrl();
    }
    const wsUrl = `wss://${wsUrlBase.value?.domain}:${wsUrlBase.value?.port}/api/ws`;
    wsInstance.value = new WebSocket(wsUrl);

    wsInstance.value.onopen = () => {
      console.log("ws connect");
      isReconnect = false;
      initSend();
    };

    wsInstance.value.onmessage = (e) => {
      if (e.data === "pong") {
        clearPongTimeout();
        return;
      }
      try {
        const data = JSON.parse(e.data);
        // heartBeat
        if (data.config) {
          startHeartbeat(data.config);
        }
        // update web修改数据响应
        if (data.deviceid && data.error === 0) {
          thingStore.setThingSwitch(data.deviceid);
        }
        // // update server推送数据
        if (data.deviceid && data.params.switches) {
          thingStore.setThingSwitch(data.deviceid, data.params.switches);
        }
        // sysmsg
        if (data.action === "sysmsg") {
          thingStore.setThingOnline(data.deviceid, data.params.online);
        }
      } catch {}
    };

    wsInstance.value.onerror = (e) => {
      console.error("ws error", e);
    };

    wsInstance.value.onclose = (e) => {
      console.warn(`ws close`, e);
      stopHeartbeat();
      clearPongTimeout();
      wsInstance.value = null;

      if (e.code === 1000) return;

      // 尝试重连
      retryConnect();
    };
  };
  return {
    wsInstance,
    wsConnect,
    closeWs,
  };
});
