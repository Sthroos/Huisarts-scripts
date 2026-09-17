// Browser API shim (werkt in Firefox en Chrome)
const _api = typeof browser !== 'undefined' ? browser : chrome;

// In Chrome MV3 (service worker) moet config.js handmatig geladen worden
if (typeof importScripts !== 'undefined') {
  try {
    importScripts(_api.runtime.getURL('config.js'));
  } catch(e) {
    console.error('[Background] importScripts failed:', e);
  }
}

// Controleer of onboarding gedaan is, of dat migratie nodig is
function checkOnboarding() {
  _api.storage.local.get(['onboardingDone', 'geselecteerdeInstellingenData']).then(result => {
    if (!result.onboardingDone || !result.geselecteerdeInstellingenData) {
      _api.tabs.create({ url: _api.runtime.getURL('onboarding.html') });
    }
  });
}

// Initialiseer standaardinstellingen bij installatie
_api.runtime.onInstalled.addListener((details) => {
  const defaults = { scriptsEnabled: true };
  if (typeof SCRIPT_CONFIG !== 'undefined') {
    SCRIPT_CONFIG.forEach(script => {
      defaults[script.id + 'Enabled'] = script.enabled;
    });
  }

  if (details.reason === 'install') {
    // Eerste installatie: zet alle defaults
    _api.storage.local.set(defaults);
  } else {
    // Update: voeg alleen keys toe die nog niet bestaan (bijv. nieuw script in config)
    _api.storage.local.get(Object.keys(defaults)).then(existing => {
      const toSet = {};
      for (const [key, value] of Object.entries(defaults)) {
        if (existing[key] === undefined) toSet[key] = value;
      }
      if (Object.keys(toSet).length > 0) _api.storage.local.set(toSet);
    });
  }

  checkOnboarding();
});

// DEV badge
const _manifest = _api.runtime.getManifest();
const _isDev = _manifest.name.includes('[DEV]');
if (_isDev) {
  const _actionApi = _api.action || _api.browserAction;
  if (_actionApi) {
    _actionApi.setBadgeText({ text: 'DEV' });
    _actionApi.setBadgeBackgroundColor({ color: '#cc0000' });
  }
}

// Berichtenhandler
_api.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === 'getSettings') {
    _api.storage.local.get().then(settings => {
      // Migratie: zet verouderd activeMenuFile pad bij naar het nieuwe bestand.
      // Gebruikers van versies vóór 2.5 kunnen nog een oud pad in storage hebben.
      if (settings.activeMenuFile && settings.activeMenuFile !== 'zorgdomein-menu-data.js') {
        settings.activeMenuFile = 'zorgdomein-menu-data.js';
        _api.storage.local.set({ activeMenuFile: 'zorgdomein-menu-data.js' });
      }
      sendResponse(settings);
    });
    return true;
  }

  if (message.type === 'getScriptConfig') {
    sendResponse({ scripts: typeof SCRIPT_CONFIG !== 'undefined' ? SCRIPT_CONFIG : [] });
    return true;
  }

  if (message.type === 'openOnboarding') {
    _api.tabs.create({ url: _api.runtime.getURL('onboarding.html') });
    sendResponse({ ok: true });
    return true;
  }

  // Tab sluit: wis patiëntgerelateerde storage keys
  if (message.type === 'promedico_tab_unloading') {
    _api.storage.local.remove([
      'zneller_patient_data',
      'zneller_expires_at',
    ]).catch(() => {});
    // Correspondentie zit in sessionStorage van de tab zelf — die verdwijnt automatisch
    sendResponse({ ok: true });
    return true;
  }
});
