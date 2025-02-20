import { getConfig } from "./userConfig.js";
import { makeUserConfig } from "./question.js";
import "./log.js";
import "./globalValue.js";
import welcome from "./welcome.js";
import main from "./browser/index.js";

process.on("uncaughtException", (error) => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    global.logger.info("用户取消配置引导");
    process.exit();
  } else {
    console.error(error);
    global.logger.error(error.message);
    console.log("请尝试删除 config.json 文件后重试");
    console.log("如无法解决，请保留日志文件并反馈至唯一指定扣扣群：726686920");
    console.log("5s后自动退出，再见！");

    let time = 5;
    setInterval(() => {
      time--;
      console.log(time);
      if (time == 1) {
        process.exit(1);
      }
    }, 1000);
  }
});

async function start() {
  await welcome();
  getConfig()
    .then(() => {
      console.log("配置文件读取成功");
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
