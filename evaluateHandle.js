const handleProxy = async (page, action, url) => {
  const msg = '获取' + action
  console.log(msg, 'start');
  const handle = await page.evaluateHandle(url =>
    fetch(
      url,
      { method: 'POST' }
    ).then(
      res => res.json()
    ).catch(err => ({
      handleError: `POST ${url} 失败`,
      name: err.name,
      message: err.message,
    })
    ),
    url
  ).finally(() => {
    console.log(msg, url, 'evaluateHandle fetch done');
  })
  return handle.jsonValue().then(res => {
    if (res.handleError) {
      return Promise.reject(res)
    }
    return Promise.resolve(res)
  }).finally(() => {
    console.log(msg, 'jsonValue done');
    handle.dispose()
  })
}

module.exports = (action, page, data) => {
  switch (action) {
    case '个人信息':
      return handleProxy(page, action, 'https://www.acfun.cn/rest/pc-direct/user/personalInfo').then(res =>
        res.info
      )
    case '粉丝牌列表':
      return handleProxy(page, action, 'https://www.acfun.cn/rest/pc-direct/fansClub/fans/medal/list')
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
      return handleProxy(page, action, 'https://www.acfun.cn/rest/pc-direct/live/followLiveUsers')
        .then(res =>
          res.liveUsers.map(e =>
          ({
            authorId: e.authorId,
            title: e.title,
            createTime: e.createTime
          })
        )
      )
    case '当日时长':
      return handleProxy(page, action + data, `https://www.acfun.cn/rest/pc-direct/fansClub/fans/medal/degreeLimit?uperId=${data}`)
        .then(res => 
          res.medalDegreeLimit
        )

    default:
      return Promise.reject()
  }
}