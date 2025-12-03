import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  // 统一版本号获取逻辑
  const getVersion = () => {
    if (process.env.BUILD_VERSION) {
      return process.env.BUILD_VERSION.replace(/\./g, '_');
    }
    // 使用基于本文件的 package.json 路径，避免 cwd 问题
    const pkgPath = path.join(__dirname, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version.replace(/\./g, '_');
  };

  try {
    const version = getVersion();
    const distPath = path.join(__dirname, 'dist');

    // 清理dist目录（保留config.json）
    if (fs.existsSync(distPath)) {
      fs.readdirSync(distPath)
        .filter((file) => file !== 'config.json')
        .forEach((file) =>
          fs.rmSync(path.join(distPath, file), {
            recursive: true,
            force: true,
          }),
        );
    } else {
      fs.mkdirSync(distPath, { recursive: true });
    }

    // 使用绝对路径构造命令，避免依赖 cwd
    const entryFile = path.join(__dirname, 'src', 'index.js');
    const outCjs = path.join(distPath, `acfunlive_${version}.cjs`);
    const outExe = path.join(distPath, `acfunlive_${version}.exe`);

    // 修正esbuild命令格式，使用双引号包裹路径，并指定兼容的target
    const buildCommands = [
      `npx esbuild "${entryFile}" --bundle --platform=node --outfile="${outCjs}" --format=cjs --target=es2017`,
      `npx pkg "${outCjs}" --target node18-win-x64 --output "${outExe}" --compress`,
    ];

    // 执行构建命令
    buildCommands.forEach((cmd) =>
      execSync(cmd, {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_OPTIONS: '--experimental-vm-modules --no-warnings',
        },
      }),
    );

    // 检查 exe 是否生成
    if (!fs.existsSync(outExe)) {
      throw new Error(`期望的可执行文件未生成：${outExe}`);
    }

    // 压缩打包：使用事件等待 archive 完成
    const zipPath = path.join(distPath, `acfunlive_${version}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    const archivePromise = new Promise((resolve, reject) => {
      output.on('close', resolve);
      output.on('end', resolve);
      archive.on('warning', (err) => {
        // 小问题记录但不终止
        console.warn('archiver warning:', err.message || err);
      });
      archive.on('error', (err) => reject(err));
    });

    archive.pipe(output);
    archive.file(outExe, { name: path.basename(outExe) });
    archive.finalize();
    await archivePromise;

    console.log(`
  ✅ 构建完成！
  生成文件：
  - ${path.relative(__dirname, outCjs)}
  - ${path.relative(__dirname, outExe)}
  - ${path.relative(__dirname, zipPath)}
  `);
  } catch (error) {
    console.error(
      '❌ 构建失败:',
      error && error.message ? error.message : error,
    );
    process.exit(1);
  }
})();
