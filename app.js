const puppeteer = require('puppeteer');
const config = require('./config.json')
let times = 0

/**
 * 用户登录
 * @param {Object} page 登录页
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

function formartDate (time) {
  let date = new Date(time)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}

/**
 * 开始监控室
 * @param {Object} page 页面
 */
async function startMonitor (page) {
  console.groupCollapsed('第', times + 1, '次检查直播状态')
  console.log(formartDate(new Date));
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
        limit: e.liveWatchDegree + '/' + e.liveWatchDegreeLimit,
        watch: e.liveWatchDegree < e.liveWatchDegreeLimit
      }))
    })
  });
  // console.log('isLiveList', isLiveList);
  DDVup(await page.browser().pages(), isLiveList.filter(e => e.watch))
  console.groupEnd('第', times + 1, '次检查直播状态')
  times ++
}

/**
 * 从网址中获取uid
 * @param {String} link 网址
 */
function getUidByLink (link) {
  return link.split('/')[4]
}

/**
 * 开启DD监控室
 * @param {Object} pages 已打开的页面对象
 * @param {Array} liveUidList 直播中的用户uid数组
 */
async function DDVup (pages, liveUpinfo) {
  console.log('---');
  liveUpinfo.forEach(e => {
    console.log('主播：', e.uperId, e.uperName, `开播于 ${formartDate(e.createTime)}`);
    console.log('标题：', e.title);
    console.log('牌子：', e.level, e.clubName, `(${e.limit})`,`获取于 ${formartDate(e.joinClubTime)}`,);
    console.log('---');
  })
  let liveUidList = liveUpinfo.map(e => e.authorId)

  const patt = new RegExp("live.acfun.cn/live/")
  const openedUid = []
  pages.filter(p => patt.test(p.url())).forEach((page, index) => {
    const uid = Number(getUidByLink(page.url()))
    if (liveUidList.includes(uid)) {
      // 直播仍继续
      openedUid.push(uid)
    } else {
      console.log('退出直播间', liveUpinfo[index].uperName);
      page.close()
    }
  })

  liveUidList.filter(e => !openedUid.includes(e)).forEach((uid, index) => {
    console.log('进入直播间', liveUpinfo[index].uperName);
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
        }
        else request.continue();
      });

      await page.goto(`https://live.acfun.cn/live/${uid}`)

      // const title = await page.waitForFunction(() => document.title)
      // console.log(uid, '房间名', await title.jsonValue());

      page.evaluate(() => {
        document.write('')
      });
    })
  })
}

process.on('uncaughtException', err => {
  console.error('有一个未捕获的错误', err)
  Browser.close()
  process.exit(1) //强制性的（根据 Node.js 文档）
})
process.on("unhandledRejection", err => {
  console.error('有一个未拒绝的错误', err)
  Browser.close()
  process.exit(1) //强制性的（根据 Node.js 文档）
});


let Browser = null
puppeteer.launch({
  // devtools: true,
  product: 'chrome',
  // defaultViewport: {
  //   width: 1366,
  //   height: 768
  // },
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
    console.log('登录用户：', personalInfoJson.info.userName, personalInfoJson.info.userId);
    // 起飞
    startMonitor(page)
    setInterval(() => {
      startMonitor(page)
    }, 1000 * 60 * config.checkLiveTimeout)
  } else {
    console.log('登录失败，请检查配置');
  }
})
