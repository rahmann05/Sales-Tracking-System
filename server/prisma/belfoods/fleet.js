// Transcribed from the user's historical "DATA DRIVER & HELPER DIVISI MIX".
// No generated photos, account assignments, odometer or measured capacity.
const granMaxReference={label:'Referensi Gran Max Pick Up, bukan hasil pengukuran unit ini',payloadKg:1000,url:'https://www.astra-daihatsu.id/berita-dan-tips/gran-max-jadi-mobil-andalan-pengusaha-umkm'};
const carryReference={label:'Referensi New Carry Pick Up standar; varian/tahun dan box thermo unit ini belum diketahui',payloadKg:1000,url:'https://auto.suzuki.co.id/cars/new-carry'};
export const BELFOODS_FLEET=[
 ['GRAN_MAX','D 8012 ZC','ANDRI','DIDIN','PADALARANG & CIPEUNDEUY'],
 ['GRAN_MAX','D 8013 ZC','AANG','RIDWAN','CIMAHI & CIMINDI'],
 ['GRAN_MAX','D 8836 YH','ARUL',null,'CABANG HAVANA'],
 ['GRAN_MAX','D 8626 FX','AGUS','TIAR','CIMAHI & LEMBANG'],
 ['GRAN_MAX','D 8428 ZZ','YUDI','ANGGA','BATUJAJAR & CILILIN'],
 ['CARRY_THERMO','D 8032 FS','RENDI','ZULFIKAR','BANDUNG TIMUR'],
 ['CARRY_THERMO','D 8726 FP','RIDWANTO','ROHIMAT','BANDUNG SELATAN'],
 ['ENGKLE_THERMO','D 8566 FK','P OKI','ARIF','BANDUNG KOTA'],
 ['ENGKLE','D 8567 FK','YANA',null,'CABANG HAVANA'],
 ['ENGKLE','D 8042 UC','ABDUL','RAHMAT','BORMA CIMAHI & KBB'],
 ['ENGKLE','D 8849 FA',null,null,'KAB BANDUNG BARAT'],
].map(([category,plate,driver,helper,region])=>({category,plate,driver,helper,region}));
export async function seedHistoricalFleet(db){
 let created=0;
 for(const row of BELFOODS_FLEET){
  const existing=await db.vehicle.findFirst({where:{code:row.plate}});
  if(existing)continue; // Never overwrite operational edits or existing vehicle IDs.
  await db.vehicle.create({data:{code:row.plate,name:`${row.category.replaceAll('_',' ')} · ${row.plate}`,maxCartons:0,maxWeightKg:0,fuelKmPerLiter:0,fuelPricePerLiter:0,fuelType:'BELUM_DIVERIFIKASI',isActive:true,condition:'AVAILABLE',capacityProfile:{status:'UNVERIFIED',category:row.category,source:'USER_HISTORICAL_DRIVER_HELPER_MIX',sourceDate:null,importedAt:new Date().toISOString(),historicalAssignment:{driver:row.driver,helper:row.helper,region:row.region},manufacturerReference:row.category==='GRAN_MAX'?granMaxReference:row.category==='CARRY_THERMO'?carryReference:null,notes:'Patokan operasional karton/berat belum diukur. Jenis engkle belum menentukan merek, model atau JBB. Box/thermo dan personel memengaruhi kapasitas efektif. Nama driver/helper adalah data lampau, bukan penugasan akun saat ini.'}}});created++;
 }
 return {created,total:BELFOODS_FLEET.length};
}
