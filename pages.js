// 配置文件
const config = require('./config.json')
// 工具类函数
const { formartDate, orderBy, getUidByLink, isLiveTab } = require('./util.js')
const puppeteer = require('puppeteer');

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
  // let browser = await puppeteer.connect({
  //   browserWSEndpoint
  // }).then(async browser => {
  //   console.log('连接浏览器成功');
    await browser.pages().then(pages => {
      // console.log('获取页面对象成功');
      // pages.forEach(async (page, index) => {
      //   console.log(index, '标题', await page.title());
      // })
      let target = pages.find(page => !isLiveTab(page))
      if (target === undefined) {
        console.log('没有打开AC主页的标签');
      }
      page = target
    }).catch(err => {
      console.log('获取页面对象失败');
      // console.log(err);
      clearTimeout(timeId)
      throw err
    })
  //   return browser
  // }).catch(err => {
  //   console.log('连接浏览器失败');
  //   console.log(err);
  // })

  if (config.checkWearMedal) {
    getPersonalInfo(page).then(personalInfoJson => {
      if (personalInfoJson === undefined || personalInfoJson.info === undefined) {
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
  }

  const handle = await page.evaluateHandle(async () => {
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
    ).catch(err => {
      console.log('失败');
      console.log(err);
    })
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
    ).catch(err => {
      console.log('失败');
      console.log(err);
    })

    const allLiveRoom = await Promise.all([
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
    let liveAndClub = allLiveRoom.filter(e => e.fansClub)
    // console.log('liveAndClub', liveAndClub);
    // console.log(`关注的主播已开播${allLiveRoom.length}位，其中${liveAndClub.length}拥有粉丝牌`);
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
    }).then(isLiveList => {
      // await handle.jsonValue()
      console.log('拥有牌子并且开播的直播间数', isLiveList.length, isLiveList);
      return isLiveList
    }).catch(err => {
      console.log('获取所有牌子的当日信息失败');
      console.log(err);
      throw err
    })
  }).catch(err => {
    console.log('执行失败，页面刷新1分钟后重试');
    console.log(err);
    clearTimeout(timeId)
    // return page.title().then(title => {
    //   console.log(title);
    // }).then(() => {
    //   return page.reload().then(() => {
    //     console.log('页面刷新成功');
    //     // 1分钟后重试
    //     setTimeout(id => {
    //       startMonitor(browserWSEndpoint, times + 1, id)
    //     }, 1000 * 60)
    //   })
    // })
  })

  DDVup(browser, handle)
    // .then(() => {
    setTimeout(id => {
      startMonitor(browser, times + 1, id)
    }, 1000 * 60 * config.checkLiveTimeout)
  // browser = null
  // }).catch(err => {
  //   console.log('DDVup error');
  //   console.log(err);
  // }).finally(() => {
    // if (handle && handle.dispose) {
    //   handle.dispose()
    //   console.log('handle被处置');
    // }
    // browser.disconnect()
  // })
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
              return page.reload()
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

    page.on('error', err => {
      console.log('page error', err);
    })

    return page.goto(`https://live.acfun.cn/live/${info.uperId}`).then(() => {
      console.log('进入直播', info.uperName);
      // afterOpenRoom(page)
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
function afterOpenRoom (page) {
  page.waitForSelector('.like-btn').then(() => {
    page.evaluate(() => {
      setTimeout(() => {
        document.querySelector('.like-btn').click()
        // 10分钟点赞一次
      }, 1000 * 60 * 10)
    }).catch(err => {
      console.log('执行点赞操作失败');
      console.log(err);
    })
  }).catch(err => {
    console.log('等待点赞按钮超时');
    console.log(err);
  })
}

/**
 * 开启DD监控室
 * @param {Object} browser 浏览器对象
 * @param {Array} liveUperInfo 直播中的用户uid数组
 */
async function DDVup (browser, handle) {
  let liveUperInfo = orderBy((await handle.jsonValue()).map(info => ({
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
  }).finally(() => {
    // console.log('处理 handle');
    handle.dispose()
      // .then(() => {
      //   // console.log('释放 browser');
      //   // browser.disconnect()
      // }).finally(() => {
      //   console.log('处理完毕');
      // })
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
    throw err
  })
}

module.exports = {
  userLogin,
  userLoginByCookies,
  startMonitor
}