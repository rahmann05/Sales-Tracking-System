import bcrypt from 'bcryptjs';
import { CONFIG_PARAMS } from '../../../shared/config.mjs';
import { OUTLET_DIGITAL_VERSION } from '../../../shared/outlet-validation.mjs';
import { BUILT_IN_ROLES } from '../../src/modules/roles/roles.constants.js';
import {
  at,
  CLUSTER_DEFS,
  email,
  haversineKm,
  id,
  note,
  offsetDate,
  operationalPolicy,
  people,
  sourceData,
} from './context.js';
import { makeEvidencePng } from './completions.js';
import { seedFleet } from './fleet.js';

export const PRODUCT_CATALOG = [
  [1, 'Nugget Ayam Klasik 500 g', 35000, 'BF-NUG-500', 220],
  [2, 'Sosis Ayam 375 g', 24000, 'BF-SOS-375', 240],
  [3, 'Bakso Ayam 500 g', 28000, 'BF-BKS-500', 180],
  [4, 'Royal Chicken Nugget 500 g', 42000, 'BF-RYL-500', 160],
  [5, 'Chicken Stick Crispy 500 g', 37500, 'BF-STK-500', 150],
  [6, 'Spicy Wing Chicken 500 g', 46000, 'BF-WNG-500', 140],
  [7, 'Uenaak Chicken Nugget 500 g', 31000, 'BF-UEN-500', 200],
  [8, 'Sosis Sapi Bakar 500 g', 49000, 'BF-SSB-500', 120],
  [9, 'Karaage Ayam Renyah 500 g', 44000, 'BF-KRG-500', 135],
  [10, 'Cordon Bleu Chicken 350 g', 48000, 'BF-CDB-350', 110],
  [11, 'Kaki Naga Ayam 500 g', 33000, 'BF-KNB-500', 175],
  [12, 'Otak-Otak Ikan 500 g', 26000, 'BF-OTK-500', 190],
];

const OVERRIDE_CONFIG_DEFAULTS = {
  TAX_RATE_PERCENT: 0,
  CODE_INVOICE_MODE: 'INCREMENT',
  CODE_INVOICE_RESET: 'DAILY',
  CODE_PJP_MODE: 'INCREMENT',
  CODE_PJP_RESET: 'DAILY',
};

