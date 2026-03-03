// shim.js - Page context shim, geladen als <script src="chrome-extension://...">
// Maakt 'chrome' beschikbaar als alias voor 'browser' in Firefox page context
// In Chrome is 'chrome' al beschikbaar, dit is een no-op
(function() {
  if (typeof chrome === 'undefined' && typeof browser !== 'undefined') {
    window.chrome = browser;
  }
  if (typeof chrome === 'undefined') {
    window.chrome = {
      storage: {
        local: {
          get: function(k, cb) { if (cb) cb({}); return Promise.resolve({}); },
          set: function(v, cb) { if (cb) cb(); return Promise.resolve(); },
          remove: function(k, cb) { if (cb) cb(); return Promise.resolve(); }
        }
      },
      runtime: { getURL: function(p) { return p; } }
    };
  }
})();
