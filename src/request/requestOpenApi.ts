import axios from "axios";

// open api request 实例
const requestOpenApi = axios.create({
  timeout: 5000,
});

requestOpenApi.interceptors.response.use((response) => response.data);

export default requestOpenApi;
