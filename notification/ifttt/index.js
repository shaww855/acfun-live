const https = require('https')
const { formartDate } = require('../../util.js')
const { iftttKey } = require('../../config.json')
module.exports = (uperList) => {
  return new Promise((resolve, reject) => {
    let uperNameList = ''
    if (uperList.length > 6) {
      uperNameList = uperList[0].uperName + ` 等${uperList.length}名主播`
    } else {
      uperNameList = uperList.map(e => e.uperName).join('，') + ' '
    }

    let path = encodeURI(`/trigger/acfun_live/with/key/${iftttKey}?value1=${uperNameList}&value2=${formartDate(new Date)}&value3=https://m.acfun.cn/live/detail?${uperList[0].authorId}`)

    const options = {
      hostname: 'maker.ifttt.com',
      port: 443,
      path,
      method: 'GET'
    }

    console.log('开播通知 IFTTT Webhook');
    console.log('https://' + options.hostname + options.path);

    const req = https.request(options, res => {
      if (res.statusCode === 200) {
        // console.log('IFTTT发送开播通知成功',);
        resolve('ok')
      }

      // res.on('data', d => {
      //   process.stdout.write(d)
      // })
    })

    req.on('error', error => {
      reject(error)
      // console.error('IFTTT发送开播通知失败', error)
    })

    req.end()
  })
}