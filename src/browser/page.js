import QRCode from 'qrcode';
import {
  qrcodeScanResult,
  qrcodeStart,
  qrcodeAcceptResult,
  medalList,
  channelList,
  channelListFollow,
  extraInfo,
  medalInfo,
} from './api.js';
import fs from 'fs';
import moment from 'moment';
import { saveConfig } from '../userConfig.js';
import logger from '../log.js';
import { sleep } from '../utils.js';

moment.locale('zh-cn');
/**
 * 用户扫码登录
 */
export async function loginByQrcode() {
  const qrcodeStartRes = await qrcodeStart().then((res) => {
    saveQrcodeImg(res.imageData);
    showQrcode(res.qrLoginToken);
    return res;
  });
  const qrcodeScanResultRes = await qrcodeScanResult(
    qrcodeStartRes.qrLoginToken,
    qrcodeStartRes.qrLoginSignature,
  )
    .then((res) => {
      if (res.qrLoginSignature) {
        logger.info('扫码成功，请在手机上确认登录。');
      }
      return res;
    })
    .catch((err) => {
      logger.error('等待确认超时');
      logger.error(err.message);
    });

  return qrcodeAcceptResult(
    qrcodeStartRes.qrLoginToken,
    qrcodeScanResultRes.qrLoginSignature,
  )
    .then((res) => {
      if (res.result == 0) {
        logger.info(`登录成功，欢迎${res.ac_username}`);
        try {
          global.config.饼干 = res.cookies.map((e) => e.split(';')[0]);

          const str = res.cookies[0];
          const regex = /Expires=([^;]+); Domain/;
          const match = str.match(regex);

          if (match) {
            global.config.饼干过期时间 = moment(new Date(match[1])).format(
              'YYYY/MM/DD HH:mm:ss',
            );
          } else {
            logger.debug(`饼干过期时间处理失败，${res.cookies[0]}`);
            throw new Error('饼干过期时间处理失败');
          }
          const dateStr = res.cookies[0].split('Expires=');
        } catch (error) {
          logger.debug(`解析饼干失败，${error.message}`);
          throw error;
        }
        saveConfig();
        return undefined;

        // const res = {
        //   result: 0,
        //   next: 'succ',
        //   qrLoginSignature: '40fa71c5c6ccc7712236a114e77320fb',
        //   acPasstoken: 'ChVpbmZyYS5hY2Z1bi5wYXNzdG9rZW4SYMBCkjgkMwrgV1G01wxSTqepf52jRXfjDHG7Macvn3w_cGMIu_zUmkopYDoqV98iBE4OuV3nvhYtpZ_oapwclgJ8hoyM7Ne9RvduAaQdU6somlLzVXPErEwZgmxqwRPPmBoSqZWmRFkwUCp2Gc38VfVTkOSLIiDeGVQKYB1iNxCfOqTRGNSCo1Q22UpcWwzE5H_pBauVQigFMAE',
        //   userId: 620132,
        //   ac_username: '泥壕',
        //   ac_userimg: 'https://imgs.aixifan.com/newUpload/620132_8acd0a8b71d345dba3d5c93f4ba52096.jpg',
        //   status: 'ACCEPTED',
        //   cookies: [
        //     'ac_username=%E6%B3%A5%E5%A3%95; Max-Age=2592000; Expires=Mon, 03-Mar-2025 15:03:02 GMT; Domain=acfun.cn; Path=/',
        //     'ac_userimg=https%3A%2F%2Fimgs.aixifan.com%2FnewUpload%2F620132_8acd0a8b71d345dba3d5c93f4ba52096.jpg; Max-Age=2592000; Expires=Mon, 03-Mar-2025 15:03:02 GMT; Domain=acfun.cn; Path=/',
        //     'acPostHint=4dd949dbebf820d0d389430676bd662bc9c7; Max-Age=2592000; Expires=Mon, 03-Mar-2025 15:03:02 GMT; Domain=acfun.cn; Path=/',
        //     'acPasstoken=ChVpbmZyYS5hY2Z1bi5wYXNzdG9rZW4SYMBCkjgkMwrgV1G01wxSTqepf52jRXfjDHG7Macvn3w_cGMIu_zUmkopYDoqV98iBE4OuV3nvhYtpZ_oapwclgJ8hoyM7Ne9RvduAaQdU6somlLzVXPErEwZgmxqwRPPmBoSqZWmRFkwUCp2Gc38VfVTkOSLIiDeGVQKYB1iNxCfOqTRGNSCo1Q22UpcWwzE5H_pBauVQigFMAE; Max-Age=2592000; Expires=Mon, 03-Mar-2025 15:03:02 GMT; Domain=acfun.cn; Path=/; HttpOnly',
        //     'auth_key=620132; Max-Age=2592000; Expires=Mon, 03-Mar-2025 15:03:02 GMT; Domain=acfun.cn; Path=/'
        //   ]
        // }
      }
    })
    .catch((err) => {
      logger.error('二维码授权失败');
      logger.error(err.message);
    });
}

const qrcodePath = './qrcode.png';

/**
 * 保存二维码图片
 * @param {String} base64Data 图片base64信息
 */
function saveQrcodeImg(base64Data) {
  const dataBuffer = Buffer.from(base64Data, 'base64');
  fs.writeFile(qrcodePath, dataBuffer, (err) => {
    if (err) {
      logger.error(`保存二维码图片失败： ${err.message}`);
    } else {
      console.log(
        '如二维码图片无法扫描，请自行打开本工具目录下的二维码图片进行扫码',
      );
    }
  });
}

/**
 * 在控制台展示二维码
 * @param {String} qrLoginToken token
 */
