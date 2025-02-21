import puppeteer from "puppeteer-core";
import { loginByQrcode, requestFliter, watcherUper } from "./page.js";
import {
  personalInfo,
  medalList,
  channelList,
  channelListFollow,
  extraInfo,
} from "./api.js";
import moment from "moment";
import { sleep } from "../utils.js";

moment.locale("zh-cn");

let monitorTimeoutId = null;
let 检测到所有主播均未开播的次数 = 0;
let browserObj = null;

export default async function main() {
  if (global.platformIsWin) {
    if (!global.config.饼干过期时间) {
      await loginByQrcode();
    }
  } else {
  }

  console.log("正在获取登录信息");
  await personalInfo().then((res) => {
    console.log(`==${res.info.userName}，欢迎使用==`);
    console.log("当前账号登录过期时间：", global.config.饼干过期时间);
  });

  console.log("正在启动", global.config.浏览器路径);
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
      console.log("启动成功");
      browserObj = browser;
      // ac_username=%E6%B3%A5%E5%A3%95; Max-Age=2592000; Expires=Mon, 03-Mar-2025 15: 03: 02 GMT; Domain=acfun.cn; Path=/

      const pageList = await browser.pages();
      const page = pageList[0];
      await requestFliter(page);
      await readCookies(page);
      await page.goto("https://www.acfun.cn/");
      await monitor(browser);
    });
}

function readCookies(page) {
  const CookieData = global.config.饼干.map((cookie) => {
    const list = cookie.split("=");
    return {
      domain: ".acfun.cn",
      name: list[0],
      value: list[1],
    };
  });

  // console.log("CookieData", CookieData);

  return Promise.all(CookieData.map((e) => page.setCookie(e)));
}

async function monitor(browser, times = 0) {
  console.log("===");
  console.log(
    "第",
    times + 1,
    "次检查直播状态",
    moment().format("YYYY/MM/DD HH:mm:ss"),
  );

  const 守护团列表 = await medalList().then((res) => {
    return res.medalList.map((e) => ({
      clubName: e.clubName,
      currentDegreeLimit: e.currentDegreeLimit,
      friendshipDegree: e.friendshipDegree,
      friendshipToLevelUp: e.currentDegreeLimit - e.friendshipDegree,
      joinClubTime: e.joinClubTime,
      level: e.level,
      uperId: e.uperId,
      uperName: e.uperName,
      wearMedal: e.wearMedal,
    }));
  });

  console.log("守护团数量", 守护团列表.length);

  let 所有正在直播列表 = [];

  if (global.config.忽略有牌子但未关注的直播间) {
    console.log("忽略有牌子但未关注的直播间");
    所有正在直播列表 = await channelListFollow().then((e) => e.liveList);
  } else {
    const 守护团列表uperId = 守护团列表.map((e) => e.uperId);
    let list = await channelList().then((e) => e.liveList);
    console.log("正在直播主播数量", list.length);
    所有正在直播列表 = list.filter((e) =>
      守护团列表uperId.includes(e.authorId),
    );
  }

  所有正在直播列表 = 所有正在直播列表.map((e) => ({
    authorId: e.authorId,
    uperId: e.authorId,
    uperName: e.user.name,
    title: e.title,
    createTime: e.createTime,
    headUrl: e.user.headUrl,
  }));

  let 需要关注的直播 = [];

  // 根据配置过滤直播间
  if (global.config.白名单.length > 0) {
    console.log("存在白名单，忽略黑名单！");
    需要关注的直播 = 所有正在直播列表.filter((e) =>
      global.config.白名单.includes(e.authorId),
    );
  } else if (global.config.黑名单.length > 0) {
    console.log("存在黑名单", global.config.黑名单.length);
    需要关注的直播 = 所有正在直播列表.filter(
      // 过滤有粉丝团的直播间
      (e) => !global.config.黑名单.includes(e.authorId),
    );
  } else {
    需要关注的直播 = 所有正在直播列表;
  }

  if (需要关注的直播.length === 0) {
    检测到所有主播均未开播的次数++;
    console.log("---");
    console.log("拥有牌子的主播均未开播。");
    console.log(
      "如果你确定有主播开播：请删除 config.json 文件，重启本工具，按照提示重新登录",
    );
    if (检测到所有主播均未开播的次数 > 24) {
      // 每十分钟检测一次，则24为：连续四小时都没有主播开播
      // 连续长时间无主播开播，可能为cookie过期，发送通知提醒
      检测到所有主播均未开播的次数 = 0;
      notify("连续四小时未检测到主播开播，可能为cookie过期，请及时检查。");
    }
  } else {
    检测到所有主播均未开播的次数 = 0;
  }

  // todo 开播通知

  console.log("需要关注的直播", 需要关注的直播.length);

  const pageList = await browser.pages();
  const pageListUrl = [];
  for (let index = 0; index < pageList.length; index++) {
    const page = pageList[index];
    pageListUrl.push(page.url());
  }

  console.log("顺序获取守护团信息");
  for (let index = 0; index < 需要关注的直播.length; index++) {
    const element = 需要关注的直播[index];
    const info = await extraInfo(element.uperId).then((res) => {
      const medalInfo = res.medalDegreeLimit;
      const target = 守护团列表.find((e) => e.uperId === element.uperId);
      return {
        ...target,
        ...element,
        ...medalInfo,
        timeLimitStr:
          medalInfo.liveWatchDegree + "/" + medalInfo.liveWatchDegreeLimit,
        noTimeLimit: medalInfo.liveWatchDegree < medalInfo.liveWatchDegreeLimit,
        timeDifference:
          medalInfo.liveWatchDegreeLimit - medalInfo.liveWatchDegree,
      };
    });

    // 找到对应主播的标签
    const targetIndex = pageListUrl.findIndex((e) => e.includes(info.uperId));
    let page = null;
    let msg = "";
    if (info.timeDifference === 0) {
      // 满了
      if (targetIndex > -1) {
        // 找到
        page = pageList[targetIndex];
        msg = "时长已满 退出";
        page && (await page.close());
      } else {
        msg = "时长已满 跳过";
      }
    } else {
      if (targetIndex > -1) {
        // 找到
        page = pageList[targetIndex];
        msg = "时长未满 继续";
        await page.reload();
      } else {
        // 没找到并且没有挂满的则新建
        msg = "时长未满 进入";
        await browser.newPage().then(async (page) => {
          // 设置5分钟的超时允许
          page.setDefaultNavigationTimeout(1000 * 60 * 5);
          await requestFliter(page);
          await page.goto(
            `https://live.acfun.cn/room/${info.uperId}?theme=default&showAuthorclubOnly=true&showAvatar=false`,
          );
        });
      }
    }

    console.log(
      `开播时间 ${moment(info.createTime).format("YYYY/MM/DD HH:mm:ss")}`,
    );
    console.log(`标题： ${info.title}`);
    console.log(
      `${info.level}级`,
      info.clubName,
      `(${info.timeLimitStr})`,
      info.uperName,
      info.uperId,
    );
    console.log(`[${index + 1}/${需要关注的直播.length}]`, msg);
    console.log("---");
  }
  console.log(
    "再次检测时间",
    moment().add(10, "minute").format("YYYY/MM/DD HH:mm:ss"),
  );
  monitorTimeoutId = setTimeout(
    () => {
      monitor(browser, times + 1);
    },
    1000 * 60 * 10,
  );
}

/**
 * 关闭浏览器
 * @returns
 */
export function closeBrowser() {
  console.log("浏览器已关闭");
  if (browserObj) {
    return browserObj.close();
  }
  return Promise.resolve();
}
