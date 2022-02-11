const https = require('https')
const { barkKey } = require('../config.json')
module.exports = ({ title, message, url, headUrl }) => {
  return new Promise((resolve, reject) => {

    let path = encodeURI(`/${barkKey}/${title.replace('/', '')}/${message.replace('/', '')}?url=${url}&group=acfun&icon=${headUrl}`)

    const options = {
      hostname: 'api.day.app',
      port: 443,
      path,
      method: 'GET'
    }

    console.log('开播通知 Bark Webhook');
    console.log('https://' + options.hostname + options.path);

    const req = https.request(options, res => {
      if (res.statusCode === 200) {
        // console.log('Bark发送开播通知成功',);
        resolve('ok')
      }

      // res.on('data', d => {
      //   process.stdout.write(d)
      // })
    })

    req.on('error', error => {
      reject(error)
      // console.error('Bark发送开播通知失败', error)
    })

    req.end()
  })
}