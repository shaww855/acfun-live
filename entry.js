const { getConfig, setConfig } = require('./util.js')
const inquirer = require('inquirer');
// 检查更新
const checkUpdate = require('./checkUpdate')
const runApp = require('./app.js')
const defaultConfig = {
  "loginType": null,
  "account": "",
  "password": "",
  "debug": false,
  "autoRestart": false,
  "checkLiveTimeout": 10,
  "likeBtnTimeout": 0,
  "defaultTimeout": 5,
  "executablePath": "",
  "uidUnwatchList": [],
  "showLiveInfo": true,
  "checkWearMedal": false,
  "serverRoomLimit": [
    0
  ],
  "serverIndex": 0,
  "checkAllRoom": false,
  "useObsDanmaku": true,
  "notification": false,
  "iftttKey": "",
  "barkKey": "",
  "cookies": ""
}

global.platformIsWin = process.platform === 'win32'

/**
 * 登录方式
 * @returns Promise
 */
const confirmLoginType = () => 
 inquirer.prompt([{
    type: 'list',
    name: 'loginType',
    message: "请选择登录方式",
    choices: global.platformIsWin ? ['扫码登录','账号密码'] : ['账号密码','cookies'],
  }, {
    type: 'editor',
    name: 'cookies',
    message: "从已登录过账号密码的config.json文件中复制cookies项并粘贴：",
    when: answers => answers.loginType === 'cookies',
    validate: function (input) {
      const done = this.async()
      if (input === '') {
        done('cookies不能为空')
        return
      }
      try {
        JSON.parse(input)
        done(null, true)
      } catch (error) {
        done(`请输入正确的格式，${error.message}`)
      }
    }
  }, {
    type: 'input',
    name: 'account',
    message: "请输入账号：",
    when: answers => answers.loginType === '账号密码',
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
    when: answers => answers.loginType === '账号密码',
    validate: function (input) {
      const done = this.async()
      if (input === '') {
        done('密码不能为空')
      } else {
        done(null, true)
      }
    }
  }, ]).then(answers => {
    // global.loginType = answers.loginType
    global.loginInfo = answers

    const userConfig = {
      ...answers
    }

    if (answers.loginType === 'cookies') {
      userConfig.cookies = JSON.parse(answers.cookies)
    }
    if (answers.loginType === '账号密码') {
      if (global.platformIsWin) {
        // 赋值全局账号密码
        delete userConfig.account
        delete userConfig.password
      }
    }
    return userConfig
  })

/**
 * 询问并建立配置文件
 * @returns Promise
 */
const createConfiguration = () => {
  return inquirer.prompt([{
    type: 'confirm',
    message: '是否开启调试？',
    default: false,
    name: 'debug',
  }, {
    type: 'list',
    message: '是否开启自动重启？',
    choices: [{
      name: '关闭',
      value: false,
      checked: true
    }, {
      name: '每天0点重启',
      value: '30 00 00 * * *',
    }, {
      name: '每个整点重启',
      value: '30 00 * * * *',
    }],
    name: 'autoRestart'
  }, {
    type: 'input',
    message: '请输入 Chromium 为内核的浏览器执行路径：',
    default: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    name: 'executablePath',
  }, {
    //   type: 'confirm',
    //   message: '使用OBS弹幕工具监控？',
    //   default: true,
    //   name: 'useObsDanmaku',
    // }, {
    type: 'confirm',
    message: '佩戴牌子的主播不观看？ （戴着牌子说明你正在D TA，不需要工具挂牌子）',
    default: false,
    name: 'checkWearMedal'
  }, {
    type: 'confirm',
    message: '只要有粉丝牌，即使未关注主播也需要监控？',
    default: false,
    name: 'checkAllRoom'
  }]).then((answers) => {
    // 赋值全局登录类型
    const userConfig = {
      ...answers
    }
    if (global.loginInfo.loginType === 'cookies') {
      userConfig.cookies = JSON.parse(answers.cookies)
    }

    delete userConfig.notificationApp
    console.log('entry createConfiguration() allConfig', userConfig);
    setConfig({
      userConfig: {
        ...defaultConfig,
        ...userConfig
    } })
    return userConfig
  })
}

const handleError = err => {
  // if (err.result === -401) {
  //   console.error('登录过期，尝试使用账号密码重新登录');
  //   setConfig({ prop: 'cookies' })
  //   Start()
  //   return
  // }
  console.log(err)
  console.log('出现错误，10秒后自动关闭...');
  console.log('如频繁报错，请删除config.json文件后，重新开打工具');
  console.log('或截图反馈给开发者');

  setTimeout(() => {
    console.log('祝您身体健康，再见');
  }, 7000)
  setTimeout(() => {
    process.exit(1)
  }, 10000)
}

process.on('uncaughtException', handleError)
process.on("unhandledRejection", handleError);

checkUpdate().then(() => {
  const config = getConfig()
  let 配置文件过期 = false
  if (config !== null) {
    const { version } = require('./package.json')
    const { hasNewVersion } = require('./util.js')
    if (config.version === version) {
      配置文件过期 = false
    } else if (hasNewVersion(config.version, version)) {
      配置文件过期 = true
    } else {
      配置文件过期 = false
    }
  }

  if (global.platformIsWin === false) {
    if (config === null) {
      console.log('Linux请用户按照文档手动创建配置文件');
      console.log('https://github.com/shilx/acfun-live#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E8%AF%B4%E6%98%8Econfigjson');
    } else if (配置文件过期) {
      console.log('版本已更新，请按照文档重新创建配置文件');
      console.log('https://github.com/shilx/acfun-live#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E8%AF%B4%E6%98%8Econfigjson');
    } else {
      runApp()
    }
    return
  }
  confirmLoginType().then(async (loginInfo) => {
    console.log('loginInfo', loginInfo);
    const config = getConfig()
    if (config === null) {
      // 未配置
      await createConfiguration()
    } else if (配置文件过期) {
      console.log('版本已更新，需要重新配置');
      await createConfiguration()
    }

    // console.log('config', userConfig);
    // console.log('loginInfo', loginInfo);
    // console.log(process.platform);
    runApp()
  })
})