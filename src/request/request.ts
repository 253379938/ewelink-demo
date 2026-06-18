import axios from 'axios';
import { appid } from '@/constants';

const request = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

request.interceptors.request.use(
  (config) => {
    config.headers['X-CK-Appid'] = appid;

    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return config;
  },
);

request.interceptors.response.use(
  (response) => {
    const res = response.data;
      if (res.error !== 0) {
      console.error(res.msg);
      throw new Error(res.msg);
    } else {
      return res;
    }
  },
);

export default request;