import fs from "node:fs/promises";
// import path from "node:path";

const configPath = "./config.json";
// const configPath = path.join(import.meta.dirname, "./config.json");

export const defaultConfig = {
  调试: false,
  自动重启: false,
  记住登录状态: false,
  监控间隔分钟: 10,
  浏览器路径: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  黑名单: [],
  白名单: [],
  忽略当前佩戴牌子的直播间: false,
  忽略有牌子但未关注的直播间: false,
  bark通知: null,
  饼干: [],
  饼干过期时间: null,
};

/**
 * 读取配置文件
 */
export function getConfig() {
  return new Promise((resolve, reject) => {
    fs.readFile(configPath, { encoding: "utf8" })
      .then((res) => {
        global.config = JSON.parse(res);
        resolve();
      })
      .catch((err) => {
        global.logger.error("读取配置文件失败", err);
        reject(err);
      });
  });
}

/**+
 * 保存配置文件
 */
export function saveConfig() {
  const data = JSON.stringify(global.config);
  return fs
    .writeFile(configPath, data)
    .then((res) => {
      global.logger.info("保存配置文件成功", JSON.stringify(global.config));
    })
    .catch((err) => {
      global.logger.error("保存配置文件失败", err);
    });
}
