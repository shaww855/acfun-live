let data = {}

const { getConfig, formartDate } = require('../util.js')
const IFTTT = require('./ifttt')
const BARK = require('./bark')

/**
 * 发送开播通知
 * @param {Array} liveUperInfo 开播的主播信息
 * @returns 
 */
function liveStart (liveUperInfo) {
  const { checkLiveTimeout, notification, iftttKey, barkKey } = getConfig()
  if (notification === false || notification.length === 0) return
  if (iftttKey + barkKey === '') {
    console.log('开播通知 发送失败，未配置相关key。');
    return
  }
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

  if (needToSend.length === 1) {
    message = `主播：${ needToSend[0].uperName }\n时间：${formartDate(needToSend[0].createTime, '时间')}\n标题：${needToSend[0].title}` 
  } else if (needToSend.length > 10) {
    message = `${ needToSend.slice(0, 10).map(e => e.uperName).join('、 ') } 等 ${needToSend.length} 位主播已开播` 
  } else {
    message = `${needToSend.map(e => e.uperName).join('、 ')} 已经开播`
  }

  let fn = null
  let path = ''
  const title = 'Acfun 开播通知'
  const url = `https://m.acfun.cn/live/detail/${needToSend[0].authorId}`
  const headUrl = needToSend[0].headUrl.split('?')[0]
  const badge = needToSend.length

  if (iftttKey !== '') {
    fn = IFTTT
    path = `/trigger/acfun_live/with/key/${iftttKey}?value1=${title}&value2=${message}&value3=${url}`
  }
  if (barkKey !== '') {
    fn = BARK
    path = `/${barkKey}/${title}/${message.replace('/', '')}?url=${url}&group=acfun&icon=${headUrl}&badge=${badge}`
  }
  fn(path).then(res => {
    console.log(`开播通知 发送成功`);
  }).catch(err => {
    console.log(`开播通知 发送失败`);
    console.error(err)
  })
}

/**
 * 发送通知
 * @param {String} message 通知内容
 * @param {String} url 点击通知跳转的链接
 * @returns 
 */
function notify (message, url = '') {
  const config = getConfig()
  if (config === null) {
    return
  }
  const { notification, iftttKey, barkKey } = config
  if (notification === false || notification.length === 0) return
  if (iftttKey + barkKey === '') {
    console.log('通知 发送失败，未配置相关key。');
    return
  }

  let fn = null
  let path = ''
  const title = '挂牌子工具通知'
  const headUrl = 'https://tvax4.sinaimg.cn/crop.0.2.1020.1020.180/8faf3cccly8gditbjc4o1j20sf0sfae7.jpg'

  if (iftttKey !== '') {
    fn = IFTTT
    path = `/trigger/acfun_live/with/key/${iftttKey}?value1=${title}&value2=${message}`
    if(url !== '') path += `&value3=${url}`
  }
  if (barkKey !== '') {
    fn = BARK
    path = `/${barkKey}/${title}/${message.replace('/', '')}?group=acfun&icon=${headUrl}`
    if(url !== '') path += `&url=${url}`
  }
  fn(path).then(res => {
    console.log(`通知 发送成功`);
  }).catch(err => {
    console.log(`通知 发送失败`);
    console.error(err)
  })
}

module.exports = {
  liveStart,
  notify
}