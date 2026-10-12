// 《战争进化史 3D》本地专属轻量 HTTP 游戏服务器 (Node.js 原生零依赖)
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.fbx': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm'
};

function startServer(port = 8090) {
  const server = http.createServer((req, res) => {
    // 允许跨域加载 3D 资产与 API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURI(parsedUrl.pathname);

    // API: 保存基地与炮塔对齐参数
    if (pathname === '/api/save_alignment' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const configPath = path.join(ROOT_DIR, 'src', 'config', 'alignment_config.json');
          const eraSpecs = payload.eraSpecs || payload;
          fs.writeFileSync(configPath, JSON.stringify(eraSpecs, null, 2), 'utf-8');

          // 同步更新 Base.js 中的 BASE_ERA_SPECS
          const baseJsPath = path.join(ROOT_DIR, 'src', 'entities', 'Base.js');
          if (fs.existsSync(baseJsPath)) {
            let baseJsContent = fs.readFileSync(baseJsPath, 'utf-8');
            const replacement = `export const BASE_ERA_SPECS = ${JSON.stringify(eraSpecs, null, 2)};`;
            baseJsContent = baseJsContent.replace(/export const BASE_ERA_SPECS = \{[\s\S]*?\};/, replacement);
            fs.writeFileSync(baseJsPath, baseJsContent, 'utf-8');
          }

          console.log(`[API] 成功持久化保存基地与炮塔对齐配置 (时代: ${payload.era || '全部'})`);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, message: '配置已成功保存并同步到 Base.js' }));
        } catch (err) {
          console.error('[API 错误]', err);
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // API: 获取已保存的对齐参数
    if (pathname === '/api/get_alignment' && req.method === 'GET') {
      const configPath = path.join(ROOT_DIR, 'src', 'config', 'alignment_config.json');
      if (fs.existsSync(configPath)) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        fs.createReadStream(configPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Config not found' }));
      }
      return;
    }

    let reqPath = pathname;
    if (reqPath === '/' || reqPath === '') {
      reqPath = '/game.html';
    }

    const safePath = path.normalize(path.join(ROOT_DIR, reqPath));
    if (!safePath.startsWith(ROOT_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }

    fs.stat(safePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`404 Not Found: ${reqPath}`);
        return;
      }

      const ext = path.extname(safePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      // 支持音频流 Range 分片加载
      const range = req.headers.range;
      const fileSize = stats.size;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const fileStream = fs.createReadStream(safePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        });
        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes'
        });
        fs.createReadStream(safePath).pipe(res);
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
      console.log(`⚠️  端口 ${port} 无法使用 (${err.code})，自动尝试下一个端口 ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ 服务器错误:', err);
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}/game.html`;
    const inspectorUrl = `http://localhost:${port}/inspector_stone_age.html`;

    console.log('\n======================================================');
    console.log('   ⚔️  《战争进化史 3D》本地服务器已成功启动！ ⚔️');
    console.log('======================================================');
    console.log(` 🎮 游戏对战主页:     ${url}`);
    console.log(` 🎯 塔楼炮塔对齐工具: http://localhost:${port}/align_tool.html`);
    console.log(` 🏰 防御塔 3D 展厅:   http://localhost:${port}/turrets_gallery.html`);
    console.log(` 🔍 3D 资产检视台:    ${inspectorUrl}`);
    console.log('======================================================');
    console.log(' 💡 正在自动调起浏览器进入游戏... (按 Ctrl+C 可停止服务)\n');

    // 自动呼起 Windows 默认浏览器打开游戏
    exec(`start "" "${url}"`, (e) => {
      // 忽略后台输出
    });
  });
}

startServer(8107);
