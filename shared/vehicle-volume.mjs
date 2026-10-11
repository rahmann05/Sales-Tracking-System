// Litres measure volume, not weight. A carton conversion is a declared estimate.
export function vehicleVolume(cartons,profile={}){
 const ratio=Number.isFinite(profile.litersPerCarton)&&profile.litersPerCarton>0?profile.litersPerCarton:null;
 const independent=profile.independentVolume===true;
 const liters=independent?(Number.isFinite(profile.maxVolumeLiters)&&profile.maxVolumeLiters>0?profile.maxVolumeLiters:null):ratio&&cartons>0?Math.round(cartons*ratio*1000)/1000:null;
 return {liters,ratio,independent};
}
