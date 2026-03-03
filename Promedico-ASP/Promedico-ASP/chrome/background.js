// Background service worker for Chrome Manifest V3
// config.js wordt geladen via importScripts
importScripts('config.js');

// Initialize default settings
chrome.runtime.onInstalled.addListener(() => {
  const defaults = {
    scriptsEnabled: true,
    lastUpdateCheck: 0,
    githubScripts: {}
  };

  chrome.management.getSelf(info => {
    if (info.installType === 'development') {
      chrome.action.setBadgeText({ text: 'DEV' });
      chrome.action.setBadgeBackgroundColor({ color: '#ff0000' });
    }
  });

  SCRIPT_CONFIG.forEach(script => {
    defaults[script.id + 'Enabled'] = script.enabled;
  });

  chrome.storage.local.set(defaults);
  console.log('[Promedico Helper] Installed - version', chrome.runtime.getManifest().version);

  if (GITHUB_CONFIG.enabled) {
    checkForUpdates();
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getSettings') {
    chrome.storage.local.get(null, settings => {
      sendResponse(settings);
    });
    return true;
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

  if (message.type === 'injectScript') {
    // MV3: gebruik chrome.scripting.executeScript
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id, allFrames: true },
      files: [message.file]
    }).then(() => {
      console.log('Injected:', message.file);
    }).catch(err => {
      console.error('Injection failed:', err);
    });
    return false;
  }
});

// GitHub update checker
async function checkForUpdates() {
  if (!GITHUB_CONFIG.enabled) {
    console.log('[GitHub] Auto-updates disabled');
    return { success: false, reason: 'disabled' };
  }

  const now = Date.now();
  const settings = await chrome.storage.local.get(['lastUpdateCheck', 'githubScripts']);

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

    for (const file of files) {
      if (file.name.endsWith('.js')) {
        const scriptName = file.name.replace('.js', '');
        const configFile = files.find(f => f.name === scriptName + '.json');

        if (configFile) {
          const configResponse = await fetch(configFile.download_url);
          const config = await configResponse.json();

          const scriptResponse = await fetch(file.download_url);
          const scriptContent = await scriptResponse.text();

          const oldScript = settings.githubScripts?.[config.id];
          if (oldScript && oldScript === scriptContent) {
            console.log(`[GitHub] ${config.name} - unchanged`);
            unchangedCount++;
          } else {
            console.log(`[GitHub] ${config.name} - ${oldScript ? 'UPDATED' : 'NEW'} ✓`);
            updatedCount++;
          }

          newScripts[config.id] = scriptContent;
          scriptConfigs.push(config);
        }
      }
    }

    await chrome.storage.local.set({
      githubScripts: newScripts,
      lastUpdateCheck: now
    });

    console.log(`[GitHub] Summary: ${updatedCount} updated, ${unchangedCount} unchanged, ${Object.keys(newScripts).length} total`);

    return {
      success: true,
      scriptsFound: Object.keys(newScripts).length,
      updatedCount,
      unchangedCount,
      configs: scriptConfigs
    };

  } catch (error) {
    console.error('[GitHub] Update check failed:', error);
    return { success: false, reason: 'error', error: error.message };
  }
}

// Periodic update checker
if (GITHUB_CONFIG.enabled) {
  setTimeout(() => checkForUpdates(), 5000);
  setInterval(() => checkForUpdates(), GITHUB_CONFIG.checkInterval);
}
