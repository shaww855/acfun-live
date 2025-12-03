import QRCode from 'qrcode';
import {
  qrcodeScanResult,
  qrcodeStart,
  qrcodeAcceptResult,
  medalList,
  channelList,
  extraInfo,
  medalInfo,
} from './api.js';
import fs from 'fs';
import moment from 'moment';
import { saveConfig } from '../userConfig.js';
import logger from '../log.js';
import si from 'systeminformation';
import { getTitle } from '../welcome.js';

moment.locale('zh-cn');
/**
 * 用户扫码登录
 */
export async function loginByQrcode() {
  try {
    // 启动并展示二维码
    const qrcodeStartRes = await qrcodeStart();
    saveQrcodeImg(qrcodeStartRes.imageData);
    showQrcode(qrcodeStartRes.qrLoginToken);

    // 等待扫码（可能超时）
    const qrcodeScanResultRes = await qrcodeScanResult(
      qrcodeStartRes.qrLoginToken,
      qrcodeStartRes.qrLoginSignature,
    ).catch((err) => {
      logger.error('等待确认超时', err.message);
      return null;
    });

    if (!qrcodeScanResultRes || !qrcodeScanResultRes.qrLoginSignature) {
      logger.warn('扫码未返回签名，可能超时或取消。');
      return null;
    }
    logger.info('扫码成功，请在手机上确认登录。');

    // 接受并获取 cookies
    const acceptRes = await qrcodeAcceptResult(
      qrcodeStartRes.qrLoginToken,
      qrcodeScanResultRes.qrLoginSignature,
    ).catch((err) => {
      logger.error('二维码授权失败', err.message);
      return null;
    });

    if (!acceptRes) {
      logger.error('二维码授权未返回结果');
      return null;
    }

    if (acceptRes.result !== 0) {
      logger.error(`二维码授权未成功，result=${acceptRes.result}`);
      return null;
    }

    logger.info(`登录成功，欢迎${acceptRes.ac_username}`);
    try {
      if (Array.isArray(acceptRes.cookies) && acceptRes.cookies.length > 0) {
        global.config.饼干 = acceptRes.cookies.map((e) => e.split(';')[0]);

        // 尝试解析过期时间
        const str = acceptRes.cookies[0] || '';
        const regex = /Expires=([^;]+);?\s*Domain/;
        const match = str.match(regex);
        if (match && match[1]) {
          global.config.饼干过期时间 = moment(new Date(match[1])).format(
            'YYYY/MM/DD HH:mm:ss',
          );
        } else {
          logger.debug(`饼干过期时间处理失败，cookie: ${str}`);
          // 不抛出错误，只记录
        }
      } else {
        logger.warn('未返回 cookies 列表，登录态无法持久化');
        global.config.饼干 = [];
      }
    } catch (error) {
      logger.debug(`解析饼干失败，${error && error.message}`);
    }
    saveConfig();

    // 清理二维码图片文件
    try {
      if (fs.existsSync(qrcodePath)) {
        fs.unlinkSync(qrcodePath);
        logger.info('二维码图片已清理');
      }
    } catch (err) {
      logger.warn('清理二维码图片失败：', err.message);
    }

    return acceptRes;
  } catch (err) {
    logger.error('登录流程出错：', err && err.message);
    return null;
  }
}

const qrcodePath = './qrcode.png';

/**
 * 保存二维码图片
 * @param {String} base64Data 图片base64信息
 */
function saveQrcodeImg(base64Data) {
  if (!base64Data) {
    logger.warn('未收到二维码 imageData，跳过保存二维码图片');
    return;
  }
  try {
    const dataBuffer = Buffer.from(base64Data, 'base64');
    fs.writeFile(qrcodePath, dataBuffer, (err) => {
      if (err) {
        logger.error(`保存二维码图片失败： ${err.message}`);
      } else {
        logger.info(
          '如二维码图片无法扫描，请自行打开本工具目录下的二维码图片进行扫码',
        );
      }
    });
  } catch (err) {
    logger.error('保存二维码图片异常：', err && err.message);
  }
}

/**
 * 在控制台展示二维码
 * @param {String} qrLoginToken token
 */
function showQrcode(qrLoginToken) {
  logger.info('↓↓↓ 请使用 AcFun APP 扫码并确认登录 ↓↓↓');
  try {
    QRCode.toString(
      `http://scan.acfun.cn/l/${qrLoginToken}`,
      { type: 'terminal', small: true },
      function (err, string) {
        if (err) {
          logger.error('二维码在终端展示失败：', err && err.message);
          // 打印备用 URL 以便手动打开
          console.log(`二维码 URL: http://scan.acfun.cn/l/${qrLoginToken}`);
          return;
        }
        console.log(string);
        logger.debug('二维码打印成功');
      },
    );
  } catch (err) {
    logger.error('生成二维码字符串失败：', err && err.message);
    console.log(`二维码 URL: http://scan.acfun.cn/l/${qrLoginToken}`);
  }
}

