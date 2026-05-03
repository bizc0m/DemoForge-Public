import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'assets', 'thumbs');
const PORT = Number(process.env.PORT || 4173);
const WIDTH = Number(process.env.SCREENSHOT_WIDTH || 1280);
const HEIGHT = Number(process.env.SCREENSHOT_HEIGHT || 800);
const TIMEOUT = Number(process.env.SCREENSHOT_TIMEOUT || 12000);

fs.mkdirSync(outDir, { recursive: true });

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (['.git', 'node_modules', '__MACOSX'].includes(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (name.endsWith('.html') && name !== 'index.html') acc.push(full);
  }
  return acc;
}

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css';
  if (file.endsWith('.js')) return 'text/javascript';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
  const safe = path.normalize(urlPath).replace(/^[/\\]+/, '');
  const file = path.join(root, safe || 'index.html');
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': contentType(file) });
  fs.createReadStream(file).pipe(res);
});

await new Promise(resolve => server.listen(PORT, resolve));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
const htmlFiles = walk(root);
let ok = 0;
let failed = 0;

for (const full of htmlFiles) {
  const rel = path.relative(root, full).split(path.sep).join('/');
  const shot = path.join(outDir, rel.replaceAll('/', '--') + '.png');
  try {
    await page.goto(`http://127.0.0.1:${PORT}/${rel}`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(500);
    await page.screenshot({ path: shot, fullPage: false });
    ok++;
    console.log(`✓ ${rel}`);
  } catch (error) {
    failed++;
    console.warn(`✗ ${rel}: ${error.message}`);
  }
}

await browser.close();
server.close();
console.log(`Screenshots complete: ${ok} ok, ${failed} failed.`);
if (failed > 0) process.exitCode = 1;
