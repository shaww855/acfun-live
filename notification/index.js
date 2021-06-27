const { checkLiveTimeout, notification, iftttKey, barkKey } = require('../config.json')
const IFTTT = require('./ifttt')
let data = {}

module.exports = (liveUperInfo) => {
  if (notification === false || notification.length === 0) return
  const hours = new Date().getHours()
  if (hours === 0 && new Date().getMinutes() < 10) {
    // 每天0点10分触发 清空
    data = {}
  }
  if (hours < 6) {
    console.log('开播通知 0~6点默认不发送');
    return
  }

  let sendFn = undefined
  if (iftttKey !== '') {
    sendFn = IFTTT
  }
  if (barkKey !== '') {

  }
  if (sendFn === undefined) {
    console.log('开播通知 发送失败，未配置相关key。');
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
  
  if(typeof notification === 'object') needToSend = needToSend.filter(e => notification.includes(e.uperId))

  if (needToSend.length === 0) return

  sendFn(needToSend).then(res => {
    console.log('开播通知 发送成功');
  }).catch(err => {
    console.log('开播通知 发送失败');
    console.error(err)
  })
}