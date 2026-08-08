const { execSync } = require('child_process');
const path = require('path');
process.chdir(__dirname);
const prismaBin = path.join(__dirname, 'node_modules', '.bin', 'prisma.CMD');
try {
  execSync(`"${prismaBin}" generate`, { stdio: 'inherit', shell: true });
  console.log('GEN_OK');
} catch (e) { console.error('GEN_FAIL'); process.exit(1); }
