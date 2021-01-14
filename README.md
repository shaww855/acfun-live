# acfun-live
使用 Puppeteer 开启 acfun 直播监控室，挂牌子！
    
## 配置 config.json  
cookies 为空时使用账号密码登录  
键名 | 说明  
--- | ---  
cookies | 自行抓包，复制请求头的 cookie  
account | 账号  
password | 密码  
timeOut | 超时（分钟）  
## 运行  
1. 安装  
    - NodeJs 和 NPM
    - `npm i --registry=https://registry.npm.taobao.org`  
2. 运行  
  `npm run start`  
3. 进阶  
  使用进程守护挂载到服务器