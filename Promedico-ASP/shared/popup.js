// Browser API shim (werkt in Firefox en Chrome)
const _api = typeof browser !== 'undefined' ? browser : chrome;

// E-mailadres voor de "Mis je iets?" knop
const TIP_EMAIL = 'tips@uwpraktijk.nl'; // ← vervang door jouw adres

// ── Export ────────────────────────────────────────────────────────────────

async function exportSettings() {
  const settings = await _api.storage.local.get();
  const json = JSON.stringify(settings, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'promedico-helper-instellingen.json';
  a.click();
  URL.revokeObjectURL(url);
  showStatus('Instellingen geëxporteerd ✓');
}

// ── Import ────────────────────────────────────────────────────────────────

function triggerImport() {
  document.getElementById('importFileInput').click();
}

async function handleImportFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const settings = JSON.parse(text);
    if (typeof settings !== 'object' || Array.isArray(settings)) {
      throw new Error('Ongeldig formaat');
    }
    await _api.storage.local.set(settings);
    showStatus('Geïmporteerd — Promedico-tabbladen worden herladen…');
    setTimeout(() => {
      reloadPromedicoTabs();
      window.close();
    }, 1200);
  } catch (e) {
    showStatus('Importeren mislukt: controleer het bestand', true);
  }
}

// ── Genereer script-toggles dynamisch vanuit config ───────────────────────

function generateScriptToggles() {
  const container = document.getElementById('scriptsContainer');

  SCRIPT_CONFIG.forEach(script => {
    const toggleRow = document.createElement('div');
    toggleRow.className = 'toggle-row';
    toggleRow.innerHTML = `
      <div>
        <div class="toggle-label">${script.name}</div>
        <div class="script-description">${script.description}</div>
      </div>
      <label class="switch">
        <input type="checkbox" id="${script.id}Toggle" class="script-toggle" data-script-id="${script.id}">
        <span class="slider"></span>
      </label>
    `;
    container.appendChild(toggleRow);
  });
}

// ── Laad opgeslagen instellingen ──────────────────────────────────────────

async function loadSettings() {
  const settings = await _api.storage.local.get();
  const masterEnabled = settings.scriptsEnabled !== undefined ? settings.scriptsEnabled : true;
  document.getElementById('masterToggle').checked = masterEnabled;

  SCRIPT_CONFIG.forEach(script => {
    const toggle = document.getElementById(script.id + 'Toggle');
    if (toggle) {
      const key = script.id + 'Enabled';
      toggle.checked = settings[key] !== undefined ? settings[key] : script.enabled;
    }
  });

  updateScriptTogglesState(masterEnabled);

  // Toon geselecteerde instellingen
  const regioLabel = document.getElementById('regioLabel');
  if (regioLabel) {
    const ids = settings.geselecteerdeInstellingen || [];
    if (ids.length === 0) {
      regioLabel.textContent = 'Geen instellingen geselecteerd';
    } else if (ids.length <= 2) {
      // Zoek namen op uit ZORGDOMEIN_INSTELLINGEN als beschikbaar
      const namen = (typeof ZORGDOMEIN_INSTELLINGEN !== 'undefined')
        ? ids.map(id => {
            const inst = ZORGDOMEIN_INSTELLINGEN.find(i => i.id === id);
            return inst ? inst.naam : id;
          }).join(', ')
        : ids.length + ' instelling(en)';
      regioLabel.textContent = namen;
    } else {
      regioLabel.textContent = ids.length + ' instellingen geselecteerd';
    }
  }
}

// ── Toon versienummer en installatietype ──────────────────────────────────

function displayVersionInfo() {
  const manifest = _api.runtime.getManifest();
  const badge = document.getElementById('versionBadge');
  const info = document.getElementById('installInfo');

  if (!badge || !info) {
    setTimeout(displayVersionInfo, 50);
    return;
  }

  badge.textContent = 'v' + manifest.version;

  const isDev = _api.runtime.getManifest().name.includes('[DEV]');
  if (isDev) {
    badge.textContent += ' [DEV]';
    badge.className = 'version-badge version-debug';
    info.textContent = '⚠ Development / tijdelijke installatie';
  } else {
    badge.className = 'version-badge version-production';
    info.textContent = '✓ Geïnstalleerd via store';
  }
}

