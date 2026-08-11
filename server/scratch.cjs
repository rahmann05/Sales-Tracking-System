const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const outlets = await prisma.outlet.findMany({ 
    include: { cluster: { include: { assignedSales: true, users: true } } },
    take: 1
  });
  console.log('Sample outlet:', JSON.stringify(outlets[0], null, 2));
  console.log('Total outlets:', await prisma.outlet.count());
}
main().catch(console.error).finally(() => prisma.$disconnect());
