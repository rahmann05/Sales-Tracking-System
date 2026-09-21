import { prisma } from '../config/prisma.js';

const vehiclesData = [
  {
    code: 'B-1234-XYZ',
    name: 'Truk Box Isuzu Elf',
    maxCartons: 150,
    maxWeightKg: 2000,
    fuelKmPerLiter: 10,
    fuelType: 'Solar',
    fuelPricePerLiter: 6800,
    isActive: true,
    condition: 'AVAILABLE',
    totalKm: 12500,
    lastOilChangeKm: 8000,         // Sisa 500 km sampai ganti oli (Threshold 5000)
    lastOilFilterChangeKm: 5000,   // Sisa 2500 km sampai ganti filter (Threshold 10000)
    lastBrakePadChangeKm: 0,       // Sisa 7500 km sampai ganti rem (Threshold 20000)
  },
  {
    code: 'D-9876-ABC',
    name: 'Pickup L300',
    maxCartons: 80,
    maxWeightKg: 1000,
    fuelKmPerLiter: 12,
    fuelType: 'Solar',
    fuelPricePerLiter: 6800,
    isActive: true,
    condition: 'AVAILABLE',
    totalKm: 21500,
    lastOilChangeKm: 16000,        // Telat 500 km (Oli - Threshold 5000)
    lastOilFilterChangeKm: 10000,  // Telat 1500 km (Filter - Threshold 10000)
    lastBrakePadChangeKm: 0,       // Telat 1500 km (Rem - Threshold 20000)
  },
  {
    code: 'D-5555-ZZZ',
    name: 'Van Grand Max',
    maxCartons: 60,
    maxWeightKg: 800,
    fuelKmPerLiter: 14,
    fuelType: 'Pertalite',
    fuelPricePerLiter: 10000,
    isActive: true,
    condition: 'AVAILABLE',
    totalKm: 3200,
    lastOilChangeKm: 0,            // Sisa 1800 km
    lastOilFilterChangeKm: 0,      // Sisa 6800 km
    lastBrakePadChangeKm: 0,       // Sisa 16800 km
  }
];

async function main() {
  console.log('Seeding Vehicles...');

  // Optional: clear existing service records first
  await prisma.vehicleServiceRecord.deleteMany({});
  
  // Clear existing vehicles (or just ignore if using upsert, but we'll use create/update)
  for (const v of vehiclesData) {
    const existing = await prisma.vehicle.findUnique({ where: { code: v.code } });
    
    if (existing) {
      await prisma.vehicle.update({
        where: { id: existing.id },
        data: v
      });
      console.log(`Updated vehicle: ${v.code}`);
    } else {
      await prisma.vehicle.create({
        data: v
      });
      console.log(`Created vehicle: ${v.code}`);
    }
  }

  // Seed a sample service record for the first vehicle
  const firstVehicle = await prisma.vehicle.findUnique({ where: { code: 'B-1234-XYZ' } });
  if (firstVehicle) {
    await prisma.vehicleServiceRecord.create({
      data: {
        vehicleId: firstVehicle.id,
        serviceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        workshopName: 'Bengkel Resmi Isuzu Bandung',
        serviceType: 'GANTI_OLI',
        cost: 450000,
        odometerAtService: 8000,
        notes: 'Ganti oli rutin bulan lalu'
      }
    });
    console.log('Created sample service record for B-1234-XYZ');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
