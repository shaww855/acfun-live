// 工具类函数
const { formartDate, orderBy, getUidByUrl, isLiveTab, getConfig, setConfig, writeOnVideoUrl } = require('../util.js')
const fs = require('node:fs')
const QRCode = require('qrcode')
const getInfo = require('./evaluateHandle.js')

const inquirer = require('inquirer')
// 报错计数
const errorTimes = {
  主页: 0
}
let monitorTimeoutId = null
let 检测到所有主播均未开播的次数 = 0

const { liveStart, notify } = require('./notification/index.js')
/**
 * 用户登录
 * @param {Object} page 页面
 */

function userLogin (page) {
  const config = getConfig()
  return new Promise(async (resolve, reject) => {
    const ui = new inquirer.ui.BottomBar();
    const clear = () => {
      clearInterval(timeId)
      console.log('');
      ui.close()
    }
    let second = 0
    const timeId = setInterval(() => {
      second++
      ui.updateBottomBar(`等待登录页响应...${second}s`);
      if (second > 30) {
        clear()
        reject(`** 等待登录超时 **`)
      }
    }, 1000)
    page.goto('https://www.acfun.cn/login', { waitUntil: 'domcontentloaded' }).then(async () => {
      clear()
      const loginSwitch = '#login-switch'
      await page.waitForSelector(loginSwitch)
      await page.click(loginSwitch)
      // console.log('sign in...');
      // if (global.platformIsWin) {
      await inquirer.prompt([{
        type: 'input',
        name: 'account',
        message: "请输入账号：",
        validate: function (input) {
          const done = this.async()
          if (input === '') {
            done('账号不能为空')
          } else {
            done(null, true)
          }
        }
      }, {
        type: 'password',
        message: '请输入密码：',
        mask: '*',
        name: 'password',
        validate: function (input) {
          const done = this.async()
          if (input === '') {
            done('密码不能为空')
          } else {
            done(null, true)
          }
        }
      }]).then(async answer => {
        await page.type('#ipt-account-login', answer.account);
        await page.type('#ipt-pwd-login', answer.password);
      })
      const loginBtnSelector = '.btn-login'
      await page.waitForSelector(loginBtnSelector);
      await page.click(loginBtnSelector)
      // await page.waitForNavigation()
    }).catch(err => {
      console.error(err);
      page.browser().close()
      reject('使用账号密码登录失败');
    })

    page.on('response', async response => {
      if (response.url().includes('/login/signin')) {
        const res = await response.json()
        if (res.result === 0) {
          if (config.debug === true || global.loginInfo.saveCookies || !global.platformIsWin) {
            await page.cookies().then(cookieList => {
              setConfig({ prop: 'cookies', value: cookieList })
            })
          }
          resolve()
        } else {
          reject(`** ${res.error_msg} ** `)
        }
      }
    })
  })
}

/**
 * 用Cookies登录
 * @param {Object} page 页面
 */
async function userLoginByCookies (page) {
  const config = getConfig()
  let list = []
  if (config.cookies instanceof Object) {
    config.cookies.forEach(e => {
      list.push(page.setCookie({
        name: e.name,
        value: e.value,
        domain: e.domain
      }))
    })
  } else {
    config.cookies.split('; ').forEach(e => {
      const cookie = e.split('=')
      list.push(page.setCookie({
        name: cookie[0],
        value: cookie[1],
        domain: '.acfun.cn'
      }))
    })
  }
  await Promise.all(list)
  return page.goto('https://www.acfun.cn', { waitUntil: 'domcontentloaded' }).catch(err => {
    console.log('跳转主页失败');
    console.log(err);
    page.browser().close()
  })
}

/**
 * 用户登录
 * @param {Object} page 页面
 * @param {Number} [scanTime=0] 扫码超时次数
 */
