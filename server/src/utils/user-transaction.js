import {prisma} from '../config/prisma.js';
export const withUserTransaction=(userId,work)=>prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`staff:${userId}`}))`;
  return work(tx);
},{timeout:15000});
