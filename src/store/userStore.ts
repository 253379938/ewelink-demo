import { defineStore } from "pinia";
import { ref } from "vue";

export interface UserInfo {
  at: string;
  rt: string;
  region: string;
  user: {
    accountConsult: boolean;
    accountLevel: number;
    apikey: string;
    appForumEnterHide: boolean;
    appVersion: string;
    countryCode: string;
    denyRecharge: boolean;
    ipCountry: string;
    phoneNumber: string;
    timezone: {
      id: string;
      offset: number;
    };
  };
}

export const useUserStore = defineStore("user", () => {
  const getInitUser = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {}
    }
    return null;
  };

  const userData = ref<UserInfo | null>(getInitUser());

  const setUserInfo = (data: UserInfo) => {
    userData.value = data;

    localStorage.setItem("accessToken", data.at);
    localStorage.setItem("refreshToken", data.rt);
    localStorage.setItem("user", JSON.stringify(data));
  };

  const clearUserInfo = () => {
    userData.value = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  return {
    userData,
    setUserInfo,
    clearUserInfo,
  };
});
