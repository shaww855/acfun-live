const puppeteer = require('puppeteer');
const config = require('./config.json')

// 检查次数
let times = 0
/**
 * 补零
 * @param {*} value 
 * @param {Number} digits 理想位数 默认2
 */
const padNum = (value, digits = 2) => Array(digits - value.toString().length + 1).join('0') + value

/**
 * 格式化时间
 * @param {Date}} time 时间戳
 */
const formartDate = (time) => {
  let date = new Date(time)
  return `${date.getFullYear()}/${padNum(date.getMonth() + 1)}/${padNum(date.getDate())} ${padNum(date.getHours())}:${padNum(date.getMinutes())}:${padNum(date.getSeconds())}`
}
/**
 * 排序对象数组
 * @author https://www.css88.com/30-seconds-of-code/#orderby
 * @param {Array} arr 
 * @param {Array} props 需要排序的值数组
 * @param {Array} orders asc desc
 */
const orderBy = (arr, props, orders) =>
  [...arr].sort((a, b) =>
    props.reduce((acc, prop, i) => {
      if (acc === 0) {
        const [p1, p2] = orders && orders[i] === 'desc' ? [b[prop], a[prop]] : [a[prop], b[prop]];
        acc = p1 > p2 ? 1 : p1 < p2 ? -1 : 0;
      }
      return acc;
    }, 0)
  );

/**
 * 用户登录
 * @param {Object} page 页面
 */
function userLogin (page) {
  return page.goto('https://www.acfun.cn/login').then(async () => {
    const loginSwitch = '#login-switch'
    await page.waitForSelector(loginSwitch)
    await page.click(loginSwitch)
    // console.log('sign in...');
    await page.type('#ipt-account-login', config.account);
    await page.type('#ipt-pwd-login', config.password);
    const loginBtnSelector = '.btn-login'
    await page.waitForSelector(loginBtnSelector);
    await page.click(loginBtnSelector)
    // console.log('logged!');
    await page.waitForNavigation()
  }).catch(err => {
    console.log('使用账号密码登录失败');
    console.log(err);
    page.browser().close()
  })
}

/**
 * 用Cookies登录
 * @param {Object} page 页面
 */
function userLoginByCookies (page) {
  let list = []
  config.cookies.split('; ').forEach(e => {
    const cookie = e.split('=')
    list.push(page.setCookie({
      name: cookie[0],
      value: cookie[1],
      domain: '.acfun.cn'
    }))
  })
  return Promise.all(list)
}

/**
 * 开始监控室
 * @param {Object} page 页面
 */
async function startMonitor (page) {
  console.log('===');
  console.log('第', times + 1, '次检查直播状态')
  let isLiveList = await page.evaluate(async () => {
    // 获取拥有粉丝牌的列表
    const fansClub = fetch(
      'https://www.acfun.cn/rest/pc-direct/fansClub/fans/medal/list',
      {
        method: 'POST'
      }
    ).then(
      res => res.json()
    ).then(
      res => res.medalList.map(e => ({
        clubName: e.clubName,
        currentDegreeLimit: e.currentDegreeLimit,
        friendshipDegree: e.friendshipDegree,
        friendshipToLevelUp: e.currentDegreeLimit - e.friendshipDegree,
        joinClubTime: e.joinClubTime,
        level: e.level,
        uperId: e.uperId,
        uperName: e.uperName,
        wearMedal: e.wearMedal
      }))
    )
    // 获取已开播的
    const getFollowLiveUsers = fetch(
      `https://www.acfun.cn/rest/pc-direct/live/followLiveUsers`,
      {
        method: 'POST',
      }
    ).then(
      res => res.json()
    ).then(
      res => res.liveUsers.map(e => ({
        authorId: e.authorId,
        title: e.title,
        createTime: e.createTime
      }))
    )

    // 所有有粉丝牌的直播间
    let liveAndClub = await Promise.all([
      fansClub,
      getFollowLiveUsers
    ]).then(responseList => {
      console.log('responseList', responseList);
      return responseList[1].map(e => {
        const target = responseList[0].find(clubList => clubList.uperId === e.authorId)
        console.log('target', target, e.authorId);
        if (target === undefined) {
          return {
            ...e,
            onLive: true,
            fansClub: false
          }
        }
        return {
          ...e,
          onLive: true,
          fansClub: true,
          ...target
        }
      })
    })
    let checkLiveWatch = []
    console.log('liveAndClub', liveAndClub);
    liveAndClub = liveAndClub.filter(e => e.fansClub)
    // 获取当日时长
    liveAndClub.forEach(item => {
      console.log('获取当日时长', item);
      checkLiveWatch.push(
        fetch(
          `https://www.acfun.cn/rest/pc-direct/fansClub/fans/medal/degreeLimit?uperId=${item.uperId}`
        ).then(
          res => res.json()
        ).then(res => {
          return res.medalDegreeLimit
        })
      )
    })
    return Promise.all(checkLiveWatch).then(list => {
      console.log('list', list)
      return list.map((e, i) => ({
        ...liveAndClub[i],
        timeLimitStr: e.liveWatchDegree + '/' + e.liveWatchDegreeLimit,
        noTimeLimit: e.liveWatchDegree < e.liveWatchDegreeLimit,
        timeDifference: e.liveWatchDegreeLimit - e.liveWatchDegree
      }))
    })
  });
  // console.log('isLiveList', isLiveList);
  DDVup(await page.browser(), isLiveList)
  times++
}

