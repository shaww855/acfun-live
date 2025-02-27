import log4js from 'log4js';

log4js.configure({
  appenders: {
    // 原始控制台输出
    console: { type: 'console' },
    // 过滤控制台，仅接受 `info` 及以上级别
    consoleFilter: {
      type: 'logLevelFilter', // 使用日志级别过滤器
      level: 'info', // 最低接受级别为 `info`
      appender: 'console', // 指向原始控制台输出
    },
    // 文件输出，接受 `debug` 及以上级别
    dateFileOut: {
      type: 'dateFile',
      filename: 'logs/datefile.log',
      pattern: 'yyyy-MM-dd.log',
      maxLogSize: 10485760,
      backups: 3,
      alwaysIncludePattern: true,
    },
  },
  categories: {
    default: { appenders: ['dateFileOut'], level: 'all' },
    acfunlive: {
      appenders: ['consoleFilter', 'dateFileOut'], // 使用过滤后的控制台
      level: 'debug', // 允许 `debug` 及以上日志传递给 appenders
    },
  },
});

const logger = log4js.getLogger('acfunlive');
export default logger;
