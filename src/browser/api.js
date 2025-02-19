import request from "./request.js";

/**
 * 获取二维码
 * @returns
 */
export function qrcodeStart() {
  return request({
    url: `https://scan.acfun.cn/rest/pc-direct/qr/start?type=WEB_LOGIN&_=${Date.now()}`,
    method: "get",
  });
}

/**
 * 二维码扫描结果
 * @param {String} qrLoginToken
 * @param {String} qrLoginSignature
 * @returns
 */
export function qrcodeScanResult(qrLoginToken, qrLoginSignature) {
  return request({
    url: `https://scan.acfun.cn/rest/pc-direct/qr/scanResult?qrLoginToken=${qrLoginToken}&qrLoginSignature=${qrLoginSignature}&_=${Date.now()}`,
    method: "get",
    timeout: 2 * 60 * 1000,
  });

  const good = {
    next: "acceptResult",
    qrLoginSignature: "1939ba4d6aba116e5416721b981bc582",
    result: 0,
    status: "SCANNED",
  };
  const bad = {
    error_msg: "token expired",
    result: 100400002,
  };
}

/**
 * 确认二维码登录
 * @param {String} qrLoginToken
 * @param {String} qrLoginSignature
 * @returns
 */
export function qrcodeAcceptResult(qrLoginToken, qrLoginSignature) {
  return request({
    url: `https://scan.acfun.cn/rest/pc-direct/qr/acceptResult?qrLoginToken=${qrLoginToken}&qrLoginSignature=${qrLoginSignature}&_=${Date.now()}`,
    method: "get",
    timeout: 2 * 60 * 1000,
  });
  const bad = {
    error_msg: "token expired",
    result: 100400002,
  };
  const good = {
    result: 0,
    next: "succ",
    qrLoginSignature: "5ccab9a0b791fc5cbab67dea2e3da2df",
    acPasstoken:
      "ChVpbmZyYS5hY2Z1bi5wYXNzdG9rZW4SYCGJ6Pbhnl4q9W_dHMGq4SRp-v-xl572Kulas73IEEVLdC8pTg8fNasy1qZI_Drd-iwpXKhOAOH7-Tf6OtxcLNoTP_DShm6WC82eCQ5yZXyHAsIx8xMXcV1WSy2wdvM7-xoSuoXRMN3u4Ns02n6Y_s_QM5b8IiB-Jo0oGs--a-TGjIBwO0h8EpB6_KJQuhUWgCGLUxWIeigFMAE",
    userId: 620132,
    ac_username: "泥壕",
    ac_userimg:
      "https://imgs.aixifan.com/newUpload/620132_8acd0a8b71d345dba3d5c93f4ba52096.jpg",
    status: "ACCEPTED",
  };
}

/**
 * 个人信息
 * @returns
 */
export function personalInfo() {
  return request({
    url: "https://live.acfun.cn/rest/pc-direct/user/personalInfo",
    method: "get",
  });
}

/**
 * 守护团列表
 * @returns
 */
export function medalList() {
  return request({
    url: "https://www.acfun.cn/rest/pc-direct/fansClub/fans/medal/list",
    method: "get",
  });
}

/**
 * 全站已开播列表
 * @returns
 */
export function channelList() {
  return request({
    url: "https://live.acfun.cn/api/channel/list?count=200&pcursor=0",
    method: "get",
  });
}

/**
 * 关注并开播列表
 * @returns
 */
export function channelListFollow() {
  return request({
    url: "https://live.acfun.cn/api/channel/list?count=100&pcursor=&filters=[%7B%22filterType%22:3,+%22filterId%22:0%7D",
    method: "get",
  });
}

/**
 * 粉丝团当日时长
 * @returns
 */
export function extraInfo(uperId) {
  return request({
    url: `https://www.acfun.cn/rest/pc-direct/fansClub/fans/medal/extraInfo?uperId=${uperId}`,
    method: "get",
  });
}
