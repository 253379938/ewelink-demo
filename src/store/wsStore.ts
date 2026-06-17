import { defineStore } from "pinia";
import { ref } from "vue";
import { appid } from "@/constants";
import { useUserStore } from "@/store/userStore";

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
  let heartbeatTimer: number | null = null;

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
        const interval = ((config.hbInterval || 90) - 7)* 1000;

        heartbeatTimer = setInterval(() => {
          if (wsInstance.value) {
            wsInstance.value.send("ping");
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
  const wsConnect = async () => {
    if (wsInstance.value) return;
    if (!wsUrlBase.value) {
      await getWsUrl();
    }
    const wsUrl = `wss://${wsUrlBase.value?.domain}:${wsUrlBase.value?.port}/api/ws`;
    wsInstance.value = new WebSocket(wsUrl);

    wsInstance.value.onopen = () => {
      console.log("ws connect");
      initSend();
    };

    wsInstance.value.onmessage = (e) => {
      const data = JSON.parse(e.data);
      // heartBeat
      if (data.config) {
        startHeartbeat(data.config);
      }
      // update
      if (data.action === "update") {

      }
      // system
      
    };

    wsInstance.value.onerror = (e) => {
      console.error("ws error", e);
    };

    wsInstance.value.onclose = (e) => {
      console.warn(`ws close`, e);
      wsInstance.value = null;
    };
  };
  return {
    wsInstance,
    wsConnect,
  };
});
