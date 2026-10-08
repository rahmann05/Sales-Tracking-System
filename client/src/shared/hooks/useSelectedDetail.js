import {useEffect,useRef} from 'react';
export function useSelectedDetail(id,scrollToDetail=false){
  const ref=useRef(null);
  useEffect(()=>{if(id&&ref.current){ref.current.focus({preventScroll:true});if(scrollToDetail||window.matchMedia('(max-width:1199px)').matches)ref.current.scrollIntoView({block:'start'});}},[id,scrollToDetail]);
  return ref;
}
