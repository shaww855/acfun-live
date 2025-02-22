import axios from "axios";
import axiosRetry from "axios-retry";

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
    global.logger.error('构造请求体失败', error.message);
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
      global.logger.debug(`扫描确认登录 设置饼干 ${responseCookies}`);
      // console.log('responseCookies', responseCookies);

      if (responseCookies) {
        response.data.cookies = responseCookies;
      }
    }
    return response.data;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    global.logger.error('构造返回体失败',error.message);
    return Promise.reject(error);
  },
);
axiosRetry(instance, {
  retries: 5,
  retryDelay: (retryCount) => {
    return retryCount * 3000;
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`请求第${retryCount}次重试失败`, error.message);
    global.logger.error(`请求第${retryCount}次重试失败 ${error.message}`);
  },
  onMaxRetryTimesExceeded: (error, retryCount) => {
    global.logger.error(
      `请求达到最大重试次数 ${retryCount}次 ${error.message}`,
    );
  },
});

export default instance;
