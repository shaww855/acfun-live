# AcFun-Live  
使用 Puppeteer 开启 AcFun 直播监控室，挂牌子！😏  
定时检查已开播并且拥有粉丝牌的直播间，根据设置进行操作。  
支持多台服务器，请保持每台服务器配置相同。  
（序列形式的负载，并不是真正的均衡负载，因为实现起来比较容易😆）  
- dev 分支  
主要用于功能测试、问题修复  
- main 分支  
自测通过后会发布到此分支  
  
# 来自无常猴的温馨提示  
我们注意到最近有很多有关A站平台的自制插件出现在社区中，我们不鼓励也不禁止大家自行开发涉AC的相关插件，但请肥肥们一定注意账号财产安全，对所有需要A站账号密码的插件有所警惕，在A站只有平台登录与APP登录才可以提供账号密码哦。  
原文链接：[ac23978179](https://www.acfun.cn/a/ac23978179)  
  
## 配置 config.json  
键名 | 类型 | 说明  
  --- | --- | ---  
cookies | String | 自行抓包，复制请求头的 cookie （饼干保质期一个月）
~~account~~ | ~~String~~ | ~~账号~~  
~~password~~ | ~~String~~ | ~~密码~~  
checkLiveTimeout | Number | 每（分钟）检查直播  
likeBtnTimeout | Number | 每（分钟）自动点赞 <br> 0为关闭自动点赞
defaultTimeout | Number | 异步操作最多等待（分钟）
executablePath | String | Chromium 路径 <br> 例 `C:/Program Files (x86)/Google/Chrome/Application/chrome.exe` <br> 注意路径的斜杠方向
uidUnwatchList | Array | 这些 UID 的直播间不看
showLiveInfo | Boolean | 检查直播状态时是否展示主播详细信息
checkWearMedal | Boolean | 佩戴牌子的主播不观看 <br> （戴着牌子说明你正在D TA，不需要服务器挂牌子）
serverRoomLimit | Array | 支持多台服务器 <br> 假如你有三台服务器，并填入了 [3, 2, 0]  <br>  第一台服务器负责挂第0、1、2个直播间 <br> 第二台服务器挂第3、4个直播间  <br>  第三台服务器挂剩余的所有直播   <br>  直播间按开播时间从早到晚 <br> 自己测试自己的机子能挂多少直播间 
serverIndex | Array | 当前是第几台，从0开始
checkAllRoom | Boolean | 只要有牌子，不管是否关注都监控
useObsDanmaku | Boolean | 使用官方OBS弹幕工具监控
notification | Boolean<br>Array  | 借助第三方APP推送开播通知<br>true: 所有粉丝牌主播的通知<br>false: 不推送开播通知<br> [ Number ]: 指定uid开播推送，前提是已关注并有粉丝牌<br>此配置项会受 `checkAllRoom` 影响
iftttKey | String | [IFTTT](https://ifttt.com/) 密钥<br>[配置方法](#IFTTT)
barkKey | String | [Bark](https://github.com/Finb/Bark) 密钥<br>限IOS用户
## 运行  
1. 安装  
    - NodeJs 和 NPM
    - 下载源码  
    - 安装依赖包 `npm ci`  
2. 运行  
  `npm run start` 或 `node app`  
3. 进阶  
  使用进程守护挂载到服务器  
  我用的 [PM2](https://pm2.keymetrics.io/) ，配置文件在 ecosystem.config.js ，日志记录也靠它

## 当前状态  
- ### Win10 正常运行 😎
- ### WSL 正常运行 😎
- ### 海外主机 😶  
  不知道为啥会报这个错误，出错了牌子经验就不会涨  
  目前解决方案就是报错就关闭页面，等下次检查直播时在打开  
  我的海外🐥上，监控数量设的越大越容易出现此错误，所以只能设置2个
  ```
  Error: DOMException: Failed to execute 'send' on 'WebSocket': Still in CONNECTING state.
    at WebSocket.send (<anonymous>)
    at t.sendPushAck (https://ali-imgs.acfun.cn/kos/nlav10360/static/js/0.2b0f2cd0.js:2:295904)
    at t.<anonymous> (https://ali-imgs.acfun.cn/kos/nlav10360/static/js/0.2b0f2cd0.js:2:294659)
    at https://ali-imgs.acfun.cn/kos/nlav10360/static/js/0.2b0f2cd0.js:2:256372
    at Object.next (https://ali-imgs.acfun.cn/kos/nlav10360/static/js/0.2b0f2cd0.js:2:256477)
    at a (https://ali-imgs.acfun.cn/kos/nlav10360/static/js/0.2b0f2cd0.js:2:255215)
  ```  
- ### ARM机器 😆  
  安装npm包时照着提示来就行  

## 安装时可能出现的问题
  * ERROR: Failed to set up Chromium r782078! Set  "PUPPETEER_SKIP_DOWNLOAD" env variable to skip download.  
  一般是网络慢导致下载浏览器失败，解决方法有二  
     -  设置淘宝预源后再次尝试安装    
     `npm config set puppeteer_download_host=https://npm.taobao.org/mirrors`  
     -  如果你本机已经安装 Chromium，可以设置跳过下载后，再次尝试安装  
     `npm config set puppeteer_skip_chromium_download=true`  
     运行前需要在 config.json 里填入 executablePath  
  * npm默认不以root身份运行  
     - `npm install puppeteer --unsafe-perm=true --allow-root`
  https://github.com/puppeteer/puppeteer/issues/1597
  * (node:10916) UnhandledPromiseRejectionWarning: Error: Failed to launch the browser process!
  path/node_modules/puppeteer/.local-chromium/linux-782078/chrome-linux/chrome: error while loading shared libraries: libXss.so.1: cannot open shared object file: No such file or directory
     - 查找缺少的依赖并安装  
  https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md
---

## 运行日志示例  
```
每(分钟)检查直播 10
异步操作最多等待(分钟) 5
设置了不看 []
显示详细直播信息 true
佩戴牌子的主播不观看 true
服务器矩阵配置 [ 3, 0 ]
当前第 1 台
登录方式 Cookie
===
第 1 次检查直播状态 2021/02/19 18:28:27
用户 昵称 UID
当前未佩戴牌子
拥有牌子并且开播的直播间数 1
---
开播时间 2021/02/19 15:09:11
标题： 古惑狼2 目标：2~3层！
12级 黎明 (360/360) 1001Project 179922
[1/1] 牌子已满
---
```
## IFTTT

### 创建Applets：
1. My Applets - Create
2. If This - Add
    - 搜索 webhooks 并进入配置
    - Event Name 输入 acfun_live
3. Then That - Add
    - 搜索选择 Notifications
    - 选择 Send a rich notification from the IFTTT app
    - Title 选择变量 Value1
    - Message 选择变量 Value2
    - Link URL 选择变量 Value3
    - Create action
4. Continue
5. Finish
### 获取 Webhooks Key
  1. 打开 https://ifttt.com/maker_webhooks
  2. 点击 Documentation
  3. 此页面会显示你的 key
  可以顺便在这个页面测试你的 Webhook