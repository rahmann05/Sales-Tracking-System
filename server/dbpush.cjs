// Helper sementara: jalankan prisma db push dari cwd folder server
const { execSync } = require('child_process');
const path = require('path');
process.chdir(__dirname);
const prismaBin = path.join(__dirname, 'node_modules', '.bin', 'prisma.CMD');
try {
  execSync(`"${prismaBin}" db push --accept-data-loss --skip-generate`, { stdio: 'inherit', shell: true });
  console.log('DB_PUSH_OK');
} catch (e) {
  console.error('DB_PUSH_FAIL', e.status);
  process.exit(1);
}
