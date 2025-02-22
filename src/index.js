import { getConfig } from "./userConfig.js";
import { makeUserConfig } from "./question.js";
import "./log.js";
import "./globalValue.js";
import welcome from "./welcome.js";
import main, { closeBrowser } from "./browser/index.js";

process.on("uncaughtException", (error) => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    global.logger.error("用户取消配置引导");
    process.exit();
  } else {
    global.logger.error(error.message);
    console.log("请尝试删除 config.json 文件后重试");
    console.log("如无法解决，请保留日志文件并反馈至唯一指定扣扣群：726686920");
    closeBrowser().then(() => {
      console.log("5s后自动重启！");

      let timeCount = 5;
      const timeid = setInterval(() => {
        timeCount--;
        console.log(timeCount);
        if (timeCount == 1) {
          clearInterval(timeid);
          start();
        }
      }, 1000);
    });
  }
});

async function start() {
  await welcome();
  getConfig()
    .then(() => {
      global.logger.info(`配置文件读取成功，${JSON.stringify(global.config)}`);
      main();
    })
    .catch(() => {
      if (global.platformIsWin) {
        makeUserConfig().then((res) => {
          main();
        });
      } else {
        throw new Error("非windows平台，请手动新增配置文件后再试！");
      }
    });
}

start();
