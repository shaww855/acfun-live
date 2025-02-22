import QRCode from "qrcode";
import { qrcodeScanResult, qrcodeStart, qrcodeAcceptResult } from "./api.js";
import fs from "fs";
import moment from "moment";
import { saveConfig } from "../userConfig.js";

moment.locale("zh-cn");
/**
 * 用户扫码登录
 */
export async function loginByQrcode() {
  const qrcodeStartRes = await qrcodeStart().then((res) => {
    saveQrcodeImg(res.imageData);
    showQrcode(res.qrLoginToken);
    // console.log(res);
    return res;
  });
  const qrcodeScanResultRes = await qrcodeScanResult(
    qrcodeStartRes.qrLoginToken,
    qrcodeStartRes.qrLoginSignature,
  )
    .then((res) => {
      if (res.qrLoginSignature) {
        console.log("扫码成功，请在手机上确认登录。");
        global.logger.info("扫码成功");
      }
      return res;
    })
    .catch((err) => {
      console.log("等待确认超时");
      global.logger.info("等待确认超时");
      global.logger.error(err.message);
    });

  return qrcodeAcceptResult(
    qrcodeStartRes.qrLoginToken,
    qrcodeScanResultRes.qrLoginSignature,
  )
    .then((res) => {
      // console.log(res);
      if (res.result == 0) {
        console.log("登录成功，欢迎", res.ac_username);
        global.logger('登录成功')
        try {
          global.config.饼干 = res.cookies.map((e) => e.split(";")[0]);

          const str = res.cookies[0];
          const regex = /Expires=([^;]+); Domain/;
          const match = str.match(regex);

          if (match) {
            global.config.饼干过期时间 = moment(new Date(match[1])).format(
              "YYYY/MM/DD HH:mm:ss",
            );
          } else {
            global.logger.error(`饼干过期时间处理失败，${res.cookies[0]}`);
            throw new Error("饼干过期时间处理失败");
          }
          const dateStr = res.cookies[0].split("Expires=");
        } catch (error) {
          console.log("解析饼干失败");
          global.logger.error(`解析饼干失败，${error.message}`);
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
      console.log("二维码授权失败");
      global.logger.info("二维码授权失败");
      global.logger.error(err.message);
    });
}

const qrcodePath = "./qrcode.png";

/**
 * 保存二维码图片
 * @param {String} base64Data 图片base64信息
 */
function saveQrcodeImg(base64Data) {
  const dataBuffer = Buffer.from(base64Data, "base64");
  fs.writeFile(qrcodePath, dataBuffer, (err) => {
    if (err) {
      console.error(err);
      global.logger.info("保存二维码图片失败");
    } else {
      console.log(
        "如二维码图片无法扫描，请自行打开本工具目录下的二维码图片进行扫码",
      );
    }
  });
}

/**
 * 在控制台展示二维码
 * @param {String} qrLoginToken token
 */
function showQrcode(qrLoginToken) {
  console.log("↓↓↓ 请使用 AcFun APP 扫码并确认登录 ↓↓↓");
  QRCode.toString(
    `http://scan.acfun.cn/l/${qrLoginToken}`,
    { type: "terminal", small: true },
    function (err, string) {
      if (err) {
        throw err;
      }
      console.log(string);
      global.logger.info("二维码打印成功");
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
  page.on("request", (request) => {
    if (request.resourceType() === "image") {
      request.continue({
        url: "https://ali-imgs.acfun.cn/kos/nlav10360/static/common/widget/appGuide/img/appclose.192fa4f1ecb6c48661d8.png",
      });
    } else if (request.url().includes(".flv")) {
      // 拦截直播流
      request.abort();
    } else if (request.url().includes("/perfLog")) {
      // 拦截疑似日志
      request.abort();
    } else if (request.url().includes("/hm.baidu.com")) {
      // 拦截疑似日志
      request.abort();
    } else if (request.url().includes("/collect")) {
      // 拦截疑似错误信息收集
      request.abort();
    } else request.continue();
  });
}