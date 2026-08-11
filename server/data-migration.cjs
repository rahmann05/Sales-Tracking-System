const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration...');

  // 1. Identify Dadan and Cahya clusters
  const dadanCahyaClusters = await prisma.cluster.findMany({
    where: {
      OR: [
        { name: { contains: 'DADAN', mode: 'insensitive' } },
        { name: { contains: 'CAHYA', mode: 'insensitive' } },
      ]
    }
  });

  const dadanCahyaIds = dadanCahyaClusters.map(c => c.id);
  console.log(`Found ${dadanCahyaIds.length} clusters for Dadan/Cahya.`);

  // 2. Update Outlet Types
  if (dadanCahyaIds.length > 0) {
    const updateGt = await prisma.outlet.updateMany({
      where: {
        clusterId: { in: dadanCahyaIds }
      },
      data: {
        type: 'GENERAL_TRADE'
      }
    });
    console.log(`Updated ${updateGt.count} outlets to GENERAL_TRADE.`);

    const updateMt = await prisma.outlet.updateMany({
      where: {
        clusterId: { notIn: dadanCahyaIds }
      },
      data: {
        type: 'MODERN_TRADE'
      }
    });
    console.log(`Updated ${updateMt.count} outlets to MODERN_TRADE.`);
  } else {
    // If no clusters match, maybe update all to MODERN_TRADE?
    console.log('No Dadan/Cahya clusters found, falling back to all MODERN_TRADE.');
    const updateAll = await prisma.outlet.updateMany({
      data: {
        type: 'MODERN_TRADE'
      }
    });
    console.log(`Updated ${updateAll.count} outlets to MODERN_TRADE.`);
  }

  // 3. Reset Sales and Supervisor Assignments
  console.log('Resetting user cluster assignments...');
  
  // Clear User.clusterId (so no sales/supervisor is attached to a cluster)
  const resetUsers = await prisma.user.updateMany({
    where: {
      clusterId: { not: null }
    },
    data: {
      clusterId: null
    }
  });
  console.log(`Cleared clusterId for ${resetUsers.count} users.`);

  // Clear Cluster.assignedSalesId
  const resetClusters = await prisma.cluster.updateMany({
    where: {
      assignedSalesId: { not: null }
    },
    data: {
      assignedSalesId: null
    }
  });
  console.log(`Cleared assignedSalesId for ${resetClusters.count} clusters.`);

  // Because users <-> clusters is also managed via the 'ClusterAssignedSales' implicit relation in Prisma if it was a many-to-many?
  // Let's check schema. User has:
  // clusterId String? (this is the 1-to-many relation 'Cluster.users')
  // assignedClusters Cluster[] @relation("ClusterAssignedSales")
  // So emptying assignedSalesId from Cluster is sufficient to break the "ClusterAssignedSales" 1-to-many relation, wait.
  // In schema.prisma:
  // User: assignedClusters Cluster[] @relation("ClusterAssignedSales")
  // Cluster: assignedSales User? @relation("ClusterAssignedSales", fields: [assignedSalesId], references: [id])
  // This is a 1-to-many relation! (A user can be assigned as sales to multiple clusters, a cluster has 1 assigned sales).
  // Yes, setting assignedSalesId = null on Cluster will clear it.

  console.log('Data migration completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
