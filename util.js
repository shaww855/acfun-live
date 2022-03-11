"use strict";

const fs = require("fs");
const inquirer = require('inquirer');

/**
* 补零
* @param {*} value
* @param {Number} digits 理想位数 默认2
* @param {String} pad 填充的字符 默认0
*/
const padNum = (value, digits = 2, pad = '0') => String(value).padStart(digits, pad)

/**
 * 格式化时间
 * @param {Date} time 时间戳
 * @param {String} action 日期\时间\日期时间\
 */
const formartDate = (time, action = '日期时间') => {
  let date = new Date(time)
  const DateString = `${date.getFullYear()}-${padNum(date.getMonth() + 1)}-${padNum(date.getDate())}`
  const TimeString = `${padNum(date.getHours())}:${padNum(date.getMinutes())}:${padNum(date.getSeconds())}`
  if (action === '日期') {
    return DateString
  } else if (action === '时间') {
    return TimeString
  }
  return `${DateString} ${TimeString}`
}

/**
 * 排序对象数组
 * @author https://www.css88.com/30-seconds-of-code/#orderby
 * @param {Array} arr 
 * @param {Array} props 需要排序的值数组
 * @param {Array} orders asc desc
 */
const orderBy = (arr, props, orders) =>
  [...arr].sort((a, b) =>
    props.reduce((acc, prop, i) => {
      if (acc === 0) {
        const [p1, p2] = orders && orders[i] === 'desc' ? [b[prop], a[prop]] : [a[prop], b[prop]];
        acc = p1 > p2 ? 1 : p1 < p2 ? -1 : 0;
      }
      return acc;
    }, 0)
  )

/**
 * 返回网址中的UID
 * @param {String} url 网址
 * @returns {Number}
 */
function getUidByUrl (url) {
  return Number(getConfig().useObsDanmaku ? url.split('/')[4].split('?')[0] : url.split('/')[4])
}

/**
 * 返回页面是否是直播间
 * @param {String} url 
 */
const isLiveTab = url => {
  return url.includes(getConfig().useObsDanmaku ? "live.acfun.cn/room/" : "live.acfun.cn/live/")
}

const configPath = "config.json"
let config = null

/**
 * 获取配置文件
 */
const getConfig = () => {
  if (config !== null) {
    return config
  }
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    console.log(`= config.json config 已读取 =`);
    return config
  } else {
    // throw '未找到config.json';
    console.log('未找到config.json，或文件已损坏！');
    console.log('utils');
    return null
    // await inquirer.prompt([{
    //   type: 'confirm',
    //   name: 'create',
    //   message: "未找到config.json，或文件已损坏！是否重新建立？",
    // }]).then(answers => {
    //   if (answers.create) {
    //     return configQuestion()
    //   } else {
    //     console.log('程序即将关闭...');
    //     setTimeout(() => {
    //       process.exit(0)
    //     }, 1000)
    //   }
    // })
  }
}

const setConfig = ({
  prop = null,
  value = '',
  userConfig = {}
}) => {
  if (prop === null) {
    config = {
      ...config,
      ...userConfig
    }
  } else if (prop === 'cookies') {
    config.cookies = val.map(e => ({
      name: e.name,
      value: e.value,
      domain: e.domain
    }))
  } else {
    config[prop] = value
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
  console.log(`= config.json cookies 已保存 =`);
}

const defaultConfig = {
  "account": "",
  "password": "",
  "debug": false,
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

module.exports = {
  padNum,
  formartDate,
  orderBy,
  getUidByUrl,
  isLiveTab,
  getConfig,
  setConfig,
  configQuestion
}