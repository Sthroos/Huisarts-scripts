// Content script - dynamically loads scripts based on config and settings
(function() {
  'use strict';

  console.log('[Promedico Helper] Content script loaded');

  // === STORAGE BRIDGE ===
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== 'promedico-page') return;

    const { requestId, method, args } = event.data;

    function reply(result, error) {
      window.postMessage({
        source: 'promedico-extension',
        requestId,
        result,
        error: error ? error.message || String(error) : undefined
      }, '*');
    }

    try {
      if (method === 'storage.local.get') {
        chrome.storage.local.get(args[0], result => reply(result));
      } else if (method === 'storage.local.set') {
        chrome.storage.local.set(args[0], () => reply(null));
      } else if (method === 'storage.local.remove') {
        chrome.storage.local.remove(args[0], () => reply(null));
      }
    } catch(e) {
      reply(null, e);
    }
  });

  function urlMatches(pattern) {
    const currentUrl = window.location.href;
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    const regex = new RegExp('^' + regexPattern + '$');
    return regex.test(currentUrl);
  }

  // Inject script bestand — MET charset=utf-8 zodat emoji en speciale tekens correct werken
  function injectScriptFile(scriptPath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(scriptPath);
      script.charset = 'utf-8';  // BELANGRIJK: voorkomt kapotte emoji/accenten
      script.onload = () => {
        console.log('[Promedico Helper] Script loaded successfully:', scriptPath);
        resolve();
      };
      script.onerror = (e) => {
        console.error('[Promedico Helper] Failed to load script:', scriptPath, e);
        resolve();
      };
      (document.head || document.documentElement).appendChild(script);
    });
  }

  // Inject GitHub script code via blob URL
  function injectScriptCode(code, name) {
    return new Promise((resolve) => {
      try {
        const blob = new Blob([code], { type: 'application/javascript; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const script = document.createElement('script');
        script.src = url;
        script.charset = 'utf-8';
        script.onload = () => {
          URL.revokeObjectURL(url);
          console.log('[Promedico Helper] GitHub script injected:', name);
          resolve();
        };
        script.onerror = (e) => {
          URL.revokeObjectURL(url);
          console.error('[Promedico Helper] GitHub script inject error:', name, e);
          resolve();
        };
        (document.head || document.documentElement).appendChild(script);
      } catch (error) {
        console.error('[Promedico Helper] Script inject error:', error);
        resolve();
      }
    });
  }

  // Laad eerst de storage bridge, dan pas de andere scripts
  injectScriptFile('storage-bridge-client.js').then(() => {

    Promise.all([
      new Promise(resolve => chrome.runtime.sendMessage({type: 'getSettings'}, resolve)),
      new Promise(resolve => chrome.runtime.sendMessage({type: 'getScriptConfig'}, resolve))
    ]).then(([settings, config]) => {
      console.log('[Promedico Helper] Settings:', settings);
      console.log('[Promedico Helper] Config:', config);
      console.log('[Promedico Helper] Current URL:', window.location.href);

      if (!settings.scriptsEnabled) {
        console.log('[Promedico Helper] Scripts disabled by master toggle');
        return;
      }

      config.scripts.forEach(script => {
        const enabledKey = script.id + 'Enabled';
        const isEnabled = settings[enabledKey] !== undefined ? settings[enabledKey] : script.enabled;

        if (!isEnabled) {
          console.log('[Promedico Helper] Script disabled:', script.name);
          return;
        }

        if (script.urlPatterns && script.urlPatterns.length > 0) {
          const matches = script.urlPatterns.some(pattern => urlMatches(pattern));
          if (!matches) {
            console.log('[Promedico Helper] URL does not match for:', script.name);
            return;
          }
        }

        console.log('[Promedico Helper] Loading script:', script.name);

        if (settings.githubScripts && settings.githubScripts[script.id]) {
          console.log('[Promedico Helper] Using GitHub version of', script.name);
          injectScriptCode(settings.githubScripts[script.id], script.name);
        } else {
          console.log('[Promedico Helper] Loading from file:', script.scriptFile);
          injectScriptFile(script.scriptFile);
        }
      });
    });

  });

})();
