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
 * 从网址中获取uid
 * @param {String} link 网址
 */
const getUidByLink = link => link.split('/')[4]

/**
 * 返回页面是否是直播间
 * @param {Object} page 
 */
const isLiveTab = page => {
  const patt = new RegExp("live.acfun.cn/live/")
  return patt.test(page.url())
}

module.exports = {
  padNum,
  formartDate,
  orderBy,
  getUidByLink,
  isLiveTab
}