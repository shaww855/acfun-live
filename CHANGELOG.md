# 更新日志

此项目的所有更改都将记录在此文件中。
格式基于[Keep a Changelog](https://keepachangelog.com/en/1.0.0/)，并且该项目遵循 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)。

## [未发布]

## [2.1.0] - 2025-02-27

### 增加

- 新增配置项`手动指定拥有守护团徽章的UID`
- 展示内存使用量

### 变更

- 修复配置项`忽略有牌子但未关注的直播间`无效的问题
- 修复win10无法运行的问题(版本22H2内部版本119045.5487测试通过)

## [2.0.0] - 2025-02-22

### 项目重构

- 精简操作流程
- 优化内存占用
- 去除冗余功能

## [1.5.12] - 2025-01-21

### 变更

- 工作流调整，使用 `Node18` 打包，发布压缩后的文件。
- 回滚解决白屏问题的代码，此代码导致新版本浏览器无法启动，白屏问题已被[chromium](https://www.chromium.org/Home/)修复

## [1.5.11] - 2024-09-26

### 变更

- 修复windows环境启动白屏问题

## [1.5.10] - 2024-07-24

### 新增

- 标签页保活，用于抵消Edge的标签睡眠功能

### 变更

- 二维码登录超时逻辑优化

## [1.5.9] - 2024-07-18

### 变更

- 修复依赖漏洞

## [1.5.8] - 2023-04-18

### 变更

- 开播通知链接地址404问题修复
- 周期性地升级依赖包

## [1.5.7] - 2023-01-10

### 变更

- 依赖包`luxon`安全漏洞修复
- 周期性地升级依赖包

## [1.5.6] - 2022-10-09

### 变更

- 调整配置文件引导
- 调整检查新版本逻辑，避免阻塞进程
- 调整说明文档

## [1.5.5] - 2022-09-22

### 变更

- 开播通知现在支持无守护团勋章的主播
- 版本更新文案调整
- 计划性的依赖更新

## [1.5.4] - 2022-07-29

### 变更

- 工作流调整，使用 `Node16` 打包，发布压缩后的文件。
- 源码目录结构调整。
- 隐藏不影响使用的报错信息。
- 调整说明文档。
- 更新依赖包。

### 修复

- 修复配置项 `checkAllRoom` 为 `true` 时，发送通知报错的问题

## [1.5.3] - 2022-06-29

### 变更

- 修复了错误的文件引入方式导致在win平台上闪退问题。

## [1.5.2] - 2022-06-28

### 新增

- Win 平台添加 **记住登录状态** 引导。
  为方便将本工具设为开机启动的用户，开启此项会在首次登录成功后会保存 **cookies** 于本地，之后的每次启动不会再询问登录方式，请保证本地运行环境的安全。
- Win 平台添加 **直播间数量限制** 引导。
  默认 `0` 为无限，请根据本机运行内存大小酌情设置。
- 使用工作流自动发布。
- 添加了更新日志。

### 变更

- 说明文档新增配置文件中`cookies`和`version`的解释。
- 读取配置方式优化，在登录成功后配置储存于运行环境，避免频繁 I/O。

[未发布]: https://github.com/shaww855/acfun-live/compare/main...dev
[2.1.0]: https://github.com/shaww855/acfun-live/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/shaww855/acfun-live/compare/v1.5.11...v2.0.0
[1.5.12]: https://github.com/shaww855/acfun-live/compare/v1.5.11...v1.5.12
[1.5.11]: https://github.com/shaww855/acfun-live/compare/v1.5.10...v1.5.11
[1.5.10]: https://github.com/shaww855/acfun-live/compare/v1.5.9...v1.5.10
[1.5.9]: https://github.com/shaww855/acfun-live/compare/v1.5.8...v1.5.9
[1.5.8]: https://github.com/shaww855/acfun-live/compare/v1.5.7...v1.5.8
[1.5.7]: https://github.com/shaww855/acfun-live/compare/v1.5.6...v1.5.7
[1.5.6]: https://github.com/shaww855/acfun-live/compare/v1.5.5...v1.5.6
[1.5.5]: https://github.com/shaww855/acfun-live/compare/v1.5.4...v1.5.5
[1.5.4]: https://github.com/shaww855/acfun-live/compare/v1.5.3...v1.5.4
[1.5.3]: https://github.com/shaww855/acfun-live/compare/v1.5.2...v1.5.3
[1.5.2]: https://github.com/shaww855/acfun-live/releases/tag/v1.5.2
