const fs = require("fs");
const path = require("path");

const configPath = path.join(process.execPath, "../","./config.json");
let isConfigExist = fs.existsSync(configPath);

let config = null
if (isConfigExist) {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} else {
  throw ' config.json 文件不存在，请检查'
}

module.exports = {
  config
}