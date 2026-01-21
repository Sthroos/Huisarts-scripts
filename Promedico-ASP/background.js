// Background script with GitHub auto-update support

// Import config
importScripts('config.js');

// Initialize default settings
browser.runtime.onInstalled.addListener(() => {
  // Set defaults for all scripts from config
  const defaults = {
    scriptsEnabled: true,
    lastUpdateCheck: 0,
    githubScripts: {} // Store downloaded scripts from GitHub
  };
  
  SCRIPT_CONFIG.forEach(script => {
    defaults[script.id + 'Enabled'] = script.enabled;
  });
  
  browser.storage.local.set(defaults);
  console.log('Promedico ASP Helper installed');
  
  // Check for updates immediately
  if (GITHUB_CONFIG.enabled) {
    checkForUpdates();
  }
});

// Listen for messages from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getSettings') {
    browser.storage.local.get().then(settings => {
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
  const settings = await browser.storage.local.get(['lastUpdateCheck']);
  
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
    const newScripts = {};
    const scriptConfigs = [];
    
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
          
          newScripts[config.id] = scriptContent;
          scriptConfigs.push(config);
          
          console.log('[GitHub] Found script:', config.name);
        }
      }
    }
    
    // Update storage
    await browser.storage.local.set({
      githubScripts: newScripts,
      lastUpdateCheck: now
    });
    
    console.log(`[GitHub] Updated ${Object.keys(newScripts).length} scripts from GitHub`);
    
    return {
      success: true,
      scriptsFound: Object.keys(newScripts).length,
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
