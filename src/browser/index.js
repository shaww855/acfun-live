import puppeteer from 'puppeteer-core';
import { loginByQrcode, requestFliter, monitor } from './page.js';
import { personalInfo } from './api.js';
import moment from 'moment';
import logger from '../log.js';

moment.locale('zh-cn');

let browserObj = null;

export default async function main() {
  if (global.platformIsWin) {
    if (!global.config.饼干过期时间) {
      await loginByQrcode();
    }
  } else {
  }

  logger.info('正在获取登录信息');
  await personalInfo().then((res) => {
    logger.info(`==${res.info.userName}，欢迎使用==`);
    logger.info(`当前账号登录过期时间：${global.config.饼干过期时间}`);
  });

  logger.info(`正在启动 ${global.config.浏览器路径}`);
  puppeteer
    .launch({
      devtools: global.config.调试,
      product: 'chrome',
      executablePath: global.config.浏览器路径,
      args: [
        '--disable-crash-reporte',
        '--disable-extensions',
        '--disable-smooth-scrolling',
        '--no-crash-upload',
      ],
    })
    .then(async (browser) => {
      logger.info(`启动成功，浏览器版本：${await browser.version()}`);
      browserObj = browser;
      // ac_username=%E6%B3%A5%E5%A3%95; Max-Age=2592000; Expires=Mon, 03-Mar-2025 15: 03: 02 GMT; Domain=acfun.cn; Path=/

      const pageList = await browser.pages();
      const page = pageList[0];
      await requestFliter(page);
      await readCookies(page);
      logger.info('饼干设置完成');
      // await page.goto("https://www.acfun.cn/");
      await monitor(browser);
    });
}

function readCookies(page) {
  const CookieData = global.config.饼干.map((cookie) => {
    const list = cookie.split('=');
    return {
      domain: '.acfun.cn',
      name: list[0],
      value: list[1],
    };
  });

  return Promise.all(CookieData.map((e) => page.setCookie(e)));
}

/**
 * 关闭浏览器
 * @returns
 */
export async function closeBrowser() {
  if (browserObj) {
    await browserObj.close();
  }
  logger.info('浏览器已关闭');
}
