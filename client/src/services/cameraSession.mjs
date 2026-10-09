// A permission prompt may resolve after a modal closes or another camera opens.
export function createCameraSession(){
 let revision=0,active=null;
 const release=stream=>stream?.getTracks().forEach(track=>{try{track.stop();}catch{}});
 return {
  stop(){revision++;release(active);active=null;},
  begin(){this.stop();return revision;},
  current(token){return token===revision;},
  accept(token,stream){if(token!==revision){release(stream);return false;}release(active);active=stream;return true;},
 };
}
