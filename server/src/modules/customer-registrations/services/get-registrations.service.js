import { teamSalesWhere } from '../../../utils/team-scope.js';
/** getRegistrations - single-responsibility service (extracted from customer-registrations.service.js). */
import { prisma } from '../../../config/prisma.js';
import { parsePagination, buildPaginatedResponse } from '../../../utils/pagination.js';
import { ROLES } from '../../../utils/constants.js';

const REGISTRATION_LIST_SELECT = {
  id: true,
  policySnapshot: true,
  revisionHistory: true,
  visitIntervalWeeks: true,
  locationEvidence: true,
  requestId: true,
  registrationCode: true,
  customerCode: true,
  divisionId: true,
  divisionName: true,
  branch: true,
  companyId: true,
  branchId: true,
  name: true,
  ownerName: true,
  address: true,
  address2: true,
  address3: true,
  phone: true,
  locationType: true,
  mappingLocation: true,
  taxType: true,
  taxNumber: true,
  taxName: true,
  taxAddress: true,
  area: true,
  subAreaKecamatan: true,
  kelurahan: true,
  city: true,
  latitude: true,
  longitude: true,
  placeId: true,
  placeDetails: true,
  photoId: true,
  channel: true,
  subChannel: true,
  channelTier: true,
  paymentType: true,
  cashMethod: true,
  termOfPaymentDays: true,
  bankAccountInfo: true,
  visitWeekSchedule: true,
  visitDays: true,
  registrationStatus: true,
  outletKnownBy: true,
  rejectionNote: true,
  salesmanName: true,
  spvName: true,
  adminName: true,
  salesmanId: true,
  spvId: true,
  spvApprovedAt: true,
  adminId: true,
  adminRegisteredAt: true,
  clusterId: true,
  marketSegmentId: true,
  customerGroupId: true,
  customerCategoryId: true,
  storeStatusId: true,
  isActive: true,
  isBumn: true,
  isContraBill: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
};

/**
 * 2. Get Paginated Registrations
 */
export const getRegistrations = async (query = {}, currentUser) => {
  const {
    status = 'ALL',
    area = 'ALL',
    channel = 'ALL',
    division = 'ALL',
    search = '',
    startDate,
    endDate,
    includeMedia,
  } = query;
  const { skip, take, page, limit } = parsePagination(query);

  const where = { deletedAt: null };
  if (currentUser?.role === 'SUPERVISOR') where.salesman = teamSalesWhere(currentUser.id);

  // Sales only sees their own submissions unless privileged
  if (currentUser?.role === ROLES.SALES) {
    where.salesmanId = currentUser.id;
  }

  const cleanStatus = status && status !== 'ALL' && status !== 'undefined' ? status : null;
  const cleanArea = area && area !== 'ALL' && area !== 'undefined' ? area : null;
  const cleanChannel = channel && channel !== 'ALL' && channel !== 'undefined' ? channel : null;
  const cleanDivision =
    division && division !== 'ALL' && division !== 'undefined' ? division : null;
  const cleanSearch = search && search !== 'undefined' && search.trim() ? search.trim() : null;

  if (cleanStatus) where.registrationStatus = cleanStatus;
  if (cleanArea) where.area = cleanArea;
  if (cleanChannel) where.channel = cleanChannel;

  const andClauses = [];
  if (cleanDivision) {
    andClauses.push({
      OR: [
        { divisionId: cleanDivision },
        { divisionName: { equals: cleanDivision, mode: 'insensitive' } },
        { divisionRef: { is: { name: { equals: cleanDivision, mode: 'insensitive' } } } },
      ],
    });
  }
  if (cleanSearch) {
    andClauses.push({
      OR: [
        { name: { contains: cleanSearch, mode: 'insensitive' } },
        { address: { contains: cleanSearch, mode: 'insensitive' } },
        { customerCode: { contains: cleanSearch, mode: 'insensitive' } },
        { registrationCode: { contains: cleanSearch, mode: 'insensitive' } },
        { salesmanName: { contains: cleanSearch, mode: 'insensitive' } },
      ],
    });
  }
  if (andClauses.length) {
    where.AND = andClauses;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const withFullMedia = includeMedia === 'true';
  const [rawData, total, statusCounts] = await Promise.all([
    prisma.customerRegistration.findMany({
      where,
      ...(withFullMedia ? {} : { select: REGISTRATION_LIST_SELECT }),
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.customerRegistration.count({ where }),
    // Summary status counts
    prisma.customerRegistration.groupBy({
      by: ['registrationStatus'],
      where: Object.fromEntries(
        Object.entries(where).filter(([key]) => key !== 'registrationStatus')
      ),
      _count: { _all: true },
    }),
  ]);

  let photoIdSet = new Set();
  if (!withFullMedia && rawData.length > 0) {
    const withPhotoRows = await prisma.customerRegistration.findMany({
      where: {
        id: { in: rawData.map((r) => r.id) },
        NOT: [{ photoUrl: null }, { photoUrl: '' }],
      },
      select: { id: true },
    });
    photoIdSet = new Set(withPhotoRows.map((r) => r.id));
  }

  const data = rawData.map((row) => ({
    ...row,
    division: row.divisionName ?? null,
    hasPhoto: withFullMedia ? Boolean(row.photoUrl) : photoIdSet.has(row.id),
  }));

  const countsMap = {
    TOTAL: total,
    SUBMITTED: 0,
    SPV_APPROVED: 0,
    REGISTERED_ACTIVE: 0,
    REJECTED: 0,
  };
  statusCounts.forEach((c) => {
    countsMap[c.registrationStatus] = c._count._all;
  });
  countsMap.TOTAL = statusCounts.reduce((sum, c) => sum + c._count._all, 0);

  const response = buildPaginatedResponse(data, total, page, limit);
  return { ...response, statusCounts: countsMap };
};
