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
async function userLogin (page) {
  await page.goto('https://www.acfun.cn/login')
  console.log('page navigation');
  const loginSwitch = '#login-switch'
  await page.waitForSelector(loginSwitch)
  await page.click(loginSwitch)

  console.log('sign in...');
  await page.type('#ipt-account-login', config.account);
  await page.type('#ipt-pwd-login', config.password);
  const loginBtnSelector = '.btn-login'
  await page.waitForSelector(loginBtnSelector);
  await page.click(loginBtnSelector)
  console.log('logged!');

  await page.waitForNavigation()
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
  DDVup(await page.browser().pages(), isLiveList)
  times++
}

/**
 * 从网址中获取uid
 * @param {String} link 网址
 */
function getUidByLink (link) {
  return link.split('/')[4]
}

// 即使是DD，爱也是有限度的吧
function DDlimit (list) {
  console.log('---');

  config.uidSortList = config.uidSortList.reverse()
  list.forEach(info => {
    // 配置优先级
    info.configOrder = config.uidSortList.findIndex(e => e === info.uperId)
    // 配置不观看
    info.configUnWatch = config.uidUnwatchList.includes(info.uperId)
  })

  // 配置观看、配置排序、牌子最快升级
  list = orderBy(list, ['configUnWatch', 'configOrder', 'friendshipToLevelUp'], ['asc', 'desc', 'asc'])

  // 直播间数量限制
  list = list.map((info, index) => {
    let configWatch = false
    if (config.liveRoomLimit === 0) {
      configWatch = true
    } else {
      configWatch = index < config.liveRoomLimit
    }

    // console.log('主播：', info.uperName, info.uperId, `开播于 ${formartDate(info.createTime)}`);
    // console.log('标题：', info.title);
    // console.log('牌子：', info.level, info.clubName, `(${info.timeLimitStr})`, `获取于 ${formartDate(info.joinClubTime)}`,);
    // console.log('届不到', !unlimitedLove);
    console.log(info.level, info.clubName, `(${info.timeLimitStr})`, info.uperName, info.uperId);
    console.log(configWatch ? '✔' : '✘', info.title, `[${formartDate(info.createTime)}]`);
    console.log('---');

    return {
      ...info,
      configWatch
    }
  })
  console.log(JSON.stringify(list));

  return list.filter(e => e.configWatch)
}

/**
 * 开启DD监控室
 * @param {Object} pages 已打开的页面对象
 * @param {Array} liveUperInfo 直播中的用户uid数组
 */
async function DDVup (pages, liveUperInfo) {
  liveUperInfo = DDlimit(liveUperInfo)
  console.log(JSON.stringify(liveUperInfo));
  let liveUidList = liveUperInfo.map(e => e.authorId)
  const patt = new RegExp("live.acfun.cn/live/")
  const openedUid = []
  pages.filter(p => patt.test(p.url())).forEach((page, index) => {
    const uid = Number(getUidByLink(page.url()))
    if (liveUidList.includes(uid)) {
      // 直播仍继续
      openedUid.push(uid)
    } else {
      page.evaluate(() => document.querySelector('.up-name').textContent)
        .then(uperName => {
          console.log('退出直播间', uperName);
          page.close()
        })
    }
  })

  liveUidList.filter(e => !openedUid.includes(e)).forEach((uid, index) => {
    pages[0].browser().newPage().then(async page => {
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

      page.goto(`https://live.acfun.cn/live/${uid}`).then(() => {
        page.evaluate(() => document.querySelector('.up-name').textContent).then(uperName => {
          console.log('进入直播间', uperName);
          page.waitForSelector('.like-btn').then(() => {
            page.evaluate(() => {
              setTimeout(() => {
                document.querySelector('.like-btn').click()
                // 10分钟点赞一次
              }, 1000 * 60 * 10)
            }).catch(err => {
              console.log(uperName, '执行点赞操作失败', err);
            })
          }).catch(err => {
            console.log(uperName, '等待点赞按钮超时', err);
          })
        })
      }).catch(err => {
        console.log(uid, '进入直播间超时', err);
      })
    })
  })
}

process.on('uncaughtException', err => {
  console.log(err)
  Browser.close()
  process.exit(1) //强制性的（根据 Node.js 文档）
})
process.on("unhandledRejection", err => {
  console.log(err)
  Browser.close()
  process.exit(1) //强制性的（根据 Node.js 文档）
});


let Browser = null
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
  Browser = browser
  const pageList = await browser.pages()
  const page = pageList[0]
  await page.setRequestInterception(true);
  page.setDefaultTimeout(config.defaultTimeout * 1000 * 60)

  page.on('error', async error => {
    console.log(error);
    await browser.close()
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
    await page.goto('https://www.acfun.cn')
  } else {
    await page.goto('https://www.acfun.cn')
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
    setInterval(() => {
      startMonitor(page)
    }, 1000 * 60 * config.checkLiveTimeout)
  } else {
    console.log('登录失败，请检查配置');
  }
})
