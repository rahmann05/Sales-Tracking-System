import { prisma } from '../config/prisma.js';

async function main() {
  console.log('Seeding Delivery Routes for testing...');

  const vehicle = await prisma.vehicle.findFirst({ where: { code: 'B-1234-XYZ' } });
  if (!vehicle) {
    console.error('Vehicle B-1234-XYZ not found, please run seedVehicles.js first.');
    return;
  }

  const driver = await prisma.user.findFirst({ where: { role: 'SUPIR' } });
  if (!driver) {
    console.error('Supir not found.');
    return;
  }

  const kepalaGudang = await prisma.user.findFirst({ where: { role: 'KEPALA_GUDANG' } });
  if (!kepalaGudang) {
    console.error('Kepala Gudang not found.');
    return;
  }

  const outlet = await prisma.outlet.findFirst();
  if (!outlet) {
    console.error('No outlets found.');
    return;
  }

  // Create a PackingList
  const packingList = await prisma.packingList.create({
    data: {
      code: `PL-TEST-${Date.now()}`,
      outletId: outlet.id,
      totalCartons: 10,
      totalWeight: 150,
      notes: 'Test packing list',
      createdById: kepalaGudang.id,
      invoices: {
        create: [
          {
            invoiceNumber: `INV-TEST-${Date.now()}`,
            outletId: outlet.id,
            totalAmount: 500000,
            totalCartons: 10,
            notes: 'Test invoice'
          }
        ]
      }
    }
  });

  // Create DeliveryRoute for today
  const today = new Date();
  today.setHours(7, 0, 0, 0); // Start of day

  const route = await prisma.deliveryRoute.create({
    data: {
      code: `DR-TEST-${Date.now()}`,
      date: today,
      vehicleId: vehicle.id,
      driverId: driver.id,
      status: 'READY',
      totalCartons: 10,
      totalWeight: 150,
      createdById: kepalaGudang.id,
      stops: {
        create: [
          {
            sequence: 1,
            packingListId: packingList.id,
            outletId: outlet.id,
            status: 'PENDING'
          }
        ]
      }
    }
  });

  console.log(`Created test DeliveryRoute: ${route.code} assigned to ${driver.name} with vehicle ${vehicle.code}`);
  console.log('Seeding Delivery Routes complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
