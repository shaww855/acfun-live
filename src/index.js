import { getConfig } from './userConfig.js';
import { makeUserConfig } from './question.js';
import logger from './log.js';
import './globalValue.js';
import welcome from './welcome.js';
import main, { closeBrowser } from './browser/index.js';

let userClose = false;
let exitReason = 'unknown'; // 'user' | 'error' | 'external' | 'normal'

// 用户主动 Ctrl+C（SIGINT）
// 不在终端中打印交互式提示，仅记录日志并优雅退出
process.on('SIGINT', async () => {
  userClose = true;
  exitReason = 'user';
  try {
    logger.info('用户主动触发关闭（SIGINT/Ctrl+C）');
  } catch (e) {}

  // 尝试优雅关闭浏览器（捕获所有错误），然后关闭 logger 并退出
  try {
    await Promise.resolve(closeBrowser()).catch((err) => {
      logger.error('closeBrowser 执行出错（已捕获）：', err && err.message);
      logger.debug(err && err.stack);
    });
  } catch (e) {
    logger.error('在 SIGINT 处理器中关闭浏览器时发生错误（已捕获）：', e && e.message);
  } finally {
    // 优雅关闭 logger，并在回调中 exit
    try {
      logger.shutdown(() => {
        try {
          process.exit(0);
        } catch (e) {
          process.exitCode = 0;
        }
      });
    } catch (e) {
      process.exitCode = 0;
    }
  }
});

// 外部终止（例如 systemd 或 docker 发出的 SIGTERM）
process.on('SIGTERM', async () => {
  exitReason = 'external';
  try {
    logger.info('收到外部终止信号（SIGTERM）');
  } catch (e) {}

  try {
    await Promise.resolve(closeBrowser()).catch((err) => {
      logger.error('closeBrowser 执行出错（已捕获）：', err && err.message);
      logger.debug(err && err.stack);
    });
  } catch (e) {
    logger.error('在 SIGTERM 处理器中关闭浏览器时发生错误（已捕获）：', e && e.message);
  } finally {
    try {
      logger.shutdown(() => {
        try {
          process.exit(0);
        } catch (e) {
          process.exitCode = 0;
        }
      });
    } catch (e) {
      process.exitCode = 0;
    }
  }
});

// 未捕获异常：记录错误、尝试优雅清理并退出（不重启）
process.on('uncaughtException', async (error) => {
  if (userClose) return; // 如果用户已经主动退出，忽略

  exitReason = 'error';
  try {
    logger.error(`捕获未知错误：${error && error.message}`);
    if (error && error.stack) logger.debug(error.stack);
    logger.warn('请尝试删除 config.json 文件后重试');
    logger.warn('如无法解决，请保留日志文件并反馈至唯一指定扣扣群：726686920');
  } catch (e) {}

  try {
    await Promise.resolve(closeBrowser()).catch((err) => {
      logger.error('closeBrowser 执行出错（已捕获）：', err && err.message);
      logger.debug(err && err.stack);
    });
  } catch (e) {
    logger.error('在 uncaughtException 处理器中关闭浏览器时发生错误（已捕获）：', e && e.message);
  } finally {
    try {
      logger.shutdown(() => {
        try {
          process.exit(1);
        } catch (e) {
          process.exitCode = 1;
        }
      });
    } catch (e) {
      process.exitCode = 1;
    }
  }
});

// 在进程退出时记录退出原因（注意：logger 在某些退出路径可能已关闭）
process.on('exit', (code) => {
  try {
    logger.info(`程序退出，原因：${exitReason}，退出码：${code}`);
  } catch (e) {
    // 退出时忽略记录失败
  }
});

async function start() {
  await welcome();
  getConfig()
    .then(() => {
      main();
    })
    .catch(() => {
      if (global.platformIsWin) {
        makeUserConfig().then((res) => {
          main();
        });
      } else {
        throw new Error('非windows平台，请手动新增配置文件后再试！');
      }
    });
}

start();