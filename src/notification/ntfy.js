const https = require('node:https')
module.exports = function (path) {
  return new Promise((resolve, reject) => {
    path = encodeURI(path)

    const options = {
      hostname: 'ntfy.shaww.net',
      port: 443,
      path,
      method: 'GET'
    }

    console.log('通知 NTFY Webhook');
    console.log('https://' + options.hostname + options.path);

    const req = https.request(options, res => {
      if (res.statusCode === 200) {
        // console.log('NTFY发送开播通知成功',);
        resolve('ok')
      }

      // res.on('data', d => {
      //   process.stdout.write(d)
      // })
    })

    req.on('error', error => {
      reject(error)
      // console.error('NTFY发送开播通知失败', error)
    })

    req.end()
  })
}