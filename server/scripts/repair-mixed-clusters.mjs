import 'dotenv/config';
import {prisma} from '../src/config/prisma.js';
import {invalidateClusterCache} from '../src/modules/clusters/services/clusters.helpers.js';
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname))throw new Error('Perbaikan otomatis ini hanya untuk database lokal.');
try{
 const changed=await prisma.$transaction(async tx=>{
  const clusters=await tx.cluster.findMany({where:{deletedAt:null},include:{outlets:{where:{deletedAt:null},select:{id:true,type:true}}}});
  const result=[];
  for(const cluster of clusters){
   if(new Set(cluster.outlets.map(outlet=>outlet.type)).size<2)continue;
   const modern=cluster.outlets.filter(outlet=>outlet.type==='MODERN_TRADE');
   const target=await tx.cluster.create({data:{name:cluster.name==='Belum Ditugaskan'?cluster.name:cluster.name+' · Modern Trade',region:cluster.region,colorHex:cluster.colorHex,centerLat:cluster.centerLat,centerLng:cluster.centerLng,supervisorId:cluster.supervisorId,assignedSalesId:cluster.assignedSalesId,outletCount:modern.length}});
   await tx.outlet.updateMany({where:{id:{in:modern.map(outlet=>outlet.id)}},data:{clusterId:target.id}});
   await tx.cluster.update({where:{id:cluster.id},data:{outletCount:cluster.outlets.length-modern.length}});
   await tx.clusterRoute.deleteMany({where:{clusterId:cluster.id}});
   result.push({name:cluster.name,generalTrade:cluster.outlets.length-modern.length,modernTrade:modern.length});
  }
  return result;
 },{timeout:30000});
 invalidateClusterCache();console.log(JSON.stringify({splitClusters:changed}));
}finally{await prisma.$disconnect();}
