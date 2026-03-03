// Browser API shim (werkt in Firefox en Chrome)
const _api = typeof browser !== 'undefined' ? browser : chrome;

// In Chrome MV3 (service worker) moet config.js handmatig geladen worden
if (typeof importScripts !== 'undefined') {
  try {
    importScripts(_api.runtime.getURL('config.js'));
  } catch(e) {
    console.error('[Background] importScripts config.js failed:', e);
  }
}

// Initialiseer standaardinstellingen bij installatie
_api.runtime.onInstalled.addListener(() => {
  const defaults = { scriptsEnabled: true };
  SCRIPT_CONFIG.forEach(script => {
    defaults[script.id + 'Enabled'] = script.enabled;
  });
  _api.storage.local.set(defaults);
  console.log('[Promedico Helper] Installed - version', _api.runtime.getManifest().version);
});

// Toon DEV badge in ontwikkelaarsmodus of tijdelijke installatie
_api.management.getSelf().then(info => {
  const isDev = info.installType === 'development' || info.installType === 'temporary';
  if (isDev) {
    const _actionApi = _api.action || _api.browserAction;
    if (_actionApi) {
      _actionApi.setBadgeText({ text: 'DEV' });
      _actionApi.setBadgeBackgroundColor({ color: '#cc0000' });
    }
  }
});

// Berichtenhandler voor content scripts en popup
_api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getSettings') {
    _api.storage.local.get().then(settings => sendResponse(settings));
    return true;
  }

  if (message.type === 'getScriptConfig') {
    sendResponse({ scripts: SCRIPT_CONFIG });
    return true;
  }

  if (message.type === 'injectScript') {
    const tabId = sender.tab.id;
    if (_api.scripting) {
      _api.scripting.executeScript({
        target: { tabId },
        files: [message.file]
      }).catch(err => console.error('Injection failed:', err));
    } else {
      _api.tabs.executeScript(tabId, { file: message.file })
        .catch(err => console.error('Injection failed:', err));
    }
    return false;
  }
});
