// Browser API shim
const _api = typeof browser !== 'undefined' ? browser : chrome;

// Content script - Chrome MV3 versie
// Chrome verbiedt: inline scripts in page context, blob URLs van externe pagina's
// Oplossing: shim als apart extensiebestand laden via chrome-extension:// URL
(function() {
  'use strict';

  // Deduplicatie guard
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

  // Injecteer shim als extensiebestand - enige CSP-conforme methode in Chrome MV3
  function injectPageContextShim(callback) {
    if (document.documentElement.hasAttribute('data-promedico-shim')) { callback(); return; }
    document.documentElement.setAttribute('data-promedico-shim', '1');
    const s = document.createElement('script');
    s.charset = 'utf-8';
    s.src = _api.runtime.getURL('shim.js');
    s.onload = function() { this.remove(); callback(); };
    s.onerror = function() { this.remove(); callback(); };
    (document.head || document.documentElement).appendChild(s);
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
          // GitHub scripts: via background (blob URLs geblokkeerd door pagina CSP in Chrome)
          _api.runtime.sendMessage({
            type: 'executeScriptCode',
            code: settings.githubScripts[script.id]
          });
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

})();
