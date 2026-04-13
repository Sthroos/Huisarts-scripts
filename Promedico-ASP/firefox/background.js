// Browser API shim (werkt in Firefox en Chrome)
const _api = typeof browser !== 'undefined' ? browser : chrome;

// In Chrome MV3 (service worker) moet config.js handmatig geladen worden
if (typeof importScripts !== 'undefined') {
  try {
    importScripts(_api.runtime.getURL('config.js'));
    importScripts(_api.runtime.getURL('profiles.js'));
  } catch(e) {
    console.error('[Background] importScripts failed:', e);
  }
}

// Controleer of onboarding gedaan is — zo niet, open onboarding tab
function checkOnboarding() {
  _api.storage.local.get(['onboardingDone']).then(result => {
    if (!result.onboardingDone) {
      _api.tabs.create({ url: _api.runtime.getURL('onboarding.html') });
    }
  });
}

// Initialiseer standaardinstellingen bij installatie
_api.runtime.onInstalled.addListener(() => {
  const defaults = { scriptsEnabled: true };
  if (typeof SCRIPT_CONFIG !== 'undefined') {
    SCRIPT_CONFIG.forEach(script => {
      defaults[script.id + 'Enabled'] = script.enabled;
    });
  }
  _api.storage.local.set(defaults);
  console.log('[Promedico Helper] Installed - version', _api.runtime.getManifest().version);
  checkOnboarding();
});

// Toon DEV badge als extensie lokaal/tijdelijk is geladen of een dev-build is
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
    _api.storage.local.get().then(settings => {
      // Zorg dat activeMenuFile altijd overeenkomt met het actieve profiel.
      // Als het profiel gewijzigd is maar activeMenuFile nog oud is, corrigeer dit.
      if (settings.activeProfile && typeof PROFILES !== 'undefined') {
        const profiel = PROFILES[settings.activeProfile];
        if (profiel && profiel.menuFile && settings.activeMenuFile !== profiel.menuFile) {
          settings.activeMenuFile = profiel.menuFile;
          _api.storage.local.set({ activeMenuFile: profiel.menuFile });
        }
      }
      sendResponse(settings);
    });
    return true;
  }

  if (message.type === 'getScriptConfig') {
    sendResponse({ scripts: typeof SCRIPT_CONFIG !== 'undefined' ? SCRIPT_CONFIG : [] });
    return true;
  }

  // Popup vraagt om onboarding opnieuw te openen (via "Wijzig profiel" knop)
  if (message.type === 'openOnboarding') {
    _api.tabs.create({ url: _api.runtime.getURL('onboarding.html') });
    sendResponse({ ok: true });
    return true;
  }
});
