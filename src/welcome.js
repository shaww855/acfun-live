import axios from "axios";
import { readFile } from "fs/promises";
console.log(`
                   .d888                          888 d8b                   
                  d88P"                           888 Y8P                   
                  888                             888                       
 8888b.   .d8888b 888888 888  888 88888b.         888 888 888  888  .d88b.  
    "88b d88P"    888    888  888 888 "88b        888 888 888  888 d8P  Y8b 
.d888888 888      888    888  888 888  888 888888 888 888 Y88  88P 88888888 
888  888 Y88b.    888    Y88b 888 888  888        888 888  Y8bd8P  Y8b.     
"Y888888  "Y8888P 888     "Y88888 888  888        888 888   Y88P    "Y8888  
                                                                            
`);

await Promise.all([
  readFile(new URL("../package.json", import.meta.url)).then((res) =>
    JSON.parse(res),
  ),
  axios.get("https://api.shaww.net/c.json"),
]).then(([packgeData, response]) => {
  //   console.log(response.data);
  console.log(`免费开源：${packgeData.homepage}`);
  console.log("公告时间：", response.data["公告时间"]);
  console.log("公告内容：", response.data["公告"]);
  console.log("当前版本：", packgeData.version);
  console.log("最新版本：", response.data["版本号"]);
});
