// Browser API shim (werkt in Firefox en Chrome)
const _api = typeof browser !== 'undefined' ? browser : chrome;

// In Chrome MV3 (service worker) moet config.js handmatig geladen worden
// In Firefox MV2 gebeurt dit automatisch via de manifest scripts array
if (typeof importScripts !== 'undefined') {
  try {
    importScripts(_api.runtime.getURL('config.js'));
  } catch(e) {
    console.error('[Background] importScripts config.js failed:', e);
  }
}

// Initialize default settings
_api.runtime.onInstalled.addListener(() => {
  // Set defaults for all scripts from config
  const defaults = {
    scriptsEnabled: true,
    lastUpdateCheck: 0,
    githubScripts: {}
  };
  
    _api.management.getSelf().then(info => {
    if (info.installType === 'development') {
      // Show DEBUG badge
      const _actionApi = _api.action || _api.browserAction;
      if (_actionApi) {
        _actionApi.setBadgeText({ text: 'DEV' });
        _actionApi.setBadgeBackgroundColor({ color: '#ff0000' });
      }
    }
    // For production, no badge (or version number)
  });

  SCRIPT_CONFIG.forEach(script => {
    defaults[script.id + 'Enabled'] = script.enabled;
  });
  
  _api.storage.local.set(defaults);
  console.log('[Promedico Helper] Installed - version', _api.runtime.getManifest().version);
  
  // Check for updates immediately
  if (GITHUB_CONFIG.enabled) {
    checkForUpdates();
  }
});

// Listen for messages from content script
_api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getSettings') {
    _api.storage.local.get().then(settings => {
      sendResponse(settings);
    });
    return true; // Keep the message channel open for async response
  }
  
  if (message.type === 'checkUpdates') {
    checkForUpdates().then(result => {
      sendResponse(result);
    });
    return true;
  }
  
  if (message.type === 'getScriptConfig') {
    sendResponse({
      scripts: SCRIPT_CONFIG,
      github: GITHUB_CONFIG
    });
    return true;
  }
});

// GitHub update checker
async function checkForUpdates() {
  if (!GITHUB_CONFIG.enabled) {
    console.log('[GitHub] Auto-updates disabled');
    return { success: false, reason: 'disabled' };
  }
  
  const now = Date.now();
  const settings = await _api.storage.local.get(['lastUpdateCheck', 'githubScripts']);
  
  // Don't check too frequently
  if (now - settings.lastUpdateCheck < GITHUB_CONFIG.checkInterval) {
    console.log('[GitHub] Too soon to check again');
    return { success: false, reason: 'too_soon' };
  }
  
  try {
    console.log('[GitHub] Checking for script updates...');
    
    const baseUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.scriptsPath}`;
    const response = await fetch(baseUrl + `?ref=${GITHUB_CONFIG.branch}`);
    
    if (!response.ok) {
      console.error('[GitHub] Failed to fetch repo contents:', response.status);
      return { success: false, reason: 'fetch_failed', status: response.status };
    }
    
    const files = await response.json();
    const newScripts = { ...(settings.githubScripts || {}) };
    const scriptConfigs = [];
    let updatedCount = 0;
    let unchangedCount = 0;
    
    // Look for .js files and their corresponding .json config files
    for (const file of files) {
      if (file.name.endsWith('.js')) {
        const scriptName = file.name.replace('.js', '');
        const configFile = files.find(f => f.name === scriptName + '.json');
        
        if (configFile) {
          // Fetch the config
          const configResponse = await fetch(configFile.download_url);
          const config = await configResponse.json();
          
          // Fetch the script
          const scriptResponse = await fetch(file.download_url);
          const scriptContent = await scriptResponse.text();
          
          // Check if content actually changed
          const oldScript = settings.githubScripts?.[config.id];
          if (oldScript && oldScript === scriptContent) {
            console.log(`[GitHub] ${config.name} - unchanged`);
            unchangedCount++;
          } else {
            if (oldScript) {
              console.log(`[GitHub] ${config.name} - UPDATED ✓`);
            } else {
              console.log(`[GitHub] ${config.name} - NEW ✓`);
            }
            updatedCount++;
          }
          
          newScripts[config.id] = scriptContent;
          scriptConfigs.push(config);
        }
      }
    }
    
    // Update storage
    await _api.storage.local.set({
      githubScripts: newScripts,
      lastUpdateCheck: now
    });
    
    console.log(`[GitHub] Summary: ${updatedCount} updated, ${unchangedCount} unchanged, ${Object.keys(newScripts).length} total`);
    
    return {
      success: true,
      scriptsFound: Object.keys(newScripts).length,
      updatedCount: updatedCount,
      unchangedCount: unchangedCount,
      configs: scriptConfigs
    };
    
  } catch (error) {
    console.error('[GitHub] Update check failed:', error);
    return { success: false, reason: 'error', error: error.message };
  }
}

// Periodic update checker
if (GITHUB_CONFIG.enabled) {
  // Check on startup
  setTimeout(() => {
    checkForUpdates();
  }, 5000); // Wait 5 seconds after startup
  
  // Then check periodically
  setInterval(() => {
    checkForUpdates();
  }, GITHUB_CONFIG.checkInterval);
}

_api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'injectScript') {
    // Chrome MV3 gebruikt scripting.executeScript, Firefox MV2 gebruikt tabs.executeScript
    const tabId = sender.tab.id;
    if (_api.scripting) {
      // Chrome MV3
      _api.scripting.executeScript({
        target: { tabId },
        files: [message.file]
      }).then(() => {
        console.log('Injected (scripting):', message.file);
      }).catch(err => {
        console.error('Injection failed (scripting):', err);
      });
    } else {
      // Firefox MV2
      _api.tabs.executeScript(tabId, { file: message.file }).then(() => {
        console.log('Injected (tabs):', message.file);
      }).catch(err => {
        console.error('Injection failed (tabs):', err);
      });
    }
    return false;
  }
});