/**
 * 从网址中获取uid
 * @param {String} link 网址
 */
function getUidByLink (link) {
  return link.split('/')[4]
}

/**
 * 检查已打开的页面，关闭符合条件的直播间，标记已打开的直播
 * @param {Object} browser 浏览器对象
 * @param {Array} list 正在直播的信息
 */
async function checkOpenedPages (browser) {
  const patt = new RegExp("live.acfun.cn/live/")
  let pages = await browser.pages()
    pages.forEach(page => {
      const isLiveRoom = patt.test(page.url())
      if (!isLiveRoom) {
        // 不是直播间则跳过
        return
      }
      const uid = Number(getUidByLink(page.url()))
      let target = list.find(e => e.uperId === uid)
      if (target === undefined) {
        // 已经停止直播
        roomExit(page)
      } else {
        target.opened = true
        if (target.timeDifference === 0) {
          // 牌子已挂满
          roomExit(page)
        } else {
          // 继续监控
        }
      }
    })
  return list
}

/**
 * 退出直播间
 */
function roomExit (page) {
  page
    .evaluate(() => document.querySelector('.up-name').textContent)
    .then(uperName => {
      console.log('退出直播间', uperName)
    }).catch(err => {
      console.log('退出直播间时，获取主播昵称失败')
      console.log(err)
    }).finally(() => {
      page.close()
    })
}

/**
 * 进入直播间
 */
function roomOpen (browser, info) {
  browser.newPage().then(async page => {
    await page.setRequestInterception(true);
    page.setDefaultTimeout(config.defaultTimeout * 1000 * 60)
    page.on('error', async error => {
      console.log(error);
      await browser.close()
      process.exit(1)
    })
    page.on('request', request => {
      if (request.resourceType() === 'image') {
        request.continue({
          url: 'https://cdnfile.aixifan.com/static/common/widget/header/img/shop.e1c6992ee499e90d79e9.png'
        })
      } else if (request.url().includes('.flv')) {
        // 拦截直播流
        request.abort()
      } else if (request.url().includes('/log')) {
        // 拦截疑似日志
        request.abort()
      } else if (request.url().includes('/collect')) {
        // 拦截疑似错误收集
        request.abort()
      }
      else request.continue();
    });

    page.goto(`https://live.acfun.cn/live/${info.uperId}`).then(() => {
      console.log('进入直播间', info.uperName);
      page.waitForSelector('.like-btn').then(() => {
        page.evaluate(() => {
          setTimeout(() => {
            document.querySelector('.like-btn').click()
            // 10分钟点赞一次
          }, 1000 * 60 * 10)
        }).catch(err => {
          console.log(info.uperName, '执行点赞操作失败', err);
        })
      }).catch(err => {
        console.log(info.uperName, '等待点赞按钮超时', err);
      })
    }).catch(err => {
      console.log(info.uperName, '进入直播间超时', err);
      page.close()
    })
  })
}

/**
 * 开启DD监控室
 * @param {Object} browser 浏览器对象
 * @param {Array} liveUperInfo 直播中的用户uid数组
 */
async function DDVup (browser, liveUperInfo) {
  orderBy(liveUperInfo.map(info => {
    // 配置不观看
    info.configUnWatch = config.uidUnwatchList.includes(info.uperId)
  }), ['configUnWatch'], ['asc'])

  console.log(liveUperInfo);

  // 直播间数量限制
  liveUperInfo.map((info, index) => {
    // console.log('主播：', info.uperName, info.uperId, `开播于 ${formartDate(info.createTime)}`);
    // console.log('标题：', info.title);
    // console.log('牌子：', info.level, info.clubName, `(${info.timeLimitStr})`, `获取于 ${formartDate(info.joinClubTime)}`,);
    // console.log('届不到', !unlimitedLove);
    console.log(info.level, info.clubName, `(${info.timeLimitStr})`, info.uperName, info.uperId);
    console.log(`No.${index + 1}`, info.title, `[${formartDate(info.createTime)}]`);
    console.log('---')
    return info
  })

  liveUperInfo = checkOpenedPages(browser, liveUperInfo)

  let filter = liveUperInfo.filter(e => e.opened && e.timeDifference > 0)
  filter.forEach((info, index) => {
    if (!info.opened && !info.configUnWatch && info.timeDifference > 0) {
      if (index < config.liveRoomLimit) {
        roomOpen(info)
      } else {
        console.log(info.uperName, '数量限制', config.liveRoomLimit);
      }
    }
  })
}

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
  headless: false, // 无头模式
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
  // page.evaluate(() => {
  //   document.write('')
  // });

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
    setInterval(() => {
      startMonitor(page)
    }, 1000 * 60 * config.checkLiveTimeout)
  } else {
    console.log('登录失败，请检查配置', personalInfoJson);
  }
})
