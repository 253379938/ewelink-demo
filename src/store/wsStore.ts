import { defineStore } from "pinia";
import { ref } from "vue";
import { appid } from "@/constants";
import { useUserStore } from "@/store/userStore";
import { useThingStore } from "@/store/home/thingStore";

// 连接 server ws
export const useWsStore = defineStore("ws", () => {
  const wsInstance = ref<WebSocket | null>(null);
  const userStore = useUserStore();
  const thingStore = useThingStore();

  let reconnectTimer: number | null = null;
  let retryCount = 0;
  const retryTimeOut = 3000;
  const maxRetryTimeOut = 30000;
  let isReconnect = false;

  // 控制命令发送 promise
  const pendingMap = new Map<string, { resolve: Function; timer: number }>();
  const updateTimeOut = 5000;
  const updateParams = (data: Record<string, any>) => {
    return new Promise(
      (resolve: (value: Record<string, any>) => void, reject) => {
        if (!wsInstance.value) return reject(new Error("ws no exist"));
        const sequence = String(data.sequence);
        const timer = setTimeout(() => {
          pendingMap.delete(sequence);
          reject(new Error("device update timeout"));
        }, updateTimeOut);
        pendingMap.set(sequence, { resolve, timer });
        wsInstance.value.send(JSON.stringify(data));
      },
    );
  };

  // 重连
  const retryConnect = () => {
    if (isReconnect) return;
    retryCount++;
    isReconnect = true;
    let delay = retryTimeOut * Math.pow(2, retryCount - 1);
    delay = Math.min(delay, maxRetryTimeOut);
    reconnectTimer = setTimeout(async () => {
      try {
        isReconnect = false;
        await wsConnect();
      } catch (err) {
        retryConnect();
      }
    }, delay);
  };

  const wsConnect = () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (wsInstance.value) {
          return reject(new Error("ws instance existed"));
        }
        const wsUrl = `ws://${location.host}/open-api/ws`;
        wsInstance.value = new WebSocket(wsUrl);

        wsInstance.value.onopen = () => {
          console.log("ws connected to server");
          isReconnect = false;
          retryCount = 0;
          // 握手：传递 ewelink 云连接所需的凭证
          const at = userStore.userData?.at;
          const apikey = userStore.userData?.user.apikey;
          if (at && apikey) {
            wsInstance.value?.send(
              JSON.stringify({
                action: "userOnline",
                version: 8,
                ts: Math.floor(Date.now() / 1000),
                at,
                userAgent: "app",
                apikey,
                appid,
                nonce: Math.random().toString(36).slice(2, 10),
                sequence: Date.now(),
              }),
            );
          }
          resolve(wsInstance.value);
        };

        wsInstance.value.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            // 控制命令响应（server 回显前端的 sequence）
            if (pendingMap.has(data.sequence)) {
              const item = pendingMap.get(data.sequence)!;
              clearTimeout(item.timer);
              pendingMap.delete(data.sequence);
              item.resolve(data);
              return;
            }
            // server 推送的消息进行合并 params
            if (data.action === "update" && data.deviceid && data.params) {
              thingStore.mergeThingParams(data.deviceid, data.params);
            }
            if (data.action === "sysmsg") {
              thingStore.setThingOnline(data.deviceid, data.params.online);
            }
          } catch {}
        };

        wsInstance.value.onerror = (e) => {
          console.error("ws error", e);
          reject(e);
        };

        wsInstance.value.onclose = (e) => {
          console.warn(`ws close`, e);
          pendingMap.forEach((item) => clearTimeout(item.timer));
          pendingMap.clear();
          wsInstance.value = null;
          if (e.code === 1000) return;
          reject(e);
          retryConnect();
        };
      } catch (err) {
        reject(err);
      }
    });
  };

  // 关闭
  const closeWs = () => {
    pendingMap.forEach((item) => clearTimeout(item.timer));
    pendingMap.clear();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    isReconnect = false;
    retryCount = 0;
    if (wsInstance.value) {
      wsInstance.value.close(1000, "logout");
      wsInstance.value = null;
    }
  };

  return {
    wsInstance,
    wsConnect,
    closeWs,
    updateParams,
  };
});
