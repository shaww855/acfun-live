"use strict";

const fs = require("fs")

/**
* 补零
* @param {*} value
* @param {Number} digits 理想位数 默认2
* @param {String} pad 填充的字符 默认0
*/
const padNum = (value, digits = 2, pad = '0') => String(value).padStart(digits, pad)

/**
 * 格式化时间
 * @param {Date} time 时间戳
 * @param {String} action 日期\时间\日期时间\
 */
const formartDate = (time, action = '日期时间') => {
  let date = new Date(time)
  const DateString = `${date.getFullYear()}-${padNum(date.getMonth() + 1)}-${padNum(date.getDate())}`
  const TimeString = `${padNum(date.getHours())}:${padNum(date.getMinutes())}:${padNum(date.getSeconds())}`
  if (action === '日期') {
    return DateString
  } else if (action === '时间') {
    return TimeString
  }
  return `${DateString} ${TimeString}`
}

/**
 * 排序对象数组
 * @author https://www.css88.com/30-seconds-of-code/#orderby
 * @param {Array} arr 
 * @param {Array} props 需要排序的值数组
 * @param {Array} orders asc desc
 */
const orderBy = (arr, props, orders) =>
  [...arr].sort((a, b) =>
    props.reduce((acc, prop, i) => {
      if (acc === 0) {
        const [p1, p2] = orders && orders[i] === 'desc' ? [b[prop], a[prop]] : [a[prop], b[prop]];
        acc = p1 > p2 ? 1 : p1 < p2 ? -1 : 0;
      }
      return acc;
    }, 0)
  )

/**
 * 返回网址中的UID
 * @param {String} url 网址
 * @returns {Number}
 */
const getUidByUrl = url => Number(getConfig().useObsDanmaku ? url.split('/')[4].split('?')[0] : url.split('/')[4])

/**
 * 返回页面是否是直播间
 * @param {String} url 
 */
const isLiveTab = url => {
  return url.includes(getConfig().useObsDanmaku ? "live.acfun.cn/room/" : "live.acfun.cn/live/")
}

const configPath = "./config.json"
let configCache = null

/**
 * 获取配置文件
 */
const getConfig = () => {
  if (configCache !== null) {
    // 存在缓存则直接返回
    return configCache
  }
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    console.log(`= config.json config 已读取 =`);
    if (global.configCache) {
      // 需要设置缓存
      configCache = config
    }
    return config
  } else {
    return null
  }
}

const setConfig = ({
  prop = null,
  value = '',
  userConfig = {}
}) => {
  let config = getConfig()
  if (prop === null) {
    config = {
      ...config,
      ...userConfig,
      version: global.version
    }
  } else if (prop === 'cookies') {
    config.cookies = value.map(e => ({
      name: e.name,
      value: e.value,
      domain: e.domain
    }))
  } else {
    config[prop] = value
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
  console.log(`= config.json cookies 已保存 =`);
}

/**
 * 对比版本号是否有更新
 * @param {String} older 旧版本
 * @param {String} newer 新版本
 * @returns Boolean
 */
const hasNewVersion = (older, newer) => {
  newer = newer.split('.').map(e => Number(e))
  older = older.split('.').map(e => Number(e))
  if (newer.some(e => isNaN(e)) || older.some(e => isNaN(e))) {
    throw new Error('读取版本号失败')
  }
  return newer.some((e, i) => e > older[i])
}

module.exports = {
  padNum,
  formartDate,
  orderBy,
  getUidByUrl,
  isLiveTab,
  getConfig,
  setConfig,
  hasNewVersion,
}