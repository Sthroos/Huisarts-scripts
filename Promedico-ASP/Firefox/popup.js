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

// Initialize
generateScriptToggles();
loadSettings();

// Master toggle
document.getElementById('masterToggle').addEventListener('change', function() {
  const enabled = this.checked;
  
  browser.storage.local.set({
    scriptsEnabled: enabled
  });
  
  updateScriptTogglesState(enabled);
  showStatus(enabled ? 'All scripts enabled' : 'All scripts disabled');
  
  // Reload all Promedico tabs
  reloadPromedicoTabs();
});

// Individual script toggles - attach dynamically
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
      showStatus(`✓ Found ${result.scriptsFound} script(s) on GitHub`);
      
      // Reload settings to show updated info
      const settings = await browser.storage.local.get();
      updateLastCheckInfo(settings.lastUpdateCheck);
      
      // Reload tabs to use new scripts
      reloadPromedicoTabs();
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
