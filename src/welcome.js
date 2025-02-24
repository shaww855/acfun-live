import fs from 'fs';

export default async function () {
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

  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  console.log('当前版本：', pkg.version);
  console.log('推荐使用浏览器：Chromium 133.0.6943.98  Firefox 135.0');
  console.log(`开源地址：`, pkg.homepage);
}
