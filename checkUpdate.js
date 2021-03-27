const https = require('https');
const { version } = require('./package.json')

module.exports = function () {
  return new Promise((resolve, reject) => {
    console.log('当前版本', version);
    console.log('https.get https://raw.githubusercontent.com/shilx/acfun-live/main/package.json');
    https.get('https://raw.githubusercontent.com/shilx/acfun-live/main/package.json', (res) => {
    // https.get('https://log-sdk.gifshow.com/rest/wd/common/log/collect/acfun', (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];
    
      let error;
      // 任何 2xx 状态码都表示成功的响应，但是这里只检查 200。
      if (statusCode !== 200) {
        error = new Error('请求失败\n' +
          `状态码: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('无效的 content-type.\n' +
          `期望的是 application/json 但接收到的是 ${contentType}`);
      }
      if (error) {
        // console.error(error.message);
        // 消费响应的数据来释放内存。
        res.resume();
        reject(error.message)
      }
    
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          // console.log(parsedData);
          resolve(parsedData)
        } catch (e) {
          console.error(e.message);
        }
      });
    }).on('error', (e) => {
      reject(e.message)
    });
  }).then(res => {
    if (res.version) {
      console.log(`服务器版本是${res.version}，请前往查看 https://github.com/shilx/acfun-live`);
    } else {
      throw new Error('读取版本号失败')
    }
  }).catch(err => {
    console.error('检查更新失败', err);
  })
}