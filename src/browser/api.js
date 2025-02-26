import request from './request.js';

/**
 * 获取二维码
 * @returns
 */
export function qrcodeStart() {
  return request({
    url: `https://scan.acfun.cn/rest/pc-direct/qr/start?type=WEB_LOGIN&_=${Date.now()}`,
    method: 'get',
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
    method: 'get',
    timeout: 2 * 60 * 1000,
  });
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
    method: 'get',
    timeout: 2 * 60 * 1000,
  });
}

/**
 * 个人信息
 * @returns
 */
export function personalInfo() {
  return request({
    url: 'https://live.acfun.cn/rest/pc-direct/user/personalInfo',
    method: 'get',
  });
}

/**
 * 守护团列表
 * @returns
 */
export function medalList() {
  return request({
    url: 'https://www.acfun.cn/rest/pc-direct/fansClub/fans/medal/list',
    method: 'get',
  });
}

/**
 * 全站已开播列表
 * @returns
 */
export function channelList() {
  return request({
    url: 'https://live.acfun.cn/api/channel/list?count=200&pcursor=0',
    method: 'get',
  });
}

/**
 * 关注并开播列表
 * @returns
 */
export function channelListFollow() {
  return request({
    url: 'https://live.acfun.cn/api/channel/list?count=100&pcursor=&filters=[%7B%22filterType%22:3,+%22filterId%22:0%7D',
    method: 'get',
  });
}

/**
 * 粉丝团当日时长
 * @returns
 */
export function extraInfo(uperId) {
  return request({
    url: `https://www.acfun.cn/rest/pc-direct/fansClub/fans/medal/extraInfo?uperId=${uperId}`,
    method: 'get',
  });
}

/**
 * 获取登录用户的关于该主播的信息
 * @param {String} uperId uid
 * @returns
 */
export function medalInfo(uperId) {
  return request({
    url: `https://live.acfun.cn/rest/pc-direct/fansClub/live/medalInfo?uperId=${uperId}`,
    method: 'get',
  });
}
