import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Kepala Gudang user
  const kg = await prisma.user.upsert({
    where: { email: 'kepalagudang@sinaranugrah.com' },
    update: { role: 'KEPALA_GUDANG' },
    create: {
      name: 'Pak Hendra (Kepala Gudang)',
      email: 'kepalagudang@sinaranugrah.com',
      password: passwordHash,
      role: 'KEPALA_GUDANG',
    },
  });
  console.log('[OK] Kepala Gudang created:', kg.name, kg.email);

  // Create Supir user
  const supir = await prisma.user.upsert({
    where: { email: 'supir@sinaranugrah.com' },
    update: { role: 'SUPIR' },
    create: {
      name: 'Agus (Supir 1)',
      email: 'supir@sinaranugrah.com',
      password: passwordHash,
      role: 'SUPIR',
    },
  });
  console.log('[OK] Supir created:', supir.name, supir.email);

  // Create second Supir
  const supir2 = await prisma.user.upsert({
    where: { email: 'supir2@sinaranugrah.com' },
    update: { role: 'SUPIR' },
    create: {
      name: 'Budi (Supir 2)',
      email: 'supir2@sinaranugrah.com',
      password: passwordHash,
      role: 'SUPIR',
    },
  });
  console.log('[OK] Supir 2 created:', supir2.name, supir2.email);

  console.log('\n[INFO] Login Credentials:');
  console.log('  Kepala Gudang: kepalagudang@sinaranugrah.com / password123');
  console.log('  Supir 1: supir@sinaranugrah.com / password123');
  console.log('  Supir 2: supir2@sinaranugrah.com / password123');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
