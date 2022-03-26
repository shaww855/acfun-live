const https = require('https');
const { version } = require('./package.json')

module.exports = () => {
  return new Promise((resolve, reject) => {
    // return https.get('https://gitee.com/cn_shaw/acfun-live/raw/main/package.json', { timeout:3000 }, (res) => {
    // return https.get('https://raw.githubusercontent.com/shilx/acfun-live/main/package.json', { timeout:3000 }, (res) => {
    return https.get('https://github.91chi.fun/https://raw.githubusercontent.com/shilx/acfun-live/main/package.json', { timeout:3000 }, (res) => {

      const { statusCode } = res;
      // const contentType = res.headers['content-type'];
  
      let error;
      // 任何 2xx 状态码都表示成功的响应，但是这里只检查 200。
      if (statusCode !== 200) {
        error = new Error('请求失败\n' +
          `状态码: ${statusCode}`);
        // } else if (!/^application\/json/.test(contentType)) {
        //   error = new Error('无效的 content-type.\n' +
        //     `期望的是 application/json 但接收到的是 ${contentType}`);
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
          reject(e.message)
        }
      });
    }).on('error', (e) => {
      reject(e.message)
    });
  }).then(res => {
    let msg = `当前版本：${version}，`
    if (res.version) {
      if (res.version === version) {
        msg += '已是最新'
      } else {
        msg += `GitHub版本 ${res.version}，请前往查看 https://github.com/shilx/acfun-live/releases` 
      }
      console.log(msg);
    } else {
      throw new Error('读取版本号失败')
    }
  }).catch(err => {
    console.error('检查更新失败，请前往查看 https://github.com/shilx/acfun-live/releases');
    console.error(err)
  })
}