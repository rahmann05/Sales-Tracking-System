/**
 * Helper to parse pagination params from query string
 * @param {object} query - req.query
 * @returns {{ skip: number, take: number, page: number, limit: number }}
 */
export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

/**
 * Build standardized paginated response payload
 */
export const buildPaginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
});

/**
 * Build a Prisma-compatible date range filter from optional startDate/endDate strings.
 * @param {string|undefined} startDate - ISO date string for start (inclusive)
 * @param {string|undefined} endDate   - ISO date string for end (inclusive)
 * @returns {object|undefined} Prisma `{ gte, lte }` filter, or undefined if no dates given
 */
export const buildDateRange = (startDate, endDate) => {
  const filter = {};

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    filter.gte = start;
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.lte = end;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
};

/**
 * Build a start-of-day / end-of-day range for a single date string.
 * @param {string} dateStr - ISO date string (e.g. '2026-08-05')
 * @returns {{ gte: Date, lte: Date }}
 */
export const buildDayRange = (dateStr) => {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
};
