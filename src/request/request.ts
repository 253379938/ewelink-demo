import axios from "axios";
import { appid } from "@/constants";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

const request = axios.create({
  baseURL: "/api",
  timeout: 5000,
});

const router = useRouter();

request.interceptors.request.use((config) => {
  config.headers["X-CK-Appid"] = appid;

  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return config;
});

const errorCodeMap: Record<number, string> = {
  10001: "登录密码错误",
  10002: "验证码错误",
  10003: "用户不存在",
  10004: "登录的用户不在本区域",
  10009: "账号已被注册",
  10010: "验证码发送频率过快，请稍后再试",
};

request.interceptors.response.use((response) => {
  const res = response.data;
  if (res.error !== 0) {
    // if (res.error === 402) {
    //   // refresh
    //   const res = axios.post("/v2/user/refresh", {
    //     rt: localStorage.getItem("refreshToken"),
    //   });
    //   const { at, rt } = res;
    // } else {
    if (res.error === 401) {
      ElMessage.warning("该账号被他人登录");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.push("/login");
    } else if (errorCodeMap[res.error]) {
      ElMessage.error(errorCodeMap[res.error]);
    }
    throw new Error(res.msg);
    // }
  } else {
    return res;
  }
});

export default request;
