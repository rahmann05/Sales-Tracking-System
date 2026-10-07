import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { getDynamicConfig } from './dynamic-config.service.js';
import { CODE_ENTITIES, CODE_CONFIG_GROUPS, codePolicy, validateCodePolicy, codePeriod, formatCode } from '../../../../../shared/coding.mjs';

export async function getCodePolicy(key) {
  const group = CODE_CONFIG_GROUPS.find(g=>g.groupKey===`CODING_${key}`);
  if (!group) throw new AppError('Jenis kode tidak dikenal',400);
  const values = Object.fromEntries(await Promise.all(group.params.map(async p=>[p.key,await getDynamicConfig(p.key,p.defaultValue)])));
  const policy = codePolicy(key,values); validateCodePolicy(policy); return policy;
}

// Each reservation is a short, atomic PostgreSQL UPSERT, independent of the
// business transaction. Failed business saves may leave gaps but never reuse a
// reserved number. Changing prefix/pattern does not rewind the entity counter.
export async function reserveCodeNumber(key,policy,date) {
  const counterKey = `_CODE_COUNTER:${key}:${policy.reset}:${codePeriod(policy.reset,date)}`;
  const rows = await prisma.$queryRaw`
    INSERT INTO "SystemConfig" ("key","value","updatedAt")
    VALUES (${counterKey}, to_jsonb(${policy.start}::bigint), NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "value" = to_jsonb(GREATEST(("SystemConfig"."value" #>> '{}')::bigint + 1, ${policy.start}::bigint)),
      "updatedAt" = NOW()
    RETURNING ("value" #>> '{}')::text AS "sequence"
  `;
  const sequence = Number(rows[0]?.sequence);
  if (!Number.isSafeInteger(sequence)) throw new AppError('Nomor urut melampaui kapasitas aman',409);
  return sequence;
}

export async function resolveBusinessCode(key,manualValue,{db=prisma,date=new Date(),excludeId,optional=false}={}) {
  const entity = CODE_ENTITIES.find(e=>e.key===key);
  if (!entity) throw new AppError('Jenis kode tidak dikenal',400);
  const policy = await getCodePolicy(key);
  if (policy.mode === 'MANUAL') {
    const code = String(manualValue ?? '').trim();
    if (!code && optional) return null;
    if (!code || code.length > 128 || /[\r\n]/.test(code)) throw new AppError(`${entity.label} wajib diisi manual (maksimal 128 karakter)`,422);
    await assertCodeAvailable(entity,code,db,excludeId);
    return code;
  }
  for (let attempt=0; attempt<1000; attempt++) {
    const code = formatCode(policy,await reserveCodeNumber(key,policy,date),date);
    if (!await codeExists(entity,code,db,excludeId)) return code;
  }
  throw new AppError(`Seri ${entity.label} bertabrakan dengan data lama. Naikkan nomor awal pada pengaturan.`,409);
}

async function codeExists(entity,code,db,excludeId) {
  const where = {[entity.field]:code,...(excludeId?{id:{not:excludeId}}:{})};
  if (await db[entity.model].findFirst({where,select:{id:true}})) return true;
  // NOO customer codes and master outlets share the same namespace.
  if (entity.key === 'OUTLET') return Boolean(await db.customerRegistration.findFirst({where:{customerCode:code,...(excludeId?{id:{not:excludeId}}:{})},select:{id:true}}));
  return false;
}
export async function assertCodeAvailable(entity,code,db=prisma,excludeId) {
  if (await codeExists(entity,code,db,excludeId)) throw new AppError(`${entity.label} "${code}" sudah digunakan`,409);
}

export async function validateCodeUpdate(key,value,id,db=prisma) {
  if (value === undefined) return undefined;
  const entity=CODE_ENTITIES.find(e=>e.key===key);
  const current=await db[entity.model].findUnique({where:{id},select:{[entity.field]:true}});
  if (!current) throw new AppError(`${entity.label} tidak ditemukan`,404);
  if ((value ?? '') === (current[entity.field] ?? '')) return current[entity.field];
  if ((await getCodePolicy(key)).mode !== 'MANUAL') throw new AppError(`Kode ${entity.label} otomatis tidak dapat diubah. Pilih mode MANUAL untuk perubahan kode.`,409);
  return resolveBusinessCode(key,value,{db,excludeId:id,optional:entity.optional});
}
