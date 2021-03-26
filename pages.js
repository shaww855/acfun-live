// 配置文件
const config = require('./config.json')
// 工具类函数
const { formartDate, orderBy, getUidByLink, isLiveTab } = require('./util.js')
// const puppeteer = require('puppeteer');
const getInfo = require('./evaluateHandle')

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
 * @param {Object} browser 浏览器连接断点
 * @param {Number} times 检查次数
 * @param {Number} timeId 定时器ID
 */
async function startMonitor (browser, times = 0, timeId = null) {
  console.log('===');
  console.log('第', times + 1, '次检查直播状态', formartDate(new Date()))

  let page = null
  await browser.pages().then(pages => {
    let target = pages.find(page => !isLiveTab(page))
    if (target === undefined) {
      console.log('没有打开AC主页的标签');
    }
    page = target
  }).catch(err => {
    console.log('获取页面对象失败');
    clearTimeout(timeId)
    throw err
  })

  if (config.checkWearMedal) {
    getInfo('个人信息', page).then(res => {
      console.log(`用户 ${res.userName} ${res.userId}`);
      if (res.mediaWearInfo) {
        console.log(`当前佩戴 ${res.mediaWearInfo.level} ${res.mediaWearInfo.clubName} ${res.mediaWearInfo.uperName}`);
      } else {
        console.log('当前未佩戴牌子');
      }
    })
  }

  const allLiveRoom = await Promise.all([
    getInfo('粉丝牌列表', page),
    getInfo('关注并开播列表', page)
  ]).then(responseList => {
    return responseList[1].map(e => {
      const target = responseList[0].find(clubList => clubList.uperId === e.authorId)
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
    console.log('整合粉丝牌列表和已开播房间信息时失败', err);
    throw err
  })

  let checkLiveWatch = []
  let liveAndClub = allLiveRoom.filter(e => e.fansClub)
  liveAndClub.forEach(item => {
    checkLiveWatch.push(getInfo('当日时长', page, item.uperId))
  })
  const liveUperInfo = await Promise.all(checkLiveWatch).then(list => {
    // console.log('list', list)
    return list.map((e, i) => ({
      ...liveAndClub[i],
      timeLimitStr: e.liveWatchDegree + '/' + e.liveWatchDegreeLimit,
      noTimeLimit: e.liveWatchDegree < e.liveWatchDegreeLimit,
      timeDifference: e.liveWatchDegreeLimit - e.liveWatchDegree
    }))
  }).then(isLiveList => {
    console.log('拥有牌子并且开播的直播间数', isLiveList.length);
    return isLiveList
  }).catch(err => {
    console.log('获取所有牌子的当日信息失败');
    console.log(err);
    throw err
  })

  DDVup(browser, liveUperInfo)
  setTimeout(id => {
    startMonitor(browser, times + 1, id)
  }, 1000 * 60 * config.checkLiveTimeout)
}

/**
 * 检查已打开的页面，关闭符合条件的直播间，标记已打开的直播
 * @param {Object} browser 浏览器对象
 * @param {Array} list 正在直播的信息
 */
async function checkOpenedPages (browser, list) {
  // console.log('checkOpenedPages', list);
  let pages = await browser.pages()
  // console.log('循环当前标签页');
  const promiseList = []
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    if (!isLiveTab(page)) {
      // 不是直播间则跳过
    } else {
      const uid = Number(getUidByLink(page.url()))
      let target = list.find(e => e.uperId === uid)
      // console.log('target', target);
      if (target === undefined) {
        promiseList.push(roomExit(page, uid))
      } else {
        target.opened = true
        if (target.wearMedal && config.checkWearMedal) {
          console.log('因佩戴牌子，退出直播间', target.uperName);
          promiseList.push(roomExit(page, uid))
        } else {
          // await page.title().then(title => {
          //   console.log('检查', title);
          // })
          promiseList.push(
            page.$('.main-tip .active').then(elHandle => {
              if (elHandle === null) {
                return Promise.resolve()
              }
              console.log('继续监控 刷新', target.uperName);
              return elHandle.dispose().then(() =>
                page.reload()
              )
            }).catch((err) => {
              console.log('tipHandle fail');
              console.log(err);
            })
          )
        }
      }
    }
  }
  // console.log('循环结束', promiseList);
  await Promise.all(promiseList).then(() => {
    // console.log('>>>>>checkOpenedPages', list);
  }).catch(err => {
    console.log('检查已打开的页面失败');
    console.log(err);
  }).finally(() => {
    // console.log('>>>>>>checkOpenedPages done');
  })
  return list
}

/**
 * 退出直播间
 */
async function roomExit (page, uid, browser=null) {
  if (page === null) {
    const pages = await browser.pages()
    const patt = new RegExp("live.acfun.cn/live/")
    page = pages.find(p => {
      const isLiveRoom = patt.test(p.url())
      if (!isLiveRoom) {
        // 不是直播间则跳过
        return false
      }
      const pageUid = Number(getUidByLink(p.url()))
      if (uid === pageUid) {
        return true
      }
      return false
    })

    if (page === undefined) {
      return false
    }
  }

  if (page && page.isClosed()) {
    // 异步操作 检查牌子时已经执行退出
    return Promise.resolve()
  }
  return page
    .evaluate(() => document.querySelector('.up-name').textContent)
    .then(uperName => {
      console.log('退出直播', uperName)
    }).catch(err => {
      console.log('退出直播', uid)
      console.log(err)
    }).finally(() => {
      if (page.isClosed()) {
        // 异步操作
        return Promise.resolve()
      }
      return page.close()
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
  return browser.newPage().then(async page => {
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

    page.on('pageerror', error => {
      console.log('pageerror:', info.uperName, error.name, error.message);
    })

    return page.goto(`https://live.acfun.cn/live/${info.uperId}`).then(async () => {
      console.log('进入直播', info.uperName);
      await afterOpenRoom(page)
    }).catch(err => {
      console.log('进入直播间失败');
      console.log(err);
    })
    // return page.waitForNavigation()
  })
}

/**
 * 点赞
 * @param {Object} page 页面对象
 */
async function afterOpenRoom (page) {
  // page.waitForSelector('.like-btn').then(() => {
  //   page.evaluate(() => {
  //     setTimeout(() => {
  //       document.querySelector('.like-btn').click()
  //       // 10分钟点赞一次
  //     }, 1000 * 60 * 10)
  //   }).catch(err => {
  //     console.log('执行点赞操作失败');
  //     console.log(err);
  //   })
  // }).catch(err => {
  //   console.log('等待点赞按钮超时');
  //   console.log(err);
  // })
  const videoHandle = await page.waitForSelector('video')
  videoHandle.dispose()
  await page.evaluate(() => {
    // 这里不能用video.pause，因为video.play是个Promise
    const video = document.querySelector('video')
    video.src = ''
    // video.addEventListener('play', () => {
    //   video.pause()
    // })
    // 干掉弹幕池
    document.querySelector('.container-live-feed-messages').remove()
  })
  // videoHandle.evaluate(node => node.pause()).finally(() => {
  //   console.log('videoHandle evaluate');
  //   videoHandle.dispose()
  // })
}

/**
 * 开启DD监控室
 * @param {Object} browser 浏览器对象
 * @param {Array} liveUperInfo 直播中的用户uid数组
 */
async function DDVup (browser, liveUperInfo) {
  liveUperInfo = orderBy(liveUperInfo.map(info => ({
    // 配置不观看
    ...info,
    configUnWatch: config.uidUnwatchList.includes(info.uperId)
  })), ['configUnWatch', 'createTime'], ['asc', 'asc'])
  // console.log(liveUperInfo);

  if (liveUperInfo.length === 0) {
    console.log('---')
    console.log('拥有牌子的主播均未开播。')
    // console.log('---')
  }
  // console.log('>>>>before', liveUperInfo);
  await checkOpenedPages(browser, liveUperInfo)
  //   .then(list => {
  //   console.log('>>>>afert list', list);
  // })

  // liveUperInfo = await checkOpenedPages(browser, liveUperInfo)
  // console.log('afert',liveUperInfo);

  // console.log('await checkOpenedPages');
  // console.log('liveUperInfo', liveUperInfo);
  let limit = config.serverRoomLimit[config.serverIndex],
    msg = '',
    ignoreIndex = 0
  for (let index = 0; index < config.serverRoomLimit.length; index++) {
    const element = config.serverRoomLimit[index];
    if (index < config.serverIndex) {
      ignoreIndex += element
    }
  }
  console.log('---')
  let promiseList = []
  liveUperInfo.forEach((info, index) => {
    // console.log(index, limit, config.serverIndex, ignoreIndex);
    if (info.wearMedal && config.checkWearMedal) {
      msg = '佩戴牌子'
      limit++
      ignoreIndex++
      // roomExit(null, info.uperId, browser)
      promiseList.push(roomExit(null, info.uperId, browser))
    } else if (info.timeDifference == 0) {
      msg = '牌子已满'
      limit++
      ignoreIndex++
      // roomExit(null, info.uperId, browser)
      promiseList.push(roomExit(null, info.uperId, browser))
    } else if (config.serverIndex > 0 && index < ignoreIndex) {
      msg = `由其他服务器执行`
      limit++
      if (info.opened) {
        msg = `转移至其他服务器执行`
      }
      // roomExit(null, info.uperId, browser)
      promiseList.push(roomExit(null, info.uperId, browser))
    } else if (info.configUnWatch) {
      msg = '配置不看'
      // roomExit(null, info.uperId, browser)
      promiseList.push(roomExit(null, info.uperId, browser))
    } else if (config.serverRoomLimit[config.serverIndex] > 0 && index >= limit) {
      msg = '数量限制'
      // roomExit(null, info.uperId, browser)
      promiseList.push(roomExit(null, info.uperId, browser))
    } else if (info.opened) {
      msg = '继续监控'
    } else {
      msg = '进入直播'
      // roomOpen(browser, info)
      promiseList.push(roomOpen(browser, info))
    }
    if (config.showLiveInfo) {
      console.log(`开播时间 ${formartDate(info.createTime)}`);
      console.log(`标题： ${info.title}`);
      console.log(`${info.level}级`, info.clubName, `(${info.timeLimitStr})`, info.uperName, info.uperId);
      console.log(`[${ index + 1}/${liveUperInfo.length}] ${msg}`);
      console.log('---')
    }
  })
  await Promise.all(promiseList).then(() => {
  }).catch(err => {
    console.log('DD行为失败');
    console.log(err);
  })
}

module.exports = {
  userLogin,
  userLoginByCookies,
  startMonitor
}