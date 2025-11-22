import { getConfig } from './userConfig.js';
import { makeUserConfig } from './question.js';
import logger from './log.js';
import './globalValue.js';
import welcome from './welcome.js';
import main, { closeBrowser } from './browser/index.js';

let userClose = false;
let exitReason = 'unknown'; // 'user' | 'error' | 'external' | 'normal'

// Helper to log exit reason and shutdown logger then exit with code
async function gracefulExit(reason, code) {
  exitReason = reason;
  try {
    // Ensure the final exit reason is logged before shutdown
    logger.info(`程序退出，原因：${exitReason}，退出码：${code}`);
  } catch (e) {
    // ignore logging errors
  }

  try {
    logger.shutdown(() => {
      try {
        process.exit(code);
      } catch (e) {
        process.exitCode = code;
      }
    });
  } catch (e) {
    process.exitCode = code;
  }
}

// 用户主动 Ctrl+C（SIGINT）
// 不在终端中打印交互式提示，仅���录日志并优雅退出
process.on('SIGINT', async () => {
  userClose = true;
  // Use conventional exit code for SIGINT (128 + 2 = 130)
  await Promise.resolve(gracefulExit('user', 130));
});

// 外部终止（例如 systemd 或 docker 发出的 SIGTERM）
process.on('SIGTERM', async () => {
  // Conventional SIGTERM exit code: 128 + 15 = 143
  await Promise.resolve(gracefulExit('external', 143));
});

// 未捕获异常：记录错误、尝试优雅清理并退出（不重启）
process.on('uncaughtException', async (error) => {
  if (userClose) return; // 如果用户已经主动退出，忽略

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
  }

  // Ensure exit reason is logged and logger flushed before exiting with code 1
  await Promise.resolve(gracefulExit('error', 1));
});

// 在进程退出时做最后记录（保底）——注意 logger 可能已被关闭
process.on('exit', (code) => {
  try {
    logger.info(`程序退出（exit 事件），原因：${exitReason}，退出码：${code}`);
  } catch (e) {
    // ignore
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
