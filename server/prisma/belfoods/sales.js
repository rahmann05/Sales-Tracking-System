import { createHash } from 'node:crypto';
import { DEFAULT_AUDIT_ITEMS } from '../../../shared/supervision-checklist.mjs';
import { OUTLET_DIGITAL_VERSION } from '../../../shared/outlet-validation.mjs';
import { makeEvidencePng } from './completions.js';
import {
  activeWorkingDay,
  at,
  ensure,
  id,
  note,
  offsetDate,
  operationalPolicy,
  workingDaysBack,
} from './context.js';

function selectDailyOutlets(sourceOutlets, outletByCode, staffCode, dayKey, minCount = 5) {
  const dow = activeWorkingDay(dayKey);
  const allForSales = sourceOutlets
    .filter((o) => o.salesCode === staffCode)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.sequence - b.sequence);
  const exactDay = allForSales.filter(
    (o) => o.dayOfWeek === dow && (o.weekType === 'ALL' || o.weekType === 'WEEK_1')
  );
  const pool = [...exactDay];
  for (const cand of allForSales) {
    if (pool.length >= minCount) break;
    if (!pool.some((x) => x.customer_id === cand.customer_id)) pool.push(cand);
  }
  return pool.slice(0, Math.max(minCount, Math.min(exactDay.length || minCount, 7))).map((r) => ({
    src: r,
    outlet: outletByCode.get(r.customer_id),
  }));
}

function buildOrderItems(products, seedIndex, qtyA = 6, qtyB = 4) {
  const p1 = products[seedIndex % products.length];
  const p2 = products[(seedIndex + 3) % products.length];
  const sub1 = p1.price * qtyA;
  const sub2 = p2.price * qtyB;
  return {
    totalValue: sub1 + sub2,
    lines: [
      {
        product: p1,
        quantity: qtyA,
        unitPrice: p1.price,
        subtotal: sub1,
      },
      {
        product: p2,
        quantity: qtyB,
        unitPrice: p2.price,
        subtotal: sub2,
      },
    ],
  };
}

const primaryCluster = (clusters, member) =>
  clusters.find((c) => c.assignedSalesId === member.id) || clusters[0];

