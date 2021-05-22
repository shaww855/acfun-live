const { useObsDanmaku } = require('./config.json')

/**
* 补零
* @param {*} value
* @param {Number} digits 理想位数 默认2
*/
const padNum = (value, digits = 2) => Array(digits - value.toString().length + 1).join('0') + value

/**
 * 格式化时间
 * @param {Date}} time 时间戳
 */
const formartDate = (time) => {
  let date = new Date(time)
  return `${date.getFullYear()}/${padNum(date.getMonth() + 1)}/${padNum(date.getDate())} ${padNum(date.getHours())}:${padNum(date.getMinutes())}:${padNum(date.getSeconds())}`
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
 function getUidByUrl(url) {
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