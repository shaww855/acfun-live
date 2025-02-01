import puppeteer from "puppeteer-core";
import { loginByQrcode } from "./page.js";
import { personalInfo } from "./api.js";

export default async function main() {
  if (global.platformIsWin) {
    if (!global.config.饼干过期时间) {
      await loginByQrcode();
    }
  } else {
  }
  await personalInfo().then((res) => {
    console.log(`==${res.info.userName}，欢迎使用==`);
    console.log("当前账号登录过期时间：", global.config.饼干过期时间);
  });
  puppeteer
    .launch({
      devtools: global.config.调试,
      product: "chrome",
      executablePath: global.config.浏览器路径,
      args: [
        "--disable-crash-reporte",
        "--disable-extensions",
        "--disable-smooth-scrolling",
        "--no-crash-upload",
      ],
    })
    .then(async (browser) => {
      console.log("浏览器已启动");
      // ac_username=%E6%B3%A5%E5%A3%95; Max-Age=2592000; Expires=Mon, 03-Mar-2025 15: 03: 02 GMT; Domain=acfun.cn; Path=/
      const pageList = await browser.pages();
      const page = pageList[0];
      await readCookies(page);
      await page.goto("https://www.acfun.cn/");
    });
}

function readCookies(page) {
  const CookieData = global.config.饼干.map((cookie) => {
    const list = cookie.split('=')
    return {
      domain: '.acfun.cn',
      name: list[0],
      value: list[1]
    }
  });

  console.log('CookieData', CookieData);
  

  return Promise.all(CookieData.map(e => page.setCookie(e)))
}
