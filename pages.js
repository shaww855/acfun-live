// 配置文件
const config = require('./config.json')
// 工具类函数
const { formartDate, orderBy, getUidByLink } = require('./util.js')

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
 * @param {Number} times 检查次数
 * @param {Number} timeId 定时器ID
 */
async function startMonitor (page, times = 0, timeId = null) {
  console.log('===');
  console.log('第', times + 1, '次检查直播状态', formartDate(new Date()))

  getPersonalInfo(page).then(personalInfoJson => {
    if (typeof personalInfoJson !== 'object' || personalInfoJson.info === undefined) {
      console.log('读取用户信息失败', personalInfoJson);
      return
    }
    console.log(`用户 ${personalInfoJson.info.userName} ${personalInfoJson.info.userId}`);
    if (personalInfoJson.info.mediaWearInfo) {
      console.log(`当前佩戴 ${personalInfoJson.info.mediaWearInfo.level} ${personalInfoJson.info.mediaWearInfo.clubName} ${personalInfoJson.info.mediaWearInfo.uperName}`);
    } else {
      console.log('当前未佩戴牌子');
    }
  })

  page.evaluate(async () => {
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
      // console.log('responseList', responseList);
      return responseList[1].map(e => {
        const target = responseList[0].find(clubList => clubList.uperId === e.authorId)
        // console.log('target', target, e.authorId);
        if (target === undefined) {
          return {
            ...e,
            onLive: true,
            fansClub: false,
            wearMedal: false
          }
        }
        return {
          ...e,
          onLive: true,
          fansClub: true,
          ...target
        }
      })
    }).catch(err => {
      console.log('获取粉丝牌列表和已开播房间信息时失败', err);
      throw err
    })

    let checkLiveWatch = []
    // console.log('liveAndClub', liveAndClub);
    liveAndClub = liveAndClub.filter(e => e.fansClub)
    // 获取当日时长
    liveAndClub.forEach(item => {
      // console.log('获取当日时长', item);
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
      // console.log('list', list)
      return list.map((e, i) => ({
        ...liveAndClub[i],
        timeLimitStr: e.liveWatchDegree + '/' + e.liveWatchDegreeLimit,
        noTimeLimit: e.liveWatchDegree < e.liveWatchDegreeLimit,
        timeDifference: e.liveWatchDegreeLimit - e.liveWatchDegree
      }))
    }).catch(err => {
      console.log('获取所有牌子的当日信息失败');
      console.log(err);
      throw err
    })
  }).then(async isLiveList => {
    // console.log('isLiveList', isLiveList);
    DDVup(await page.browser(), isLiveList)

    setTimeout(id => {
      startMonitor(page, times + 1, id)
    }, 1000 * 60 * config.checkLiveTimeout)
  }).catch(err => {
    console.log('执行失败，1分钟后重试');
    console.log(err);
    clearTimeout(timeId)
    // 1分钟后重试
    setTimeout(id => {
      startMonitor(page, times + 1, id)
    }, 1000 * 60)
  })
}

/**
 * 检查已打开的页面，关闭符合条件的直播间，标记已打开的直播
 * @param {Object} browser 浏览器对象
 * @param {Array} list 正在直播的信息
 */
async function checkOpenedPages (browser, list) {
  // console.log('checkOpenedPages', list);
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
    // console.log('target', target);
    if (target === undefined) {
      roomExit(page, uid)
    } else {
      target.opened = true
      if (target.timeDifference === 0) {
        roomExit(page, uid)
      }
      if (target.wearMedal && config.checkWearMedal) {
        console.log('因佩戴牌子，退出直播间', target.uperName);
        roomExit(page, uid)
      }
    }
  })
  return list
}

/**
 * 退出直播间
 */
function roomExit (page, uid) {
  if (page.isClosed()) {
    // 异步操作 检查牌子时已经执行退出
    return
  }
  page
    .evaluate(() => document.querySelector('.up-name').textContent)
    .then(uperName => {
      console.log('退出直播', uperName)
    }).catch(err => {
      console.log('退出直播', uid)
      console.log(err)
    }).finally(() => {
      if (page.isClosed()) {
        // 异步操作
        return
      }
      page.close()
    })
}

/**
 * 进入直播间
 * @param {Object} browser 浏览器对象
 * @param {Object} info UP主信息
 * @param {Number} num 重试次数
 */
function roomOpen (browser, info, num = 0) {
  // console.log('roomOpen', info);
  browser.newPage().then(async page => {
    await page.setRequestInterception(true);
    page.setDefaultTimeout(config.defaultTimeout * 1000 * 60)
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
        // 拦截疑似错误信息收集
        request.abort()
      }
      else request.continue();
    });

    page.goto(`https://live.acfun.cn/live/${info.uperId}`).then(() => {
      console.log('进入直播', info.uperName);
      page.waitForSelector('.like-btn').then(() => {
        page.evaluate(() => {
          setTimeout(() => {
            document.querySelector('.like-btn').click()
            // 10分钟点赞一次
          }, 1000 * 60 * 10)
        }).catch(err => {
          console.log(info.uperName, '执行点赞操作失败');
          console.log(err);
        })
      }).catch(err => {
        console.log(info.uperName, '等待点赞按钮超时');
        console.log(err);
      })
    }).catch(err => {
      console.log(info.uperName, '进入直播间失败');
      console.log(err);
    })
  })
}

/**
 * 开启DD监控室
 * @param {Object} browser 浏览器对象
 * @param {Array} liveUperInfo 直播中的用户uid数组
 */
async function DDVup (browser, liveUperInfo, DDVup) {
  liveUperInfo = orderBy(liveUperInfo.map(info => ({
    // 配置不观看
    ...info,
    configUnWatch: config.uidUnwatchList.includes(info.uperId)
  })), ['configUnWatch', 'createTime'], ['asc', 'asc'])
  // console.log(liveUperInfo);

  if (liveUperInfo.length === 0) {
    console.log('---')
    console.log('拥有牌子的主播均未开播。')
    console.log('---')
  }
  liveUperInfo = await checkOpenedPages(browser, liveUperInfo)
  // console.log('liveUperInfo', liveUperInfo);
  if (config.showLiveInfo) {
    console.log('---')
    liveUperInfo.forEach((info, index) => {
      console.log(`开播时间 ${formartDate(info.createTime)}`, info.configUnWatch);
      console.log(`${info.level}级`, info.clubName, `(${info.timeLimitStr})`, info.uperName, info.uperId);
      console.log(`[${index + 1}/${liveUperInfo.length}]`, info.title);
      console.log('---')
    })
  }

  let limit = config.liveRoomLimit
  liveUperInfo.forEach((info, index) => {
    if (info.wearMedal) {
      console.log('佩戴牌子', info.uperName);
    } else if (info.opened) {
      console.log('继续监控', info.uperName);
    } else if (info.configUnWatch) {
      console.log('配置不看', info.uperName);
    } else if (info.timeDifference <= 0) {
      console.log('牌子已满', info.uperName);
      limit++
    } else if (config.liveRoomLimit > 0 && index >= limit) {
      console.log('数量限制', info.uperName);
    } else {
      roomOpen(browser, info)
    }
  })
}

/**
 * 获取个人信息
 */
function getPersonalInfo (page) {
  return page.waitForFunction(() => {
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
  }).then(async info => {
    let infoJson = await info.jsonValue()
    info.dispose()
    return infoJson
  }).catch(err => {
    console.log('登录失败，请检查');
    console.log(err);
  })
}

module.exports = {
  userLogin,
  userLoginByCookies,
  startMonitor,
  checkOpenedPages,
  roomExit,
  roomOpen
}