export async function seedMaster(db, date) {
  const baseStamp = at(date, '06:00');
  const validatedStamp = at(offsetDate(date, -7), '10:00');
  const source = sourceData();

  await db.systemConfig.createMany({
    data: CONFIG_PARAMS.map((param) => ({
      key: param.key,
      value: Object.hasOwn(OVERRIDE_CONFIG_DEFAULTS, param.key)
        ? OVERRIDE_CONFIG_DEFAULTS[param.key]
        : param.defaultValue,
      updatedAt: baseStamp,
    })),
    skipDuplicates: true,
  });

  await db.systemConfig.upsert({
    where: { key: 'ROLE_DEFINITIONS' },
    update: {},
    create: { key: 'ROLE_DEFINITIONS', value: BUILT_IN_ROLES, updatedAt: baseStamp },
  });

  const divisionBelfoods = await db.division.upsert({
    where: { code: 'BELFOODS' },
    update: {},
    create: {
      id: id('division-BELFOODS'),
      code: 'BELFOODS',
      name: 'BELFOODS',
      isActive: true,
      createdAt: baseStamp,
      updatedAt: baseStamp,
    },
  });
  await db.division.deleteMany({
    where: {
      OR: [{ code: 'MIX' }, { name: { equals: 'DIVISI MIX', mode: 'insensitive' } }],
      customerRegistrations: { none: {} },
    },
  });

  const password = await bcrypt.hash(process.env.SEED_PASSWORD || 'DemoSinar2026!', 10);
  const users = {};
  const newUserKeys = new Set();
  for (const [key, name, role, staffCode, team] of people) {
    const addr = email(key);
    if (!(await db.user.findUnique({ where: { email: addr } }))) newUserKeys.add(key);
    users[key] = await db.user.upsert({
      where: { email: addr },
      update: {},
      create: {
        id: id(`user-${key}`),
        name,
        email: addr,
        password,
        role,
        roleCode: role,
        staffCode,
        permissions: {},
        ...(role === 'SALES' ? { supervisorId: users[team === 0 ? 'spv.gt' : 'spv.mt'].id } : {}),
        createdAt: baseStamp,
        updatedAt: baseStamp,
      },
    });
  }

  const supervisors = [users['spv.gt'], users['spv.mt']];
  const sales = CLUSTER_DEFS.map((def) => users[def.salesKey]);
  const drivers = [
    users['andri.supir'],
    users['rendi.supir'],
    users['ridwanto.supir'],
    users['oki.supir'],
  ];

  // Create clusters cleanly and bind each Salesman's primary clusterId
  const clusters = [];
  const clusterByCode = new Map();
  for (const [index, def] of CLUSTER_DEFS.entries()) {
    const member = users[def.salesKey];
    const rows = source.outlets.filter((o) => o.salesCode === def.staffCode);
    const centerLat = Number((rows.reduce((s, r) => s + r.latitude, 0) / rows.length).toFixed(6));
    const centerLng = Number((rows.reduce((s, r) => s + r.longitude, 0) / rows.length).toFixed(6));

    const cluster = await db.cluster.upsert({
      where: { id: id(`cluster-${def.code}`) },
      update: {},
      create: {
        id: id(`cluster-${def.code}`),
        code: def.code,
        name: def.name,
        region: def.region,
        colorHex: def.colorHex,
        centerLat,
        centerLng,
        outletCount: rows.length,
        assignedSalesId: member.id,
        supervisorId: member.supervisorId,
        createdAt: baseStamp,
        updatedAt: baseStamp,
      },
    });
    clusters.push(cluster);
    clusterByCode.set(def.code, cluster);

    if (newUserKeys.has(def.salesKey)) {
      await db.user.update({
        where: { id: member.id },
        data: { clusterId: cluster.id, updatedAt: baseStamp },
      });
      users[def.salesKey].clusterId = cluster.id;
    }
  }

  // Pick specific real outlets for connected workflows before bulk-inserting all 443 outlets
  const cahyaOutlets = source.outlets.filter((o) => o.salesCode === 'SLD514');
  const dadanOutlets = source.outlets.filter((o) => o.salesCode === 'SLD516');
  const puriOutlets = source.outlets.filter((o) => o.salesCode === 'SLD515');
  const yatiOutlets = source.outlets.filter((o) => o.salesCode === 'SLD517');

  const registeredOutletSrc = cahyaOutlets[0];
  const lockedOutletSrc = dadanOutlets[0];
  const fieldReviewOutlets = new Set([dadanOutlets[2].customer_id, puriOutlets[2].customer_id]);

  // Seed 4 CustomerRegistration (NOO) rows covering every lifecycle status without null business fields
  const nooSpecs = [
    {
      status: 'REGISTERED_ACTIVE',
      src: registeredOutletSrc,
      salesman: users['cahya'],
      spv: users['spv.gt'],
      cluster: clusterByCode.get('BF-SLD514'),
      customerCode: registeredOutletSrc.customer_id,
      name: registeredOutletSrc.customer_name,
      address: registeredOutletSrc.address,
      area: 'Cimahi & Bandung Barat',
      subAreaKecamatan: 'Padalarang',
      kelurahan: 'Kertamulya',
      city: 'Kabupaten Bandung Barat',
      rejectionNote: '-',
    },
    {
      status: 'SPV_APPROVED',
      src: { ...cahyaOutlets[5], latitude: -6.88912, longitude: 107.51542 },
      salesman: users['cahya'],
      spv: users['spv.gt'],
      cluster: clusterByCode.get('BF-SLD514'),
      customerCode: 'NOO-CAND-002',
      name: 'Toko Berkah Frozen Cimahi',
      address: 'Jl. Gandawijaya No. 112, Setiamanah, Cimahi Tengah, Kota Cimahi',
      area: 'Cimahi Tengah',
      subAreaKecamatan: 'Cimahi Tengah',
      kelurahan: 'Setiamanah',
      city: 'Kota Cimahi',
      rejectionNote: '-',
    },
    {
      status: 'SUBMITTED',
      src: { ...dadanOutlets[5], latitude: -6.96824, longitude: 107.57415 },
      salesman: users['dadan'],
      spv: users['spv.gt'],
      cluster: clusterByCode.get('BF-SLD516'),
      customerCode: 'NOO-CAND-003',
      name: 'Warung Frozen Sayati Jaya',
      address: 'Jl. Kopo Sayati No. 214, Margahayu, Kabupaten Bandung',
      area: 'Kopo & Margahayu',
      subAreaKecamatan: 'Margahayu',
      kelurahan: 'Sayati',
      city: 'Kabupaten Bandung',
      rejectionNote: '-',
    },
    {
      status: 'REJECTED',
      src: { ...yatiOutlets[2], latitude: -6.91435, longitude: 107.61942 },
      salesman: users['yati'],
      spv: users['spv.mt'],
      cluster: clusterByCode.get('BF-SLD517'),
      customerCode: 'NOO-CAND-004',
      name: 'Minimarket Riau Sentosa',
      address: 'Jl. Lombok No. 41, Merdeka, Sumur Bandung, Kota Bandung',
      area: 'Bandung Tengah',
      subAreaKecamatan: 'Sumur Bandung',
      kelurahan: 'Merdeka',
      city: 'Kota Bandung',
      rejectionNote: 'Duplikat dengan pelanggan aktif pada koridor jalan yang sama.',
    },
  ];

  const registrations = [];
  for (const [idx, spec] of nooSpecs.entries()) {
    const regId = id(`noo-${spec.status}`);
    const reg = await db.customerRegistration.upsert({
      where: { id: regId },
      update: {},
      create: {
        id: regId,
        requestId: id(`noo-req-${spec.status}`),
        registrationCode: `BF-NOO-${date.replaceAll('-', '')}-${String(idx + 1).padStart(3, '0')}`,
        customerCode: spec.customerCode,
        divisionId: divisionBelfoods.id,
        divisionName: 'BELFOODS',
        branch: 'PADALARANG',
        companyId: 'PT-SA-BDG',
        branchId: 'BDG-01',
        name: spec.name,
        ownerName: spec.src.ownerName || 'Pemilik Usaha',
        address: spec.address,
        address2: spec.subAreaKecamatan,
        address3: spec.city,
        phone: spec.src.phone || '081220001001',
        locationType: 'PINGGIR_JALAN',
        mappingLocation: `${spec.src.latitude}, ${spec.src.longitude}`,
        taxType: spec.src.channel === 'MODERN_TRADE' ? 'PKP' : 'NON_PKP',
        taxNumber: spec.src.taxNumber || '01.452.100.1-428.000',
        taxName: spec.name,
        taxAddress: spec.address,
        taxDocumentUrl: makeEvidencePng('noo', 10 + idx),
        area: spec.area,
        subAreaKecamatan: spec.subAreaKecamatan,
        kelurahan: spec.kelurahan,
        city: spec.city,
        latitude: spec.src.latitude,
        longitude: spec.src.longitude,
        placeId: `google-place-noo-${idx + 1}`,
        placeDetails: {
          name: spec.name,
          formattedAddress: spec.address,
          source: 'GOOGLE_PLACES_VERIFIED',
        },
        photoId: `noo-photo-${idx + 1}`,
        photoUrl: makeEvidencePng('noo', idx + 1),
        locationEvidence: {
          source: 'DEVICE_GPS',
          verified: true,
          accuracyMeters: 12,
          latitude: spec.src.latitude,
          longitude: spec.src.longitude,
          capturedAt: at(date, '08:15').toISOString(),
        },
        channel: spec.src.channel,
        subChannel: spec.src.subChannel,
        channelTier: spec.src.channel === 'MODERN_TRADE' ? 'TIER_1_TOP' : 'BRONZE_B',
        paymentType: 'TOP',
        cashMethod: 'TUNAI',
        termOfPaymentDays: spec.src.channel === 'MODERN_TRADE' ? 14 : 7,
        bankAccountInfo: 'BCA 008-341-9921 a.n. Usaha Mitra Belfoods',
        visitWeekSchedule: 'ALL_WEEK',
        visitDays: 'Senin, Kamis',
        registrationStatus: spec.status,
        outletKnownBy: spec.salesman.name,
        rejectionNote: spec.rejectionNote,
        salesmanId: spec.salesman.id,
        salesmanName: spec.salesman.name,
        spvId: ['SPV_APPROVED', 'REGISTERED_ACTIVE'].includes(spec.status)
          ? spec.spv.id
          : spec.spv.id,
        spvName: spec.spv.name,
        spvApprovedAt: ['SPV_APPROVED', 'REGISTERED_ACTIVE'].includes(spec.status)
          ? at(offsetDate(date, -2), '11:00')
          : null,
        adminId: spec.status === 'REGISTERED_ACTIVE' ? users.admin.id : users.admin.id,
        adminName: users.admin.name,
        adminRegisteredAt:
          spec.status === 'REGISTERED_ACTIVE' ? at(offsetDate(date, -1), '09:30') : null,
        clusterId: spec.cluster.id,
        marketSegmentId: spec.src.channel === 'MODERN_TRADE' ? 'SEG-MT' : 'SEG-GT',
        customerGroupId: spec.src.channel === 'MODERN_TRADE' ? 'GRP-MODERN' : 'GRP-RETAIL',
        customerCategoryId: 'CAT-FROZEN',
        storeStatusId: 'ACTIVE',
        isActive: spec.status !== 'REJECTED',
        isBumn: false,
        isContraBill: spec.src.channel === 'MODERN_TRADE',
        policySnapshot: operationalPolicy(date),
        revisionHistory: [
          {
            action: 'SUBMITTED',
            actor: {
              id: spec.salesman.id,
              name: spec.salesman.name,
              role: 'SALES',
            },
            at: at(offsetDate(date, -3), '14:00').toISOString(),
            reason: 'Pengajuan pelanggan baru Belfoods Bandung Raya.',
            rejectionNote: null,
            before: {},
            after: {},
          },
        ],
        createdAt: at(offsetDate(date, -3), '14:00'),
        updatedAt: at(date, '08:00'),
      },
    });
    registrations.push(reg);
  }

  // Bulk insert all 443 Outlets from KUNJUNGAN_TOKO_BELFOODS_CONVERTED.json with zero nulls
  const activeNooId = id('noo-REGISTERED_ACTIVE');
  const outletRows = source.outlets.map((o, idx) => {
    const cluster = clusterByCode.get(o.clusterCode);
    const isRegistered = o.customer_id === registeredOutletSrc.customer_id;
    const isLocked = o.customer_id === lockedOutletSrc.customer_id;
    const isReviewTarget = fieldReviewOutlets.has(o.customer_id);
    const validationStatus = isReviewTarget
      ? 'WARNING'
      : o.geocode_confidence === 'high'
        ? 'VALID'
        : 'LIKELY_VALID';
    const validationConfidence = isReviewTarget
      ? 0.68
      : o.geocode_confidence === 'high'
        ? 0.96
        : 0.85;
    const placeId = `bf-place-${o.customer_id.toLowerCase()}`;

    return {
      id: id(`outlet-${o.customer_id}`),
      requestId: id(`outlet-req-${o.customer_id}`),
      ...(isRegistered ? { registrationId: activeNooId } : {}),
      source: isRegistered ? 'NOO' : 'BELFOODS_CALLPLAN',
      taxType: o.taxType,
      taxNumber: o.taxNumber,
      taxName: o.customer_name,
      taxAddress: o.address,
      paymentType: o.paymentType,
      termOfPaymentDays: o.termOfPaymentDays,
      visitSchedule: {
        days: [o.dayOfWeek],
        weekType: o.weekType,
      },
      name: o.customer_name,
      address: o.address,
      latitude: o.latitude,
      longitude: o.longitude,
      clusterId: cluster.id,
      outletCode: o.customer_id,
      ownerName: o.ownerName,
      phone: o.phone,
      outstanding: isLocked ? 1750000 : 0,
      radiusMeters: 50,
      itineraryCode: o.itineraryCode,
      channel: o.channel,
      type: o.channel,
      subChannel: o.subChannel,
      lockStatus: isLocked ? 'LOCKED' : 'NORMAL',
      validationStatus,
      validationConfidence,
      validatedAt: validatedStamp,
      googleSuggestedLat: o.latitude,
      googleSuggestedLng: o.longitude,
      googleLocation: {
        placeId,
        name: o.customer_name,
        formattedAddress: o.address,
        latitude: o.latitude,
        longitude: o.longitude,
        status: 'ACTIVE',
        cachedAt: validatedStamp.toISOString(),
        expiresAt: at(offsetDate(date, 30), '23:59').toISOString(),
        basis: {
          name: o.customer_name,
          address: o.address,
          latitude: o.latitude,
          longitude: o.longitude,
          clusterId: cluster.id,
          phone: o.phone,
        },
        confidence: validationConfidence,
        source: o.curatedFromMissing ? 'CURATED_CACHE' : 'GOOGLE_PLACES',
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`,
      },
      locationEvidence: {
        source: o.geocode_confidence === 'high' ? 'GOOGLE' : 'INTERNAL',
        status: 'ACTIVE',
        verified: !isReviewTarget,
        confidence: validationConfidence,
        verifiedAt: validatedStamp.toISOString(),
        note: o.catatan_validasi,
      },
      validationDetails: {
        source: 'KUNJUNGAN_TOKO_BELFOODS_CONVERTED',
        callplanId: o.callplanId,
        salesCode: o.salesCode,
        salesVariant: o.salesLabel,
        dayOfWeek: o.dayOfWeek,
        sequence: o.sequence,
        rawConfidence: o.geocode_confidence,
        note: o.catatan_validasi,
        stale: false,
        coordinateHistory: [
          {
            at: validatedStamp.toISOString(),
            latitude: o.latitude,
            longitude: o.longitude,
            source: 'BELFOODS_CALLPLAN',
          },
        ],
        ...(!isReviewTarget
          ? {
              qualityConfirmed: {
                source: 'DIGITAL',
                version: OUTLET_DIGITAL_VERSION,
                name: o.customer_name,
                address: o.address,
                confirmedAt: validatedStamp.toISOString(),
              },
            }
          : {}),
      },
      createdAt: baseStamp,
      updatedAt: baseStamp,
    };
  });

  await db.outlet.createMany({ data: outletRows, skipDuplicates: true });

  const outletsByCluster = new Map();
  const dbOutlets = await db.outlet.findMany({
    where: { deletedAt: null },
    orderBy: [{ outletCode: 'asc' }],
  });
  const outletByCode = new Map(dbOutlets.map((o) => [o.outletCode, o]));
  for (const o of dbOutlets) {
    const arr = outletsByCluster.get(o.clusterId) || [];
    arr.push(o);
    outletsByCluster.set(o.clusterId, arr);
  }

  // Create active ClusterRoute per cluster using real outlet order and computed distance
  for (const def of CLUSTER_DEFS) {
    const cluster = clusterByCode.get(def.code);
    const orderedSources = source.outlets
      .filter((r) => r.clusterCode === def.code)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.sequence - b.sequence);
    const orderedIds = orderedSources.map((r) => outletByCode.get(r.customer_id).id);
    let totalDistanceKm = 0;
    for (let i = 1; i < orderedSources.length; i++) {
      totalDistanceKm += haversineKm(
        orderedSources[i - 1].latitude,
        orderedSources[i - 1].longitude,
        orderedSources[i].latitude,
        orderedSources[i].longitude
      );
    }
    const overviewPath = orderedSources
      .slice(0, 25)
      .map((r) => ({ lat: r.latitude, lng: r.longitude }));

    await db.clusterRoute.upsert({
      where: { id: id(`cluster-route-${def.code}`) },
      update: {},
      create: {
        id: id(`cluster-route-${def.code}`),
        clusterId: cluster.id,
        routeIndex: 1,
        isActive: true,
        totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
        outletOrder: orderedIds,
        overviewPath,
        startOutletId: orderedIds[0],
        createdAt: baseStamp,
        updatedAt: baseStamp,
      },
    });
  }

  // Build all 41 PjpTemplates + all 443 PjpTemplateStops matching KUNJUNGAN_TOKO_BELFOODS_CONVERTED.json
  const templateBuckets = new Map();
  for (const r of source.outlets) {
    const key = `${r.salesCode}:${r.dayOfWeek}:${r.weekType}`;
    if (!templateBuckets.has(key)) {
      templateBuckets.set(key, {
        salesCode: r.salesCode,
        dayOfWeek: r.dayOfWeek,
        weekType: r.weekType,
        items: [],
      });
    }
    templateBuckets.get(key).items.push(r);
  }

  const templateRows = [];
  const templateStopRows = [];
  for (const [key, bucket] of templateBuckets.entries()) {
    const member = sales.find((s) => s.staffCode === bucket.salesCode);
    const tplId = id(`pjp-template-${key}`);
    templateRows.push({
      id: tplId,
      userId: member.id,
      dayOfWeek: bucket.dayOfWeek,
      weekType: bucket.weekType,
      createdAt: baseStamp,
      updatedAt: baseStamp,
    });
    const sorted = [...bucket.items].sort((a, b) => a.sequence - b.sequence);
    for (const [idx, row] of sorted.entries()) {
      templateStopRows.push({
        id: id(`pjp-template-stop-${key}-${row.customer_id}`),
        pjpTemplateId: tplId,
        outletId: outletByCode.get(row.customer_id).id,
        sequence: idx + 1,
        createdAt: baseStamp,
        updatedAt: baseStamp,
      });
    }
  }
  await db.pjpTemplate.createMany({ data: templateRows, skipDuplicates: true });
  await db.pjpTemplateStop.createMany({ data: templateStopRows, skipDuplicates: true });

  // Seed 12 real Belfoods products
  const products = [];
  for (const [index, name, price, sku, stock] of PRODUCT_CATALOG) {
    const product = await db.product.upsert({
      where: { sku },
      update: {},
      create: {
        id: id(`product-${sku}`),
        sku,
        code: `BF-P${String(index).padStart(2, '0')}`,
        name,
        price,
        stock,
        unit: 'pak',
        baseUnit: 'pak',
        unitsPerUnit: 1,
        createdAt: baseStamp,
        updatedAt: baseStamp,
      },
    });
    products.push(product);
  }

  const vehicles = await seedFleet(db, users, date);

  return {
    users,
    supervisors,
    sales,
    drivers,
    clusters,
    clusterByCode,
    outlets: dbOutlets,
    outletByCode,
    outletsByCluster,
    registrations,
    products,
    vehicles,
    divisionBelfoods,
    source,
    lockedOutletCode: lockedOutletSrc.customer_id,
    fieldReviewOutletCodes: [...fieldReviewOutlets],
  };
}
