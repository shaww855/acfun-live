import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 统一版本号获取逻辑
const getVersion = () => {
  // 优先使用环境变量
  if (process.env.BUILD_VERSION) {
    return process.env.BUILD_VERSION.replace(/\./g, '_');
  }
  
  // 本地开发读取 package.json
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  return pkg.version.replace(/\./g, '_');
};

try {
  const version = getVersion();
  const distPath = path.join(__dirname, 'dist');

  // 清理dist目录（保留config.json）
  if (fs.existsSync(distPath)) {
    fs.readdirSync(distPath)
      .filter(file => file !== 'config.json')
      .forEach(file => fs.rmSync(path.join(distPath, file), { recursive: true, force: true }));
  } else {
    fs.mkdirSync(distPath, { recursive: true });
  }

  // 修复 esbuild 调用方式
  const buildCommands = [
    `npx esbuild ./src/index.js --bundle --platform=node --outfile=dist/index_${version}.cjs --format=cjs`,
    `npx pkg ./dist/index_${version}.cjs --target latest --platform win --output dist/index_${version}.exe`
  ];

  // 执行构建命令
  buildCommands.forEach(cmd => execSync(cmd, { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      // 添加 Linux 环境需要的 Node 选项
      NODE_OPTIONS: '--experimental-vm-modules --no-warnings'
    }
  }));

  // 压缩打包
  const zipPath = path.join(distPath, `index_${version}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 }});
  
  archive.pipe(output);
  archive.file(path.join(distPath, `index_${version}.exe`), { name: `index_${version}.exe` });
  await archive.finalize();

  console.log(`
  ✅ 构建完成！
  生成文件：
  - dist/index_${version}.cjs
  - dist/index_${version}.exe
  - dist/index_${version}.zip
  `);
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}
