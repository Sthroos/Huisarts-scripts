// Browser API shim (werkt in Firefox en Chrome)
const _api = typeof browser !== 'undefined' ? browser : chrome;

// Genereer script-toggles dynamisch vanuit config
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

// Laad opgeslagen instellingen
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
}

// Toon versienummer en installatietype
function displayVersionInfo() {
  const manifest = _api.runtime.getManifest();
  const badge = document.getElementById('versionBadge');
  const info = document.getElementById('installInfo');

  if (!badge || !info) {
    setTimeout(displayVersionInfo, 50);
    return;
  }

  badge.textContent = 'v' + manifest.version;

  _api.management.getSelf().then(ext => {
    const isDev = ext.installType === 'development' || ext.installType === 'temporary';
    if (isDev) {
      badge.textContent += ' [DEV]';
      badge.className = 'version-badge version-debug';
      info.textContent = '⚠ Development / tijdelijke installatie';
    } else {
      badge.className = 'version-badge version-production';
      info.textContent = '✓ Geïnstalleerd via store';
    }
  }).catch(() => {
    badge.className = 'version-badge version-production';
    info.textContent = 'v' + manifest.version;
  });
}

function initializePopup() {
  generateScriptToggles();
  loadSettings();
  displayVersionInfo();
  setupEventListeners();
}

function setupEventListeners() {
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
