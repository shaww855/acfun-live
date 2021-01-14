const puppeteer = require('puppeteer');

const HOSTNAME = 'https://www.acfun.cn/';
// const USINFO_URL = HOSTNAME + 'rest/pc-direct/user/personalInfo';

// 是否使用Cookie登录
const useCookieLogin = true

// 使用Cookie登录
const cookies = ''

// 不想用 cookie 也可以用账号密码，要设置 useCookieLogin 为 false。
const user = {
  account: '你的登录账号',
  password: '登录密码'
}

// 每隔（毫秒）检查一次开播的 UP，现在是十分钟
const timeOut = 1000 * 60 * 10

/**
 * 用户登录
 * @param {Object} page 登录页
 */
async function userLogin (page) {
  await page.goto(HOSTNAME + 'login')
  console.log('page navigation');
  const loginSwitch = '#login-switch'
  await page.waitForSelector(loginSwitch)
  await page.click(loginSwitch)

  console.log('sign in...');
  await page.type('#ipt-account-login', user.account);
  await page.type('#ipt-pwd-login', user.password);
  const loginBtnSelector = '.btn-login'
  await page.waitForSelector(loginBtnSelector);
  await page.click(loginBtnSelector)
  console.log('logged!');

  await page.waitForNavigation()
}

function userLoginByCookies (page) {
  let list = []
  cookies.split('; ').forEach(e => {
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
 * @param {Object} browser 浏览器
 */
async function startMonitor (page, browser) {
  console.log(new Date, '检查正在直播的房间...');
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
      res => res.medalList
    )
    // 获取已开播的
    const followLiveUsers = fetch(
      `https://www.acfun.cn/rest/pc-direct/live/followLiveUsers`,
      {
        method: 'POST',
      }
    ).then(
      res => res.json()
    ).then(
      res => res.liveUsers.map(e => e.authorId)
    )

    // 筛选有牌子的
    let liveAndClub = await Promise.all([
      fansClub,
      followLiveUsers
    ]).then(responseList => {
      console.log('responseList', responseList);
      return responseList[0].filter(e => responseList[1].includes(e.uperId))
    })
    // console.log('liveAndClub', liveAndClub);

    let checkLiveWatch = []
    // 获取当日时长
    liveAndClub.forEach(item => {
      checkLiveWatch.push(
        fetch(
          `https://www.acfun.cn/rest/pc-direct/fansClub/fans/medal/degreeLimit?uperId=${item.uperId}`
        ).then(
          res => res.json()
        ).then(res => {
          return res.medalDegreeLimit
          // if (res.medalDegreeLimit.liveWatchDegree < res.medalDegreeLimit.liveWatchDegreeLimit) {
          //   return res.medalDegreeLimit.uperId
          // } else {
          //   return null
          // }
        })
      )
    })
    return Promise.all(checkLiveWatch).then(list => {
      // console.log('list', list)
      return list.map((e, i) => ({
        uid: e.uperId,
        clubName: liveAndClub[i].clubName,
        uName: liveAndClub[i].uperName,
        limit: e.liveWatchDegree + '/' + e.liveWatchDegreeLimit,
        watch: e.liveWatchDegree < e.liveWatchDegreeLimit
      }))
    })
  });

  console.table(isLiveList)
  DDVup(await browser.pages(), isLiveList.filter(e => e.watch).map(e => e.uid), browser)
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
 * @param {Object} browser 浏览器对象
 */
async function DDVup (pages, liveUidList, browser) {
  const patt = new RegExp("live.acfun.cn/live/")
  pages = pages.filter(p => patt.test(p.url())).map(p => ({
    p,
    uid: Number(getUidByLink(p.url()))
  }))
  pages.forEach(async page => {
    if (liveUidList.includes(page.uid)) {
      // 直播仍继续
    } else {
      console.log('live over', page.uid);
      page.p.close = true
      page.p.close()
    }
  })

  let openedUid = pages.filter(e => !e.close).map(e => e.uid)

  liveUidList.forEach(uid => {
    if (openedUid.includes(uid)) {
      // 直播仍继续
    } else {
      console.log('进入房间', uid);
      browser.newPage().then(async page => {
        // console.log('new live', page);
        await page.setRequestInterception(true);

        page.on('request', request => {
          if (request.resourceType() === 'image') {
            request.continue({
              url: 'https://cdnfile.aixifan.com/static/common/widget/header/img/shop.e1c6992ee499e90d79e9.png'
            })
          }
          else request.continue();
        });

        await page.goto(`https://live.acfun.cn/live/${uid}`)

        const title = await page.waitForFunction(() => document.title)
        console.log(uid, '房间名', await title.jsonValue());

        page.evaluate(() => {
          document.write('')
        });
      })
    }
  })
}

puppeteer.launch({
  // devtools: true,
  product: 'chrome',
  // defaultViewport: {
  //   width: 1366,
  //   height: 768
  // },
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
}).then(async browser => {

  browser.newPage().then(async mainPage => {
    await mainPage.setRequestInterception(true);
    mainPage.on('request', request => {
      if (request.resourceType() === 'image') {
        // 随便塞一个小图片，减少资源占用
        request.continue({
          url: 'https://cdnfile.aixifan.com/static/common/widget/header/img/shop.e1c6992ee499e90d79e9.png'
        })
      }
      else request.continue();
    });

    // 开始登录
    if (useCookieLogin) {
      await userLoginByCookies(mainPage)
      await mainPage.goto('https://www.acfun.cn')
    } else {
      await mainPage.goto('https://www.acfun.cn')
      await userLogin(page)
    }

    // 起飞
    startMonitor(mainPage, browser)
    setInterval(() => {
      startMonitor(mainPage, browser)
    }, timeOut)
  })
})
