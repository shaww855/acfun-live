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
- 海外主机 频繁超时 😶