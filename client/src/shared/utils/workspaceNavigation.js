export function saveWorkspaceScroll() {
  const main = document.getElementById('main-content');
  if (main) {
    window.history.replaceState(
      { ...window.history.state, workspaceScroll: { top: main.scrollTop, left: main.scrollLeft } },
      '',
      window.location.href
    );
  }
}

export function pushWorkspaceUrl(url, { replace = false, preserveScroll = false } = {}) {
  saveWorkspaceScroll();
  const prevScroll = window.history.state?.workspaceScroll || { top: 0, left: 0 };
  window.history[replace ? 'replaceState' : 'pushState'](
    { ...window.history.state, workspaceScroll: preserveScroll ? prevScroll : { top: 0, left: 0 } },
    '',
    url
  );
  window.dispatchEvent(new Event('workspace-state-changed'));
}

export function setWorkspaceValues(values, { replace = false, tab } = {}) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value == null || value === '') url.searchParams.delete(key);
    else url.searchParams.set(key, String(value));
  }
  if (tab) url.hash = tab;
  pushWorkspaceUrl(url, { replace, preserveScroll: replace && !tab });
}
