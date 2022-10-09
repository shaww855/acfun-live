# AcFun-Live  
## 介绍
[![Actions Release](https://github.com/shaww855/acfun-live/actions/workflows/git-actions-release.yml/badge.svg)](https://github.com/shaww855/acfun-live/actions/workflows/git-actions-release.yml)
[![CodeQL](https://github.com/shaww855/acfun-live/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/shaww855/acfun-live/actions/workflows/codeql-analysis.yml)  
[![version](https://img.shields.io/github/package-json/v/shaww855/acfun-live)](https://github.com/shaww855/acfun-live/tags)
[![downloads](https://img.shields.io/github/downloads/shaww855/acfun-live/total)](https://github.com/shaww855/acfun-live/releases)
[![license](https://img.shields.io/github/license/shaww855/acfun-live)](https://github.com/shaww855/acfun-live/blob/main/LICENSE)  
自动挂牌子工具，定时检测主播开播情况，当日经验挂满后自动离开直播间，支持扫码登录。  
请认准唯二指定下载仓库 Github、Gitee。  
本工具完全免费、开源，有更好的点子欢迎PR。

## 下载运行  
- ### Windows环境  
  支持 Windows10 及以上，请前往 [发布页面](https://github.com/shaww855/acfun-live/releases) 下载解压后双击运行即可。   
- ### Linux环境  
  - 安装  
      - NodeJs 和 NPM （尽量保持为最新版）
      - 下载源码  
      - 安装依赖包（建议 `npm ci`）  
  - 运行  
    `npm run start` 或 `node entry.js`  
  - 进阶  
    使用进程守护挂载  
    **如果你在进程守护中配置了定时重启，请关闭 config.autoRestart 选项**   
    [PM2](https://pm2.keymetrics.io/) 配置示例文件在 `/ecosystem.config.js`。

## 更新日志  
请参阅 [CHANGELOG.md](https://github.com/shaww855/acfun-live/blob/main/CHANGELOG.md)
## 隐私提示 
本工具不会向A站以外的任何服务器发送或储存你的任何信息，也不会分享任何信息给任意第三方，所有操作均通过A站API实现。  
 - Win 用户扫码登录不储存任何信息；账号密码登录则储存于运行环境中，关闭即销毁；同时开启记住登录状态选项，会将`cookies`储存于本地。  
 - Linux 用户账号密码明文存储于本地，请自行保证本地环境安全。  

本工具通过 Puppeteer 操控 Chromium 内核的浏览器实现如下操作：
  1. 根据你提供的信息进行登录操作；  
  1. 查询你的粉丝牌列表及粉丝牌经验；  
  1. 使用你的账号信息查询主播开播信息；  
  1. 使用你的账号进入直播间。  

## 官方对第三方插件的态度  
- 2022-05-17 无常猴 [ac34895639](https://www.acfun.cn/a/ac34895639) [ac34899002](https://www.acfun.cn/a/ac34899002  
)
  >- <b>及时修改密码，定期更新密码，增加密码复杂程度。</b>尤其是账号注册时间较长、密码较长时间未更改、多平台使用同一密码的用户。    
  >- 不使用来历不明的第三方程序，谨慎点击不明链接，保护账号安全。
- 2021-02-05 无常猴 [ac23978179](https://www.acfun.cn/a/ac23978179)  
  >我们注意到最近有很多有关A站平台的自制插件出现在社区中，<b>我们不鼓励也不禁止大家自行开发涉AC的相关插件</b>，但请肥肥们一定注意账号财产安全，对所有需要A站账号密码的插件有所警惕，在A站只有平台登录与APP登录才可以提供账号密码哦。  
- 2021-06-08 活动猴 [ac29442323](https://www.acfun.cn/a/ac29442323)  
  > 用户不得以任何不正当手段及其他破坏活动规则、违背活动公平原则的方式参与本活动。一经发现，本平台有权撤消活动资格，亦有权收回用户已领取的现金奖励、实物奖品或者虚拟奖品，并保留追究该用户责任的权利。如因前述不正当手段被本平台追究责任造成的损失，本平台不进行任何赔偿或补偿。不正当手段及舞弊行为包括但不限于：下载非官方客户端；使用模拟器、插件、外挂等非法工具扫码、下载、安装、注册、登录、赠与、领取奖励；恶意购买；虚假分享；倒买倒卖；注册多个账号；篡改设备数据；恶意牟利等扰乱平台秩序；<b>使用插件、外挂、系统或第三方工具</b>对本平台及本次活动进行干扰、破坏、修改或施加其他影响及本平台认为的其他不正当手段
  
## 配置文件说明
  
键名 | 类型 | 说明  
  --- | --- | ---  
account | String | 账号  
password | String | 密码  
debug | Boolean | 是否开启调试，默认不开启<br>是则会在前台展示浏览器<br>否则静默运行
autoRestart | Boolean<br>String | 是否开启点自动重启<br>true 为每天0点<br>文本需符合 cron [规则](https://github.com/node-schedule/node-schedule#cron-style-scheduling)的文本
checkLiveTimeout | Number | 每（分钟）检查直播  
likeBtnTimeout | Number | 每（分钟）自动点赞 <br> 0为关闭自动点赞
defaultTimeout | Number | 异步操作最多等待（分钟）
executablePath | String | Chromium 路径 <br> 例 `C:/Program Files (x86)/Google/Chrome/Application/chrome.exe` <br> 注意路径的斜杠方向
uidUnwatchList | Array | 这些 UID 的直播间不看
showLiveInfo | Boolean | 检查直播状态时是否展示主播详细信息
checkWearMedal | Boolean | 佩戴牌子的主播不观看 <br> （戴着牌子说明你正在D TA，不需要服务器挂牌子）
serverRoomLimit | Array | 支持多台服务器 <br> 假如你有三台服务器，并填入了 [3, 2, 0]  <br>  第一台服务器负责挂第0、1、2个直播间 <br> 第二台服务器挂第3、4个直播间  <br>  第三台服务器挂剩余的所有直播   <br>  直播间按开播时间从早到晚排序 <br> 请先测试你的机子能挂多少直播间<br>（估计1G内存可以挂2个直播间） 
serverIndex | Array | 当前是第几台，从0开始
checkAllRoom | Boolean | 只要有牌子，不管是否关注都监控
useObsDanmaku | Boolean | 使用官方OBS弹幕工具监控<br>开启此项时 自动点赞功能 会失效
notification | Boolean<br>Array  | 借助第三方APP推送开播通知<br>true: 有粉丝牌的主播都通知<br>false: 不推送开播通知<br> [ Number ]: 指定uid开播推送<br>此配置项会受 `checkAllRoom` 影响<br>服务器时间的 0~6 点不推送
iftttKey | String | [IFTTT](https://ifttt.com/) 密钥<br>[配置方法](#IFTTT)
barkKey | String | [Bark](https://github.com/Finb/Bark) 密钥  仅限IOS<br>[配置方法](#BARK)
cookies | String<br>Array | 保存登录状态的字段<br>要么为空字符串，要么为`puppeteer`导出的`cookies`数组
version | String | 当前版本号<br>本工具会将它与Github上的版本号对比并提示是否有更新

## 推送配置
### IFTTT

- 创建Applets  
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
- 获取 Webhooks Key
    1. 打开 https://ifttt.com/maker_webhooks
    2. 点击 Documentation
    3. 此页面会显示你的 key  
      （可以在这个页面测试你的 Webhook  ）

### BARK 

1. App Store 搜索并下载安装  
2. 打开 app 就可以看到链接  https://api.day.app/你的key/

## 可能会遇到的问题及解决方法
  * Q   
  ERROR: Failed to set up Chromium r782078! Set  "PUPPETEER_SKIP_DOWNLOAD" env variable to skip download.  
  * A   
  一般是网络慢导致下载浏览器失败，解决方法有二  
     -  设置淘宝源后再次尝试安装    
     `npm config set puppeteer_download_host=https://npm.taobao.org/mirrors`  
     -  如果你本机已经安装 Chromium，可以设置跳过下载后，再次尝试安装  
     `npm config set puppeteer_skip_chromium_download=true`  
     运行前需要在 config.json 里填入 executablePath 
  --- 
  * Q  
    npm默认不以root身份运行  
  * A  
    `npm install puppeteer --unsafe-perm=true --allow-root`  
    https://github.com/puppeteer/puppeteer/issues/1597
  ---
  * Q  
  (node:10916) UnhandledPromiseRejectionWarning: Error: Failed to launch the browser process!
  path/node_modules/puppeteer/.local-chromium/linux-782078/chrome-linux/chrome: error while loading shared libraries: libXss.so.1: cannot open shared object file: No such file or directory
  * A  
  查找缺少的依赖并安装  
  https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md
  ---
  * Q  
  打包Windows单文件时进度慢或者失败  
  * A  
  可能是需要下载node包缓慢导致的  
    1. 去 https://github.com/vercel/pkg-fetch/releases 下载提示中的 `node` 版本包  
    2. 放到 `C:\Users\{用户名}\.pkg-cache\{当前pkg版本号}` 目录下  
    3. 改名为 `fetched-{node版本号}-win-x64`  
    4. 再次运行打包命令即可
  ---
  * Q  
  其他问题请参照 `Puppeteer` 官方解决方案  
  * A  
  https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md


## Stargazers over time

[![Stargazers over time](https://starchart.cc/shaww855/acfun-live.svg)](https://starchart.cc/shaww855/acfun-live)
