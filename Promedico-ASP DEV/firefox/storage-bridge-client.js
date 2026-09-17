// storage-bridge-client.js
// Wordt als eerste script geladen in de page context.
// Emuleert chrome.storage.local via postMessage naar de content script.

(function() {
  'use strict';

  let _requestId = 0;
  const _pending = {};

  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== 'promedico-extension') return;
    const { requestId, result, error } = event.data;
    const pending = _pending[requestId];
    if (!pending) return;
    delete _pending[requestId];
    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  });

  function storageCall(method, ...args) {
    return new Promise((resolve, reject) => {
      const requestId = ++_requestId;
      _pending[requestId] = { resolve, reject };
      window.postMessage({
        source: 'promedico-page',
        requestId,
        method,
        args
      }, '*');
      setTimeout(() => {
        if (_pending[requestId]) {
          delete _pending[requestId];
          reject(new Error('Storage bridge timeout'));
        }
      }, 5000);
    });
  }

  if (typeof window.chrome === 'undefined') window.chrome = {};
  if (typeof window.chrome.storage === 'undefined') window.chrome.storage = {};

  window.chrome.storage.local = {
    get: function(keys, callback) {
      const p = storageCall('storage.local.get', keys);
      if (callback) { p.then(callback).catch(() => callback({})); return; }
      return p;
    },
    set: function(items, callback) {
      const p = storageCall('storage.local.set', items);
      if (callback) { p.then(() => callback()).catch(() => callback()); return; }
      return p;
    },
    remove: function(keys, callback) {
      const p = storageCall('storage.local.remove', keys);
      if (callback) { p.then(() => callback()).catch(() => callback()); return; }
      return p;
    }
  };

  if (typeof window.browser === 'undefined') window.browser = {};
  if (typeof window.browser.storage === 'undefined') {
    window.browser.storage = window.chrome.storage;
  }

  console.log('[Promedico Helper] Storage bridge client geïnstalleerd');
})();
