# AcFun-Live  
使用 Puppeteer 开启 acfun 直播监控室，挂牌子！😏  
定时检查已开播并且拥有粉丝牌的直播间，根据设置进行操作。  
- dev 分支  
主要用于功能测试、问题修复  
- main 分支  
自测通过后会发布到此分支  
  
# 来自无常猴的温馨提示  
我们注意到最近有很多有关A站平台的自制插件出现在社区中，我们不鼓励也不禁止大家自行开发涉AC的相关插件，但请肥肥们一定注意账号财产安全，对所有需要A站账号密码的插件有所警惕，在A站只有平台登录与APP登录才可以提供账号密码哦。  
[原文链接 ac23978179](https://www.acfun.cn/a/ac23978179)  
  
## 配置 config.json  
键名 | 类型 | 说明  
  --- | --- | ---  
cookies | String | 自行抓包，复制请求头的 cookie <br> 为空时使用账号密码登录  
account | String | 账号  
password | String | 密码  
checkLiveTimeout | Number | 每（分钟）检查直播  
defaultTimeout | Number | 异步操作最多等待（分钟）
executablePath | String | Chromium 路径 <br> 例 `C:/Program Files (x86)/Google/Chrome/Application/chrome.exe`
liveRoomLimit | Number | 监控限制 0为无限制 <br> 实测 1G 内存 vps 能开3个
uidUnwatchList | Array | 这些 uid 的直播间不看
showLiveInfo | Boolean | 检查直播状态时是否展示详细信息
checkWearMedal | Boolean | 佩戴牌子的主播不观看 <br> 戴着牌子说明你正在D TA，不需要服务器挂牌子
loadBalancer | Number | 负载均衡 当前是第几台机子 默认第一台为0 <br> 请保持每台机子的 liveRoomLimit 一致
## 运行  
1. 安装  
    - NodeJs 和 NPM
    - `npm i --registry=https://registry.npm.taobao.org`  
2. 运行  
  `npm run start` 或 `node app.js`  
3. 进阶  
  使用进程守护挂载到服务器（我用的 PM2 ，配置文件是 ./ecosystem.config.js ，日志输出也靠它）

## 当前状态  
- Win10 正常运行 😎
- WSL 会报 Page crashed 🙄
- 海外主机 加了限制后 正常运行 😶  

## 问题
  -  ERROR: Failed to set up Chromium r782078! Set  "PUPPETEER_SKIP_DOWNLOAD" env variable to skip download.  
  `npm config set puppeteer_download_host=https://npm.taobao.org/mirrors`  
  如果你本机已经安装 Chromium，可以跳过它，并在 config.json 里填入 executablePath  
  - npm默认不以root身份运行  
  `npm install puppeteer --unsafe-perm=true --allow-root`
  https://github.com/puppeteer/puppeteer/issues/1597
  ---
  - (node:10916) UnhandledPromiseRejectionWarning: Error: Failed to launch the browser process!
  path/node_modules/puppeteer/.local-chromium/linux-782078/chrome-linux/chrome: error while loading shared libraries: libXss.so.1: cannot open shared object file: No such file or directory
  - 查找缺少的依赖并安装  
  `repoquery --nvr --whatprovides libXss.so.1`  
  `yum install libXScrnSaver`
  ---

## 正常运行时日志会这样打印  
  
  每(分钟)检查直播 10  
  异步操作最多等待(分钟) 5  
  直播间数量限制 3  
  设置了不看 []  
  显示详细直播信息 true  
  佩戴牌子的主播不观看 true  
  登录方式 Cookile  
    ===  
  第 1 次检查直播状态 2021/02/18 00:44:11  
  用户 XX 337845818  
  当前佩戴 12 小夜灯 张梓义  
    ---  
  开播时间 2021/02/17 19:20:52  
  标题： 屠龙勇士出击！  
  9级 理智+1 (97/360) SteamParty 934542  
  [1/6] 执行状态：进入直播  
    ---  
  开播时间 2021/02/17 22:57:42  
  标题： 在？来玩烟火 胆小勿进  
  11级 吳彦祖 (45/360) Kira_辣椒酱 23512715  
  [2/6] 执行状态：进入直播  
    ---  
  开播时间 2021/02/17 23:02:36  
  标题： 给鹦鹉听A睿的歌是什么反应？  
  12级 魂球球 (130/360) 茗魂 17912421  
  [3/6] 执行状态：进入直播  
    ---  
  开播时间 2021/02/18 00:16:45  
  标题： 【临临华】深夜的突击loop  
  5级 夜上海 (28/360) 临临华 44753354  
  [4/6] 执行状态：数量限制  
    ---  
  开播时间 2021/02/18 00:35:03  
  标题： 早上好 我来讲睡前故事了  
  11级 喵年糕 (16/360) 白椿_official 35948175  
  [5/6] 执行状态：数量限制  
    ---  
  开播时间 2021/02/18 00:42:17  
  标题： 美好的一天从0点开始  
  11级 怪人 (0/360) Xsphere 280178  
  [6/6] 执行状态：数量限制  
    ---  
  进入直播 Kira_辣椒酱  
  进入直播 茗魂  
  进入直播 SteamParty  
    ===  
  第 2 次检查直播状态 2021/02/18 00:54:11  
  用户 泥壕 620132  
  当前佩戴 12 小夜灯 张梓义  
    ---  
  开播时间 2021/02/17 19:20:52  
  标题： 屠龙勇士出击！  
  9级 理智+1 (127/360) SteamParty 934542  
  [1/5] 执行状态：继续监控  
    ---  
  开播时间 2021/02/17 22:57:42  
  标题： 在？来玩烟火 胆小勿进  
  11级 吳彦祖 (74/360) Kira_辣椒酱 23512715  
  [2/5] 执行状态：继续监控  
    ---  
  开播时间 2021/02/18 00:16:45  
  标题： 【临临华】深夜的突击loop  
  5级 夜上海 (29/360) 临临华 44753354  
  [3/5] 执行状态：进入直播  
    ---  
  开播时间 2021/02/18 00:35:03  
  标题： 早上好 我来讲睡前故事了  
  11级 喵年糕 (17/360) 白椿_official 35948175  
  [4/5] 执行状态：数量限制  
    ---  
  开播时间 2021/02/18 00:42:17  
  标题： 美好的一天从0点开始  
  11级 怪人 (0/360) Xsphere 280178  
  [5/5] 执行状态：数量限制  
    ---  
  退出直播 茗魂  
  进入直播 临临华  