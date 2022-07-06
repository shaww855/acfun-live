# 更新日志  
此项目的所有更改都将记录在此文件中。  
格式基于[Keep a Changelog](https://keepachangelog.com/en/1.0.0/)，并且该项目遵循 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)。

## [未发布]
### 新增
* 打包时顺便生成一个压缩的副本
### 变更
* 工作流调整，使用`Node16`打包，发布时上传压缩后的副本
* 源码目录结构调整

## [1.5.3] - 2022-06-29  

### 变更
* 修复了错误的文件引入方式导致在win平台上闪退问题

## [1.5.2] - 2022-06-28  
### 新增    
* Win 平台添加`记住登录状态`引导  
  为方便将本工具设为开机启动的用户，开启此项会在首次登录成功后会保存 **cookies** 于本地，之后的每次启动不会再询问登录方式，请保证本地运行环境的安全。
* Win 平台添加`直播间数量限制`引导  
  默认 `0` 为无限，请根据本机运行内存大小酌情设置。
* 使用工作流自动发布
* 添加了更新日志

### 变更
* 说明文档新增配置文件中`cookies`和`version`的解释
* 读取配置方式优化，在登录成功后配置储存于运行环境，避免频繁 I/O
  
[未发布]: https://github.com/shaww855/acfun-live/compare/v1.5.3...HEAD
[1.5.3]: https://github.com/shaww855/acfun-live/compare/v1.5.2...1.5.3
[1.5.2]: https://github.com/shaww855/acfun-live/compare/v1.5.1...v1.5.2