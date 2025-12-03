import axios from 'axios';
import axiosRetry from 'axios-retry';
import logger from '../log.js';
import { saveConfig } from '../userConfig.js';

const instance = axios.create({
  withCredentials: true,
  timeout: 20000,
});

instance.interceptors.request.use(
  function (config) {
    logger.debug(`请求 ${config.url}`);
    // 确保饼干配置存在且为数组
    if (Array.isArray(global.config.饼干) && global.config.饼干.length > 0) {
      const cookie = global.config.饼干.join('; ');
      config.headers['Cookie'] = cookie;
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
    const responseData = response.data;
    const logResponse = JSON.stringify(responseData);

    // 优化日志输出，避免过长内容影响可读性
    const displayContent =
      logResponse.length > 1000
        ? `${logResponse.substring(0, 1000)}... (内容过长，共${
            logResponse.length
          }字符)`
        : logResponse;

    logger.debug(`响应 ${logResponse.length} 字符 ${displayContent}`);

    if (response.config.url.includes('/rest/pc-direct/qr/acceptResult')) {
      // 扫描确认登录时
      const responseCookies = response.headers['set-cookie'];
      logger.debug(`扫描确认登录 设置饼干 ${responseCookies}`);

      if (responseCookies) {
        responseData.cookies = responseCookies;
      }
    }
    return responseData;
  },
  async function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    const errorMessage = error.message || '未知错误';
    const responseContent = error.response
      ? JSON.stringify(error.response.data)
      : '无响应内容';

    logger.error(`接口请求失败： ${errorMessage} ${responseContent}`);

    if (error.response && error.response.status === 401) {
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
