import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReviewFilterId } from '../src/modules/outlets/services/outlet-reviews.service.js';
import { queryString } from '../../client/src/services/api/helpers.js';

describe('Outlet review query filter serialization and normalization', () => {
  it('omits undefined, null, and empty string parameters in client queryString', () => {
    const qs = queryString({
      status: 'ALL',
      stage: 'ALL',
      search: '',
      page: 1,
      issue: 'ALL',
      clusterId: undefined,
      ownerId: null,
      limit: 25,
    });
    const parsed = new URLSearchParams(qs);
    assert.equal(parsed.get('status'), 'ALL');
    assert.equal(parsed.get('stage'), 'ALL');
    assert.equal(parsed.get('page'), '1');
    assert.equal(parsed.get('limit'), '25');
    assert.equal(parsed.has('clusterId'), false);
    assert.equal(parsed.has('ownerId'), false);
    assert.equal(parsed.has('search'), false);
  });

  it('normalizes missing, sentinel, and ALL filter identifiers safely on the server', () => {
    assert.equal(normalizeReviewFilterId(undefined, { allowAll: true }), null);
    assert.equal(normalizeReviewFilterId(null, { allowAll: true }), null);
    assert.equal(normalizeReviewFilterId('', { allowAll: true }), null);
    assert.equal(normalizeReviewFilterId('   ', { allowAll: true }), null);
    assert.equal(normalizeReviewFilterId('undefined', { allowAll: true }), null);
    assert.equal(normalizeReviewFilterId('null', { allowAll: true }), null);
    assert.equal(normalizeReviewFilterId('ALL', { allowAll: true }), null);
    assert.equal(normalizeReviewFilterId('ALL', { allowAll: false }), 'ALL');
    assert.equal(
      normalizeReviewFilterId(' 5fa8fa69-9409-4d10-a8f9-694df3033f9a ', { allowAll: true }),
      '5fa8fa69-9409-4d10-a8f9-694df3033f9a'
    );
  });
});
