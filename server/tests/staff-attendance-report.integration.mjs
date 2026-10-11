import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {attendanceSummary} from '../src/modules/staff-attendance/attendance-report.service.js';
import {attendanceStatus,attendanceStages,attendanceMap,attendanceAudit} from '../../shared/staff-attendance-report.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='attendance-report-'+randomUUID(),users=[],ids=[];let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const api=async(user,path)=>{
 const token=jwt.sign({id:user.id,tokenVersion:0},config.jwtSecret,{expiresIn:'5m'});
 const response=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/staff-attendance${path}`,{headers:{Authorization:`Bearer ${token}`}});
 return {status:response.status,cache:response.headers.get('cache-control'),body:await response.json()};
};
try{
 const person=async(role,extra={})=>{const user=await prisma.user.create({data:{role,name:tag,email:randomUUID()+'@example.invalid',password:'unused',...extra}});users.push(user.id);return user;};
 const admin=await person('ADMIN'),spv=await person('SUPERVISOR'),other=await person('SUPERVISOR'),warehouse=await person('KEPALA_GUDANG'),sales=await person('SALES',{supervisorId:spv.id});
 const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAIAAAD4YuoOAAAAJ0lEQVR4nGPkT6lgoCVgoqnpDKMWEAFG44AgGA0igmA0iAiCoR9EAPXMAQvV8BzPAAAAAElFTkSuQmCC';
 const row=await prisma.staffActivity.create({data:{userId:sales.id,dateKey:'2026-10-11',activityKey:tag,kind:'SHIFT',checkInAt:new Date('2026-10-11T01:05:00Z'),photoUrl:photo,latitude:-6.88,longitude:107.48,policySnapshot:{values:{SHIFT_ATTENDANCE_MODE:'IN_OUT',SHIFT_START_TIME:'08:00',SHIFT_END_TIME:'17:00'}},checklist:{state:'FINISHED',finishedAt:'2026-10-11T10:00:00Z',finishEvidence:{photoUrl:photo,notes:'Selesai shift',latitude:-6.89,longitude:107.49}},timeCorrection:{accepted:{checkInAt:'2026-10-11T01:00:00Z',checkOutAt:'2026-10-11T10:00:00Z',reason:'Laporan administratif',lateMinutes:0}}}});ids.push(row.id);
 const summarized=attendanceSummary(row);eq(summarized.checkInAt,'2026-10-11T01:05:00.000Z');eq(summarized.photoUrl,null);eq(summarized.checklist.finishEvidence.photoUrl,null);eq(summarized.photoAvailable,true);eq(summarized.finishPhotoAvailable,true);
 const collection=await prisma.staffActivity.create({data:{userId:sales.id,dateKey:row.dateKey,activityKey:tag+'-collection',kind:'COLLECTION_FOLLOW_UP'}});ids.push(collection.id);
 const report=await api(admin,'/report?date=2026-10-11'),record=report.body.data.find(r=>r.id===row.id);eq(report.status,200);eq(record.photoAvailable,true);eq(record.photoUrl,null);eq(record.checkInAt,row.checkInAt.toISOString());eq(report.cache,'private, no-store');
 for(const user of [admin,spv]){const response=await api(user,`/${row.id}/evidence`);eq(response.status,200);eq(response.body.data.photoUrl,photo);eq(response.body.data.checklist.finishEvidence.photoUrl,photo);eq(response.body.data.checkOutAt,null);eq(response.cache,'private, no-store');}
 for(const user of [other,warehouse])eq((await api(user,`/${row.id}/evidence`)).status,404);
 eq(report.body.data.some(r=>r.id===collection.id),false);eq((await api(admin,`/${collection.id}/evidence`)).status,404);
 eq((await api(sales,`/${row.id}/evidence`)).status,403);
 eq((await api(other,'/report?date=2026-10-11')).body.data.some(r=>r.id===row.id),false);
 eq(attendanceStatus(row).includes('tanpa bukti keluar'),true);eq(attendanceStages(row)[1].at,null);eq(attendanceStages(row)[1].photoUrl,photo);
 eq(attendanceMap({latitude:0,longitude:0}),'https://www.google.com/maps/search/?api=1&query=0,0');eq(attendanceMap({latitude:null,longitude:0}),null);
 eq(attendanceStages({...row,kind:'OFF_PJP'}).length,1);
 eq(attendanceAudit({checklist:{salesGreeting:false,_evidence:{salesGreeting:{reason:'Perlu tindak lanjut',photoUrl:photo}}}})[0].reason,'Perlu tindak lanjut');
 eq((await api(admin,'/report?date=bad')).status,400);
 console.log(`PASS: ${checks} attendance report checks: lazy photos, dates, team access, original vs corrected evidence, GPS zero, off-PJP and supervision.`);
}finally{
 await prisma.staffActivity.deleteMany({where:{id:{in:ids}}});await prisma.user.deleteMany({where:{id:{in:users}}});await new Promise(r=>server.close(r));await prisma.$disconnect();
}
