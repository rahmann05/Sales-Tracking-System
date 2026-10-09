import { createHash } from 'node:crypto';
import { wibDateKey } from '../../../shared/visit-metrics.mjs';
export const seedId = key => {
  const hex = createHash('sha256').update(`sinar-demo-v2:${key}`).digest('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
};
export const ensure = (db, model, key, data) => db[model].upsert({where:{id:seedId(key)},update:{},create:{id:seedId(key),...data}});
export const seedDate = () => {
  const key = process.env.SEED_DATE || wibDateKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || new Date(`${key}T00:00:00Z`).toISOString().slice(0,10) !== key) throw new Error('SEED_DATE harus YYYY-MM-DD valid');
  return key;
};
export const at = (dateKey, time='08:00') => new Date(`${dateKey}T${time}:00+07:00`);
export const offsetDate = (key, days) => new Date(new Date(`${key}T12:00:00Z`).getTime()+days*86400000).toISOString().slice(0,10);
export function assertDemoDatabase() {
  if (process.env.ALLOW_EXTERNAL_SEED === 'true' || process.env.ALLOW_PRODUCTION_SEED === 'true') return;
  const host = new URL(process.env.DATABASE_URL).hostname;
  if (!['localhost','127.0.0.1','[::1]'].includes(host)) throw new Error('Seed demo hanya diizinkan pada database lokal; tidak mengisi database eksternal dengan data contoh.');
}
