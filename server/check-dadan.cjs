const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const dadanCahyaClusters = await prisma.cluster.findMany({
    where: {
      OR: [
        { name: { contains: 'DADAN', mode: 'insensitive' } },
        { name: { contains: 'CAHYA', mode: 'insensitive' } },
      ]
    }
  });
  console.log('Clusters for Dadan/Cahya:', dadanCahyaClusters.map(c => c.name));

  const countDadanCahya = await prisma.outlet.count({
    where: {
      clusterId: { in: dadanCahyaClusters.map(c => c.id) }
    }
  });
  console.log('Outlets for Dadan/Cahya:', countDadanCahya);
}
main().catch(console.error).finally(() => prisma.$disconnect());
