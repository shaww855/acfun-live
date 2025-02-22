import axios from "axios";
import axiosRetry from "axios-retry";
import logger from "../log.js";
import { saveConfig } from "../userConfig.js";

const instance = axios.create({
  withCredentials: true,
  timeout: 20000,
});
instance.interceptors.request.use(
  function (config) {
    if (global.config.饼干.length) {
      const cookie = global.config.饼干.join("; ");
      config.headers["Cookie"] = cookie;
    }
    return config;
  },
  function (error) {
    logger.error(`构造请求体失败：${error.message}`);
    return Promise.reject(error);
  },
);
instance.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    // console.log("interceptors", response.data);
    // console.log(response);
    if (response.config.url.includes("/rest/pc-direct/qr/acceptResult")) {
      // 扫描确认登录时
      const responseCookies = response.headers["set-cookie"];
      logger.debug(`扫描确认登录 设置饼干 ${responseCookies}`);
      // console.log('responseCookies', responseCookies);

      if (responseCookies) {
        response.data.cookies = responseCookies;
      }
    }
    return response.data;
  },
  async function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    logger.error(
      `接口请求失败： ${error.message} ${error.response ? error.response.data : "无响应内容"}`,
    );
    if (error.status === 401) {
      // 登录超时
      global.config.饼干过期时间 = null;
      global.config.饼干 = [];
      await saveConfig();
    }

    return Promise.reject(error);
  },
);
axiosRetry(instance, {
  retries: 5,
  retryDelay: (retryCount) => {
    return retryCount * 3000;
  },
  onRetry: (retryCount, error, requestConfig) => {
    logger.error(`请求第${retryCount}次重试失败 ${error.message}`);
  },
  onMaxRetryTimesExceeded: (error, retryCount) => {
    logger.error(`请求达到最大重试次数 ${retryCount}次 ${error.message}`);
  },
});

export default instance;
