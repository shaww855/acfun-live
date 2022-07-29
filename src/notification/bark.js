const https = require('node:https')
module.exports = function (path) {
  return new Promise((resolve, reject) => {
    path = encodeURI(path)

    const options = {
      hostname: 'api.day.app',
      port: 443,
      path,
      method: 'GET'
    }

    console.log('通知 Bark Webhook');
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