const https = require('node:https');

module.exports = function (path) {
  return new Promise((resolve, reject) => {
    path = encodeURI(path);

    const options = {
      hostname: 'ntfy.shaww.net',
      port: 443,
      path,
      method: 'GET',
      timeout: 10000,
    };

    console.log('通知 NTFY Webhook');
    console.log('https://' + options.hostname + options.path);

    const req = https.request(
      {
        ...options,
        signal: AbortSignal.timeout(10000), // 全局 deadline，从发起算起
      }, (res) => {
      let body = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => { body += chunk; });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve('ok');
        } else {
          reject(new Error(`NTFY 返回非 2xx: ${res.statusCode}, body: ${body}`));
        }
      });

      res.on('error', reject);
    });

    req.on('timeout', () => {
      req.destroy(new Error('请求超时'));
    });

    req.on('error', reject);
    req.end();
  });
};