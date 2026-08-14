import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  parsePagination, 
  buildPaginatedResponse, 
  buildDateRange, 
  buildDayRange 
} from '../src/utils/pagination.js';

describe('Pagination & Date Filter Utilities Unit Tests', () => {
  it('should parse default pagination when query is empty', () => {
    const parsed = parsePagination({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 20);
    assert.equal(parsed.skip, 0);
    assert.equal(parsed.take, 20);
  });

  it('should parse custom pagination with correct offsets', () => {
    const parsed = parsePagination({ page: '3', limit: '15' });
    assert.equal(parsed.page, 3);
    assert.equal(parsed.limit, 15);
    assert.equal(parsed.skip, 30);
    assert.equal(parsed.take, 15);
  });

  it('should constrain pagination limit to maximum 100', () => {
    const parsed = parsePagination({ page: '1', limit: '500' });
    assert.equal(parsed.limit, 100);
  });

  it('should build standardized paginated response structure', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const total = 45;
    const res = buildPaginatedResponse(items, total, 2, 10);

    assert.deepEqual(res.data, items);
    assert.equal(res.pagination.total, 45);
    assert.equal(res.pagination.page, 2);
    assert.equal(res.pagination.limit, 10);
    assert.equal(res.pagination.totalPages, 5);
    assert.equal(res.pagination.hasNextPage, true);
    assert.equal(res.pagination.hasPrevPage, true);
  });

  it('should build Prisma date range filters correctly', () => {
    const range = buildDateRange('2026-08-01', '2026-08-14');
    assert.ok(range);
    assert.ok(range.gte instanceof Date);
    assert.ok(range.lte instanceof Date);
    assert.equal(range.gte.getHours(), 0);
    assert.equal(range.lte.getHours(), 23);
  });

  it('should return undefined when no date range arguments are provided', () => {
    const range = buildDateRange(undefined, undefined);
    assert.equal(range, undefined);
  });

  it('should build 24-hour day range for a given date', () => {
    const dayRange = buildDayRange('2026-08-14');
    assert.ok(dayRange.gte instanceof Date);
    assert.ok(dayRange.lte instanceof Date);
    assert.equal(dayRange.gte.getHours(), 0);
    assert.equal(dayRange.lte.getHours(), 23);
    assert.equal(dayRange.lte.getMinutes(), 59);
    assert.equal(dayRange.lte.getSeconds(), 59);
  });
});
