const { getConfig, setConfig } = require('./util.js')
const inquirer = require('inquirer');
// 检查更新
const checkUpdate = require('./checkUpdate')
const runApp = require('./app.js')
const defaultConfig = {
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

const isWindows = process.platform === 'win32'

/**
 * 询问并建立配置文件
 */
async function configQuestion () {
  return inquirer.prompt([{
    type: 'list',
    name: 'loginByUsername',
    message: "请选择登录方式",
    choices: [{
      name: '账号密码',
      value: true,
      checked: true
    },{
      name: 'cookies',
      value: false,
    }]
  }, {
    type: 'editor',
    name: 'cookies',
    message: "请粘贴cookies：",
    when: answers => !answers.loginByUsername,
    validate: function(input) {
      const done = this.async()
      if(input === ''){
        done('cookies不能为空')
      }else{
        done(null, true)
      }
    }
  }, {
    type: 'input',
    name: 'account',
    message: "请输入账号：",
    when: answers => answers.loginByUsername,
    validate: function(input) {
      const done = this.async()
      if(input === ''){
        done('账号不能为空')
      }else{
        done(null, true)
      }
    }
  }, {
    type: 'password',
    message: '请输入密码：',
    mask: '*',
    name: 'password',
    when: answers => answers.loginByUsername,
    validate: function(input) {
      const done = this.async()
      if(input === ''){
        done('密码不能为空')
      }else{
        done(null, true)
      }
    }
  }, {
    type: 'confirm',
    message: '是否开启调试？',
    default: false,
    name: 'debug',
    when: () => isWindows
  }, {
    type: 'confirm',
    message: '是否于每日0点自动重启？',
    default: false,
    name: 'autoRestart'
  }, {
    type: 'input',
    message: '请输入 Chromium 为内核的浏览器路径：',
    default: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    name: 'executablePath',
    when: isWindows
  }, {
    type: 'confirm',
    message: '使用OBS弹幕工具监控？',
    default: true,
    name: 'useObsDanmaku',
  }, {
    type: 'confirm',
    message: '佩戴牌子的主播不观看？ （戴着牌子说明你正在D TA，不需要服务器挂牌子）',
    default: false,
    name: 'checkWearMedal'
  }, {
    type: 'confirm',
    message: '只要有粉丝牌，即使未关注主播也需要监控？',
    default: false,
    name: 'checkAllRoom'
  }]).then((answers) => {
    delete answers.notificationApp
    const userConfig = {
      ...defaultConfig,
      ...answers
    }
    setConfig({userConfig})
    return userConfig
  })
}

checkUpdate().then(() => {
  // 检查配置文件
  if (getConfig() === null) {
    inquirer.prompt([{
      type: 'confirm',
      name: 'create',
      message: "未找到config.json，或文件已损坏！是否重新建立？",
    }]).then(answers => {
      if (answers.create) {
        configQuestion().then(() => {
          runApp()
        })
      } else {
        console.log('程序即将关闭...');
        setTimeout(() => {
          process.exit(0)
        }, 1000)
      }
    })
  } else {
    runApp()
  }
})