/**
 * 拦截页面请求
 * @param {Object} page 页面
 */
export async function requestFliter(page) {
  if (global?.config?.调试) {
    return;
  }
  try {
    // 有时 setRequestInterception 已被启用，捕获异常避免崩溃
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      try {
        if (request.resourceType() === 'image') {
          request.continue({
            url: 'https://ali-imgs.acfun.cn/kos/nlav10360/static/common/widget/appGuide/img/appclose.192fa4f1ecb6c48661d8.png',
          });
        } else if (request.url().includes('.flv')) {
          request.abort();
        } else if (request.url().includes('/perfLog')) {
          request.abort();
        } else if (request.url().includes('/hm.baidu.com')) {
          request.abort();
        } else if (request.url().includes('/collect')) {
          request.abort();
        } else request.continue();
      } catch (e) {
        // 如果 request 操作中出错，安全忽略
        try {
          request.continue();
        } catch (ee) {}
      }
    });
  } catch (err) {
    logger.debug('设置请求拦截失败（可能已设置）：', err && err.message);
  }
}

let monitorTimeoutId = null;
let 检测到所有主播均未开播的次数 = 0;

export async function monitor(browser, times = 0) {
  try {
    logger.info('===');
    logger.info(`第${times + 1}次检查直播状态`);

    const 白名单 = Array.isArray(global?.config?.白名单)
      ? global.config.白名单
      : [];
    const 黑名单 = Array.isArray(global?.config?.黑名单)
      ? global.config.黑名单
      : [];
    const 忽略未关注 = !!global?.config?.忽略有牌子但未关注的直播间;

    const 守护徽章列表 = await 整理守护勋章列表();
    logger.info('守护徽章数量', 守护徽章列表.length);

    let 所有正在直播列表 = [];

    const 守护徽章列表uperId = 守护徽章列表.map((e) => e.uperId);
    let list = [];
    try {
      const channelRes = await channelList();
      list = Array.isArray(channelRes?.liveList) ? channelRes.liveList : [];
    } catch (err) {
      logger.error('获取频道列表失败：', err && err.message);
      list = [];
    }

    logger.info(`正在直播主播数量 ${list.length}`);
    if (忽略未关注) {
      list = list.filter((e) => e.user && e.user.isFollowing);
      logger.info(
        `其中已关注的主播 ${list.length} ${list.map((e) => e.user && e.user.name)}`,
      );
    }
    所有正在直播列表 = list.filter((e) =>
      守护徽章列表uperId.includes(e.authorId),
    );
    logger.info(
      `并且拥有守护徽章 ${所有正在直播列表.length} ${所有正在直播列表.map((e) => e.user && e.user.name)}`,
    );

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
    if (白名单.length > 0) {
      logger.info(`当前用户是单推人  单推数 ${白名单.length}`);
      需要关注的直播 = 所有正在直播列表.filter((e) =>
        白名单.includes(e.authorId),
      );
    } else if (黑名单.length > 0) {
      logger.info(`存在黑名单 ${黑名单.length}`);
      需要关注的直播 = 所有正在直播列表.filter(
        // 过滤有粉丝团的直播间
        (e) => !黑名单.includes(e.authorId),
      );
    } else {
      需要关注的直播 = 所有正在直播列表;
    }

    if (需要关注的直播.length === 0) {
      检测到所有主播均未开播的次数++;
      logger.info('---');
      logger.info('拥有牌子的主播均未开播。');
      logger.info(
        '如果你确定有主播开播：请删除 config.json 文件，重启本工具，按照提示重新登录',
      );
      if (检测到所有主播均未开播的次数 > 24) {
        // 每十分钟检测一次，则24为：连续四小时都没有主播开播
        // 连续长时间无主播开播，可能为cookie过期，发送通知提醒
        检测到所有主播均未开播的次数 = 0;
        logger.warn(
          '连续四小时未检测到主播开播，可能为cookie过期，请及时检查。',
        );
      }
    } else {
      检测到所有主播均未开播的次数 = 0;
    }

    // todo 开播通知

    logger.info(
      `过滤黑白名单后 ${需要关注的直播.length} ${需要关注的直播.map((e) => e.uperName)}`,
    );

    const pageList = await browser.pages();
    const pageListUrl = pageList.map((page) => page.url());

    let isNotFull = 0;
    logger.info('开始对比已开播主播和拥有的守护徽章');
    logger.info('---');
    for (let index = 0; index < 需要关注的直播.length; index++) {
      const element = 需要关注的直播[index];
      const info = await extraInfo(element.uperId)
        .then((res) => {
          const medalInfo = res.medalDegreeLimit;
          const target = 守护徽章列表.find((e) => e.uperId === element.uperId);
          return {
            ...element,
            ...medalInfo,
            timeLimitStr:
              medalInfo.liveWatchDegree + '/' + medalInfo.liveWatchDegreeLimit,
            noTimeLimit:
              medalInfo.liveWatchDegree < medalInfo.liveWatchDegreeLimit,
            timeDifference:
              medalInfo.liveWatchDegreeLimit - medalInfo.liveWatchDegree,
            ...target,
          };
        })
        .catch((err) => {
          logger.error('获取主播信息失败', err.message);
          return null;
        });

      if (!info) {
        continue;
      }

      logger.info(`数量：${index + 1}/${需要关注的直播.length}`);
      logger.info(
        `开播时间 ${moment(info.createTime).format('YYYY/MM/DD HH:mm:ss')}`,
      );
      logger.info(`标题：${info.title}`);
      logger.info(
        `${info.level}级 ${info.clubName} ${info.uperName} ${info.uperId}`,
      );

      // 找到对应主播的标签
      const targetIndex = pageListUrl.findIndex((e) => e.includes(info.uperId));
      let page = null;
      if (info.timeDifference === 0) {
        logger.info(`时长已满 ${info.timeLimitStr}`);
        // 满了
        if (targetIndex > -1) {
          // 找到
          page = pageList[targetIndex];
          logger.info('退出聊天室');
          page && (await page.close());
        } else {
          logger.info('跳过');
        }
      } else {
        isNotFull++;
        logger.info(`时长未满 ${info.timeLimitStr}`);
        if (targetIndex > -1) {
          // 找到
          page = pageList[targetIndex];
          logger.info('切换标签页至前台');
          await page.bringToFront();
          // await sleep(3000);
          // logger.info("刷新聊天室");
          // await page.reload();
        } else {
          // 没找到并且没有挂满的则新建;
          logger.info('正在进入聊天室');
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
      logger.info('---');
    }
    logger.info(
      `[观看时长未满/筛选后的主播总数] [${isNotFull}/${需要关注的直播.length}]`,
    );
    process.title = `[${isNotFull}/${需要关注的直播.length}]${getTitle()}`;

    const nextM = 10;
    logger.warn(
      `下次检测时间 ${moment().add(nextM, 'minute').format('YYYY/MM/DD HH:mm:ss')}`,
    );

    showSysUsage(browser);

    monitorTimeoutId = setTimeout(
      () => {
        monitor(browser, times + 1);
      },
      1000 * 60 * nextM,
    );
  } catch (err) {
    logger.error('监控流程出错：', err && err.message);
    // 出错后继续下一次检测
    const nextM = 10;
    monitorTimeoutId = setTimeout(
      () => {
        monitor(browser, times + 1);
      },
      1000 * 60 * nextM,
    );
  }
}

async function 整理守护勋章列表() {
  if (
    global.config.手动指定拥有守护团徽章的UID &&
    global.config.手动指定拥有守护团徽章的UID.length > 0
  ) {
    logger.info(
      `正在获取指定的守护团徽章 ${global.config.手动指定拥有守护团徽章的UID}`,
    );
    logger.info('将忽略黑白名单配置！');

    const list = [];
    for (
      let index = 0;
      index < global.config.手动指定拥有守护团徽章的UID.length;
      index++
    ) {
      const element = global.config.手动指定拥有守护团徽章的UID[index];
      await medalInfo(element).then((res) => {
        const medal = res.medal;
        list.push({
          clubName: medal.clubName,
          level: medal.level,
          uperId: element,
          uperName: medal.uperName,
        });
      });
    }
    return list;
  }
  return medalList().then((res) => {
    return res.medalList.map((e) => ({
      clubName: e.clubName,
      level: e.level,
      uperId: e.uperId,
      uperName: e.uperName,
    }));
  });
}

async function showSysUsage(browser) {
  if (browser === null) {
    return;
  }

  // 获取所有进程信息
  const processes = await si.processes();
  const toolsProcess = processes.list.find((p) => p.pid === process.pid);
  // console.log(toolsProcess);

  if (toolsProcess) {
    logger.info(
      `已运行：${moment.duration(process.uptime(), 'second').humanize()}， 内存占用：${Math.round(toolsProcess.memRss / 1024)} MB`,
    );
  }

  const mainPid = browser.process().pid; // 主进程PID

  // 递归查找所有子进程（包括子进程的子进程）
  const getChildProcesses = (pid, list = []) => {
    const children = processes.list.filter((p) => p.parentPid === pid);
    // console.log('children', children.length);

    list.push(...children);
    children.forEach((child) => getChildProcesses(child.pid, list));
    return list;
  };

  // 主进程 + 所有子进程
  const allProcesses = [
    processes.list.find((p) => p.pid === mainPid),
    ...getChildProcesses(mainPid),
  ];

  // 累加内存（单位：字节）
  const totalMemory = allProcesses.reduce(
    (sum, p) => sum + (p?.memRss || 0),
    0,
  );
  logger.info(`浏览器总内存占用：${Math.round(totalMemory / 1024)} MB`);
}
