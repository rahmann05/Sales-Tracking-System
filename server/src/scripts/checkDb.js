import { prisma } from '../config/prisma.js';

async function main() {
  console.log('=== CHECKING DATABASE MODELS AND RECORDS ===');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clusterId: true,
      cluster: { select: { id: true, name: true, region: true } }
    }
  });
  console.log('\n--- USERS (' + users.length + ') ---');
  console.table(users.map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    email: u.email,
    cluster: u.cluster?.name || '-'
  })));

  const clusters = await prisma.cluster.findMany({
    include: {
      _count: { select: { outlets: true, users: true } },
      assignedSales: { select: { id: true, name: true, email: true } },
      users: { select: { id: true, name: true, role: true } },
      routes: true,
    }
  });
  console.log('\n--- CLUSTERS (' + clusters.length + ') ---');
  console.table(clusters.map(c => ({
    id: c.id,
    name: c.name,
    region: c.region,
    outlets: c._count.outlets,
    assignedSales: c.assignedSales?.name || '-',
    usersCount: c._count.users
  })));

  const outlets = await prisma.outlet.findMany({
    take: 5,
    select: { id: true, outletCode: true, name: true, address: true, clusterId: true }
  });
  console.log('\n--- SAMPLE OUTLETS ---');
  console.table(outlets);

  const pjps = await prisma.pjp.findMany({
    include: {
      user: { select: { id: true, name: true } },
      stops: {
        include: { outlet: { select: { id: true, name: true, address: true } } }
      }
    }
  });
  console.log('\n--- PJPS (' + pjps.length + ') ---');
  console.table(pjps.map(p => ({
    id: p.id,
    date: p.date,
    sales: p.user?.name,
    status: p.status,
    totalStops: p.stops?.length
  })));

  const templates = await prisma.pjpTemplate.findMany({
    include: {
      user: { select: { id: true, name: true } },
      stops: true
    }
  });
  console.log('\n--- PJP TEMPLATES (' + templates.length + ') ---');
  console.table(templates.map(t => ({
    id: t.id,
    dayOfWeek: t.dayOfWeek,
    weekNumber: t.weekNumber,
    sales: t.user?.name,
    totalStops: t.totalStops
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
