export const MASTER_IMPORT_FIELDS={products:{sku:'SKU',code:'Kode tambahan (opsional)',name:'Nama produk',unit:'Satuan jual',baseUnit:'Satuan dasar',unitsPerUnit:'Isi per satuan',price:'Harga'},vehicles:{code:'Kode kendaraan',name:'Nama kendaraan',maxCartons:'Kapasitas karton (opsional)',maxWeightKg:'Kapasitas kg',fuelKmPerLiter:'Konsumsi km/liter',fuelType:'Jenis BBM',fuelPricePerLiter:'Harga BBM/liter (opsional)'}};
const numeric=new Set(['unitsPerUnit','price','maxCartons','maxWeightKg','fuelKmPerLiter','fuelPricePerLiter']);
export function mapMasterImport(kind,headers,records,mapping,action='UPSERT'){
 const fields=Object.keys(MASTER_IMPORT_FIELDS[kind]||{});if(!fields.length)throw new Error('Jenis impor tidak valid.');
 const selected=fields.map(k=>mapping[k]).filter(Boolean);if(new Set(selected).size!==selected.length)throw new Error('Satu kolom tidak boleh digunakan untuk dua field.');
 return records.map((row,index)=>({action,data:Object.fromEntries(fields.flatMap(key=>{const column=mapping[key];if(!column)return [];const position=headers.indexOf(column);if(position<0)throw new Error('Kolom sumber tidak ditemukan.');const raw=(row[position]||'').trim();if(!raw)return [];if(numeric.has(key)&&!Number.isFinite(Number(raw)))throw new Error(`Baris ${index+2}: ${key} harus berupa angka.`);return [[key,numeric.has(key)?Number(raw):raw]];}))}));
}
