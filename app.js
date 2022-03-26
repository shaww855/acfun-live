module.exports = function () {
  const schedule = require('node-schedule');
  const puppeteer = require('puppeteer');

  // 配置文件
  const { getConfig, setConfig } = require('./util.js')
  const config = getConfig()

  // 页面操作
  const {
    userLogin,
    userLoginByCookies,
    startMonitor,
    endMonitor,
    requestFliter,
    handlePageError
  } = require('./pages.js')

  console.log('调试模式', config.debug);
  console.log('每天0~1点自动重启', config.autoRestart);
  console.log(`每(分钟)检查直播`, config.checkLiveTimeout);
  if (config.likeBtnTimeout > 0) {
    console.log(`每(分钟)点赞一次`, config.likeBtnTimeout);
  } else {
    console.log('自动点赞已关闭');
  }
  console.log(`异步操作最多等待(分钟)`, config.defaultTimeout);
  console.log('使用OBS弹幕工具监控', config.useObsDanmaku,);
  console.log('设置了不看', config.uidUnwatchList);
  console.log('显示详细直播信息', config.showLiveInfo);
  console.log('佩戴牌子的主播不观看', config.checkWearMedal);
  console.log('监控未关注但是有牌子的主播', config.checkAllRoom);
  console.log('服务器矩阵配置', config.serverRoomLimit);
  console.log('当前第', config.serverIndex, '台');
  console.log('开播通知', config.notification);
  if (config.notification) {
    console.log('IFTTT', config.iftttKey ? '已启用' : '未启用')
    console.log('BARK', config.barkKey ? '已启用' : '未启用')
  }

  const Start = () => {
    puppeteer.launch({
      devtools: config.debug, // 开发发者工具
      // headless: false, // 无头模式
      product: 'chrome',
      // defaultViewport: {
      //   width: 1366,
      //   height: 768
      // },
      executablePath: config.executablePath,
      args: [
        // '--no-sandbox',
        // '--disable-setuid-sandbox',
        '--disable-crash-reporte',
        '--disable-extensions',
        '--disable-smooth-scrolling',
        '--enable-auto-reload', // 错误页自动刷新
        '--enforce-gl-minimums', // Enforce GL minimums
        '--no-crash-upload',
        '--suppress-message-center-popups',
      ]
    }).then(async browser => {
      console.log('puppeteer launched，Cookie状态：', config.cookies !== '');
      const pageList = await browser.pages()
      const page = pageList[0]
      await requestFliter(page)

      page.setDefaultTimeout(config.defaultTimeout * 1000 * 60)

      page.on('pageerror', error => {
        handlePageError(page, '主页', error)
      })

      // 开始登录
      if (config.cookies !== '') {
        console.log('登录方式 Cookie');
        await userLoginByCookies(page)
      } else if (config.account !== '' && config.password !== '') {
        console.log('登录方式 账号密码');
        await userLogin(page)
      } else {
        console.error('请填写 Cookie 或者 账号密码 以便登录')
      }

      // 起飞
      startMonitor(browser)

      if (config.autoRestart) {
        console.log(`[定时重启工具运行中，每天0点自动重启]`);
        schedule.scheduleJob({ rule: '01 00 * * *' }, function () {
          clearInterval(timeoutId)
          endMonitor(browser)
          Start()
        })
      }

    }).catch(err => {
      console.error(err)
      console.log('🐛puppeteer启动失败，5秒后自动关闭🐛');
      setTimeout(() => {
        process.exit(1)
      }, 5000)
    })
  }

  Start()
}