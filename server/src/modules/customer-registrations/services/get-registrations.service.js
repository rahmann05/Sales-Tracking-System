/** getRegistrations - single-responsibility service (extracted from customer-registrations.service.js). */
import { prisma } from '../../../config/prisma.js';
import { parsePagination, buildPaginatedResponse } from '../../../utils/pagination.js';
import { ROLES } from '../../../utils/constants.js';

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
  } = query;
  const { skip, take, page, limit } = parsePagination(query);

  const where = { deletedAt: null };

  // Sales only sees their own submissions unless privileged
  if (currentUser?.role === ROLES.SALES) {
    where.salesmanId = currentUser.id;
  }

  const cleanStatus = status && status !== 'ALL' && status !== 'undefined' ? status : null;
  const cleanArea = area && area !== 'ALL' && area !== 'undefined' ? area : null;
  const cleanChannel = channel && channel !== 'ALL' && channel !== 'undefined' ? channel : null;
  const cleanDivision = division && division !== 'ALL' && division !== 'undefined' ? division : null;
  const cleanSearch = search && search !== 'undefined' && search.trim() ? search.trim() : null;

  if (cleanStatus) where.registrationStatus = cleanStatus;
  if (cleanArea) where.area = cleanArea;
  if (cleanChannel) where.channel = cleanChannel;
  if (cleanDivision) where.division = cleanDivision;

  if (cleanSearch) {
    where.OR = [
      { name: { contains: cleanSearch, mode: 'insensitive' } },
      { address: { contains: cleanSearch, mode: 'insensitive' } },
      { customerCode: { contains: cleanSearch, mode: 'insensitive' } },
      { salesmanName: { contains: cleanSearch, mode: 'insensitive' } },
    ];
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

  const [data, total, statusCounts] = await Promise.all([
    prisma.customerRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.customerRegistration.count({ where }),
    // Summary status counts
    prisma.customerRegistration.groupBy({
      by: ['registrationStatus'],
      where: currentUser?.role === ROLES.SALES ? { salesmanId: currentUser.id, deletedAt: null } : { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

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

  const response = buildPaginatedResponse(data, total, page, limit);
  return { ...response, statusCounts: countsMap };
};
