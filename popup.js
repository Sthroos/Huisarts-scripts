// Dynamically build the popup UI from config

// Generate script toggles from config
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

// Load current settings
async function loadSettings() {
  const settings = await browser.storage.local.get();
  
  document.getElementById('masterToggle').checked = settings.scriptsEnabled || false;
  
  SCRIPT_CONFIG.forEach(script => {
    const toggle = document.getElementById(script.id + 'Toggle');
    if (toggle) {
      const enabledKey = script.id + 'Enabled';
      toggle.checked = settings[enabledKey] !== undefined ? settings[enabledKey] : script.enabled;
    }
  });
  
  updateScriptTogglesState(settings.scriptsEnabled || false);
  updateLastCheckInfo(settings.lastUpdateCheck);
}

// Update last check info
function updateLastCheckInfo(timestamp) {
  const info = document.getElementById('updateInfo');
  if (!timestamp || !GITHUB_CONFIG.enabled) {
    info.textContent = GITHUB_CONFIG.enabled ? 'Never checked' : 'Auto-updates disabled';
    return;
  }
  
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (minutes < 1) {
    info.textContent = 'Last checked: just now';
  } else if (minutes < 60) {
    info.textContent = `Last checked: ${minutes} min ago`;
  } else {
    info.textContent = `Last checked: ${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
}

// Display version info
function displayVersionInfo() {
  const manifest = browser.runtime.getManifest();
  const badge = document.getElementById('versionBadge');
  const info = document.getElementById('installInfo');
  
  if (!badge || !info) {
    console.error('[Version] Elements not found!');
    // Try again after a short delay
    setTimeout(displayVersionInfo, 50);
    return;
  }
  
  console.log('[Version] Setting version:', manifest.version);
  badge.textContent = 'v' + manifest.version;
  
  browser.management.getSelf().then(ext => {
    if (ext.installType === 'development') {
      badge.textContent += ' DEBUG';
      badge.className = 'version-badge version-debug';
      info.textContent = 'Development Mode';
    } else {
      badge.className = 'version-badge version-production';
      info.textContent = 'Installed from AMO';
    }
  }).catch(err => {
    badge.className = 'version-badge version-production';
    info.textContent = 'Version ' + manifest.version;
  });
}

// Initialize everything when DOM is ready
function initializePopup() {
  console.log('[Popup] Initializing...');
  
  // Generate UI
  generateScriptToggles();
  loadSettings();
  displayVersionInfo();
  
  // Setup event listeners
  setupEventListeners();
  
  console.log('[Popup] Initialized!');
}

function setupEventListeners() {
  // Master toggle
  document.getElementById('masterToggle').addEventListener('change', function() {
    const enabled = this.checked;
    
    browser.storage.local.set({
      scriptsEnabled: enabled
    });
    
    updateScriptTogglesState(enabled);
    showStatus(enabled ? 'All scripts enabled' : 'All scripts disabled');
    reloadPromedicoTabs();
  });

  // Individual script toggles
  document.querySelectorAll('.script-toggle').forEach(toggle => {
    toggle.addEventListener('change', function() {
      const scriptId = this.dataset.scriptId;
      const enabledKey = scriptId + 'Enabled';
      
      browser.storage.local.set({
        [enabledKey]: this.checked
      });
      
      showStatus('Settings saved');
      reloadPromedicoTabs();
    });
  });

  // Update button
  document.getElementById('updateBtn').addEventListener('click', async function() {
    if (!GITHUB_CONFIG.enabled) {
      showStatus('Auto-updates are disabled in config', true);
      return;
    }
    
    const btn = this;
    btn.disabled = true;
    btn.textContent = '🔄 Checking...';
    
    try {
      const result = await browser.runtime.sendMessage({type: 'checkUpdates'});
      
      if (result.success) {
        if (result.updatedCount > 0) {
          showStatus(`✓ Updated ${result.updatedCount} script(s), ${result.unchangedCount} unchanged`);
        } else {
          showStatus(`✓ All ${result.unchangedCount} scripts are up to date`);
        }
        
        const settings = await browser.storage.local.get();
        updateLastCheckInfo(settings.lastUpdateCheck);
        
        if (result.updatedCount > 0) {
          reloadPromedicoTabs();
        }
      } else {
        let message = 'Update check failed';
        if (result.reason === 'disabled') message = 'Auto-updates disabled';
        if (result.reason === 'too_soon') message = 'Checked recently, try again later';
        showStatus(message, true);
      }
    } catch (error) {
      showStatus('Error checking for updates', true);
      console.error('Update error:', error);
    } finally {
      btn.disabled = false;
      btn.textContent = '🔄 Check for Updates';
    }
  });
}

function updateScriptTogglesState(masterEnabled) {
  const scriptToggles = document.querySelectorAll('.script-toggle');
  scriptToggles.forEach(toggle => {
    toggle.disabled = !masterEnabled;
    toggle.parentElement.style.opacity = masterEnabled ? '1' : '0.5';
  });
}

function showStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.classList.add('show');
  if (isError) {
    status.classList.add('error');
  } else {
    status.classList.remove('error');
  }
  
  setTimeout(() => {
    status.classList.remove('show');
  }, 3000);
}

function reloadPromedicoTabs() {
  browser.tabs.query({url: "https://www.promedico-asp.nl/*"}).then(tabs => {
    tabs.forEach(tab => {
      browser.tabs.reload(tab.id);
    });
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}