function userLoginByQrcode (page, scanTime = 0) {
  const config = getConfig()
  return new Promise(async (resolve, reject) => {
    const qrcodePath = "./qrcode.png"

    page.goto('https://www.acfun.cn/login', { waitUntil: 'domcontentloaded' }).catch(err => {
      console.error(err);
      page.browser().close()
      reject('打开登录页失败');
    })
    let timeId = null
    page.on('response', async response => {
      if (response.url().includes('/rest/pc-direct/qr/start')) {
        console.log('↓↓↓ 请使用 AcFun APP 扫码并确认登录 ↓↓↓');
        const res = await response.json()
        if (res.result === 0) {
          // 保存二维码图片至本地
          const base64Data = res.imageData
          const dataBuffer = Buffer.from(base64Data, 'base64')
          fs.writeFile(qrcodePath, dataBuffer, err => {
            if (err) {
              console.error(err);
            } else {
              console.log('如二维码图片无法扫描，请自行打开本工具目录下的二维码图片进行扫码');
            }
          })

          // 在终端中展示二维码图片
          QRCode.toString(`http://scan.acfun.cn/l/${res.qrLoginToken}`, { type: 'terminal', small: true }, function (err, url) {
            if (err) throw err
            console.log(url)
            let second = res.expireTime / 1000
            // let second = 20
            const ui = new inquirer.ui.BottomBar();
            timeId = setInterval(() => {
              second--
              ui.updateBottomBar(`二维码将在 ${second}秒 后失效`);
              if (second < 1) {
                clearInterval(timeId)
                ui.updateBottomBar(`二维码已失效`);
                console.log('');
                ui.close()

                if (scanTime < 20) {
                  console.log(`** 等待扫码登录超时 **`)
                  try {
                    fs.unlinkSync(qrcodePath);
                  } catch (err) {
                    console.log('二维码图片清理失败，可手动删除。');
                    console.error(err)
                  }
                  page.click('.refresh-btn').catch(err => {
                    console.error(err)
                    reject('重新获取二维码失败');
                  })
                } else {
                  reject('`** 等待扫码登录超时 **`')
                }
              }
            }, 1000)
          })
        } else {
          reject(`** ${res.error_msg} ** `)
        }
      }
      // // https://scan.acfun.cn/rest/pc-direct/qr/acceptResult
      // if (response.url().includes('/rest/pc-direct/qr/acceptResult')) {
      //   console.log('扫码成功，请确认登录');
      // }
      if (response.url() === 'https://www.acfun.cn/') {
        clearInterval(timeId)
        console.log('');
        console.log('扫码登录成功');
        try {
          fs.unlinkSync(qrcodePath);
        } catch (err) {
          console.log('二维码图片清理失败，可手动删除。');
          console.error(err)
        }
        await page.waitForNavigation()
        if (config.debug === true || global.loginInfo.saveCookies) {
          await page.cookies().then(cookieList => {
            setConfig({ prop: 'cookies', value: cookieList })
          })
        }
        resolve()
      }
    })
  })
}

/**
 * 开始监控室
 * @param {Object} browser 浏览器连接断点
 * @param {Number} times 检查次数
 */
async function startMonitor (browser, times = 0) {
  const config = getConfig()
  console.log('===');
  console.log('第', times + 1, '次检查直播状态', formartDate(new Date()))

  let page = null
  await browser.pages().then(pages => {
    let target = pages.find(page => !isLiveTab(page.url()))
    if (target === undefined) {
      console.log('没有打开AC主页的标签');
    }
    page = target
  }).catch(err => {
    console.log('获取页面对象失败');
    clearTimeout(monitorTimeoutId)
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
    }).catch(err => {
      console.error('获取个人信息失败')
    })
  }

  const promiseList = [
    getInfo('粉丝牌列表', page)
  ]

  promiseList.push(config.checkAllRoom ? getInfo('所有正在直播列表', page) : getInfo('关注并开播列表2', page))

  const allLiveRoom = await Promise.all(promiseList).then(responseList => {
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
    console.log('整合粉丝牌列表和已开播房间信息时失败');
    throw err
  })

  liveStart(allLiveRoom)
  const liveAndClub = allLiveRoom.filter(e => e.fansClub)

  let liveUperInfo = []
  // 顺序获取
  console.log('顺序获取粉丝牌信息');
  for (const iterator of liveAndClub) {
    await getInfo('当日时长', page, iterator.uperId).then(res => {
      liveUperInfo.push(res)
    })
  }

  console.log('拥有牌子并且开播的直播间数', liveUperInfo.length);
  liveUperInfo = liveUperInfo.map((e, i) => ({
    ...liveAndClub[i],
    timeLimitStr: e.liveWatchDegree + '/' + e.liveWatchDegreeLimit,
    noTimeLimit: e.liveWatchDegree < e.liveWatchDegreeLimit,
    timeDifference: e.liveWatchDegreeLimit - e.liveWatchDegree
  }))

  DDVup(browser, liveUperInfo)
  console.log(config.checkLiveTimeout, '分钟后检测粉丝牌进度');
  monitorTimeoutId = setTimeout(() => {
    startMonitor(browser, times + 1)
  }, 1000 * 60 * config.checkLiveTimeout)
}

