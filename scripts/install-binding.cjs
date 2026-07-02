const https = require('https');
const { createWriteStream, existsSync, mkdirSync, unlinkSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');
const { platform } = process;

if (platform !== 'win32') process.exit(0);

const pkg = '@rolldown/binding-win32-x64-msvc';
const version = '1.1.4';
const targetDir = join(__dirname, '..', 'node_modules', '@rolldown');
const bindingDir = join(targetDir, 'binding-win32-x64-msvc');

if (existsSync(bindingDir)) process.exit(0);

const tarballUrl = `https://registry.npmjs.org/${pkg}/-/${pkg.split('/')[1]}-${version}.tgz`;
const tarballPath = join(__dirname, '..', 'binding.tgz');

console.log(`[postinstall] Downloading ${pkg}@${version}...`);

const file = createWriteStream(tarballPath);
https.get(tarballUrl, res => {
  if (res.statusCode !== 200) {
    console.error(`[postinstall] Download failed: HTTP ${res.statusCode}`);
    process.exit(1);
  }
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    if (!existsSync(bindingDir)) mkdirSync(bindingDir, { recursive: true });
    execSync(`tar -xzf "${tarballPath}" -C "${bindingDir}" --strip-components=1`, { stdio: 'inherit' });
    try { unlinkSync(tarballPath); } catch {}
    console.log(`[postinstall] ${pkg}@${version} installed successfully`);
  });
}).on('error', err => {
  console.error(`[postinstall] Download failed:`, err.message);
  process.exit(1);
});
