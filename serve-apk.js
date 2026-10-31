import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = 8080;
const localIp = getLocalIp();

// Candidate APK file paths
const apkCandidates = [
  path.resolve('./SkillBridge.apk'),
  path.resolve('./mobile/android/app/build/outputs/apk/debug/app-debug.apk'),
  path.resolve('./mobile/android/app/build/outputs/apk/release/app-release.apk')
];

function findApk() {
  for (const candidate of apkCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  const apkPath = findApk();

  if (req.url === '/download' || req.url === '/SkillBridge.apk') {
    if (!apkPath) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('APK file is currently being built. Please wait a moment and refresh.');
    }

    const stat = fs.statSync(apkPath);
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': stat.size,
      'Content-Disposition': 'attachment; filename="SkillBridge.apk"'
    });

    const readStream = fs.createReadStream(apkPath);
    return readStream.pipe(res);
  }

  // HTML landing page for phone browser
  const apkExists = Boolean(apkPath);
  const sizeMb = apkExists ? (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(1) + ' MB' : 'Building...';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download SkillBridge Android App</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #F8F7FC; color: #211B35; padding: 24px 16px; display: flex; justify-content: center; }
    .card { background: #FFFFFF; max-width: 440px; width: 100%; border-radius: 24px; padding: 28px 24px; box-shadow: 0 10px 30px rgba(96,55,214,0.08); border: 1px solid #E8E4F0; text-align: center; }
    .icon { width: 72px; height: 72px; background: #6037D6; border-radius: 20px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 36px; box-shadow: 0 8px 16px rgba(96,55,214,0.25); }
    h1 { font-size: 24px; font-weight: 900; margin-bottom: 6px; }
    .subtitle { color: #817B91; font-size: 14px; margin-bottom: 24px; line-height: 1.4; }
    .meta { background: #EEE9FF; border-radius: 14px; padding: 12px; margin-bottom: 24px; font-size: 13px; color: #4523AD; font-weight: 700; display: flex; justify-content: space-around; }
    .btn { display: block; width: 100%; background: #6037D6; color: #FFFFFF; text-decoration: none; padding: 16px; border-radius: 16px; font-size: 16px; font-weight: 800; box-shadow: 0 6px 14px rgba(96,55,214,0.3); transition: transform 0.1s ease; }
    .btn:active { transform: scale(0.98); }
    .btn.disabled { background: #CCC6DD; pointer-events: none; }
    .instructions { text-align: left; margin-top: 28px; border-top: 1px solid #E8E4F0; padding-top: 20px; }
    .instructions h3 { font-size: 14px; font-weight: 800; margin-bottom: 12px; color: #211B35; }
    .instructions ol { padding-left: 20px; color: #817B91; font-size: 13px; line-height: 1.6; }
    .instructions li { margin-bottom: 6px; }
    .badge { display: inline-block; background: #20A66A; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🎓</div>
    <span class="badge">ANDROID APK</span>
    <h1>SkillBridge</h1>
    <p class="subtitle">Campus Freelance & Services Marketplace</p>

    <div class="meta">
      <span>Version: 1.0.0</span>
      <span>•</span>
      <span>Size: ${sizeMb}</span>
      <span>•</span>
      <span>Status: ${apkExists ? 'Ready' : 'Compiling'}</span>
    </div>

    ${apkExists ? `
      <a class="btn" href="/download">⬇️ Download SkillBridge.apk</a>
    ` : `
      <div class="btn disabled">Building APK... Please refresh</div>
    `}

    <div class="instructions">
      <h3>📲 How to install on your phone:</h3>
      <ol>
        <li>Tap <strong>Download SkillBridge.apk</strong> above.</li>
        <li>When downloaded, open the file or pull down notifications.</li>
        <li>If prompted with <em>"Install unknown apps"</em>, tap <strong>Settings</strong> and switch on <strong>Allow from this source</strong>.</li>
        <li>Tap <strong>Install</strong>, then open SkillBridge!</li>
      </ol>
    </div>
  </div>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`📱 SkillBridge APK Phone Download Server is Running!`);
  console.log(`======================================================`);
  console.log(`\n👉 Open this URL in your phone's browser (Chrome/Edge):`);
  console.log(`   http://${localIp}:${PORT}`);
  console.log(`\n👉 Direct APK Download Link:`);
  console.log(`   http://${localIp}:${PORT}/download`);
  console.log(`\n(Ensure your phone is connected to the same Wi-Fi network)`);
  console.log(`======================================================\n`);
});

