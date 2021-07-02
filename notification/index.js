const { checkLiveTimeout, notification, iftttKey, barkKey } = require('../config.json')
const IFTTT = require('./ifttt')
const BARK = require('./bark')
const { formartDate } = require('../util')
let data = {}

module.exports = (liveUperInfo) => {
  if (notification === false || notification.length === 0) return
  const hours = new Date().getHours()
  if (hours === 0 && new Date().getMinutes() < 10) {
    // 每天0点10分触发 清空
    data = {}
  }
  if (hours < 6) {
    console.log('开播通知 0 ~ 6 点默认不发送');
    return
  }

  let needToSend = []
  liveUperInfo.forEach(element => {
    const target = data[element.uperId]
    if (target !== undefined) {
      // 已经通知过
      if ((new Date().getTime() - element.createTime) > 1000 * 60 * checkLiveTimeout) {
        // 开播超过十分钟
        return
      }
      // 虽然通知过,但配置的时间内再次开播,也会进行通知
    }
    needToSend.push(element)
    data[element.uperId] = element
  });

  if (typeof notification === 'object') needToSend = needToSend.filter(e => notification.includes(e.uperId))

  if (needToSend.length === 0) return

  let message = ''
  if (needToSend.length > 6) {
    message = needToSend[0].uperName + ` 等${needToSend.length}位主播`
  } else {
    message = needToSend.map(e => e.uperName).join('，') + ' '
  }
  message += `已经开播 \n ${formartDate(new Date())}`

  const sendFn = (fn) => {
    fn({
      title: 'Acfun 开播通知',
      message,
      url: `https://m.acfun.cn/live/detail/${needToSend[0].authorId}`
    }).then(res => {
      console.log(`开播通知 ${fn.name}发送成功`);
    }).catch(err => {
      console.log(`开播通知 ${fn.name}发送失败`);
      console.error(err)
    })
  }

  if (iftttKey !== '') {
    sendFn(IFTTT)
  }
  if (barkKey !== '') {
    sendFn(BARK)
  }

  if (iftttKey + barkKey === '') {
    console.log('开播通知 发送失败，未配置相关key。');
    return
  }
}