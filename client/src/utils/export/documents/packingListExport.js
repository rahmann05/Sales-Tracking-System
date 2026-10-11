import { createDocumentExporters } from '../core/createDocumentExporters';
import { formatCurrency, formatDateId, formatNumber, safeStr } from '../core/formatters';

function buildPackingListBlueprint(data = {}) {
  const plNo = safeStr(data.packingListNumber || data.code, 'PL-DRAFT');
  const dateStr = formatDateId(data.date || data.deliveryDate || data.createdAt || new Date());
  const dateCode = new Date().toISOString().split('T')[0];
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const rawInvoices = Array.isArray(data.invoices) ? data.invoices : [];

  let totalCartons = 0;
  let totalPcs = 0;
  const itemRows = rawItems.map((it, idx) => {
    const cartons = Number(it.cartonQty ?? it.qtyCarton ?? it.cartons ?? 0);
    const pcs = Number(it.pcsQty ?? it.qtyPcs ?? it.pcs ?? 0);
    const total = Number(it.totalQty ?? it.quantity ?? cartons * (it.pcsPerCarton || 1) + pcs);
    totalCartons += cartons;
    totalPcs += pcs;
    return [
      idx + 1,
      safeStr(it.sku || it.productCode || it.code, '-'),
      safeStr(it.productName || it.name, '-'),
      formatNumber(cartons),
      formatNumber(pcs),
      formatNumber(total),
      safeStr(it.unit || it.uom, 'PCS'),
      safeStr(it.batchNo || it.batchNumber, '-'),
      safeStr(it.notes || it.remark, '-'),
    ];
  });

  const sections = [
    {
      title: '1. Daftar Muatan Barang (Rekapitulasi SKU Gudang)',
      headers: [
        'No',
        'Kode SKU',
        'Nama Produk / Barang',
        'Karton',
        'Pcs (Ecer)',
        'Total Qty',
        'Satuan',
        'Batch / Exp',
        'Keterangan',
      ],
      rows: itemRows,
      columnWidths: [5, 13, 28, 9, 9, 10, 8, 9, 9],
      rightAlignCols: [3, 4, 5],
    },
  ];

  if (rawInvoices.length > 0) {
    sections.push({
      title: '2. Daftar Faktur & Tujuan Pengiriman Outlet',
      headers: ['No', 'No. Faktur / SO', 'Nama Toko / Outlet', 'Alamat Tujuan', 'Karton', 'Nilai Faktur (Rp)'],
      rows: rawInvoices.map((inv, idx) => [
        idx + 1,
        safeStr(inv.invoiceNumber || inv.orderCode || inv.code, '-'),
        safeStr(inv.outletName || inv.customerName || inv.outlet?.name, '-'),
        safeStr(inv.address || inv.outlet?.address, '-'),
        formatNumber(inv.totalCartons ?? inv.cartons ?? 0),
        formatCurrency(inv.totalAmount ?? inv.amount ?? 0),
      ]),
      rightAlignCols: [4, 5],
    });
  }

  return {
    domain: 'PACKING',
    filename: `Packing_List_${plNo}_${dateCode}`,
    sheetName: 'PACKING_LIST',
    orientation: 'portrait',
    title: 'PACKING LIST & SURAT JALAN PENGIRIMAN',
    subtitle: 'Dokumen Resmi Gudang, Logistik & Ekspedisi Pengiriman Barang',
    docNumber: plNo,
    metaItems: [
      { label: 'No. Packing List', value: plNo },
      { label: 'Tanggal Pengiriman', value: dateStr },
      {
        label: 'No. Polisi Armada',
        value: safeStr(data.vehicleNumber || data.plateNumber || data.driver?.vehiclePlate),
      },
      { label: 'Nama Supir', value: safeStr(data.driverName || data.driver?.name) },
      { label: 'Asisten / Helper', value: safeStr(data.helperName || data.helper?.name) },
      {
        label: 'Petugas Gudang',
        value: safeStr(data.warehouseStaffName || data.createdBy?.name, 'Kepala Gudang'),
      },
      {
        label: 'Wilayah / Rute',
        value: safeStr(data.routeArea || data.clusterName || data.area, 'Rute Reguler'),
      },
      { label: 'Status Dokumen', value: safeStr(data.status, 'FINAL') },
      { label: 'Total Item SKU', value: `${rawItems.length} SKU` },
      {
        label: 'Total Muatan',
        value: `${formatNumber(data.totalCartons ?? totalCartons)} Karton / ${formatNumber(totalPcs)} Pcs`,
      },
    ],
    sections,
    notes: [
      'Barang telah dihitung dan diperiksa bersama oleh Kepala Gudang dan Supir sebelum armada berangkat.',
      'Klaim selisih atau kerusakan barang wajib dicatat pada Berita Acara Serah Terima saat barang tiba di toko.',
    ],
    signatories: [
      {
        role: 'Disiapkan Oleh,',
        name: safeStr(data.warehouseStaffName, 'Kepala Gudang'),
        title: 'Kepala Gudang',
      },
      {
        role: 'Dibawa Oleh,',
        name: safeStr(data.driverName || data.driver?.name, 'Supir Pengiriman'),
        title: 'Supir / Ekspedisi',
      },
      {
        role: 'Diperiksa Oleh,',
        name: '............................',
        title: 'Petugas Checker',
      },
      {
        role: 'Diterima Oleh,',
        name: '............................',
        title: 'Penerima / Toko',
      },
    ],
  };
}

const exporters = createDocumentExporters(buildPackingListBlueprint);
export const exportPackingListDocx = exporters.exportDocx;
export const exportPackingListExcel = exporters.exportExcel;
export const exportPackingListCsv = exporters.exportCsv;
export const exportPackingListTxt = exporters.exportTxt;
export const exportPackingListPdf = exporters.exportPdf;
export const exportPackingList = exporters.createBoundExporters;