/**
 * 关闭浏览器及清除定时器
 * @param {Object} browser 浏览器对象
 */
async function endMonitor (browser) {
  clearTimeout(monitorTimeoutId)
  await browser.close()
}

/**
 * 暂停挂牌子
 */
function pauseMonitor() {
  clearTimeout(monitorTimeoutId);
}

/**
 * 检查已打开的页面，关闭符合条件的直播间，标记已打开的直播
 * @param {Object} browser 浏览器对象
 * @param {Array} list 正在直播的信息
 */
async function checkOpenedPages (browser, list) {
  const config = getConfig()
  // console.log('checkOpenedPages', list);
  let pages = await browser.pages()
  const promiseList = []
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    if (!isLiveTab(page.url())) {
      // 不是直播间则跳过
    } else {
      const uid = getUidByUrl(page.url())
      let target = list.find(e => e.uperId === uid)
      // console.log('target', target);
      if (target === undefined) {
        promiseList.push(roomExit(page, uid))
      } else {
        target.opened = true
        if (target.wearMedal && config.checkWearMedal) {
          console.log('因佩戴牌子，退出直播间', target.uperName);
          promiseList.push(roomExit(page, uid))
        } else if (config.useObsDanmaku === false) {
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
              console.log('检查直播间提示失败');
              console.error(err);
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
    console.error(err);
  }).finally(() => {
    // console.log('>>>>>>checkOpenedPages done');
  })
  return list
}

/**
 * 退出直播间
 */
async function roomExit (page, uid, browser = null) {
  if (page === null) {
    const pages = await browser.pages()
    page = pages.find(p => {
      const url = p.url()
      if (!isLiveTab(url)) {
        // 不是直播间则跳过
        return false
      }
      const pageUid = getUidByUrl(url)
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
  return page.title().then(uperName => {
    errorTimes[uperName] = 0
    console.log('退出直播', uperName)

  }).catch(err => {
    console.error(err);
    console.log('退出直播', uid);
  }).finally(() => {
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
  const config = getConfig()
  // console.log('roomOpen', info);
  return browser.newPage().then(async page => {
    page.setDefaultTimeout(config.defaultTimeout * 1000 * 60)
    await requestFliter(page)

    page.on('pageerror', error => {
      handlePageError(page, info.uperName, error)
    })

    const url = config.useObsDanmaku ? `https://live.acfun.cn/room/${info.uperId}?theme=default&showAuthorclubOnly=true&showAvatar=false` : `https://live.acfun.cn/live/${info.uperId}`
    return page.goto(url, { waitUntil: 'domcontentloaded' }).then(async () => {
      console.log('进入直播', info.uperName);

      errorTimes[info.uperName] = 0

      page.evaluate(uperName => document.title = uperName, info.uperName)

      if (!config.useObsDanmaku) {
        // 不使用OBS工具监控时才能点赞
        await afterOpenRoom(page, info.uperName)
      }

      // getOnVideoUrl(page, info)
    }).catch(err => {
      console.log('进入直播间失败');
      console.error(err);
    })
    // return page.waitForNavigation()
  })
}

/**
 * 直播间开启的后续操作
 * @param {Object} page 页面对象
 */
async function afterOpenRoom (page) {
  const config = getConfig()
  if (config.likeBtnTimeout > 0) {
    // 点赞
    page.waitForSelector('.like-btn').then(() => {
      // console.log('uperName', '点赞按钮已就绪', config.likeBtnTimeout);
      page.evaluate(minute => {
        setTimeout(() => {
          document.querySelector('.like-btn').click()
          // 10分钟点赞一次
        }, 1000 * 60 * minute)
      }, config.likeBtnTimeout).catch(err => {
        // console.log('uperName', '执行点赞操作失败');
        console.error(err);
      })
    })
  }
  // const videoHandle = await page.waitForSelector('video')
  // videoHandle.dispose()
  // await page.evaluate(() => {
  //   // 这里不能用video.pause，因为video.play是个Promise
  //   const video = document.querySelector('video')
  //   video.src = ''
  //   // video.addEventListener('play', () => {
  //   //   video.pause()
  //   // })
  //   // 干掉弹幕池
  //   document.querySelector('.container-live-feed-messages').remove()
  // })
}

function keepAlive (browser) {
  return browser.pages().then(async pages => {
    console.log('===');
    console.log('需要保活的标签页', pages.length);
    // 依次切换到每个页面并执行操作
    for (let index = 0; index < pages.length; index++) {
      console.log('--');
      const page = pages[index];
      // 将焦点切换到当前页面
      await page.bringToFront();

      // 在这里可以执行页面操作，例如截图、提取页面内容等
      // 示例：打印当前页面的 URL
      if (page.url() === 'https://www.acfun.cn/') {
        console.log('关闭首页');
        await page.close()
        // await page.close();
      } else {
        await page.title().then(title => {
          console.log('保活', title);
        })
        await sleep(3000);
      }
      console.log(`[${index + 1}/${pages.length}] 执行完成`);
    }
    console.log('标签页保活已完成');
    console.log('===');
  })
}

/**
 * 开启DD监控室
 * @param {Object} browser 浏览器对象
 * @param {Array} liveUperInfo 直播中的用户uid数组
 */
async function DDVup (browser, liveUperInfo) {
  const config = getConfig()
  liveUperInfo = orderBy(liveUperInfo.map(info => ({
    // 配置不观看
    ...info,
    configUnWatch: config.uidUnwatchList.includes(info.uperId)
  })), ['configUnWatch', 'createTime'], ['asc', 'asc'])
  // console.log(liveUperInfo);

  if (liveUperInfo.length === 0) {
    检测到所有主播均未开播的次数++
    console.log('---')
    console.log('拥有牌子的主播均未开播。')
    console.log('如果你确定有主播开播：请删除 config.json 文件，重启本工具，按照提示重新登录')
    if (检测到所有主播均未开播的次数 > 24) {
      // 每十分钟检测一次，则24为：连续四小时都没有主播开播
      // 连续长时间无主播开播，可能为cookie过期，发送通知提醒
      检测到所有主播均未开播的次数 = 0
      notify('连续四小时未检测到主播开播，可能为cookie过期，请及时检查。')
    }
  } else {
    检测到所有主播均未开播的次数 = 0
  }
  await checkOpenedPages(browser, liveUperInfo)

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
      promiseList.push(roomExit(null, info.uperId, browser))
    } else if (info.timeDifference == 0) {
      msg = '牌子已满'
      limit++
      ignoreIndex++
      promiseList.push(roomExit(null, info.uperId, browser))
    } else if (config.serverIndex > 0 && index < ignoreIndex) {
      msg = `由其他服务器执行`
      limit++
      if (info.opened) {
        msg = `转移至其他服务器执行`
      }
      promiseList.push(roomExit(null, info.uperId, browser))
    } else if (info.configUnWatch) {
      msg = '配置不看'
      promiseList.push(roomExit(null, info.uperId, browser))
    } else if (config.serverRoomLimit[config.serverIndex] > 0 && index >= limit) {
      msg = '数量限制'
      promiseList.push(roomExit(null, info.uperId, browser))
    } else if (info.opened) {
      msg = '继续监控'
      promiseList.push(
        browser.pages().then(pages => {
          const page = pages.find(p => {
            const url = p.url()
            if (!isLiveTab(url)) {
              // 不是直播间则跳过
              return false
            }
            const pageUid = getUidByUrl(url)
            if (info.uperId === pageUid) {
              return true
            }
            return false
          })
          if (page === null) {
            return Promise.resolve()
          } else {
            return page.title().then(uperName => page.reload().then(() => page.evaluate(uperName => document.title = uperName, uperName)))
          }
        })
      )
    } else {
      msg = '进入直播'
      // roomOpen(browser, info)
      promiseList.push(roomOpen(browser, info))
    }
    if (config.showLiveInfo) {
      console.log(`开播时间 ${formartDate(info.createTime)}`);
      console.log(`标题： ${info.title}`);
      console.log(`${info.level}级`, info.clubName, `(${info.timeLimitStr})`, info.uperName, info.uperId);
      console.log(`[${index + 1}/${liveUperInfo.length}] ${msg}`);
      console.log('---')
    }
  })
  await Promise.all(promiseList).then(() => {
    keepAlive(browser)
  }).catch(err => {
    console.log('DD行为失败');
    console.error(err);
  })
}

/**
 * 拦截页面请求
 * @param {Object} page 页面
 */
async function requestFliter (page) {
  const config = getConfig()
  if (config.debug) {
    return
  }
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.resourceType() === 'image') {
      request.continue({
        url: 'https://ali-imgs.acfun.cn/kos/nlav10360/static/common/widget/appGuide/img/appclose.192fa4f1ecb6c48661d8.png'
      })
    } else if (request.url().includes('.flv')) {
      // 拦截直播流
      request.abort()
    } else if (request.url().includes('/perfLog')) {
      // 拦截疑似日志
      request.abort()
    } else if (request.url().includes('/hm.baidu.com')) {
      // 拦截疑似日志
      request.abort()
    } else if (request.url().includes('/collect')) {
      // 拦截疑似错误信息收集
      request.abort()
    }
    else request.continue();
  });
}

