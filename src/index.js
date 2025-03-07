import { getConfig } from './userConfig.js';
import { makeUserConfig } from './question.js';
import logger from './log.js';
import './globalValue.js';
import welcome from './welcome.js';
import main, { closeBrowser } from './browser/index.js';

let timeid = null;
let userClose = false;

process.on('SIGINT', async () => {
  logger.debug('退出');
  userClose = true;
  logger.warn('收到用户的退出命令，再见。');
  process.nextTick(() => {
    logger.shutdown(() => {
      process.exitCode = 1;
    });
  });
});

process.on('uncaughtException', (error) => {
  if (userClose) {
    return;
  }
  if (error instanceof Error && error.name === 'ExitPromptError') {
    logger.error('用户取消配置引导');
    process.exitCode = 1;
  } else {
    logger.error(`捕获未知错误！ ${error.message}`);
    if (timeid === null) {
      logger.warn('请尝试删除 config.json 文件后重试');
      logger.warn(
        '如无法解决，请保留日志文件并反馈至唯一指定扣扣群：726686920',
      );

      closeBrowser().then(() => {
        let msg = '5s后自动退出！';
        if (global.config && global.config.出错时 === '自动重启') {
          msg = '5s后自动重启！';
        }
        let timeCount = 5;
        logger.info(msg);
        timeid = setInterval(() => {
          timeCount--;
          logger.info(timeCount);
          if (timeCount == 1) {
            clearInterval(timeid);
            timeid = null;

            if (global.config && global.config.出错时 === '自动重启') {
              start();
            } else {
              // log4js.shutdown().finally(() => {
              process.exitCode = 1;
              // });
            }
          }
        }, 1000);
      });
    }
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