function showQrcode(qrLoginToken) {
  console.log('↓↓↓ 请使用 AcFun APP 扫码并确认登录 ↓↓↓');
  QRCode.toString(
    `http://scan.acfun.cn/l/${qrLoginToken}`,
    { type: 'terminal', small: true },
    function (err, string) {
      if (err) {
        throw err;
      }
      console.log(string);
      logger.info('二维码打印成功');
    },
  );
}

/**
 * 拦截页面请求
 * @param {Object} page 页面
 */
export async function requestFliter(page) {
  if (global.config.调试) {
    return;
  }
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'image') {
      request.continue({
        url: 'https://ali-imgs.acfun.cn/kos/nlav10360/static/common/widget/appGuide/img/appclose.192fa4f1ecb6c48661d8.png',
      });
    } else if (request.url().includes('.flv')) {
      // 拦截直播流
      request.abort();
    } else if (request.url().includes('/perfLog')) {
      // 拦截疑似日志
      request.abort();
    } else if (request.url().includes('/hm.baidu.com')) {
      // 拦截疑似日志
      request.abort();
    } else if (request.url().includes('/collect')) {
      // 拦截疑似错误信息收集
      request.abort();
    } else request.continue();
  });
}

let monitorTimeoutId = null;
let 检测到所有主播均未开播的次数 = 0;

export async function monitor(browser, times = 0) {
  logger.info('===');
  logger.info(`第${times + 1}次检查直播状态`);

  const 守护徽章列表 = await 整理守护勋章列表();

  logger.info('守护徽章数量', 守护徽章列表.length);

  let 所有正在直播列表 = [];

  // if (global.config.忽略有牌子但未关注的直播间) {
  //   logger.info("忽略有牌子但未关注的直播间");
  //   所有正在直播列表 = await channelListFollow().then((e) => e.liveList);
  // } else {
  const 守护徽章列表uperId = 守护徽章列表.map((e) => e.uperId);
  let list = await channelList().then((e) => e.liveList);
  logger.info(`正在直播主播数量 ${list.length}`);
  if (global.config.忽略有牌子但未关注的直播间) {
    list = list.filter((e) => e.user.isFollowing);
    logger.info(
      `其中已关注的主播 ${list.length} ${list.map((e) => e.user.name)}`,
    );
  }
  所有正在直播列表 = list.filter((e) =>
    守护徽章列表uperId.includes(e.authorId),
  );
  logger.info(
    `并且拥有守护徽章 ${所有正在直播列表.length} ${所有正在直播列表.map((e) => e.user.name)}`,
  );
  // }

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
    logger.info(`当前用户是单推人  单推数 ${global.config.白名单.length}`);
    需要关注的直播 = 所有正在直播列表.filter((e) =>
      global.config.白名单.includes(e.authorId),
    );
  } else if (global.config.黑名单.length > 0) {
    logger.info(`存在黑名单 ${global.config.黑名单.length}`);
    需要关注的直播 = 所有正在直播列表.filter(
      // 过滤有粉丝团的直播间
      (e) => !global.config.黑名单.includes(e.authorId),
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
      logger.warn('连续四小时未检测到主播开播，可能为cookie过期，请及时检查。');
    }
  } else {
    检测到所有主播均未开播的次数 = 0;
  }

  // todo 开播通知

  logger.info(
    `过滤黑白名单后 ${需要关注的直播.length} ${需要关注的直播.map((e) => e.uperName)}`,
  );

  const pageList = await browser.pages();
  const pageListUrl = [];
  for (let index = 0; index < pageList.length; index++) {
    const page = pageList[index];
    pageListUrl.push(page.url());
  }

  let isNotFull = 0;
  logger.info('开始对比已开播主播和拥有的守护徽章');
  logger.info('---');
  for (let index = 0; index < 需要关注的直播.length; index++) {
    const element = 需要关注的直播[index];
    const info = await extraInfo(element.uperId).then((res) => {
      const medalInfo = res.medalDegreeLimit;
      const target = 守护徽章列表.find((e) => e.uperId === element.uperId);
      return {
        ...element,
        ...medalInfo,
        timeLimitStr:
          medalInfo.liveWatchDegree + '/' + medalInfo.liveWatchDegreeLimit,
        noTimeLimit: medalInfo.liveWatchDegree < medalInfo.liveWatchDegreeLimit,
        timeDifference:
          medalInfo.liveWatchDegreeLimit - medalInfo.liveWatchDegree,
        ...target,
      };
    });

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
        await sleep(3000);
        // logger.info("刷新聊天室");
        // await page.reload();
      } else {
        // 没找到并且没有挂满的则新建;
        await browser.newPage().then(async (page) => {
          logger.info('新建标签页完成');
          // 设置5分钟的超时允许
          page.setDefaultNavigationTimeout(1000 * 60 * 5);
          await requestFliter(page);
          await page
            .goto(
              `https://live.acfun.cn/room/${info.uperId}?theme=default&showAuthorclubOnly=true&showAvatar=false`,
            )
            .finally(() => {
              logger.info('已进入聊天室');
            });
        });
      }
    }
    logger.info('---');
  }
  logger.info(
    `[观看时长未满/筛选后的主播总数] [${isNotFull}/${需要关注的直播.length}]`,
  );

  const nextM = 10;
  logger.warn(
    `下次检测时间 ${moment().add(nextM, 'minute').format('YYYY/MM/DD HH:mm:ss')}`,
  );
  monitorTimeoutId = setTimeout(
    () => {
      monitor(browser, times + 1);
    },
    1000 * 60 * nextM,
  );
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
