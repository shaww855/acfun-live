# 更新日志  
此项目的所有更改都将记录在此文件中。  
格式基于[Keep a Changelog](https://keepachangelog.com/en/1.0.0/)，并且该项目遵循 [语义版本控制（semver）](https://semver.org/spec/v2.0.0.html)。

## [未发布]

## [2.0.0] - 2022-06-25  
### 新增    
* Win 平台添加`记住登录状态`引导  
  为方便将本工具设为开机启动的用户，开启此项会在首次登录成功后会保存 **cookies** 于本地，之后的每次启动不会再询问登录方式，请保证本地运行环境的安全。
* Win 平台添加`直播间数量限制`引导  
  默认 `0` 为无限，请根据本机运行内存大小酌情设置。
* 读取配置方式优化，在登录成功后配置储存于运行环境，避免频繁 I/O
* 使用工作流自动发布
### 变更 
* 根据[指南（Pure ESM package）](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)，本项目已调整为 ESM ，二次开发请注意引入方式。
  
[未发布]: https://github.com/shaww855/acfun-live/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/shaww855/acfun-live/compare/v1.5.1...v2.0.0