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
_api.runtime.onInstalled.addListener((details) => {
  const defaults = { scriptsEnabled: true };
  SCRIPT_CONFIG.forEach(script => {
    defaults[script.id + 'Enabled'] = script.enabled;
  });
  _api.storage.local.set(defaults);
  console.log('[Promedico Helper] Installed - version', _api.runtime.getManifest().version);

  // Open onboarding bij install én update (voor migratie van versies zonder onboarding).
  // Guard op onboardingDone: draait maar één keer, daarna nooit meer.
  if (details.reason === 'install' || details.reason === 'update') {
    _api.storage.local.get('onboardingDone').then(result => {
      if (!result.onboardingDone) {
        _api.tabs.create({ url: _api.runtime.getURL('onboarding.html') });
      }
    });
  }
});

// Toon DEV badge als extensie lokaal/tijdelijk is geladen of een dev-build is
// NB: Firefox AMO voegt update_url niet automatisch toe, vandaar de naamcheck
// - Firefox dev/GitHub: naam bevat '[DEV]' (toegevoegd door build.sh) → DEV badge
// - Chrome/Firefox store: heeft update_url → geen DEV badge
// - Lokaal unpacked: geen update_url → DEV badge
const _manifest = _api.runtime.getManifest();
const _isDev = _manifest.name.includes('[DEV]');
if (_isDev) {
  const _actionApi = _api.action || _api.browserAction;
  if (_actionApi) {
    _actionApi.setBadgeText({ text: 'DEV' });
    _actionApi.setBadgeBackgroundColor({ color: '#cc0000' });
  }
}

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

});