// Greedy deterministic covering array. Test-only: verify the chosen cases cover every input pair.
export function pairwiseCases(dimensions){
 const keys=Object.keys(dimensions),candidates=keys.reduce((rows,key)=>rows.flatMap(row=>dimensions[key].map(value=>({...row,[key]:value}))),[{}]);
 const pairs=row=>keys.flatMap((key,i)=>keys.slice(i+1).map(other=>JSON.stringify([key,row[key],other,row[other]])));
 const remaining=new Set(candidates.flatMap(pairs)),chosen=[];
 while(remaining.size){
  let best=null,score=-1;
  for(const row of candidates){const covered=pairs(row).filter(pair=>remaining.has(pair));if(covered.length>score){best={row,covered};score=covered.length;}}
  if(!score)throw new Error('Pairwise generation stalled');chosen.push(best.row);best.covered.forEach(pair=>remaining.delete(pair));
 }
 return chosen;
}
export function assertPairwiseCoverage(assert,dimensions,rows){
 const keys=Object.keys(dimensions);
 for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)for(const a of dimensions[keys[i]])for(const b of dimensions[keys[j]])assert.ok(rows.some(row=>row[keys[i]]===a&&row[keys[j]]===b),`Missing pair ${keys[i]}=${a}, ${keys[j]}=${b}`);
}
