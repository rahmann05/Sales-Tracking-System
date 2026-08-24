import { prisma } from '../config/prisma.js';

async function main() {
  console.log('[SEED] Seeding CALLPLAN_LEGEND into SystemConfig...');
  const legendData = {
    F1: {
      code: 'F1',
      name: '1x Kunjungan per Bulan',
      description: 'Kunjungan rutin 1 kali dalam sebulan (Monthly)',
      frequencyText: '1x / Bulan',
      cycle: 'Bulanan'
    },
    F2: {
      code: 'F2',
      name: '2x Kunjungan per Bulan',
      description: 'Kunjungan rutin 2 minggu sekali (Bi-weekly: Minggu 1-3 atau Minggu 2-4)',
      frequencyText: '2x / Bulan (2 Minggu Sekali)',
      cycle: '2 Minggu Sekali'
    },
    F4: {
      code: 'F4',
      name: '4x Kunjungan per Bulan',
      description: 'Kunjungan rutin setiap minggu (Weekly: Minggu 1, 2, 3, dan 4)',
      frequencyText: '4x / Bulan (Setiap Minggu)',
      cycle: 'Setiap Minggu'
    },
    F8: {
      code: 'F8',
      name: '8x Kunjungan per Bulan',
      description: 'Kunjungan intensif 2x dalam seminggu',
      frequencyText: '8x / Bulan (2x Seminggu)',
      cycle: '2x Seminggu'
    },
  };

  const saved = await prisma.systemConfig.upsert({
    where: { key: 'CALLPLAN_LEGEND' },
    update: { value: legendData },
    create: { key: 'CALLPLAN_LEGEND', value: legendData },
  });

  console.log('[SUCCESS] CALLPLAN_LEGEND saved to PostgreSQL:', saved);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
