import { getTodayPjp } from './src/modules/pjp/pjp.service.js';
import { prisma } from './src/config/prisma.js';

try {
    const sales = await prisma.user.findFirst({ where: { role: 'SALES', clusterId: { not: null } } });
    console.log('sales:', sales ? sales.email : 'NONE', '| clusterId:', sales ? sales.clusterId : '-');
    const outletCount = sales ? await prisma.outlet.count({ where: { clusterId: sales.clusterId, deletedAt: null } }) : 0;
    console.log('outlet di cluster:', outletCount);
    const pjp = sales ? await getTodayPjp(sales.id) : null;
    console.log('PJP hari ini stops =', pjp ? pjp.stops.length : 'null');
    if (pjp && pjp.stops.length > 0) {
        console.log('contoh stop 1:', pjp.stops[0].outlet?.name, '| seq:', pjp.stops[0].sequence);
    }
} catch (e) {
    console.log('ERR:', e.message);
} finally {
    await prisma.$disconnect();
}
