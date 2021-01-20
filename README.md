# acfun-live  
使用 Puppeteer 开启 acfun 直播监控室，挂牌子！😏
    
## 配置 config.json  
cookies 为空时使用账号密码登录  
键名 | 类型 | 说明  
--- | --- | ---  
cookies | String | 自行抓包，复制请求头的 cookie  
account | String | 账号  
password | String | 密码  
checkLiveTimeout | Number | 每（分钟）检查直播  
defaultTimeout | Number | 异步操作最多等待（分钟）
executablePath | String | Chromium 路径 <br> 例 `C:/Program Files (x86)/Google/Chrome/Application/chrome.exe`
liveRoomLimit | Number | 监控限制 0为无限制 实测1G内存vps能开3个
## 运行  
1. 安装  
    - NodeJs 和 NPM
    - `npm i --registry=https://registry.npm.taobao.org`  
2. 运行  
  `npm run start`  
3. 进阶  
  使用进程守护挂载到服务器  

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