const { useObsDanmaku } = require('./config.json')

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
 * @param {String} action 
 */
const formartDate = (time, action = '日期时间') => {
  let date = new Date(time)
  const dateString = `${date.getFullYear()}-${padNum(date.getMonth() + 1)}-${padNum(date.getDate())}`
  if (action === '日期') {
    return dateString
  }
  return `${dateString} ${padNum(date.getHours())}:${padNum(date.getMinutes())}:${padNum(date.getSeconds())}`
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
function getUidByUrl (url) {
  return Number(useObsDanmaku ? url.split('/')[4].split('?')[0] : url.split('/')[4])
}

/**
 * 返回页面是否是直播间
 * @param {String} url 
 */
const isLiveTab = url => {
  return url.includes(useObsDanmaku ? "live.acfun.cn/room/" : "live.acfun.cn/live/")
}

module.exports = {
  padNum,
  formartDate,
  orderBy,
  getUidByUrl,
  isLiveTab
}