function printPageError () {
  return
  // const { debug } = getConfig()
  // if (debug) {
  //   console.error(...arguments)
  // }
}

async function handlePageError (page, uperName, err) {
  if (errorTimes[uperName] === 'loading') {
    printPageError(uperName, `handlePageError 已超过5次，刷新页面中...`)
    return
  }

  errorTimes[uperName] += 1
  printPageError(`第${errorTimes[uperName]}次 handlePageError`, uperName, errorTimes[uperName] > 5)
  if (typeof err === 'object') {
    if (err.error) {
      printPageError('[错误为object]', err)
    } else if (typeof err.message === 'string') {
      printPageError('[错误为object并且有message]', err.message)
    } else {
      JSON.stringify('[未知错误]', err.message)
      if (err.message.error) {
        printPageError('[未知错误的object]', err.message.error)
      }
    }
  } else {
    printPageError('[错误为文本]', err)
  }

  if (errorTimes[uperName] > 5) {
    printPageError(uperName, `handlePageError 超过5次，刷新页面`)
    errorTimes[uperName] = 'loading'
    page.reload().then(() => {
      printPageError(uperName, `handlePageError 刷新完毕`)
      page.evaluate(uperName => document.title = uperName, uperName)
    }).catch(err => {
      printPageError(uperName, `handlePageError 刷新失败`)
      printPageError(err)
    }).finally(() => {
      errorTimes[uperName] = 0
    })
  }
  // if (err.message) {
  //   console.log(typeof err.message === 'object' ? JSON.stringify(err.message) : err.message);
  // } else {
  //   console.error(err)
  // }
  // if (err && err.message && JSON.stringify(err.message).includes('WebSocket')) {
  //   console.log('捕捉到WebSocket错误', uperName);
  //   await page.close()
  // }
}

function getOnVideoUrl (page, info = { uperId: null, uperName: "", createTime: null }) {
  getInfo('云剪辑地址', page, {
    authorId: info.uperId,
    liveId: info.liveId
  }).then(res => {
    if (res.liveCutStatus !== 1) {
      // console.log(`${info.uperName} 主播不允许剪辑`);
      writeOnVideoUrl(info, '主播不允许剪辑')
      return
    }
    // 主播允许剪辑
    writeOnVideoUrl(info, res.liveCutUrl)
  }).catch(err => {
    console.log('生成爱咔云剪辑地址失败');
    console.log(err);
  })
}

/**
 * 等待
 * @param {number} ms 毫秒
 * @returns 等待指定时间
 */
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
  userLogin,
  userLoginByCookies,
  userLoginByQrcode,
  startMonitor,
  endMonitor,
  pauseMonitor,
  checkOpenedPages,
  roomExit,
  roomOpen,
  afterOpenRoom,
  DDVup,
  requestFliter,
  handlePageError,
}