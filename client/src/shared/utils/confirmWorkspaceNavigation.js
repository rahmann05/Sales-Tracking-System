export function confirmWorkspaceNavigation() {
  return window.dispatchEvent(new Event('app:before-navigate',{cancelable:true}));
}
