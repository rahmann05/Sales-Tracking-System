const PAGE_LIMIT = 100;
const MAX_PAGES = 200;
const BATCH_CONCURRENCY = 4;

const extractPage = (response) => {
  const body = response.data ?? response;
  const rows = Array.isArray(body) ? body : body.data || body.items || [];
  if (!Array.isArray(rows)) throw new Error('Format daftar dari server tidak valid.');
  const pagination = body.pagination || response.pagination;
  return { rows, pagination };
};

export async function collectPages(fetchPage, params = {}) {
  const list = [],
    seen = new Set();
  const started = Date.now();
  const appendRows = (rows, checkProgress) => {
    if (checkProgress && (!rows.length || rows.every((row) => row.id && seen.has(row.id))))
      throw new Error('Pagination server tidak bergerak. Muat ulang atau persempit filter.');
    list.push(...rows);
    rows.forEach((row) => {
      if (row.id) seen.add(row.id);
    });
  };

  const first = extractPage(await fetchPage({ ...params, page: 1, limit: PAGE_LIMIT }));
  const totalPages = Number.isInteger(first.pagination?.totalPages)
    ? first.pagination.totalPages
    : null;
  const firstMore = Boolean(first.pagination?.hasNextPage || (totalPages && totalPages > 1));
  appendRows(first.rows, firstMore);
  if (!firstMore) return { data: list };

  if (totalPages && totalPages > 1) {
    const cappedPages = Math.min(totalPages, MAX_PAGES);
    for (let start = 2; start <= cappedPages; start += BATCH_CONCURRENCY) {
      if (Date.now() - started > 60000)
        throw new Error('Pengambilan data melebihi batas waktu. Persempit filter lalu coba kembali.');
      const batch = [];
      for (let p = start; p < start + BATCH_CONCURRENCY && p <= cappedPages; p++) batch.push(p);
      const responses = await Promise.all(
        batch.map((page) => fetchPage({ ...params, page, limit: PAGE_LIMIT }))
      );
      for (let i = 0; i < responses.length; i++) {
        const page = batch[i];
        const { rows, pagination } = extractPage(responses[i]);
        const more = Boolean(pagination?.hasNextPage || page < totalPages);
        appendRows(rows, more && page < cappedPages);
      }
    }
    if (totalPages > MAX_PAGES)
      throw new Error('Daftar terlalu besar. Persempit filter sebelum memuat kembali.');
    return { data: list };
  }

  for (let page = 2; page <= MAX_PAGES; page++) {
    if (Date.now() - started > 60000)
      throw new Error('Pengambilan data melebihi batas waktu. Persempit filter lalu coba kembali.');
    const { rows, pagination } = extractPage(
      await fetchPage({ ...params, page, limit: PAGE_LIMIT })
    );
    const more = Boolean(pagination?.hasNextPage || pagination?.totalPages > page);
    appendRows(rows, more);
    if (!more) return { data: list };
  }
  throw new Error('Daftar terlalu besar. Persempit filter sebelum memuat kembali.');
}
