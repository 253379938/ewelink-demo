export { regionMapMerge,type RegionInfo } from "./region";

// 运行时配置注入 window.__APP_CONFIG__
// 开发时读取 VITE_ env
declare global {
  interface Window {
    __APP_CONFIG__?: { APP_ID?: string; APP_SECRET?: string };
  }
}

export const appid = window.__APP_CONFIG__?.APP_ID || (import.meta.env.VITE_APPID as string);
export const appSecret = window.__APP_CONFIG__?.APP_SECRET || (import.meta.env.VITE_SECRET as string);
