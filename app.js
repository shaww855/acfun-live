const puppeteer = require('puppeteer');
// 配置文件
const config = require('./config.json')
// 页面操作
const {
  userLogin,
  userLoginByCookies,
  startMonitor
} = require('./pages.js')

process.on('uncaughtException', err => {
  console.log(err)
  process.exit(1)
})
process.on("unhandledRejection", err => {
  console.log(err)
  process.exit(1)
});

console.log(`每(分钟)检查直播`, config.checkLiveTimeout);
console.log(`异步操作最多等待(分钟)`, config.defaultTimeout);
console.log('设置了不看', config.uidUnwatchList);
console.log('显示详细直播信息', config.showLiveInfo);
console.log('佩戴牌子的主播不观看', config.checkWearMedal);
console.log('服务器矩阵配置', config.serverRoomLimit);
console.log('当前第', config.serverIndex, '台');
puppeteer.launch({
  // devtools: true, // 开发者工具
  // headless: false, // 无头模式
  product: 'chrome',
  // defaultViewport: {
  //   width: 1366,
  //   height: 768
  // },
  executablePath: config.executablePath,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-crash-reporte',
    '--disable-extensions',
    '--disable-smooth-scrolling',
    '--enable-auto-reload', // 错误页自动刷新
    '--enforce-gl-minimums', // Enforce GL minimums
    '--no-crash-upload',
    '--suppress-message-center-popups',
    '–single-process'
  ]
}).then(async browser => {
  const pageList = await browser.pages()
  const page = pageList[0]
  await page.setRequestInterception(true);
  page.setDefaultTimeout(config.defaultTimeout * 1000 * 60)

  page.on('error', async error => {
    console.log(error);
    process.exit(1)
  })

  page.on('request', request => {
    if (request.resourceType() === 'image') {
      // 随便塞一个小图片，减少资源占用
      request.continue({
        url: 'https://cdnfile.aixifan.com/static/common/widget/header/img/shop.e1c6992ee499e90d79e9.png'
      })
    } else if (request.url().includes('/perfLog')) {
      // 拦截日志
      request.abort()
    } else {
      request.continue();
    }
  });

  // 开始登录
  if (config.cookies !== '') {
    console.log('登录方式 Cookie');
    await userLoginByCookies(page)
    await page.goto('https://www.acfun.cn').catch(err => {
      console.log('跳转主页失败');
      console.log(err);
      page.browser().close()
    })
  } else {
    console.log('登录方式 账号');
    await userLogin(page)
  }
  page.evaluate(() => {
    document.write('')
  });

  // const browserWSEndpoint = browser.wsEndpoint();
  // // 起飞
  // startMonitor(browserWSEndpoint)
  startMonitor(browser)
})
