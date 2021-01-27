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
console.log('直播间数量限制', config.liveRoomLimit);
puppeteer.launch({
  // devtools: true, // 开发者工具
  // headless: false, // 无头模式
  product: 'chrome',
  // defaultViewport: {
  //   width: 1366,
  //   height: 768
  // },
  executablePath: config.executablePath,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
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
    }
    else request.continue();
  });

  // 开始登录
  if (config.cookies !== '') {
    await userLoginByCookies(page)
    await page.goto('https://www.acfun.cn').catch(err => {
      console.log('跳转主页失败');
      console.log(err);
      page.browser().close()
    })
  } else {
    await userLogin(page)
  }
  page.evaluate(() => {
    document.write('')
  });

  // 检查登录状态
  let personalInfo = await page.waitForFunction(() => {
    return fetch(
      'https://www.acfun.cn/rest/pc-direct/user/personalInfo',
      {
        method: 'POST'
      }
    ).then(res => {
      return res.json()
    }).catch(err => {
      return err
    })
  })
  let personalInfoJson = await personalInfo.jsonValue()
  personalInfo.dispose()
  if (personalInfoJson.info) {
    console.log(`登录用户：${personalInfoJson.info.userName} ${personalInfoJson.info.userId}`);
    // 起飞
    startMonitor(page)
  } else {
    console.log('登录失败，请检查配置', personalInfoJson);
  }
})
