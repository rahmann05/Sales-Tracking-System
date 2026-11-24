import { createHash } from 'node:crypto';
import { reconciliationFingerprint } from '../../../shared/invoice-reconciliation.mjs';
import { makeEvidencePng, makeSignaturePng } from './completions.js';
import { at, ensure, id, note, offsetDate, operationalPolicy, workingDaysBack } from './context.js';

function makePackingItems(order, destinationId = null) {
  return order.items.map((item) => ({
    ...(destinationId ? { destinationId } : {}),
    lineId: item.id,
    sourceOrderItemId: item.id,
    productId: item.productId,
    sku: item.productSku,
    name: item.productName,
    unit: item.unit || 'pak',
    quantity: item.quantity,
  }));
}

function makeInvoiceItems(order) {
  return order.items.map((item) => ({
    lineId: item.id,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));
}

export async function seedWarehouse(db, master, salesData, date) {
  const { users, vehicles } = master;
  const [hist1, hist2] = workingDaysBack(date, 2);
  const approvedOrders = salesData.orders.filter((o) => o.status === 'APPROVED');

  if (approvedOrders.length < 11) {
    throw new Error(
      `Jumlah order APPROVED tidak mencukupi untuk packing list (${approvedOrders.length})`
    );
  }

  // Use orders 0..10 (leaving orders 11..17 unpacked so Admin order-to-packing queue stays rich)
  const packingDefs = [
    {
      key: 'draft-1',
      day: date,
      status: 'DRAFT',
      orders: [approvedOrders[0]],
      cartons: [4],
      v2: false,
    },
    {
      key: 'draft-2',
      day: date,
      status: 'DRAFT',
      orders: [approvedOrders[1]],
      cartons: [3],
      v2: false,
    },
    {
      key: 'released-1',
      day: date,
      status: 'RELEASED',
      orders: [approvedOrders[2]],
      cartons: [4],
      v2: false,
    },
    {
      key: 'released-v2',
      day: date,
      status: 'RELEASED',
      orders: [approvedOrders[3], approvedOrders[4]],
      cartons: [4, 4],
      v2: true,
    },
    {
      key: 'hist-delivered',
      day: hist2,
      status: 'RELEASED',
      orders: [approvedOrders[5]],
      cartons: [5],
      v2: false,
    },
    {
      key: 'transit-1',
      day: date,
      status: 'RELEASED',
      orders: [approvedOrders[6]],
      cartons: [4],
      v2: false,
    },
    {
      key: 'transit-2',
      day: date,
      status: 'RELEASED',
      orders: [approvedOrders[7]],
      cartons: [4],
      v2: false,
    },
    {
      key: 'ready-1',
      day: date,
      status: 'RELEASED',
      orders: [approvedOrders[8]],
      cartons: [5],
      v2: false,
    },
    {
      key: 'ready-2',
      day: date,
      status: 'RELEASED',
      orders: [approvedOrders[9]],
      cartons: [4],
      v2: false,
    },
    {
      key: 'return-1',
      day: date,
      status: 'RELEASED',
      orders: [approvedOrders[10]],
      cartons: [4],
      v2: false,
    },
  ];

  const packings = new Map();
  let plSeq = 1;
  let invSeq = 1;

  for (const def of packingDefs) {
    const plKey = `packing-${def.key}-${date}`;
    const plCode = `BF-PL-${def.day.replaceAll('-', '')}-${String(plSeq++).padStart(3, '0')}`;
    const reqHash = createHash('sha256').update(plCode).digest('hex');
    const primaryOrder = def.orders[0];
    const totalCartons = def.cartons.reduce((sum, n) => sum + n, 0);
    const totalWeight = totalCartons * 5;
    const isReleased = def.status === 'RELEASED';

    let items = [];
    let destinations = [];
    const invoiceCreate = [];

    if (def.v2) {
      for (const [dIdx, ord] of def.orders.entries()) {
        const destId = id(`${plKey}-dest-${dIdx}`);
        const cartons = def.cartons[dIdx];
        destinations.push({
          id: destId,
          outletId: ord.outletId,
          sourceOrderIds: [ord.id],
          totalCartons: cartons,
          totalWeight: cartons * 5,
        });
        items.push(...makePackingItems(ord, destId));
        const invCode = `BF-INV-${def.day.replaceAll('-', '')}-${String(invSeq++).padStart(3, '0')}`;
        invoiceCreate.push({
          id: id(`${plKey}-inv-${dIdx}`),
          destinationId: destId,
          sourceOrderIds: [ord.id],
          invoiceNumber: invCode,
          outletId: ord.outletId,
          totalCartons: cartons,
          totalAmount: ord.totalValue,
          taxRatePercent: 0,
          taxIncluded: false,
          taxRoundingMode: 'NEAREST',
          isDelivered: false,
          items: makeInvoiceItems(ord),
          notes: `Faktur otomatis dari ${ord.code}.`,
          createdAt: at(def.day, '07:20'),
          updatedAt: at(def.day, '07:20'),
        });
      }
    } else {
      items = makePackingItems(primaryOrder);
      const invCode = `BF-INV-${def.day.replaceAll('-', '')}-${String(invSeq++).padStart(3, '0')}`;
      const isInvDelivered = ['hist-delivered', 'transit-1'].includes(def.key);
      invoiceCreate.push({
        id: id(`${plKey}-inv-0`),
        sourceOrderIds: [primaryOrder.id],
        invoiceNumber: invCode,
        outletId: primaryOrder.outletId,
        totalCartons,
        totalAmount: primaryOrder.totalValue,
        taxRatePercent: 0,
        taxIncluded: false,
        taxRoundingMode: 'NEAREST',
        isDelivered: isInvDelivered,
        deliveredAt: isInvDelivered ? at(def.day, '09:30') : null,
        items: makeInvoiceItems(primaryOrder),
        notes: `Faktur otomatis dari ${primaryOrder.code}.`,
        createdAt: at(def.day, '07:20'),
        updatedAt: at(def.day, '07:20'),
      });
    }

    const record = await ensure(db, 'packingList', plKey, {
      requestId: id(`${plKey}-req`),
      requestHash: reqHash,
      loadPlanVersion: def.v2 ? 2 : 1,
      destinations,
      suggestedVehicleId: vehicles[0].id,
      suggestedVehicleSnapshot: {
        id: vehicles[0].id,
        code: vehicles[0].code,
        name: vehicles[0].name,
        maxCartons: vehicles[0].maxCartons,
        maxWeightKg: vehicles[0].maxWeightKg,
      },
      documentKind: def.v2 ? 'MANIFEST' : 'PACKING',
      code: plCode,
      outletId: primaryOrder.outletId,
      source: 'ORDER',
      sourceOrderId: primaryOrder.id,
      sourceOrderIds: def.orders.map((o) => o.id),
      status: def.status,
      totalCartons,
      totalWeight,
      notes: `Dokumen muatan untuk ${primaryOrder.outlet.name}.`,
      overrideReason: '-',
      items,
      revision: isReleased ? 2 : 1,
      policySnapshot: operationalPolicy(def.day),
      history: [
        {
          action: 'CREATE',
          actorId: users.admin.id,
          actorName: users.admin.name,
          at: at(def.day, '07:20').toISOString(),
          note: `Dibuat dari order ${def.orders.map((o) => o.code).join(', ')}.`,
        },
        ...(isReleased
          ? [
              {
                action: 'RELEASE',
                actorId: users.admin.id,
                actorName: users.admin.name,
                at: at(def.day, '07:35').toISOString(),
                note: 'Diserahkan ke Kepala Gudang untuk penjadwalan armada.',
              },
            ]
          : []),
      ],
      createdById: users.admin.id,
      releasedAt: isReleased ? at(def.day, '07:35') : null,
      createdAt: at(def.day, '07:20'),
      updatedAt: isReleased ? at(def.day, '07:35') : at(def.day, '07:20'),
      invoices: { create: invoiceCreate },
    });

    const loaded = await db.packingList.findUnique({
      where: { id: record.id },
      include: { invoices: true, outlet: true },
    });
    packings.set(def.key, loaded);
  }

  // Build 5 DeliveryRoutes covering all 4 SUPIR accounts (Andri has historical COMPLETED + today READY)
  const routeDefs = [
    {
      key: 'hist-completed',
      code: `BF-TRIP-${hist2.replaceAll('-', '')}-001`,
      day: hist2,
      vehicle: vehicles[0], // D 8012 ZC
      driver: users['andri.supir'],
      status: 'COMPLETED',
      stops: [
        {
          packing: packings.get('hist-delivered'),
          status: 'DELIVERED',
          arrived: true,
          completed: true,
        },
      ],
    },
    {
      key: 'transit',
      code: `BF-TRIP-${date.replaceAll('-', '')}-001`,
      day: date,
      vehicle: vehicles[5], // D 8032 FS (Carry Thermo)
      driver: users['rendi.supir'],
      status: 'IN_TRANSIT',
      stops: [
        { packing: packings.get('transit-1'), status: 'DELIVERED', arrived: true, completed: true },
        { packing: packings.get('transit-2'), status: 'PENDING', arrived: true, completed: false },
      ],
    },
    {
      key: 'ready-ridwanto',
      code: `BF-TRIP-${date.replaceAll('-', '')}-002`,
      day: date,
      vehicle: vehicles[6], // D 8726 FP (Carry Thermo)
      driver: users['ridwanto.supir'],
      status: 'READY',
      stops: [
        { packing: packings.get('ready-1'), status: 'PENDING', arrived: false, completed: false },
      ],
    },
    {
      key: 'ready-andri',
      code: `BF-TRIP-${date.replaceAll('-', '')}-003`,
      day: date,
      vehicle: vehicles[0], // D 8012 ZC
      driver: users['andri.supir'],
      status: 'READY',
      stops: [
        { packing: packings.get('ready-2'), status: 'PENDING', arrived: false, completed: false },
      ],
    },
    {
      key: 'return',
      code: `BF-TRIP-${date.replaceAll('-', '')}-004`,
      day: date,
      vehicle: vehicles[7], // D 8566 FK (Engkle Thermo)
      driver: users['oki.supir'],
      status: 'PARTIAL',
      stops: [
        {
          packing: packings.get('return-1'),
          status: 'PARTIAL_REJECT',
          arrived: true,
          completed: true,
        },
      ],
    },
  ];

  const createdRoutes = [];
  for (const rDef of routeDefs) {
    const totalCartons = rDef.stops.reduce((sum, s) => sum + s.packing.totalCartons, 0);
    const totalWeight = totalCartons * 5;
    const isReady = rDef.status === 'READY';
    const isCompleted = rDef.status === 'COMPLETED';
    const isPartial = rDef.status === 'PARTIAL';
    const routeKey = `delivery-route-${rDef.key}-${date}`;

    const prepQuantities = Object.fromEntries(
      rDef.stops.flatMap((s, seqIdx) =>
        s.packing.items.map((item) => [
          `${id(`${routeKey}-stop-${seqIdx}`)}:${item.lineId}`,
          item.quantity,
        ])
      )
    );
    const preparation = Object.fromEntries(
      ['PICK', 'CHECK', 'LOAD'].map((stage) => [
        stage,
        {
          actorId: users.gudang.id,
          actorName: users.gudang.name,
          at: at(rDef.day, '07:50').toISOString(),
          note: `Tahap ${stage} selesai oleh Kepala Gudang.`,
          cartons: totalCartons,
          quantities: prepQuantities,
        },
      ])
    );

    const route = await ensure(db, 'deliveryRoute', routeKey, {
      requestId: id(`${routeKey}-req`),
      requestHash: createHash('sha256').update(rDef.code).digest('hex'),
      code: rDef.code,
      date: at(rDef.day, '00:00'),
      vehicleId: rDef.vehicle.id,
      driverId: rDef.driver.id,
      createdById: users.gudang.id,
      status: rDef.status,
      totalCartons,
      totalWeight,
      notes: `Perjalanan distribusi armada ${rDef.vehicle.code}.`,
      totalDistanceKm: 18.5,
      estimatedTravelKm: 18.5,
      mileagePendingCount: 0,
      fuelConsumedLiters: isCompleted || isPartial ? 2.4 : 0,
      plannedStartAt: at(rDef.day, '08:00'),
      plannedEndAt: at(rDef.day, '16:00'),
      ...(!isReady
        ? {
            departedAt: at(rDef.day, '08:00'),
            odometerStart: rDef.vehicle.totalKm - 50,
          }
        : {}),
      ...(isCompleted || isPartial
        ? {
            returnedAt: at(rDef.day, '12:30'),
            odometerEnd: rDef.vehicle.totalKm - 31,
            actualDistanceKm: 19.0,
            actualFuelLiters: 2.4,
            documentsReturned: isCompleted,
            odometerPostedAt: at(rDef.day, '12:35'),
          }
        : {}),
      ...(isCompleted ? { closedAt: at(rDef.day, '13:00') } : {}),
      preparation,
      policySnapshot: operationalPolicy(rDef.day),
      history: [
        {
          action: 'CREATE',
          actorId: users.gudang.id,
          actorName: users.gudang.name,
          at: at(rDef.day, '07:45').toISOString(),
          note: `Trip dijadwalkan untuk ${rDef.driver.name}.`,
        },
      ],
      createdAt: at(rDef.day, '07:45'),
      updatedAt: at(rDef.day, '12:35'),
    });

    const stopsCreated = [];
    for (const [sIdx, sDef] of rDef.stops.entries()) {
      const p = sDef.packing;
      const stopKey = `${routeKey}-stop-${sIdx}`;
      const arrivedAt = sDef.arrived ? at(rDef.day, sIdx === 0 ? '08:55' : '10:05') : null;
      const completedAt = sDef.completed ? at(rDef.day, sIdx === 0 ? '09:30' : '10:40') : null;
      const isRejectedStop = sDef.status === 'PARTIAL_REJECT';
      const inv = p.invoices[0];

      const stop = await ensure(db, 'deliveryStop', stopKey, {
        deliveryRouteId: route.id,
        packingListId: p.id,
        outletId: p.outletId,
        sequence: sIdx + 1,
        status: sDef.status,
        allocatedCartons: p.totalCartons,
        allocatedWeight: p.totalWeight || p.totalCartons * 5,
        allocatedItems: p.items.map((i) => ({ lineId: i.lineId, quantity: i.quantity })),
        allocatedInvoices: [{ invoiceId: inv.id, cartons: p.totalCartons }],
        targetLatitude: p.outlet.latitude,
        targetLongitude: p.outlet.longitude,
        targetPointSource: 'GOOGLE',
        ...(sDef.arrived
          ? {
              latitude: p.outlet.latitude,
              longitude: p.outlet.longitude,
              arrivedAt,
              photoUrl: makeEvidencePng('delivery', sIdx + 1),
            }
          : {}),
        ...(sDef.completed
          ? {
              completedAt,
              receiptEvidence: {
                recipientName: p.outlet.ownerName || 'Penerima Toko',
                signatureDataUrl: makeSignaturePng(sIdx + 1),
                capturedAt: completedAt.toISOString(),
              },
            }
          : {}),
        ...(isRejectedStop
          ? {
              rejectReason: 'Satu karton kemasan penyok saat diturunkan di toko.',
              rejectedCartons: 1,
              rejectedItems: [{ lineId: p.items[0].lineId, quantity: 2 }],
              rejectedInvoices: [{ invoiceId: inv.id, cartons: 1 }],
            }
          : {}),
        notes: `Pengantaran ${p.code} ke ${p.outlet.name}.`,
        createdAt: at(rDef.day, '07:45'),
        updatedAt: completedAt || arrivedAt || at(rDef.day, '07:45'),
      });
      stopsCreated.push(stop);

      if (sDef.arrived) {
        await ensure(db, 'deliveryAttendance', `del-in-${stop.id}`, {
          deliveryStopId: stop.id,
          driverId: rDef.driver.id,
          type: 'IN',
          latitude: p.outlet.latitude,
          longitude: p.outlet.longitude,
          photoUrl: makeEvidencePng('delivery', 10 + sIdx),
          notes: `Supir tiba di ${p.outlet.name}.`,
          gpsEvidence: {
            source: 'DEVICE_GPS',
            accuracyMeters: 8,
            capturedAt: arrivedAt.toISOString(),
          },
          timestamp: arrivedAt,
          createdAt: arrivedAt,
          updatedAt: arrivedAt,
        });
      }
      if (sDef.completed) {
        await ensure(db, 'deliveryAttendance', `del-out-${stop.id}`, {
          deliveryStopId: stop.id,
          driverId: rDef.driver.id,
          type: 'OUT',
          latitude: p.outlet.latitude,
          longitude: p.outlet.longitude,
          photoUrl: makeEvidencePng('delivery', 20 + sIdx),
          notes: isRejectedStop
            ? 'Sebagian barang ditolak karena kemasan penyok.'
            : `Serah terima selesai di ${p.outlet.name}.`,
          gpsEvidence: {
            source: 'DEVICE_GPS',
            accuracyMeters: 8,
            capturedAt: completedAt.toISOString(),
          },
          timestamp: completedAt,
          createdAt: completedAt,
          updatedAt: completedAt,
        });
      }
    }

    // Seed active DeliveryPosition for the IN_TRANSIT route
    if (rDef.status === 'IN_TRANSIT') {
      const activeStop = rDef.stops[1].packing;
      await db.deliveryPosition.upsert({
        where: { routeId: route.id },
        update: {},
        create: {
          routeId: route.id,
          driverId: rDef.driver.id,
          latitude: activeStop.outlet.latitude,
          longitude: activeStop.outlet.longitude,
          accuracy: 10,
          observedAt: at(date, '10:15'),
          receivedAt: at(date, '10:15'),
          breadcrumbs: rDef.stops.map((s, bIdx) => ({
            latitude: s.packing.outlet.latitude,
            longitude: s.packing.outlet.longitude,
            observedAt: at(date, bIdx === 0 ? '08:55' : '10:05').toISOString(),
          })),
        },
      });
    }

    // Populate commercialReconciliation on the completed PackingList
    if (isCompleted) {
      const pHist = await db.packingList.findUnique({
        where: { id: rDef.stops[0].packing.id },
        include: { invoices: true, deliveryStops: true },
      });
      await db.packingList.update({
        where: { id: pHist.id },
        data: {
          commercialReconciliation: {
            fingerprint: reconciliationFingerprint(pHist),
            confirmedAt: at(hist2, '13:15').toISOString(),
            confirmedBy: users.admin.id,
            invoices: pHist.invoices.map((inv) => ({
              invoiceId: inv.id,
              items: inv.items,
            })),
          },
          updatedAt: at(hist2, '13:15'),
        },
      });
    }

    createdRoutes.push({ route, stops: stopsCreated, key: rDef.key });
  }

  // Create open DeliveryIssue linked to the PARTIAL_REJECT return route & stop
  const returnEntry = createdRoutes.find((r) => r.key === 'return');
  const returnPacking = packings.get('return-1');
  await ensure(db, 'deliveryIssue', `delivery-issue-return-${date}`, {
    requestId: id(`delivery-issue-return-req-${date}`),
    routeId: returnEntry.route.id,
    packingListId: returnPacking.id,
    stopId: returnEntry.stops[0].id,
    orderId: returnPacking.sourceOrderId,
    title: 'Periksa retur kemasan',
    reason: 'Satu karton ditolak karena kemasan penyok; menunggu verifikasi fisik di gudang.',
    responsibleRole: 'KEPALA_GUDANG',
    supervisorId: users['spv.gt'].id,
    ownerId: users.gudang.id,
    createdById: users['oki.supir'].id,
    status: 'OPEN',
    dueAt: at(date, '17:00'),
    history: [
      {
        action: 'OPENED',
        actorId: users['oki.supir'].id,
        actorName: users['oki.supir'].name,
        at: at(date, '10:45').toISOString(),
        note: 'Dilaporkan saat serah terima di toko.',
      },
    ],
    createdAt: at(date, '10:45'),
  });

  return {
    packings: [...packings.values()],
    routes: createdRoutes.map((r) => r.route),
    hist1,
    hist2,
  };
}