export async function seedSales(db, master, date) {
  const {
    users,
    supervisors,
    sales,
    drivers,
    clusters,
    outlets,
    outletByCode,
    products,
    source,
    lockedOutletCode,
    fieldReviewOutletCodes,
  } = master;

  const [hist1, hist2] = workingDaysBack(date, 2);
  const baseStamp = at(date, '07:00');
  const plans = [];
  const orders = [];
  const histOrderCode = new Map();
  let orderCounter = 1;

  // 1. Seed 2 PUBLISHED PjpPlans covering all 443 outlets across GT & MT supervisors
  for (const [spvIdx, spv] of supervisors.entries()) {
    const team = sales.filter((s) => s.supervisorId === spv.id);
    const startsOn = offsetDate(date, -7);
    const endsOn = offsetDate(date, 28);
    const rules = [];
    for (const member of team) {
      const memberOutlets = source.outlets.filter(
        (o) => o.assigned && o.salesCode === member.staffCode
      );
      for (const r of memberOutlets) {
        let anchor = startsOn;
        while (new Date(`${anchor}T12:00:00Z`).getUTCDay() !== r.dayOfWeek) {
          anchor = offsetDate(anchor, 1);
        }
        if (r.weekType === 'WEEK_2') anchor = offsetDate(anchor, 7);
        const outlet = outletByCode.get(r.customer_id);
        rules.push({
          userId: member.id,
          outletId: outlet.id,
          anchorDate: anchor,
          intervalWeeks: Number(r.itineraryCode.slice(1)),
          reason: `Jadwal kunjungan ${r.callplanId} hari ${r.dayLabel}.`,
        });
      }
    }

    await ensure(db, 'pjpPlan', `pjp-plan-${spvIdx}-${date}`, {
      requestId: id(`pjp-plan-req-${spvIdx}-${date}`),
      name: 'Rencana Kunjungan Belfoods GT & MT',
      supervisorId: spv.id,
      startsOn,
      endsOn,
      rules,
      revision: 2,
      status: 'PUBLISHED',
      createdBy: spv.id,
      updatedBy: spv.id,
      publishedAt: at(hist1, '06:30'),
      scheduledAt: at(hist1, '06:00'),
      publicationNextAttemptAt: at(hist1, '06:30'),
      publicationSchedule: {
        mode: 'PUBLISHED',
        publishedBy: spv.id,
        publishedAt: at(hist1, '06:30').toISOString(),
        totalOutlets: rules.length,
      },
      history: [
        {
          action: 'DRAFT',
          actorId: spv.id,
          actorName: spv.name,
          at: at(hist1, '05:45').toISOString(),
          note: 'Penyusunan jadwal kunjungan callplan Belfoods.',
        },
        {
          action: 'PUBLISH',
          actorId: spv.id,
          actorName: spv.name,
          at: at(hist1, '06:30').toISOString(),
          note: `Diterbitkan untuk ${rules.length} outlet aktif.`,
        },
      ],
      createdAt: at(hist1, '05:45'),
      updatedAt: at(hist1, '06:30'),
    });
  }

  // A DRAFT plan for the period after the published one, so the planner can be tried end to end.
  {
    const spv = supervisors[0];
    const startsOn = offsetDate(date, 29);
    const rules = [];
    for (const member of sales) {
      const own = source.outlets.filter((o) => o.assigned && o.salesCode === member.staffCode);
      for (const r of own.slice(0, 5)) {
        let anchor = startsOn;
        while (new Date(`${anchor}T12:00:00Z`).getUTCDay() !== r.dayOfWeek)
          anchor = offsetDate(anchor, 1);
        rules.push({
          userId: member.id,
          outletId: outletByCode.get(r.customer_id).id,
          anchorDate: anchor,
          intervalWeeks: Number(r.itineraryCode.slice(1)),
          reason: '',
        });
      }
    }
    await ensure(db, 'pjpPlan', `pjp-plan-draft-${date}`, {
      requestId: id(`pjp-plan-draft-req-${date}`),
      name: 'Draft rencana periode berikutnya',
      supervisorId: spv.id,
      startsOn,
      endsOn: offsetDate(date, 56),
      rules,
      revision: 1,
      status: 'DRAFT',
      createdBy: spv.id,
      updatedBy: spv.id,
      history: [
        {
          action: 'DRAFT',
          actorId: spv.id,
          actorName: spv.name,
          at: at(date, '07:30').toISOString(),
          note: 'Draft awal; belum diterbitkan.',
        },
      ],
      createdAt: at(date, '07:30'),
      updatedAt: at(date, '07:30'),
    });
  }

  // 2. Seed PJP, PjpStop, Attendance, Orders, OrderItems, SalesLivePosition, StaffActivity
  const livePositionRows = [];
  const todayStopsBySalesIndex = new Map();

  for (const [sIdx, member] of sales.entries()) {
    const cluster = primaryCluster(clusters, member);
    const spv = supervisors.find((s) => s.id === member.supervisorId);
    const reportingContext = {
      source: 'KUNJUNGAN_TOKO_BELFOODS_CONVERTED',
      supervisorId: spv.id,
      clusterId: cluster.id,
      supervisorName: spv.name,
      clusterName: cluster.name,
    };

    const dayConfigs = [
      ['hist1', hist1, 'COMPLETED'],
      ['hist2', hist2, 'COMPLETED'],
      ['today', date, 'IN_PROGRESS'],
    ];

    for (const [dayKind, dayKey, pjpStatus] of dayConfigs) {
      const policy = operationalPolicy(dayKey, {
        SALES_ATTENDANCE_MODE: 'IN_OUT',
        SALES_ALLOW_CONTINUE_WITHOUT_OUT: true,
      });
      const plan = await ensure(db, 'pjp', `pjp-${member.staffCode}-${dayKey}`, {
        code: `BF-PJP-${member.staffCode}-${dayKey}`,
        userId: member.id,
        date: at(dayKey, '00:00'),
        type: 'SALES',
        status: pjpStatus,
        reportSupervisorId: spv.id,
        reportClusterId: cluster.id,
        reportingContext,
        createdAt: at(dayKey, '07:00'),
        updatedAt: at(dayKey, '07:00'),
      });

      const dailyOutlets = selectDailyOutlets(
        source.outlets,
        outletByCode,
        member.staffCode,
        dayKey,
        dayKind === 'today' ? 5 : 4
      );
      const stops = [];

      for (const [j, { outlet }] of dailyOutlets.entries()) {
        const isHist = dayKind !== 'today';
        const isMissingOutToday = dayKind === 'today' && sIdx === 1 && j === 1;
        const isVisitedToday = dayKind === 'today' && (j === 0 || (j === 1 && !isMissingOutToday));
        const isActiveToday = dayKind === 'today' && j === 2;
        const isPendingToday = dayKind === 'today' && j >= 3;

        const finished = isHist || isVisitedToday;
        const startHour = 8 + Math.floor(j / 2);
        const startMin = j % 2 === 0 ? 15 : 45;
        const start = at(
          dayKey,
          `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`
        );
        const end = new Date(start.getTime() + 18 * 60000);

        // Cahya: approved + pending orders today. Yuli: pending order (with a collection promise)
        // and an open check-in without check-out. History keeps approved orders for packing.
        const shouldCreateOrder =
          (dayKind === 'hist1' && j < 3) ||
          (dayKind === 'hist2' && j < 2) ||
          (dayKind === 'today' && (j === 0 || (j === 1 && sIdx === 0)));

        let createdOrder = null;
        let orderSpec = null;
        if (shouldCreateOrder) {
          let orderStatus = 'APPROVED';
          if (dayKind === 'hist2' && sIdx === 1 && j === 0) orderStatus = 'REJECTED';
          if (dayKind === 'today') {
            if (j === 0 && sIdx === 1) orderStatus = 'PENDING_APPROVAL';
            else if (j === 1) orderStatus = 'PENDING_APPROVAL';
          }
          orderSpec = {
            status: orderStatus,
            bundle: buildOrderItems(products, orderCounter + sIdx + j, 6 + (j % 3), 4 + (sIdx % 2)),
          };
        }

        const isCollectionStop = dayKind === 'today' && sIdx === 1 && j === 0;
        const visitOutcome = isCollectionStop
          ? {
              purpose: 'BOTH',
              reference: histOrderCode.get(member.id) || `BF-ORD-${hist1.replaceAll('-', '')}-001`,
              result: 'PROMISED',
              promiseDate: offsetDate(date, 3),
              note: 'Pelanggan menjanjikan pelunasan faktur sebelumnya.',
            }
          : {
              purpose: orderSpec ? 'ORDER' : 'FOLLOW_UP',
              result: orderSpec ? 'ORDER_CREATED' : 'VISITED',
              note: `Kunjungan rutin ${outlet.name}.`,
            };

        const sessionState = isMissingOutToday
          ? 'INCOMPLETE'
          : finished
            ? 'FINISHED'
            : isActiveToday
              ? 'ACTIVE'
              : null;

        const stopStatus = finished || isMissingOutToday ? 'VISITED' : 'PENDING';
        const stop = await ensure(db, 'pjpStop', `stop-${member.staffCode}-${dayKey}-${j}`, {
          pjpId: plan.id,
          outletId: outlet.id,
          sequence: j + 1,
          status: stopStatus,
          ...(sessionState
            ? {
                visitSession: {
                  state: sessionState,
                  attendanceMode: 'IN_OUT',
                  startedAt: start.toISOString(),
                  ...(finished || isMissingOutToday
                    ? {
                        finishedAt: end.toISOString(),
                        finishSource: 'SALES_MOBILE',
                        result: {
                          notes: note,
                          visitOutcome,
                        },
                      }
                    : {}),
                  source: 'SALES_MOBILE',
                },
                policySnapshot: policy,
              }
            : {}),
          createdAt: at(dayKey, '07:00'),
          updatedAt: finished ? end : start,
        });
        stops.push(stop);

        if (orderSpec) {
          const ordSeq = String(orderCounter++).padStart(3, '0');
          const ordKey = `order-${member.staffCode}-${dayKey}-${j}`;
          const ordCode = `BF-ORD-${dayKey.replaceAll('-', '')}-${ordSeq}`;
          const ordTime = new Date(start.getTime() + 10 * 60000);
          const approvedAt = new Date(ordTime.getTime() + 5 * 60000);
          const reqHash = createHash('sha256').update(ordCode).digest('hex');
          if (dayKind === 'hist1' && j === 0) histOrderCode.set(member.id, ordCode);

          createdOrder = await db.order.upsert({
            where: { id: id(ordKey) },
            update: {},
            create: {
              id: id(ordKey),
              requestId: id(`${ordKey}-req`),
              requestHash: reqHash,
              code: ordCode,
              pjpStopId: stop.id,
              outletId: outlet.id,
              createdBy: member.id,
              ...(orderSpec.status === 'APPROVED' ? { approvedBy: spv.id, approvedAt } : {}),
              ...(orderSpec.status === 'REJECTED'
                ? { rejectionReason: 'Batas kredit outlet sedang dalam peninjauan admin.' }
                : {}),
              totalValue: orderSpec.bundle.totalValue,
              paymentType: outlet.paymentType,
              termOfPaymentDays: outlet.termOfPaymentDays,
              taxRatePercent: 0,
              taxAmount: 0,
              taxIncluded: false,
              promisedAt: at(offsetDate(dayKey, 1), '10:00'),
              status: orderSpec.status,
              policySnapshot: policy,
              customerSnapshot: {
                outletId: outlet.id,
                outletCode: outlet.outletCode,
                name: outlet.name,
                address: outlet.address,
                channel: outlet.channel,
                source: 'BELFOODS_ORDER',
              },
              history: [
                {
                  action: 'CREATED',
                  actorId: member.id,
                  actorName: member.name,
                  at: ordTime.toISOString(),
                  note: `Order masuk dari kunjungan ${outlet.name}.`,
                },
                ...(orderSpec.status === 'APPROVED'
                  ? [
                      {
                        action: 'APPROVED',
                        actorId: spv.id,
                        actorName: spv.name,
                        at: approvedAt.toISOString(),
                        note: 'Disetujui untuk penyiapan packing list.',
                      },
                    ]
                  : []),
              ],
              items: {
                create: orderSpec.bundle.lines.map((line, lineIdx) => ({
                  id: id(`${ordKey}-item-${lineIdx}`),
                  productId: line.product.id,
                  productName: line.product.name,
                  productSku: line.product.sku,
                  unit: 'pak',
                  baseUnit: 'pak',
                  unitsPerUnit: 1,
                  quantity: line.quantity,
                  cancelledQuantity: 0,
                  unitPrice: line.unitPrice,
                  subtotal: line.subtotal,
                  createdAt: ordTime,
                  updatedAt: ordTime,
                })),
              },
              createdAt: ordTime,
              updatedAt: orderSpec.status === 'APPROVED' ? approvedAt : ordTime,
            },
          });

          const savedItems = await db.orderItem.findMany({ where: { orderId: createdOrder.id } });
          orders.push({ ...createdOrder, items: savedItems, outlet });
        }

        const gpsLat = Number((outlet.latitude + 0.00004).toFixed(7));
        const gpsLng = Number((outlet.longitude + 0.00004).toFixed(7));
        const gpsMeta = {
          source: 'DEVICE_GPS',
          accuracyMeters: 9,
          capturedAt: start.toISOString(),
          latitude: gpsLat,
          longitude: gpsLng,
          distanceMeters: 6,
        };

        if (!isPendingToday) {
          const isApprovedOrd = createdOrder && createdOrder.status === 'APPROVED';
          const attPhoto = makeEvidencePng('visit', sIdx * 10 + j + 1);
          await ensure(db, 'attendance', `in-${stop.id}`, {
            pjpStopId: stop.id,
            userId: member.id,
            type: 'IN',
            latitude: gpsLat,
            longitude: gpsLng,
            photoUrl: attPhoto,
            notes: `Check-in kunjungan di ${outlet.name}.`,
            durationMinutes: 0,
            deviationMeters: 6,
            distanceWarning: 'OK',
            orderAmount: 0,
            skuSold: 0,
            salesProducts: [],
            isEffectiveCall: false,
            gpsEvidence: gpsMeta,
            visitOutcome,
            manualSalesMode: 'NOTES_ONLY',
            manualSalesStatus: 'NOTES_ONLY',
            isManualSalesApproved: false,
            timestamp: start,
            createdAt: start,
            updatedAt: start,
          });

          if (finished) {
            const approvedLines = isApprovedOrd ? orderSpec.bundle.lines : [];
            const approvedAmt = isApprovedOrd ? orderSpec.bundle.totalValue : 0;
            await ensure(db, 'attendance', `out-${stop.id}`, {
              pjpStopId: stop.id,
              userId: member.id,
              type: 'OUT',
              latitude: gpsLat,
              longitude: gpsLng,
              photoUrl: attPhoto,
              notes: isApprovedOrd
                ? `Check-out kunjungan dan pencatatan order ${createdOrder.code}.`
                : `Check-out kunjungan tindak lanjut di ${outlet.name}.`,
              durationMinutes: 18,
              deviationMeters: 6,
              distanceWarning: 'OK',
              reason: isApprovedOrd ? null : 'Tindak lanjut stok toko',
              orderAmount: approvedAmt,
              skuSold: approvedLines.length,
              salesProducts: approvedLines.map((l) => ({
                productId: l.product.id,
                sku: l.product.sku,
                name: l.product.name,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                subtotal: l.subtotal,
              })),
              isEffectiveCall: isApprovedOrd,
              gpsEvidence: { ...gpsMeta, capturedAt: end.toISOString() },
              visitOutcome,
              manualSalesMode: 'NOTES_ONLY',
              manualSalesStatus: 'NOTES_ONLY',
              isManualSalesApproved: false,
              timestamp: end,
              createdAt: end,
              updatedAt: end,
            });
          }
        }

        if (isCollectionStop) {
          await ensure(db, 'staffActivity', `collection-${stop.id}`, {
            userId: member.id,
            dateKey: dayKey,
            activityKey: `COLLECTION:PJP_RESULT:${stop.id}`,
            kind: 'COLLECTION_FOLLOW_UP',
            outletName: outlet.name,
            checkInAt: end,
            checkOutAt: end,
            notes: visitOutcome.note,
            latitude: gpsLat,
            longitude: gpsLng,
            photoUrl: makeEvidencePng('visit', 90 + sIdx),
            policySnapshot: policy,
            followUp: {
              ownerId: member.id,
              createdBy: member.id,
              createdAt: end.toISOString(),
              status: 'OPEN',
              dueDate: visitOutcome.promiseDate,
              note: visitOutcome.note,
              sourceKind: 'PJP_RESULT',
              sourceId: stop.id,
              reference: visitOutcome.reference,
              history: [
                {
                  action: 'CREATED_FROM_VISIT',
                  actorId: member.id,
                  at: end.toISOString(),
                  source: 'SALES_MOBILE',
                },
              ],
            },
          });
        }

        if (isMissingOutToday) {
          await ensure(db, 'operationalException', `missing-${stop.id}`, {
            dedupeKey: `MISSING_OUT:${stop.id}`,
            kind: 'MISSING_OUT',
            entityId: stop.id,
            userId: member.id,
            supervisorId: spv.id,
            status: 'OPEN',
            details: {
              outletName: outlet.name,
              outletCode: outlet.outletCode,
              source: 'PJP_ATTENDANCE_MONITOR',
              startedAt: start.toISOString(),
              note: 'Salesman belum melakukan check-out pada kunjungan ini.',
            },
            createdAt: end,
            updatedAt: end,
          });
        }

        if (isActiveToday) {
          livePositionRows.push({
            userId: member.id,
            latitude: gpsLat,
            longitude: gpsLng,
            accuracy: 9,
            speed: 0,
            heading: 90,
            battery: 84 - sIdx * 3,
            observedAt: at(date, '09:50'),
            receivedAt: at(date, '09:50'),
            gpsEvidence: {
              source: 'DEVICE_GPS',
              accuracyMeters: 9,
              capturedAt: at(date, '09:50').toISOString(),
              stopId: stop.id,
              outletName: outlet.name,
            },
            breadcrumbs: dailyOutlets.slice(0, 3).map((item, bIdx) => ({
              latitude: item.outlet.latitude,
              longitude: item.outlet.longitude,
              observedAt: at(
                date,
                `0${8 + Math.floor(bIdx / 2)}:${bIdx % 2 === 0 ? '15' : '45'}`
              ).toISOString(),
            })),
          });
        }
      }

      if (dayKind === 'today') {
        todayStopsBySalesIndex.set(sIdx, stops);
        plans.push({ ...plan, stops });
      }
    }
  }

  for (const pos of livePositionRows) {
    await db.salesLivePosition.upsert({
      where: { userId: pos.userId },
      update: {},
      create: pos,
    });
  }

  // 3. Morning SHIFT activities for all 13 staff + 2 Supervisor AUDIT activities
  for (const [uIdx, member] of Object.values(users).entries()) {
    const baseOutlet = outlets[uIdx % outlets.length];
    await ensure(db, 'staffActivity', `shift-${member.id}-${date}`, {
      userId: member.id,
      dateKey: date,
      activityKey: 'SHIFT',
      kind: 'SHIFT',
      outletName: 'Kantor & Gudang CV. Sinar Anugrah Padalarang',
      checkInAt: at(date, '07:15'),
      notes: 'Presensi masuk operasional harian.',
      latitude: baseOutlet.latitude,
      longitude: baseOutlet.longitude,
      photoUrl: makeEvidencePng('visit', 200 + uIdx),
      lateMinutes: 0,
      policySnapshot: operationalPolicy(date, {
        SHIFT_REQUIRE_GPS: false,
        SHIFT_REQUIRE_PHOTO: false,
      }),
    });
  }

  // Yesterday's shift that was never closed: the server closes it as "tidak checkout" on first load.
  await ensure(db, 'staffActivity', `shift-unclosed-${sales[1].id}-${hist1}`, {
    userId: sales[1].id,
    dateKey: hist1,
    activityKey: 'SHIFT',
    kind: 'SHIFT',
    outletName: 'Kantor & Gudang CV. Sinar Anugrah Padalarang',
    checkInAt: at(hist1, '07:20'),
    notes: 'Presensi masuk operasional harian.',
    latitude: outlets[0].latitude,
    longitude: outlets[0].longitude,
    photoUrl: makeEvidencePng('visit', 230),
    lateMinutes: 0,
    policySnapshot: operationalPolicy(hist1, {
      SHIFT_REQUIRE_GPS: false,
      SHIFT_REQUIRE_PHOTO: false,
    }),
  });

  for (const [i, member] of sales.entries()) {
    const spv = supervisors[0];
    const salesIdx = i;
    const targetStop = todayStopsBySalesIndex.get(salesIdx)[0];
    const targetOutlet = outlets.find((o) => o.id === targetStop.outletId);
    const start = at(date, '09:00');
    const finish = at(date, '09:20');

    await ensure(db, 'staffActivity', `audit-${spv.id}-${member.id}-${date}`, {
      userId: spv.id,
      dateKey: date,
      activityKey: targetStop.id,
      kind: 'VISIT',
      visitMode: 'AUDIT',
      outletName: targetOutlet.name,
      checkInAt: start,
      checkOutAt: finish,
      notes: `Supervisi lapangan dan pemeriksaan display produk Belfoods di ${targetOutlet.name}.`,
      latitude: targetOutlet.latitude,
      longitude: targetOutlet.longitude,
      photoUrl: makeEvidencePng('visit', 250 + i),
      checklist: Object.fromEntries(DEFAULT_AUDIT_ITEMS.map((item) => [item.key, true])),
      policySnapshot: operationalPolicy(date),
      followUp: {
        ownerId: member.id,
        createdBy: spv.id,
        dueDate: offsetDate(date, 1),
        note: 'Pastikan ketersediaan stok freezer dan materi promosi terpasang.',
        status: i === 1 ? 'SUBMITTED' : 'OPEN',
        ...(i === 1
          ? {
              submission: {
                id: id(`audit-sub-${date}`),
                actorId: member.id,
                at: finish.toISOString(),
                note: 'Display freezer dan daftar harga terbaru sudah dikonfirmasi.',
                evidence: 'Terverifikasi saat supervisi',
              },
            }
          : {}),
        history: [
          {
            action: 'ASSIGNED',
            actorId: spv.id,
            at: start.toISOString(),
            source: 'SUPERVISOR_AUDIT',
          },
        ],
      },
    });
  }

  // 4. Seed connected OffPjpAttendance (1 APPROVED + 1 PENDING)
  const offOutletPending = outletByCode.get(
    source.outlets.find((o) => o.salesCode === 'SLD514' && o.dayOfWeek === 6)?.customer_id ||
      source.outlets[10].customer_id
  );
  const offOutletApproved = outletByCode.get(
    source.outlets.find((o) => o.salesCode === 'SLD539' && o.dayOfWeek === 6)?.customer_id ||
      source.outlets[20].customer_id
  );

  await ensure(db, 'offPjpAttendance', `off-pjp-pending-${date}`, {
    userId: sales[0].id,
    outletId: offOutletPending.id,
    outletName: offOutletPending.name,
    customerName: offOutletPending.ownerName,
    phone: offOutletPending.phone,
    address: offOutletPending.address,
    latitude: offOutletPending.latitude,
    longitude: offOutletPending.longitude,
    photoUrl: makeEvidencePng('visit', 301),
    reason: 'Permintaan kunjungan tambahan karena toko meminta pengiriman ulang stok nugget.',
    status: 'PENDING',
    orderAmount: 0,
    skuSold: 0,
    salesProducts: [],
    isEffectiveCall: false,
    manualSalesMode: 'NOTES_ONLY',
    manualSalesStatus: 'NOTES_ONLY',
    isManualSalesApproved: false,
    policySnapshot: operationalPolicy(date),
    reportSupervisorId: sales[0].supervisorId,
    reportClusterId: primaryCluster(clusters, sales[0]).id,
    reportingContext: {
      supervisorId: sales[0].supervisorId,
      clusterId: primaryCluster(clusters, sales[0]).id,
    },
    createdAt: at(date, '10:15'),
    updatedAt: at(date, '10:15'),
  });

  await ensure(db, 'offPjpAttendance', `off-pjp-approved-${hist2}`, {
    userId: sales[1].id,
    outletId: offOutletApproved.id,
    outletName: offOutletApproved.name,
    customerName: offOutletApproved.ownerName,
    phone: offOutletApproved.phone,
    address: offOutletApproved.address,
    latitude: offOutletApproved.latitude,
    longitude: offOutletApproved.longitude,
    photoUrl: makeEvidencePng('visit', 302),
    reason: 'Kunjungan koordinasi promo akhir pekan di luar jadwal PJP reguler.',
    status: 'APPROVED',
    validatedBy: supervisors[0].id,
    validatedAt: at(hist2, '14:20'),
    orderAmount: 0,
    skuSold: 0,
    salesProducts: [],
    isEffectiveCall: false,
    manualSalesMode: 'NOTES_ONLY',
    manualSalesStatus: 'NOTES_ONLY',
    isManualSalesApproved: false,
    policySnapshot: operationalPolicy(hist2),
    reportSupervisorId: sales[1].supervisorId,
    reportClusterId: primaryCluster(clusters, sales[1]).id,
    reportingContext: {
      supervisorId: sales[1].supervisorId,
      clusterId: primaryCluster(clusters, sales[1]).id,
    },
    createdAt: at(hist2, '13:10'),
    updatedAt: at(hist2, '14:20'),
  });

  // 5. Seed connected RouteChangeRequest (1 APPROVED REROUTE + 1 PENDING_APPROVAL SKIP)
  const cahyaStopsToday = todayStopsBySalesIndex.get(0);
  const yuliStopsToday = todayStopsBySalesIndex.get(1);
  const replacementOutlet = outletByCode.get(
    source.outlets.find((o) => o.salesCode === 'SLD514' && o.dayOfWeek === 6)?.customer_id ||
      source.outlets[12].customer_id
  );

  await ensure(db, 'routeChangeRequest', `route-change-reroute-${date}`, {
    pjpId: plans[0].id,
    pjpStopId: cahyaStopsToday[3].id,
    type: 'REROUTE',
    reportedBy: sales[0].id,
    handledBy: supervisors[0].id,
    approvedBy: users.admin.id,
    replacementOutletId: replacementOutlet.id,
    reason: 'Toko tujuan awal sedang renovasi akses masuk; dialihkan ke outlet sekitar yang buka.',
    photoUrl: makeEvidencePng('visit', 310),
    status: 'APPROVED',
    createdAt: at(date, '09:30'),
    updatedAt: at(date, '09:40'),
  });

  await ensure(db, 'routeChangeRequest', `route-change-skip-${date}`, {
    pjpId: plans[1].id,
    pjpStopId: yuliStopsToday[3].id,
    type: 'SKIP',
    reportedBy: sales[1].id,
    handledBy: supervisors[0].id,
    reason: 'Pemilik toko tutup sementara karena acara keluarga hingga sore hari.',
    photoUrl: makeEvidencePng('visit', 311),
    status: 'PENDING_APPROVAL',
    createdAt: at(date, '10:05'),
    updatedAt: at(date, '10:05'),
  });

  // 6. Seed connected OutletUnlockRequest (1 PENDING_APPROVAL on the LOCKED outlet + 1 APPROVED)
  const lockedOutlet = outletByCode.get(lockedOutletCode);
  const unlockedHistoryOutlet = outletByCode.get(
    source.outlets.find(
      (o) => o.assigned && o.salesCode === 'SLD539' && o.customer_id !== lockedOutletCode
    ).customer_id
  );

  await ensure(db, 'outletUnlockRequest', `unlock-pending-${date}`, {
    outletId: lockedOutlet.id,
    requestedBy: sales[1].id,
    kind: 'BOTH',
    reason: 'Pelanggan sudah melunasi sebagian piutang dan meminta pembukaan kunci order hari ini.',
    status: 'PENDING_APPROVAL',
    policySnapshot: operationalPolicy(date),
    createdAt: at(date, '09:10'),
    updatedAt: at(date, '09:10'),
  });

  await ensure(db, 'outletUnlockRequest', `unlock-approved-${hist1}`, {
    outletId: unlockedHistoryOutlet.id,
    requestedBy: sales[1].id,
    handledBy: users.admin.id,
    handledAt: at(hist1, '11:15'),
    expiresAt: at(date, '23:59'),
    kind: 'BOTH',
    reason: 'Bukti transfer pelunasan faktur telah dikonfirmasi bagian keuangan.',
    status: 'APPROVED',
    policySnapshot: operationalPolicy(hist1),
    createdAt: at(hist1, '11:00'),
    updatedAt: at(hist1, '11:15'),
  });

  // 7. Seed OutletReview + OutletValidationRun + OutletFieldTask + OutletValidationJob + OutletChange
  const reviewOutletA = outletByCode.get(fieldReviewOutletCodes[0]);
  const reviewOutletB = outletByCode.get(fieldReviewOutletCodes[1]);
  const reviewOutletDone = outletByCode.get(source.outlets[0].customer_id);

  // Review 1: WAITING_FIELD with an OPEN OutletFieldTask linked to Yuli's today PJP validation stop
  const revA = await ensure(db, 'outletReview', `outlet-review-a-${date}`, {
    outletId: reviewOutletA.id,
    ownerId: supervisors[0].id,
    dueAt: at(offsetDate(date, 2), '17:00'),
    reason: 'Verifikasi nama papan toko dan kesesuaian koordinat bangunan di lapangan.',
    status: 'WAITING_FIELD',
    revision: 2,
    workflow: { stage: 'WAITING_FIELD' },
    assignment: { ownerId: supervisors[0].id, assignedAt: at(date, '08:00').toISOString() },
    requestedBy: { id: users.admin.id, name: users.admin.name, role: 'ADMIN' },
    policySnapshot: operationalPolicy(date),
    createdAt: at(date, '08:00'),
    updatedAt: at(date, '08:15'),
  });

  await ensure(db, 'outletValidationRun', `outlet-run-a-${date}`, {
    reviewId: revA.id,
    snapshot: {
      name: reviewOutletA.name,
      address: reviewOutletA.address,
      latitude: reviewOutletA.latitude,
      longitude: reviewOutletA.longitude,
      clusterId: reviewOutletA.clusterId,
      phone: reviewOutletA.phone,
    },
    result: {
      status: 'REVIEW',
      selectedPlaceId: reviewOutletA.googleLocation.placeId,
      confidence: 0.68,
      expiresAt: at(offsetDate(date, 14), '23:59').toISOString(),
    },
    providerContent: {
      candidates: [
        {
          placeId: reviewOutletA.googleLocation.placeId,
          name: reviewOutletA.name,
          address: reviewOutletA.address,
          latitude: reviewOutletA.latitude,
          longitude: reviewOutletA.longitude,
          businessStatus: 'OPERATIONAL',
        },
      ],
    },
    providerExpiresAt: at(offsetDate(date, 14), '23:59'),
    actor: { id: users.admin.id, name: users.admin.name, role: 'ADMIN' },
    createdAt: at(date, '08:05'),
  });

  const fieldTaskOpen = await ensure(db, 'outletFieldTask', `field-task-open-${date}`, {
    reviewId: revA.id,
    ownerId: sales[1].id,
    reviewerId: supervisors[0].id,
    status: 'OPEN',
    revision: 1,
    dueAt: at(offsetDate(date, 2), '17:00'),
    instructions:
      'Konfirmasi nama papan toko, alamat jalan/patokan, serta ambil foto dan GPS tepat di depan pintu masuk.',
    schedule: { mode: 'TODAY_ONLY', assignedOn: date },
    policySnapshot: operationalPolicy(date),
    history: [
      {
        action: 'ASSIGN',
        actor: { id: supervisors[0].id, name: supervisors[0].name, role: 'SUPERVISOR' },
        at: at(date, '08:15').toISOString(),
        ownerId: sales[1].id,
        reviewerId: supervisors[0].id,
      },
    ],
    createdAt: at(date, '08:15'),
    updatedAt: at(date, '08:15'),
  });

  // Link this field task to a validationOnly PjpStop on Yuli's today PJP
  const valStop = await ensure(db, 'pjpStop', `stop-val-${sales[1].staffCode}-${date}`, {
    pjpId: plans[1].id,
    outletId: reviewOutletA.id,
    sequence: yuliStopsToday.length + 1,
    validationTaskId: fieldTaskOpen.id,
    validationOnly: true,
    validationResult: {
      state: 'PENDING',
      assignedOn: date,
      taskId: fieldTaskOpen.id,
      mode: 'TODAY_ONLY',
    },
    status: 'PENDING',
    createdAt: at(date, '08:15'),
    updatedAt: at(date, '08:15'),
  });

  await db.outletFieldTask.update({
    where: { id: fieldTaskOpen.id },
    data: { pjpStopId: valStop.id, updatedAt: at(date, '08:15') },
  });

  // Review 2: SUBMITTED evidence from Cahya awaiting SPV/Admin review
  const revB = await ensure(db, 'outletReview', `outlet-review-b-${date}`, {
    outletId: reviewOutletB.id,
    ownerId: supervisors[0].id,
    dueAt: at(offsetDate(date, 1), '17:00'),
    reason: 'Validasi titik masuk gerai dan konfirmasi jam operasional pengiriman.',
    status: 'WAITING_FIELD',
    revision: 3,
    workflow: { stage: 'SUBMITTED' },
    assignment: { ownerId: supervisors[0].id, assignedAt: at(hist2, '08:00').toISOString() },
    requestedBy: { id: users.admin.id, name: users.admin.name, role: 'ADMIN' },
    policySnapshot: operationalPolicy(hist2),
    createdAt: at(hist2, '08:00'),
    updatedAt: at(date, '09:10'),
  });

  await ensure(db, 'outletValidationRun', `outlet-run-b-${date}`, {
    reviewId: revB.id,
    snapshot: {
      name: reviewOutletB.name,
      address: reviewOutletB.address,
      latitude: reviewOutletB.latitude,
      longitude: reviewOutletB.longitude,
      clusterId: reviewOutletB.clusterId,
      phone: reviewOutletB.phone,
    },
    result: {
      status: 'REVIEW',
      selectedPlaceId: reviewOutletB.googleLocation.placeId,
      confidence: 0.68,
      expiresAt: at(offsetDate(date, 14), '23:59').toISOString(),
    },
    providerContent: {
      candidates: [
        {
          placeId: reviewOutletB.googleLocation.placeId,
          name: reviewOutletB.name,
          address: reviewOutletB.address,
          latitude: reviewOutletB.latitude,
          longitude: reviewOutletB.longitude,
          businessStatus: 'OPERATIONAL',
        },
      ],
    },
    providerExpiresAt: at(offsetDate(date, 14), '23:59'),
    actor: { id: users.admin.id, name: users.admin.name, role: 'ADMIN' },
    createdAt: at(hist2, '08:05'),
  });

  await ensure(db, 'outletFieldTask', `field-task-submitted-${date}`, {
    reviewId: revB.id,
    ownerId: sales[0].id,
    reviewerId: supervisors[0].id,
    status: 'SUBMITTED',
    revision: 2,
    dueAt: at(offsetDate(date, 1), '17:00'),
    instructions: 'Ambil foto papan nama gerai dan titik GPS pintu penerimaan barang.',
    schedule: { mode: 'TODAY_ONLY', assignedOn: hist2 },
    policySnapshot: operationalPolicy(hist2),
    evidence: {
      requestId: id(`field-ev-req-${date}`),
      outcome: 'FOUND',
      name: reviewOutletB.name,
      address: reviewOutletB.address,
      latitude: reviewOutletB.latitude,
      longitude: reviewOutletB.longitude,
      accuracyMeters: 10,
      capturedAt: at(date, '09:05').toISOString(),
      note: 'Gerai aktif beroperasi dan akses mobil pengiriman tersedia di depan toko.',
      photo: makeEvidencePng('field', 2),
    },
    history: [
      {
        action: 'SUBMIT',
        actor: { id: sales[0].id, name: sales[0].name, role: 'SALES' },
        at: at(date, '09:10').toISOString(),
        note: 'Bukti foto & GPS pintu gerai dikirim untuk pemeriksaan.',
      },
    ],
    createdAt: at(hist2, '08:20'),
    updatedAt: at(date, '09:10'),
  });

  // Review 3: COMPLETED + OutletChange history record
  const revDone = await ensure(db, 'outletReview', `outlet-review-done-${hist1}`, {
    outletId: reviewOutletDone.id,
    ownerId: users.admin.id,
    dueAt: at(hist1, '17:00'),
    reason: 'Konfirmasi berkala kelengkapan data alamat dan koordinat pelanggan.',
    status: 'COMPLETED',
    revision: 2,
    workflow: { stage: 'COMPLETED' },
    assignment: { ownerId: users.admin.id, assignedAt: at(hist1, '08:00').toISOString() },
    requestedBy: { id: users.admin.id, name: users.admin.name, role: 'ADMIN' },
    decision: {
      action: 'DIGITAL_KEEP',
      actor: { id: users.admin.id, name: users.admin.name, role: 'ADMIN' },
      at: at(hist1, '10:30').toISOString(),
      reason: 'Identitas nama, alamat, dan titik koordinat sesuai hasil verifikasi Google.',
    },
    policySnapshot: operationalPolicy(hist1),
    createdAt: at(hist1, '08:00'),
    updatedAt: at(hist1, '10:30'),
    closedAt: at(hist1, '10:30'),
  });

  await ensure(db, 'outletValidationRun', `outlet-run-done-${hist1}`, {
    reviewId: revDone.id,
    snapshot: {
      name: reviewOutletDone.name,
      address: reviewOutletDone.address,
      latitude: reviewOutletDone.latitude,
      longitude: reviewOutletDone.longitude,
      clusterId: reviewOutletDone.clusterId,
      phone: reviewOutletDone.phone,
    },
    result: {
      status: 'STRONG',
      selectedPlaceId: reviewOutletDone.googleLocation.placeId,
      confidence: 0.96,
      version: OUTLET_DIGITAL_VERSION,
      expiresAt: at(offsetDate(date, 21), '23:59').toISOString(),
    },
    providerContent: {
      candidates: [
        {
          placeId: reviewOutletDone.googleLocation.placeId,
          name: reviewOutletDone.name,
          address: reviewOutletDone.address,
          latitude: reviewOutletDone.latitude,
          longitude: reviewOutletDone.longitude,
          businessStatus: 'OPERATIONAL',
        },
      ],
    },
    providerExpiresAt: at(offsetDate(date, 21), '23:59'),
    actor: { id: users.admin.id, name: users.admin.name, role: 'ADMIN' },
    createdAt: at(hist1, '09:00'),
  });

  await ensure(db, 'outletValidationJob', `outlet-val-job-${hist1}`, {
    requestId: id(`outlet-val-job-req-${hist1}`),
    actorId: users.admin.id,
    status: 'COMPLETED',
    reason: 'Pemeriksaan batch kelengkapan lokasi outlet Belfoods.',
    items: [
      { outletId: reviewOutletDone.id, status: 'DONE' },
      { outletId: reviewOutletA.id, status: 'DONE' },
    ],
    leaseToken: id(`lease-${hist1}`),
    leaseUntil: at(hist1, '09:15'),
    createdAt: at(hist1, '08:50'),
    updatedAt: at(hist1, '09:10'),
  });

  await ensure(db, 'outletChange', `outlet-change-${hist1}`, {
    outletId: reviewOutletDone.id,
    actor: { id: users.admin.id, name: users.admin.name, role: 'ADMIN' },
    reason: 'Sinkronisasi format alamat dan koordinat terverifikasi.',
    source: 'DIGITAL_REVIEW',
    before: { validationStatus: 'LIKELY_VALID', latitude: reviewOutletDone.latitude },
    after: { validationStatus: 'VALID', latitude: reviewOutletDone.latitude },
    createdAt: at(hist1, '10:30'),
  });

  return {
    plans,
    orders,
    todayStopsBySalesIndex,
    drivers,
    hist1,
    hist2,
    baseStamp,
    revA,
    valStop,
  };
}
