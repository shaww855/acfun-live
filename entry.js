const { getConfig, setConfig } = require('./util.js')
const inquirer = require('inquirer');
const { runApp } = require('./app.js')

const defaultConfig = {
  "account": "",
  "password": "",
  "debug": false,
  "autoRestart": false,
  "checkLiveTimeout": 10,
  "likeBtnTimeout": 0,
  "defaultTimeout": 5,
  "executablePath": "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
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

/**
 * 询问并建立配置文件
 */
function configQuestion () {
  return inquirer.prompt([{
    type: 'input',
    name: 'account',
    message: "请输入账号：",
  }, {
    type: 'password',
    message: '请输入密码：',
    mask: '*',
    name: 'password',
  }, {
    type: 'confirm',
    message: '是否开启调试？',
    default: false,
    name: 'debug',
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
    message: '只要有粉丝牌，未关注的主播也需要监控？',
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

async function check () {
  if (getConfig() === null) {
    await inquirer.prompt([{
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
        }, 3000)
      }
    })
  } else {
    runApp()
  }
}
check()