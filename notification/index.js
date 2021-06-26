const { serverIndex, checkLiveTimeout, notification, iftttKey, barkKey } = require('../config.json')
const IFTTT = require('./ifttt')
let data = {}

module.exports = (liveUperInfo) => {
  if (!notification) return
  if (new Date().getHours() === 0) {
    // 每天0点清空发送记录
    data = {}
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


  const needToSend = []
  liveUperInfo.forEach(element => {
    const target = data[element.uperId]
    if (target !== undefined) {
      // 已经通知过
      return  
    }
    // if ((new Date().getTime() - element.createTime) > 1000 * 60 * checkLiveTimeout) {
    //   // 开播超过十分钟
    //   return
    // }
    needToSend.push(element)
    data[element.uperId] = element
  });

  if (needToSend.length === 0) return
  
  sendFn(needToSend).then(res => {
    console.log('开播通知 发送成功');
  }).catch(err => {
    console.log('开播通知 发送失败');
    console.error(err)
  })
}