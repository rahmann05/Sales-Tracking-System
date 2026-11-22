import test from 'node:test';
import assert from 'node:assert/strict';
import {
  setWorkspaceValues,
  pushWorkspaceUrl,
} from '../../client/src/shared/utils/workspaceNavigation.js';

test('one document navigation preserves list filters and scroll in its previous history entry', () => {
  const previous = { window: globalThis.window, document: globalThis.document };
  let index = 0,
    events = 0;
  const entries = [
    {
      url: 'https://app.invalid/?attentionPage=2&attentionSearch=toko#attention',
      state: { other: 'preserve' },
    },
  ];
  const pane = { scrollTop: 640, scrollLeft: 0 };
  const history = {
    get state() {
      return entries[index].state;
    },
    replaceState(state, _, url) {
      entries[index] = { state, url: String(new URL(url, entries[index].url)) };
    },
    pushState(state, _, url) {
      entries.splice(++index);
      entries.push({ state, url: String(new URL(url, entries[index - 1].url)) });
    },
  };
  globalThis.window = {
    history,
    get location() {
      return { href: entries[index].url };
    },
    dispatchEvent() {
      events++;
    },
  };
  globalThis.document = { getElementById: () => pane };
  try {
    setWorkspaceValues({ orderDetail: 'order-1', attentionItem: '' }, { tab: 'admin-approval' });
    assert.equal(entries.length, 2, 'selection and tab use one history entry');
    assert.equal(entries[0].state.workspaceScroll.top, 640);
    assert.equal(entries[1].state.workspaceScroll.top, 0);
    assert.equal(entries[1].state.other, 'preserve');
    assert.equal(new URL(entries[1].url).searchParams.get('attentionPage'), '2');
    assert.equal(new URL(entries[1].url).hash, '#admin-approval');
    index--;
    assert.equal(new URL(entries[index].url).searchParams.has('orderDetail'), false);
    assert.equal(entries[index].state.workspaceScroll.top, 640);
    pane.scrollTop = 100;
    setWorkspaceValues({ attentionSearch: 'baru' }, { replace: true });
    assert.equal(entries.length, 2);
    assert.equal(new URL(entries[index].url).searchParams.get('attentionSearch'), 'baru');
    pushWorkspaceUrl('#dashboard');
    assert.equal(new URL(entries[index].url).hash, '#dashboard');
    assert.equal(events, 3);
  } finally {
    globalThis.window = previous.window;
    globalThis.document = previous.document;
  }
});
