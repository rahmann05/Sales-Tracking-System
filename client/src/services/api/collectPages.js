export async function collectPages(fetchPage, params = {}) {
  const list = [],
    seen = new Set();
  const started = Date.now();
  for (let page = 1; page <= 200; page++) {
    if (Date.now() - started > 60000) throw new Error('Pengambilan data melebihi batas waktu. Persempit filter lalu coba kembali.');
    const response = await fetchPage({
      ...params,
      page,
      limit: 100
    });
    const body = response.data ?? response;
    const rows = Array.isArray(body) ? body : body.data || body.items || [];
    if (!Array.isArray(rows)) throw new Error('Format daftar dari server tidak valid.');
    const pagination = body.pagination || response.pagination;
    const more = Boolean(pagination?.hasNextPage || pagination?.totalPages > page);
    if (more && (!rows.length || rows.every(row => row.id && seen.has(row.id)))) throw new Error('Pagination server tidak bergerak. Muat ulang atau persempit filter.');
    list.push(...rows);
    rows.forEach(row => {
      if (row.id) seen.add(row.id);
    });
    if (!more) return {
      data: list
    };
  }
  throw new Error('Daftar terlalu besar. Persempit filter sebelum memuat kembali.');
}
