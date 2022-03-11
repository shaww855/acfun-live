module.exports = ({ title, message, url }) => {
  const https = require('https')
  const { iftttKey } = require('../config.json')
  return new Promise((resolve, reject) => {

    let path = encodeURI(`/trigger/acfun_live/with/key/${iftttKey}?value1=${title}&value2=${message}&value3=${url}`)

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