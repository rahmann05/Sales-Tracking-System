export const preparationStages=values=>['PICK','CHECK','LOAD'].filter(stage=>values?.[`WAREHOUSE_REQUIRE_${stage}`]!==false);
export function preparationReady(route,values=route.policySnapshot?.values){
 return preparationStages(values).every(stage=>Boolean(route.preparation?.[stage]));
}
