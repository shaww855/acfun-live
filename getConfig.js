const fs = require("fs");

const configPath = __dirname + "/config.json"
let config = null
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} else {
  throw ' config.json 文件不存在，请检查'
}

module.exports = {
  config
}