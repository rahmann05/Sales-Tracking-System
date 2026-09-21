import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { resolveRoadRoute } from '../routing/routing.service.js';

// ═══════════════════════════════════════════════════════════════
// PACKING LIST
// ═══════════════════════════════════════════════════════════════

/**
 * Generate unique packing list code: PL-YYYYMMDD-NNN
 */
const generatePackingListCode = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `PL-${dateStr}-`;

  const lastPL = await prisma.packingList.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
  });

  const nextNum = lastPL ? parseInt(lastPL.code.slice(-3), 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};

/**
 * Create packing list with invoices
 */
export const createPackingList = async (data, userId) => {
  const { outletId, totalCartons, totalWeight, notes, invoices } = data;

  // Verify outlet exists
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet) throw new AppError('Outlet tidak ditemukan', 404);

  const code = await generatePackingListCode();

  const packingList = await prisma.packingList.create({
    data: {
      code,
      outletId,
      totalCartons,
      totalWeight,
      notes,
      createdById: userId,
      invoices: {
        create: invoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          outletId,
          totalAmount: inv.totalAmount,
          totalCartons: inv.totalCartons || 1,
          notes: inv.notes,
        })),
      },
    },
    include: {
      outlet: { select: { id: true, name: true, address: true, outletCode: true } },
      invoices: true,
      createdBy: { select: { id: true, name: true } },
    },
  });

  return packingList;
};

/**
 * List packing lists with filters
 */
export const getPackingLists = async (query) => {
  const { page = 1, limit = 20, search, outletId, dateFrom, dateTo } = query;
  const skip = (page - 1) * limit;

  const where = {};
  if (outletId) where.outletId = outletId;
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { outlet: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }

  const [items, total] = await Promise.all([
    prisma.packingList.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        outlet: { select: { id: true, name: true, address: true, outletCode: true } },
        invoices: true,
        createdBy: { select: { id: true, name: true } },
        deliveryStops: { select: { id: true, status: true } },
      },
    }),
    prisma.packingList.count({ where }),
  ]);

  return { items, total, page: parseInt(page), limit: parseInt(limit) };
};

/**
 * Get single packing list with details
 */
export const getPackingListById = async (id) => {
  const pl = await prisma.packingList.findUnique({
    where: { id },
    include: {
      outlet: { select: { id: true, name: true, address: true, outletCode: true, latitude: true, longitude: true } },
      invoices: true,
      createdBy: { select: { id: true, name: true } },
      deliveryStops: {
        include: {
          deliveryRoute: { select: { id: true, code: true, date: true, status: true } },
        },
      },
    },
  });
  if (!pl) throw new AppError('Packing list tidak ditemukan', 404);
  return pl;
};

/**
 * Delete packing list (only if not assigned to a route)
 */
export const deletePackingList = async (id) => {
  const pl = await prisma.packingList.findUnique({
    where: { id },
    include: { deliveryStops: true },
  });
  if (!pl) throw new AppError('Packing list tidak ditemukan', 404);
  if (pl.deliveryStops.length > 0) {
    throw new AppError('Packing list sudah ditetapkan ke rute pengiriman, tidak bisa dihapus', 400);
  }

  await prisma.packingList.delete({ where: { id } });
  return { message: 'Packing list berhasil dihapus' };
};

// ═══════════════════════════════════════════════════════════════
// DELIVERY ROUTE
// ═══════════════════════════════════════════════════════════════

/**
 * Generate unique delivery route code: DR-YYYYMMDD-A01
 */
const generateRouteCode = async (date) => {
  const dateStr = new Date(date).toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `DR-${dateStr}-`;

  const lastRoute = await prisma.deliveryRoute.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
  });

  const nextNum = lastRoute ? parseInt(lastRoute.code.slice(-3), 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};

/**
 * Create delivery route with stops
 */
