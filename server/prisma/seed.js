import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
import {assertDemoDatabase,seedDate} from './seeds/context.js';
import {seedBelfoods} from './belfoods/seed.js';
const prisma=new PrismaClient();
try{
 assertDemoDatabase();
 const previous=await prisma.systemConfig.findUnique({where:{key:'BELFOODS_UAT_SEED'}});
 const date=process.env.SEED_DATE||previous?.value?.date||seedDate();
 if(previous?.value?.date&&previous.value.date!==date)throw new Error('Seed ini memakai tanggal uji stabil. Gunakan reset bercadangan untuk mengganti tanggal, bukan menggandakan dataset.');
 process.env.SEED_DATE=date;seedDate();
 if(!previous&&await prisma.user.count())throw new Error('Database masih berisi data lama. Gunakan prisma:seed:reset dengan target database eksplisit dan cadangan otomatis.');
 console.log(JSON.stringify(await prisma.$transaction(db=>seedBelfoods(db,date),{timeout:120000,maxWait:10000})));
 console.log('Seed Belfoods siap. Eksekusi ulang mempertahankan sandi, konfigurasi, keputusan dan data yang diedit pengguna.');
}catch(error){console.error(error.message);process.exitCode=1;}finally{await prisma.$disconnect();}
