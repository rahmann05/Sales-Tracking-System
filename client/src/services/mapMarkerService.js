// Adapter keeps map orchestration independent from the marker rendering API.
export function createMapMarker(options) {
  const AdvancedMarker=window.google?.maps?.marker?.AdvancedMarkerElement;
  if(!AdvancedMarker)throw new Error('Library marker Google Maps belum tersedia.');
  let icon=options.icon,label=options.label;
  const marker=new AdvancedMarker({map:options.map,position:options.position,title:options.title || '',zIndex:options.zIndex});
  const listeners=[];
  const render=()=>{
    const content=document.createElement('span');
    content.style.cssText='position:relative;display:inline-flex;align-items:center;justify-content:center;';
    if(icon?.url || typeof icon==='string'){
      const image=document.createElement('img');image.src=typeof icon==='string'?icon:icon.url;image.alt='';
      image.width=icon.scaledSize?.width || 32;image.height=icon.scaledSize?.height || 40;content.appendChild(image);
    }else{
      const size=(icon?.scale || 9)*2;content.style.width=`${size}px`;content.style.height=`${size}px`;content.style.background=icon?.fillColor || '#1d1d1f';content.style.border=`${icon?.strokeWeight || 2}px solid ${icon?.strokeColor || '#fff'}`;content.style.borderRadius='50%';
    }
    if(label){const text=document.createElement('span');text.textContent=typeof label==='string'?label:label.text;text.style.cssText='position:absolute;font-size:11px;font-weight:700;color:white;';if(label.color)text.style.color=label.color;content.appendChild(text);}
    marker.content=content;
    if(icon?.anchor){marker.anchorLeft=`-${icon.anchor.x}px`;marker.anchorTop=`-${icon.anchor.y}px`;}
    else {marker.anchorLeft='-50%';marker.anchorTop=icon?.path!==undefined?'-50%':'-100%';}
  };
  render();
  return {
    setMap:map=>{marker.map=map;},getMap:()=>marker.map || null,
    setPosition:position=>{marker.position=position;},getPosition:()=>marker.position?new window.google.maps.LatLng(marker.position):null,
    setIcon:value=>{icon=value;render();},setLabel:value=>{label=value;render();},setTitle:value=>{marker.title=value || '';},setZIndex:value=>{marker.zIndex=value;},
    addListener:(event,handler)=>{const listener=marker.addListener(event,handler);listeners.push(listener);return listener;},
    clearClickListeners:()=>{listeners.splice(0).forEach(listener=>listener.remove());},
  };
}
