import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const client = fileURLToPath(new URL('../../client/', import.meta.url));
const require = createRequire(new URL('../../client/package.json', import.meta.url));
const esbuild = require('esbuild');
const result = await esbuild.build({
  absWorkingDir: client, bundle: true, platform: 'node', format: 'cjs', write: false,
  stdin: { resolveDir: client, loader: 'js', contents: `
    import assert from 'node:assert/strict';
    import { exportCustomerExcel, exportCustomerNd6Txt, exportCustomerSummaryTxt, exportCustomerCSV, exportImportNikExcel } from './src/utils/customerExport.js';
    const downloads = [];
    let currentBlob;
    globalThis.Blob = class { constructor(parts, options) { this.content = parts.join(''); this.type = options.type; } };
    URL.createObjectURL = blob => { currentBlob = blob; return 'blob:fixture'; };
    URL.revokeObjectURL = () => {};
    globalThis.document = { createElement: () => ({ click() { downloads.push({ name: this.download, ...currentBlob }); } }), body: { appendChild() {}, removeChild() {} } };
    globalThis.alert = message => { throw new Error(message); };
    const data = [{ id: 'fixture', name: 'Toko A & B <Utama>', ownerName: 'Pemilik', address: 'Alamat contoh', createdAt: '2026-10-07T08:00:00Z', visitDays: 'SENIN,RABU', status: 'PENDING' }];
    for (const exportData of [exportCustomerExcel, exportCustomerNd6Txt, exportCustomerSummaryTxt, exportCustomerCSV, exportImportNikExcel]) exportData(data);
    assert.equal(downloads.length, 5);
    assert.ok(downloads.every(file => file.name && file.content.length > 50));
    const workbook = downloads[0].content;
    assert.match(workbook, /IMPORT_ND6_CUSTOMER/);
    assert.match(workbook, /REKAP_REGISTRASI_LENGKAP/);
    assert.match(workbook, /Toko A &amp; B &lt;Utama&gt;/);
    assert.match(workbook, /DocumentStart/);
    assert.match(downloads[1].content, /ND6DATA/);
    assert.match(downloads[3].content, /Toko A & B <Utama>/);
    assert.match(downloads[4].content, /Workbook/);
    console.log('Frontend export verification passed: all 5 formats download, workbook sheets and ND6 metadata remain intact, XML escapes customer values.');
  ` },
});
const module = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);

