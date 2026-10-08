export function unitDefinitionError(value) {
 if(typeof value.unit!=='string'||!value.unit.trim()||value.unit.trim().length>32)return 'Satuan jual wajib diisi, maksimal 32 karakter';
 if(typeof value.baseUnit!=='string'||!value.baseUnit.trim()||value.baseUnit.trim().length>32)return 'Satuan dasar wajib diisi, maksimal 32 karakter';
 if(!Number.isSafeInteger(value.unitsPerUnit)||value.unitsPerUnit<1||value.unitsPerUnit>1000000)return 'Isi kemasan harus bilangan bulat positif, maksimal 1.000.000';
 if(value.unit.trim().toLowerCase()===value.baseUnit.trim().toLowerCase()&&value.unitsPerUnit!==1)return 'Satuan jual dan dasar yang sama harus memiliki isi 1';
 return null;
}
export function unitSnapshot(product) {
 return {unit:product.unit||'unit',baseUnit:product.baseUnit||null,unitsPerUnit:product.unitsPerUnit||null};
}
export function unitDescription(value) {
 if(!value?.baseUnit||!value?.unitsPerUnit)return !value?.unit||value.unit==='unit'?'unit (satuan belum terverifikasi)':`${value.unit} (isi kemasan belum ditetapkan)`;
 return value.unit===value.baseUnit?value.unit:`${value.unit} (${value.unitsPerUnit} ${value.baseUnit})`;
}
