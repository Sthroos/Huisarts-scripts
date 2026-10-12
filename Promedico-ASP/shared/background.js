// Browser API shim (werkt in Firefox en Chrome)
const _api = typeof browser !== 'undefined' ? browser : chrome;

const DEBUG = false;
function dbgErr(...args) { if (DEBUG) console.error(...args); }

// In Chrome MV3 (service worker) moet config.js handmatig geladen worden
if (typeof importScripts !== 'undefined') {
  try {
    importScripts(_api.runtime.getURL('config.js'));
  } catch(e) {
    dbgErr('[Background] importScripts failed:', e);
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
    _api.storage.local.set(defaults);
  } else {
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

// ── Klik-om-te-bellen via TeleQ ──────────────────────────────────────────────
const TELEQ_URL_PATTERN = 'https://www5.teleqone.com/*';
const TELEQ_START_URL = 'https://www5.teleqone.com/teleq/start/index.zul';

// Onthoudt het tabId van de TeleQ-tab i.p.v. steeds op URL te zoeken — die tab kan
// tijdelijk op een ander domein staan (SSO-login via login-nl.aurorateleq.com),
// en zou anders niet herkend worden, met een ongewenste tweede tab als gevolg
// (TeleQ staat maar één verbonden tabblad tegelijk toe).
async function vindOfOpenTeleqTab() {
  const { teleqTabId } = await _api.storage.local.get('teleqTabId');
  if (teleqTabId) {
    try {
      return await _api.tabs.get(teleqTabId); // bestaat nog, ongeacht huidige URL
    } catch (e) {
      // Tab bestaat niet meer — verder zoeken/aanmaken
    }
  }

  const [gevondenTab] = await _api.tabs.query({ url: TELEQ_URL_PATTERN });
  if (gevondenTab) {
    await _api.storage.local.set({ teleqTabId: gevondenTab.id });
    return gevondenTab;
  }

  const nieuweTab = await _api.tabs.create({ url: TELEQ_START_URL });
  await _api.storage.local.set({ teleqTabId: nieuweTab.id });
  return nieuweTab;
}

async function belNummer(nummer) {
  if (!nummer || typeof nummer !== 'string') {
    throw new Error('Geen geldig telefoonnummer meegegeven');
  }

  // In storage zetten vóórdat de tab wordt geopend/geactiveerd: zo pakt het
  // content script het verzoek altijd op bij het laden — ook na een
  // SSO-loginredirect die de pagina (en dus elke actieve scriptinstantie) ververst.
  await _api.storage.local.set({ teleqPendingNummer: nummer, teleqPendingSinds: Date.now() });

  const tab = await vindOfOpenTeleqTab();

  await _api.tabs.update(tab.id, { active: true });
  const win = await _api.windows.get(tab.windowId);
  if (!win.focused) await _api.windows.update(tab.windowId, { focused: true });

  return { ok: true };
}

// Berichtenhandler
_api.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === 'getSettings') {
    _api.storage.local.get().then(settings => {
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

  if (message.type === 'belNummer') {
    belNummer(message.nummer).then(sendResponse).catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === 'promedico_tab_unloading') {
    _api.storage.local.remove([
      'zneller_patient_data',
      'zneller_expires_at',
    ]).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }
});
