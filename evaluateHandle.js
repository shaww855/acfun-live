const handleProxy = async ({ page, action, url, method = 'POST', retry = 0 }) => {
  const msg = '获取 ' + action
  console.log('Fetch', url);
  const handle = await page.evaluateHandle(({ url, method }) =>
    fetch(
      url,
      { method }
    ).then(
      res => res.json()
    ).catch(err => {
      return {
        handleError: true,
        name: err.name,
        message: err.message,
        err
      }
    }
    ),
    { url, method }
  ).finally(() => {
    console.log(msg, 'done');
  })
  return handle.jsonValue().then(res => {
    if (res.handleError) {
      if (retry < 3) {
        console.log(`${msg} 第${retry}次失败`);
        return handleProxy({ page, action, url, method, retry: retry + 1 })
      } else {
        throw {
          ...res,
          handleError: `${msg} 失败`
        }
      }
    }
    if (res.result && res.result !== 0) {
      // 登录失效以及其他情况处理
      throw res
    }
    return res
  }).finally(() => {
    handle.dispose()
  })
}

const OpenLivePage = page => {
  return page.browser().newPage().then(page =>
    page.goto('https://live.acfun.cn/settings/help').then(() => page).catch(err => {
      console.log('打开live.acfun.cn相关页面失败');
      console.error(err);
    })
  )
}


module.exports = (action, page, data) => {
  switch (action) {
    case '个人信息':
      return handleProxy({
        page,
        action,
        url: 'https://www.acfun.cn/rest/pc-direct/user/personalInfo'
      })
        .then(res =>
          res.info
        )
    case '粉丝牌列表':
      return handleProxy({
        page,
        action,
        url: 'https://www.acfun.cn/rest/pc-direct/fansClub/fans/medal/list'
      })
        .then(res =>
          res.medalList.map(e =>
          ({
            clubName: e.clubName,
            currentDegreeLimit: e.currentDegreeLimit,
            friendshipDegree: e.friendshipDegree,
            friendshipToLevelUp: e.currentDegreeLimit - e.friendshipDegree,
            joinClubTime: e.joinClubTime,
            level: e.level,
            uperId: e.uperId,
            uperName: e.uperName,
            wearMedal: e.wearMedal
          })
          )
        )
    case '关注并开播列表':
      return handleProxy({
        page,
        action,
        url: 'https://www.acfun.cn/rest/pc-direct/live/followLiveUsers',
      })
        .then(res =>
          res.liveUsers.map(e =>
          ({
            authorId: e.authorId,
            uperName: e.user.name,
            title: e.title,
            createTime: e.createTime,
            headUrl: e.user.headUrl
          })
          )
        )
    case '关注并开播列表2':
      return OpenLivePage(page).then(page =>
        handleProxy({
          page,
          action,
          url: 'https://live.acfun.cn/api/channel/list?count=100&pcursor=&filters=[%7B%22filterType%22:3,+%22filterId%22:0%7D]',
          method: 'GET'
        })
          .then(res =>
            res.liveList.map(e =>
            ({
              authorId: e.authorId,
              uperName: e.user.name,
              title: e.title,
              createTime: e.createTime,
              headUrl: e.user.headUrl
            })
            )
          ).finally(() =>
            page.close()
          )
      )
    case '当日时长':
      return handleProxy({
        page,
        action: `${data} ${action}`,
        url: `https://www.acfun.cn/rest/pc-direct/fansClub/fans/medal/degreeLimit?uperId=${data}`
      })
        .then(res =>
          res.medalDegreeLimit
        )
    case '所有正在直播列表':
      return OpenLivePage(page).then(page =>
        handleProxy({
          page,
          action,
          url: `https://live.acfun.cn/api/channel/list?count=1000&pcursor=0`,
          method: 'GET'
        })
          .then(res => {
            // console.log(res.liveList.length)
            // return []
            return res.liveList.map(e =>
            ({
              authorId: e.authorId,
              title: e.title,
              createTime: e.createTime
            })
            )
          }).finally(() =>
            page.close()
          )
      )

    default:
      return Promise.reject({
        handleError: `未知请求 ${action}`
      })
  }
}