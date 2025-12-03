import fs from 'node:fs';
import { getConfig } from './userConfig.js';
import { makeUserConfig } from './question.js';
import logger from './log.js';
import './globalValue.js';
import welcome from './welcome.js';
import main, { closeBrowser } from './browser/index.js';

let userClose = false;
let exitReason = 'unknown'; // 'user' | 'error' | 'external' | 'normal'

// Helper to persist exit info synchronously, then shutdown logger and exit
function persistExitInfoSync(reason, code) {
  const data = {
    time: new Date().toISOString(),
    reason,
    code,
  };
  try {
    // 使用同步写入确保在进程退出前数据已落盘
    fs.writeFileSync('./last-exit.json', JSON.stringify(data, null, 2), {
      encoding: 'utf8',
    });
  } catch (e) {
    // 若此处失败则无更多操作可以保证，尽量记录到 stderr
    try {
      console.error('写入 last-exit.json 失败：', e && e.message);
    } catch (ee) {}
  }
}

async function gracefulExit(reason, code) {
  exitReason = reason;
  try {
    // 先把退出原因用 logger 记录一次（保留原日志链路）
    logger.info(`程序退出，原因：${exitReason}，退出码：${code}`);
  } catch (e) {
    // 忽略 logger 抛错
  }

  // 关键：再做一份同步持久化，作为保底
  persistExitInfoSync(exitReason, code);

  // 然后优雅关闭 logger（如果 logger.shutdown 有回调）
  try {
    // 确保 logger.shutdown 回调执行后再退出
    await new Promise((resolve) => {
      try {
        logger.shutdown(() => {
          resolve();
        });
      } catch (e) {
        // 若 logger.shutdown 本身抛异常，继续
        resolve();
      }
    });
  } catch (e) {
    // ignore
  } finally {
    // 最后退出
    try {
      process.exit(code);
    } catch (e) {
      process.exitCode = code;
    }
  }
}

// 用户主动 Ctrl+C（SIGINT）
process.on('SIGINT', async () => {
  userClose = true;
  // 使用惯例退出码 130（128 + SIGINT(2)）
  await gracefulExit('user', 130);
});

// 外部终止（例如 systemd 或 docker 发出的 SIGTERM）
process.on('SIGTERM', async () => {
  await gracefulExit('external', 143); // 128 + 15
});

// 未捕获异常：记录错误、尝试优雅清理并退出（不重启）
process.on('uncaughtException', async (error) => {
  if (userClose) return;

  try {
    logger.error(`捕获未知错误：${error && error.message}`);
    if (error && error.stack) logger.debug(error.stack);
    logger.warn('请尝试删除 config.json 文件后重试');
    logger.warn('如无法解决，请保留日志文件并反馈至唯一指定扣扣群：726686920');
  } catch (e) {}

  try {
    await closeBrowser().catch((err) => {
      logger.error('closeBrowser 执行出错（已捕获）：', err && err.message);
      logger.debug(err && err.stack);
    });
  } catch (e) {
    logger.error(
      '在 uncaughtException 处理器中关闭浏览器时发生错误（已捕获）：',
      e && e.message,
    );
  }

  // 退出码 1 表示程序错误退出
  await gracefulExit('error', 1);
});

// 未捕获的 promise 拒绝：记录错误、尝试优雅清理并退出
process.on('unhandledRejection', async (reason, promise) => {
  if (userClose) return;

  try {
    logger.error(`捕获未处理的 promise 拒绝：${reason && reason.message}`);
    if (reason && reason.stack) logger.debug(reason.stack);
  } catch (e) {}

  try {
    await closeBrowser().catch((err) => {
      logger.error('closeBrowser 执行出错（已捕获）：', err && err.message);
      logger.debug(err && err.stack);
    });
  } catch (e) {
    logger.error(
      '在 unhandledRejection 处理器中关闭浏览器时发生错误（已捕获）：',
      e && e.message,
    );
  }

  // 退出码 1 表示程序错误退出
  await gracefulExit('error', 1);
});

// 在进程退出时做保底记录（logger 可能已被关闭）
process.on('exit', (code) => {
  try {
    logger.info(`程序退出（exit 事件），原因：${exitReason}，退出码：${code}`);
  } catch (e) {
    // 忽略
  }
});

async function start() {
  await welcome();
  try {
    await getConfig();
    await main();
  } catch (error) {
    logger.error('启动过程中发生错误：', error.message);
    if (global.platformIsWin) {
      try {
        await makeUserConfig();
        await main();
      } catch (setupError) {
        logger.error('配置创建失败：', setupError.message);
        process.exit(1);
      }
    } else {
      logger.error('非windows平台，请手动新增配置文件后再试！');
      process.exit(1);
    }
  }
}

start();