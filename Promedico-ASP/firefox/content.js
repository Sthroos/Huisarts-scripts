// Browser API shim
const _api = typeof browser !== 'undefined' ? browser : chrome;

// Content script - Firefox MV2 versie
(function() {
  'use strict';

  // Deduplicatie guard - voorkomt dubbel laden bij meerdere frames/navigaties
  if (document.documentElement.hasAttribute('data-promedico-loaded')) return;
  document.documentElement.setAttribute('data-promedico-loaded', '1');

  console.log('[Promedico Helper] Content script loaded');

  function urlMatches(pattern) {
    const currentUrl = window.location.href;
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp('^' + regexPattern + '$').test(currentUrl);
  }

  // In Firefox MV2 is inline script.textContent toegestaan vanuit content script context
  function injectPageContextShim(callback) {
    if (document.documentElement.hasAttribute('data-promedico-shim')) { callback(); return; }
    document.documentElement.setAttribute('data-promedico-shim', '1');
    const s = document.createElement('script');
    s.charset = 'utf-8';
    s.textContent = `(function(){
      if(typeof chrome==='undefined'&&typeof browser!=='undefined'){window.chrome=browser;}
      if(typeof chrome==='undefined'){window.chrome={storage:{local:{get:function(k,cb){if(cb)cb({});return Promise.resolve({});},set:function(v,cb){if(cb)cb();return Promise.resolve();},remove:function(k,cb){if(cb)cb();return Promise.resolve();}}},runtime:{getURL:function(p){return p;}}}}
    })();`;
    (document.head || document.documentElement).appendChild(s);
    s.remove();
    callback();
  }

  Promise.all([
    _api.runtime.sendMessage({type: 'getSettings'}),
    _api.runtime.sendMessage({type: 'getScriptConfig'})
  ]).then(([settings, config]) => {
    console.log('[Promedico Helper] Settings:', settings);
    console.log('[Promedico Helper] Current URL:', window.location.href);

    if (!settings.scriptsEnabled) {
      console.log('[Promedico Helper] Scripts disabled by master toggle');
      return;
    }

    injectPageContextShim(() => {
      config.scripts.forEach(script => {
        const enabledKey = script.id + 'Enabled';
        const isEnabled = settings[enabledKey] !== undefined ? settings[enabledKey] : script.enabled;
        if (!isEnabled) { console.log('[Promedico Helper] Script disabled:', script.name); return; }

        if (script.urlPatterns?.length > 0) {
          if (!script.urlPatterns.some(p => urlMatches(p))) {
            console.log('[Promedico Helper] URL does not match for:', script.name);
            return;
          }
        }

        console.log('[Promedico Helper] Loading script:', script.name);

        if (settings.githubScripts?.[script.id]) {
          injectAsBlob(settings.githubScripts[script.id], script.name);
        } else {
          injectAsScriptTag(_api.runtime.getURL(script.scriptFile), script.name);
        }
      });
    });
  }).catch(err => console.error('[Promedico Helper] Failed:', err));

  function injectAsScriptTag(url, name) {
    const s = document.createElement('script');
    s.src = url;
    s.charset = 'utf-8';
    s.onload = function() { console.log('[Promedico Helper] Loaded:', name); this.remove(); };
    s.onerror = function() { console.error('[Promedico Helper] Failed:', name); this.remove(); };
    (document.head || document.documentElement).appendChild(s);
  }

  function injectAsBlob(code, name) {
    try {
      const blob = new Blob([code], {type: 'application/javascript'});
      const url = URL.createObjectURL(blob);
      const s = document.createElement('script');
      s.src = url;
      s.onload = function() { console.log('[Promedico Helper] Loaded (blob):', name); URL.revokeObjectURL(url); this.remove(); };
      s.onerror = function() { console.error('[Promedico Helper] Failed (blob):', name); URL.revokeObjectURL(url); this.remove(); };
      (document.head || document.documentElement).appendChild(s);
    } catch(e) {
      console.error('[Promedico Helper] Blob error:', name, e);
    }
  }

})();
