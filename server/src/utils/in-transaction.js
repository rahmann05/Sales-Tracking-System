// Reuse the caller's transaction when a composed operation must commit atomically.
export const inTransaction=(db,work,options)=>typeof db.$transaction==='function'?db.$transaction(work,options):work(db);
