// 本文件由DeepSeek-r1生成
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  // 读取版本号并格式化
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const version = pkg.version.replace(/\./g, '_'); // 转换为 2_0_0 格式
  const distPath = path.join(__dirname, 'dist');

  // 清理 dist 目录（保留 config.json）
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    for (const file of files) {
      if (file !== 'config.json') {
        fs.rmSync(path.join(distPath, file), { recursive: true, force: true });
      }
    }
  } else {
    fs.mkdirSync(distPath);
  }

  // ESBuild 打包
  execSync(
    `node .\\node_modules\\esbuild\\bin\\esbuild .\\src\\index.js ` +
    `--bundle --platform=node ` +
    `--outfile=dist\\index_${version}.cjs ` +
    `--format=cjs`,
    { stdio: 'inherit' }
  );

  // PKG 打包
  execSync(
    `pkg .\\dist\\index_${version}.cjs ` +
    `--target latest --platform win ` +
    `--output dist\\index_${version}.exe`,
    { stdio: 'inherit' }
  );

  // 使用 archiver 进行 ZIP 压缩
  const zipFilePath = `./dist/index_${version}.zip`;
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver('zip', { zlib: { level: 9 }});

  archive.pipe(output);
  archive.file(`./dist/index_${version}.exe`, { name: `index_${version}.exe` });
  await archive.finalize();

  console.log(`
  ✅ 构建完成！
  生成文件：
  - dist\\index_${version}.cjs
  - dist\\index_${version}.exe
  - dist\\index_${version}.zip
  `);
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}
