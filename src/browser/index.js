import puppeteer from 'puppeteer-core';
import { loginByQrcode, requestFliter, monitor } from './page.js';
import { personalInfo } from './api.js';
import moment from 'moment';
import logger from '../log.js';

moment.locale('zh-cn');

let browserObj = null;
let closePromise = null;

export default async function main() {
  if (global.platformIsWin) {
    if (!global.config.饼干过期时间) {
      const loginResult = await loginByQrcode();
      if (!loginResult) {
        logger.error('登录失败，程序退出');
        process.exit(1);
      }
    }
  } else {
    logger.warn('请在windows平台使用');
    process.exit(1);
  }

  logger.info('正在获取登录信息');
  try {
    const userInfo = await personalInfo();
    logger.info(`==${userInfo.info.userName}，欢迎使用==`);
    logger.info(`当前账号登录过期时间：${global.config.饼干过期时间}`);
  } catch (err) {
    logger.error('获取用户信息失败：', err && err.message);
  }

  logger.info(`正在启动 ${global.config.浏览器路径}`);
  try {
    const browser = await puppeteer.launch({
      devtools: global.config.调试,
      executablePath: global.config.浏览器路径,
      args: [
        '--disable-crash-reporter',
        '--disable-smooth-scrolling',
        '--no-crash-upload',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript',
      ],
    });

    logger.info(`启动成功，浏览器版本：${await browser.version()}`);
    browserObj = browser;

    const pageList = await browser.pages();
    const page = pageList[0];
    await requestFliter(page);
    await readCookies(page);
    logger.info('饼干设置完成');
    await monitor(browser);
  } catch (err) {
    logger.error('启动浏览器失败：', err && err.message);
    logger.debug(err && err.stack);
    process.exit(1);
  }
}

function readCookies(page) {
  if (!Array.isArray(global.config.饼干) || global.config.饼干.length === 0) {
    logger.warn('未找到饼干配置，跳过设置cookies');
    return Promise.resolve();
  }

  const CookieData = global.config.饼干.map((cookie) => {
    const list = cookie.split('=');
    return {
      domain: '.acfun.cn',
      name: list[0],
      value: list[1],
    };
  });

  return Promise.all(CookieData.map((e) => page.setCookie(e))).catch((err) => {
    logger.error('设置cookies失败：', err && err.message);
  });
}

/**
 * 更稳健的 closeBrowser 实现（并发安全、超时、错误吞掉并记录）
 */
export async function closeBrowser() {
  if (!browserObj) {
    logger.debug('closeBrowser: 无浏览器实例，忽略关闭请求');
    return;
  }

  if (closePromise) {
    logger.debug('closeBrowser: 已存在正在进行的关闭操作，等待完成');
    return closePromise;
  }

  closePromise = (async () => {
    const browserRef = browserObj;
    const TIMEOUT_MS = 5000;
    try {
      await Promise.race([
        browserRef.close(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('browser.close() 超时')), TIMEOUT_MS),
        ),
      ]);
      logger.info('浏览器正常关闭');
    } catch (err) {
      logger.error('关闭浏览器时发生错误（已捕获）：', err && err.message);
      logger.debug(err && err.stack);
      try {
        if (browserRef.disconnect && typeof browserRef.disconnect === 'function') {
          browserRef.disconnect();
          logger.info('已尝试通过 disconnect 断开浏览器连接');
        }
      } catch (e) {
        logger.debug('disconnect 也失败：', e && e.message);
      }
    } finally {
      try {
        browserObj = null;
      } catch (e) {
        logger.debug('在清理 browserObj 引用时发生错误（已捕获）：', e && e.message);
      }
      closePromise = null;
      logger.info('closeBrowser: 已完成清理');
    }
  })();

  return closePromise.catch(() => undefined);
}