export const createDeliveryRoute = async (data, userId) => {
  const { date, vehicleId, driverId, notes, stops } = data;

  // Verify vehicle exists and is active
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || !vehicle.isActive) throw new AppError('Kendaraan tidak ditemukan atau tidak aktif', 404);

  // Verify driver exists and has SUPIR role
  const driver = await prisma.user.findUnique({ where: { id: driverId } });
  if (!driver || driver.role !== 'SUPIR') throw new AppError('Supir tidak ditemukan atau role bukan SUPIR', 404);

  // Verify all packing lists exist
  const plIds = stops.map((s) => s.packingListId);
  const packingLists = await prisma.packingList.findMany({
    where: { id: { in: plIds } },
    include: { invoices: true },
  });
  if (packingLists.length !== plIds.length) {
    throw new AppError('Satu atau lebih packing list tidak ditemukan', 404);
  }

  // Calculate totals
  const totalCartons = packingLists.reduce((sum, pl) => sum + pl.totalCartons, 0);
  const totalWeight = packingLists.reduce((sum, pl) => sum + (pl.totalWeight || 0), 0);

  // Check vehicle capacity
  if (totalCartons > vehicle.maxCartons) {
    throw new AppError(
      `Total karton (${totalCartons}) melebihi kapasitas kendaraan (${vehicle.maxCartons})`,
      400
    );
  }

  const code = await generateRouteCode(date);

  const route = await prisma.deliveryRoute.create({
    data: {
      code,
      date: new Date(date),
      vehicleId,
      driverId,
      status: 'DRAFT',
      totalCartons,
      totalWeight: totalWeight || null,
      notes,
      createdById: userId,
      stops: {
        create: stops.map((s) => ({
          packingListId: s.packingListId,
          outletId: s.outletId,
          sequence: s.sequence,
        })),
      },
    },
    include: {
      vehicle: { select: { id: true, code: true, name: true, maxCartons: true } },
      driver: { select: { id: true, name: true, email: true } },
      stops: {
        orderBy: { sequence: 'asc' },
        include: {
          outlet: { select: { id: true, name: true, address: true, latitude: true, longitude: true } },
          packingList: { include: { invoices: true } },
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return route;
};

/**
 * List delivery routes with filters
 */
export const getDeliveryRoutes = async (query, userId, userRole) => {
  const { page = 1, limit = 20, date, status, driverId, vehicleId } = query;
  const skip = (page - 1) * limit;

  const where = {};

  // Supir only sees their own routes
  if (userRole === 'SUPIR') {
    where.driverId = userId;
  } else {
    if (driverId) where.driverId = driverId;
  }

  if (date) {
    const d = new Date(date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    where.date = { gte: d, lt: nextDay };
  }
  if (status) where.status = status;
  if (vehicleId) where.vehicleId = vehicleId;

  const [items, total] = await Promise.all([
    prisma.deliveryRoute.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { date: 'desc' },
      include: {
        vehicle: { select: { id: true, code: true, name: true } },
        driver: { select: { id: true, name: true } },
        stops: {
          orderBy: { sequence: 'asc' },
          include: {
            outlet: { select: { id: true, name: true, address: true, latitude: true, longitude: true } },
            packingList: { select: { id: true, code: true, totalCartons: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.deliveryRoute.count({ where }),
  ]);

  return { items, total, page: parseInt(page), limit: parseInt(limit) };
};

/**
 * Get single delivery route with full details
 */
export const getDeliveryRouteById = async (id) => {
  const route = await prisma.deliveryRoute.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: { select: { id: true, name: true, email: true } },
      stops: {
        orderBy: { sequence: 'asc' },
        include: {
          outlet: { select: { id: true, name: true, address: true, latitude: true, longitude: true, phone: true } },
          packingList: { include: { invoices: true } },
          attendances: { orderBy: { timestamp: 'asc' } },
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!route) throw new AppError('Rute pengiriman tidak ditemukan', 404);
  return route;
};

/**
 * Update delivery route status
 */
export const updateRouteStatus = async (id, status) => {
  const route = await prisma.deliveryRoute.findUnique({ 
    where: { id },
    include: { stops: { include: { outlet: true }, orderBy: { sequence: 'asc' } } }
  });
  if (!route) throw new AppError('Rute pengiriman tidak ditemukan', 404);

  let updateData = { status };
  let distanceKm = route.totalDistanceKm || 0;
  let fuelLiters = route.fuelConsumedLiters || 0;

  // Calculate distance when starting or completing if not yet calculated
  if ((status === 'IN_TRANSIT' || status === 'COMPLETED') && !route.totalDistanceKm) {
    try {
      // Waypoints: Default warehouse (Padalarang) -> Stops -> Default warehouse
      const waypoints = [
        { lat: -6.8582, lng: 107.5123 }, // Gudang origin
        ...route.stops.map(s => ({ lat: s.outlet.latitude, lng: s.outlet.longitude })),
        { lat: -6.8582, lng: 107.5123 }  // Return to Gudang
      ];
      
      const { legs } = await resolveRoadRoute(waypoints);
      distanceKm = legs.reduce((sum, leg) => sum + (leg.distanceKm || 0), 0);
      fuelLiters = distanceKm / 10; // 10km / liter
      
      updateData.totalDistanceKm = distanceKm;
      updateData.fuelConsumedLiters = fuelLiters;
    } catch (err) {
      console.warn('Gagal menghitung jarak GMap API:', err.message);
    }
  }

  // Use transaction if we need to update vehicle totalKm
  if (status === 'COMPLETED' && route.status !== 'COMPLETED') {
    const finalDistance = updateData.totalDistanceKm ?? route.totalDistanceKm ?? 0;
    
    const [updatedRoute] = await prisma.$transaction([
      prisma.deliveryRoute.update({
        where: { id },
        data: updateData,
        include: {
          vehicle: { select: { id: true, code: true, name: true } },
          driver: { select: { id: true, name: true } },
        },
      }),
      prisma.vehicle.update({
        where: { id: route.vehicleId },
        data: { totalKm: { increment: finalDistance } }
      })
    ]);
    return updatedRoute;
  }

  const updated = await prisma.deliveryRoute.update({
    where: { id },
    data: updateData,
    include: {
      vehicle: { select: { id: true, code: true, name: true } },
      driver: { select: { id: true, name: true } },
    },
  });
  return updated;
};

/**
 * Delete delivery route (only if DRAFT)
 */
export const deleteDeliveryRoute = async (id) => {
  const route = await prisma.deliveryRoute.findUnique({ where: { id } });
  if (!route) throw new AppError('Rute pengiriman tidak ditemukan', 404);
  if (route.status !== 'DRAFT') {
    throw new AppError('Hanya rute berstatus DRAFT yang bisa dihapus', 400);
  }

  await prisma.deliveryRoute.delete({ where: { id } });
  return { message: 'Rute pengiriman berhasil dihapus' };
};

// ═══════════════════════════════════════════════════════════════
// DELIVERY STOP ATTENDANCE (Supir)
// ═══════════════════════════════════════════════════════════════

/**
 * Submit driver attendance at a delivery stop
 * When type=IN: marks arrival
 * When type=OUT: marks completion & auto-ACC all invoices in packing list
 */
export const submitDriverAttendance = async (stopId, data, driverId) => {
  const { type, latitude, longitude, photoUrl, notes } = data;

  const stop = await prisma.deliveryStop.findUnique({
    where: { id: stopId },
    include: {
      deliveryRoute: true,
      packingList: { include: { invoices: true } },
    },
  });

  if (!stop) throw new AppError('Stop pengiriman tidak ditemukan', 404);
  if (stop.deliveryRoute.driverId !== driverId) {
    throw new AppError('Anda bukan supir yang ditugaskan untuk rute ini', 403);
  }

  // Create attendance record
  const attendance = await prisma.deliveryAttendance.create({
    data: {
      deliveryStopId: stopId,
      driverId,
      type,
      latitude,
      longitude,
      photoUrl,
      notes,
    },
  });

  // Update stop based on attendance type
  if (type === 'IN') {
    await prisma.deliveryStop.update({
      where: { id: stopId },
      data: {
        arrivedAt: new Date(),
        latitude,
        longitude,
      },
    });

    // Update route status to IN_TRANSIT if it's still READY
    if (stop.deliveryRoute.status === 'READY') {
      await prisma.deliveryRoute.update({
        where: { id: stop.deliveryRouteId },
        data: { status: 'IN_TRANSIT' },
      });
    }
  }

  return attendance;
};

/**
 * Update delivery stop status (Supir marks delivered/rejected)
 * Auto-ACC invoices when DELIVERED
 */
export const updateStopStatus = async (stopId, data, driverId) => {
  const { status, rejectReason, rejectedCartons, notes, photoUrl } = data;

  const stop = await prisma.deliveryStop.findUnique({
    where: { id: stopId },
    include: {
      deliveryRoute: { include: { stops: true } },
      packingList: { include: { invoices: true } },
    },
  });

  if (!stop) throw new AppError('Stop pengiriman tidak ditemukan', 404);
  if (stop.deliveryRoute.driverId !== driverId) {
    throw new AppError('Anda bukan supir yang ditugaskan untuk rute ini', 403);
  }

  const updateData = {
    status,
    completedAt: new Date(),
    notes,
  };

  if (photoUrl) updateData.photoUrl = photoUrl;

  if (status === 'REJECTED' || status === 'PARTIAL_REJECT') {
    updateData.rejectReason = rejectReason;
    updateData.rejectedCartons = rejectedCartons || 0;
  }

  // Update stop
  const updatedStop = await prisma.deliveryStop.update({
    where: { id: stopId },
    data: updateData,
    include: {
      outlet: { select: { id: true, name: true } },
      packingList: { include: { invoices: true } },
    },
  });

  // Auto-ACC invoices when delivered
  if (status === 'DELIVERED') {
    const invoiceIds = stop.packingList.invoices.map((inv) => inv.id);
    await prisma.invoice.updateMany({
      where: { id: { in: invoiceIds } },
      data: { isDelivered: true, deliveredAt: new Date() },
    });
  }

  // Check if all stops in route are completed → update route status
  const allStops = stop.deliveryRoute.stops;
  const completedStatuses = ['DELIVERED', 'REJECTED', 'PARTIAL_REJECT'];
  const otherStops = allStops.filter((s) => s.id !== stopId);
  const allOtherDone = otherStops.every((s) => completedStatuses.includes(s.status));

  if (allOtherDone && completedStatuses.includes(status)) {
    // All stops done — determine final route status
    const allDelivered = otherStops.every((s) => s.status === 'DELIVERED') && status === 'DELIVERED';
    await prisma.deliveryRoute.update({
      where: { id: stop.deliveryRouteId },
      data: { status: allDelivered ? 'COMPLETED' : 'PARTIAL' },
    });
  }

  return updatedStop;
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD (Kepala Gudang)
// ═══════════════════════════════════════════════════════════════

/**
 * Get delivery dashboard data for today (or specified date)
 */
export const getDashboard = async (query) => {
  const { date } = query;
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const routes = await prisma.deliveryRoute.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: {
      vehicle: { select: { id: true, code: true, name: true } },
      driver: { select: { id: true, name: true } },
      stops: {
        orderBy: { sequence: 'asc' },
        include: {
          outlet: { select: { id: true, name: true, latitude: true, longitude: true } },
          packingList: { select: { id: true, code: true, totalCartons: true } },
        },
      },
    },
  });

  // Summary stats
  const totalRoutes = routes.length;
  const totalVehicles = new Set(routes.map((r) => r.vehicleId)).size;
  const totalStops = routes.reduce((sum, r) => sum + r.stops.length, 0);
  const totalCartons = routes.reduce((sum, r) => sum + r.totalCartons, 0);

  const statusCounts = {
    DRAFT: routes.filter((r) => r.status === 'DRAFT').length,
    READY: routes.filter((r) => r.status === 'READY').length,
    IN_TRANSIT: routes.filter((r) => r.status === 'IN_TRANSIT').length,
    COMPLETED: routes.filter((r) => r.status === 'COMPLETED').length,
    PARTIAL: routes.filter((r) => r.status === 'PARTIAL').length,
  };

  const stopStatusCounts = {
    PENDING: 0,
    DELIVERED: 0,
    REJECTED: 0,
    PARTIAL_REJECT: 0,
  };
  routes.forEach((r) => {
    r.stops.forEach((s) => {
      stopStatusCounts[s.status] = (stopStatusCounts[s.status] || 0) + 1;
    });
  });

  return {
    date: targetDate.toISOString().slice(0, 10),
    summary: {
      totalRoutes,
      totalVehicles,
      totalStops,
      totalCartons,
      statusCounts,
      stopStatusCounts,
    },
    routes,
  };
};

/**
 * Get list of available drivers (role = SUPIR)
 */
export const getDrivers = async () => {
  return prisma.user.findMany({
    where: { role: 'SUPIR', deletedAt: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
};