function initializePopup() {
  generateScriptToggles();
  loadSettings();
  displayVersionInfo();
  checkMigratie();
  setupEventListeners();
}

// Controleer of migratie naar nieuwe instelling-selectie nodig is
async function checkMigratie() {
  const result = await _api.storage.local.get(['onboardingDone', 'geselecteerdeInstellingenData']);
  if (result.onboardingDone && !result.geselecteerdeInstellingenData) {
    // Oude versie: toon melding in popup met knop naar onboarding
    const bar = document.getElementById('regioBar');
    if (bar) {
      bar.style.background = '#fff3e0';
      bar.style.borderColor = '#ffb74d';
      bar.innerHTML = '<span style="color:#e65100;font-size:12px;">⚠ Update vereist: selecteer je zorginstellingen</span>' +
        '<button id="btnNaarOnboarding" style="font-size:11px;padding:3px 8px;border:1px solid #ffb74d;border-radius:4px;background:#fff;cursor:pointer;color:#e65100;">Nu instellen</button>';
      document.getElementById('btnNaarOnboarding').addEventListener('click', function() {
        _api.tabs.create({ url: _api.runtime.getURL('onboarding.html') });
        window.close();
      });
    }
  }
}

function setupEventListeners() {
  // Wijzig regio (heropent onboarding)
  document.getElementById('btnWisselRegio').addEventListener('click', () => {
    _api.tabs.create({ url: _api.runtime.getURL('onboarding.html') });
    window.close();
  });

  // Master toggle
  document.getElementById('masterToggle').addEventListener('change', function() {
    const enabled = this.checked;
    _api.storage.local.set({ scriptsEnabled: enabled });
    updateScriptTogglesState(enabled);
    showStatus(enabled ? 'Alle scripts ingeschakeld' : 'Alle scripts uitgeschakeld');
    reloadPromedicoTabs();
  });

  // Individuele script-toggles
  document.querySelectorAll('.script-toggle').forEach(toggle => {
    toggle.addEventListener('change', function() {
      const scriptId = this.dataset.scriptId;
      _api.storage.local.set({ [scriptId + 'Enabled']: this.checked });
      showStatus('Instellingen opgeslagen');
      reloadPromedicoTabs();
    });
  });

  // Export
  document.getElementById('btnExport').addEventListener('click', exportSettings);

  // Import
  document.getElementById('btnImport').addEventListener('click', triggerImport);
  document.getElementById('importFileInput').addEventListener('change', function () {
    handleImportFile(this.files[0]);
    this.value = '';
  });

  // Tip sturen
  document.getElementById('btnTip').addEventListener('click', () => {
    const subject = encodeURIComponent('Promedico ASP Helper – ontbrekende instelling');
    const body = encodeURIComponent(
      'Hallo,\n\nIk mis de volgende instelling / zorginstelling in de extensie:\n\n[Beschrijf hier wat ontbreekt]\n\nMet vriendelijke groet,'
    );
    _api.tabs.create({ url: `mailto:${TIP_EMAIL}?subject=${subject}&body=${body}` });
  });
}

function updateScriptTogglesState(masterEnabled) {
  document.querySelectorAll('.script-toggle').forEach(toggle => {
    toggle.disabled = !masterEnabled;
    toggle.parentElement.style.opacity = masterEnabled ? '1' : '0.5';
  });
}

function showStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.classList.add('show');
  status.classList.toggle('error', isError);
  setTimeout(() => status.classList.remove('show'), 3000);
}

function reloadPromedicoTabs() {
  _api.tabs.query({ url: 'https://www.promedico-asp.nl/*' }).then(tabs => {
    tabs.forEach(tab => _api.tabs.reload(tab.id));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}
