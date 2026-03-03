// Content script - dynamically loads scripts based on config and settings
(function() {
  'use strict';
  
  console.log('[Promedico Helper] Content script loaded');
  
  // Check if current URL matches a pattern
  function urlMatches(pattern) {
    const currentUrl = window.location.href;
    
    // Convert wildcard pattern to regex
    // * matches any characters
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\*/g, '.*'); // Convert * to .*
    
    const regex = new RegExp('^' + regexPattern + '$');
    return regex.test(currentUrl);
  }
  
  // Get settings and script configuration
  Promise.all([
    browser.runtime.sendMessage({type: 'getSettings'}),
    browser.runtime.sendMessage({type: 'getScriptConfig'})
  ]).then(([settings, config]) => {
    console.log('[Promedico Helper] Settings:', settings);
    console.log('[Promedico Helper] Config:', config);
    console.log('[Promedico Helper] Current URL:', window.location.href);
    
    if (!settings.scriptsEnabled) {
      console.log('[Promedico Helper] Scripts disabled by master toggle');
      return;
    }
    
    // Load scripts from config
    config.scripts.forEach(script => {
      const enabledKey = script.id + 'Enabled';
      
      console.log(`[Promedico Helper] Checking script: ${script.name}`);
      console.log(`[Promedico Helper]   - ID: ${script.id}`);
      console.log(`[Promedico Helper]   - Enabled key: ${enabledKey}`);
      console.log(`[Promedico Helper]   - Setting value: ${settings[enabledKey]}`);
      console.log(`[Promedico Helper]   - Default enabled: ${script.enabled}`);
      
      // FIX: Check if setting exists, otherwise use default from config
      const isEnabled = settings[enabledKey] !== undefined ? settings[enabledKey] : script.enabled;
      
      if (!isEnabled) {
        console.log('[Promedico Helper] Script disabled:', script.name);
        return;
      }
      
      console.log('[Promedico Helper]   - Script is ENABLED');
      
      // Check if URL matches (if urlPatterns is defined)
      if (script.urlPatterns && script.urlPatterns.length > 0) {
        console.log('[Promedico Helper]   - Checking URL patterns:', script.urlPatterns);
        const matches = script.urlPatterns.some(pattern => {
          const result = urlMatches(pattern);
          console.log(`[Promedico Helper]     - Pattern "${pattern}" matches: ${result}`);
          return result;
        });
        
        if (!matches) {
          console.log('[Promedico Helper] URL does not match for:', script.name);
          return;
        }
      }
      
      console.log('[Promedico Helper] Loading script:', script.name);
      
      // Check if we have a GitHub version first
      if (settings.githubScripts && settings.githubScripts[script.id]) {
        console.log('[Promedico Helper] Using GitHub version of', script.name);
        executeScriptCode(settings.githubScripts[script.id]);
      } else {
        // Load from local file
        console.log('[Promedico Helper] Loading from file:', script.scriptFile);
        loadScriptFile(script.scriptFile);
      }
    });
  });
  
  // Execute script code in content script context (NOT page context!)
  // This allows scripts to use browser.storage and other extension APIs
  function executeScriptCode(code) {
    try {
      // Use indirect eval to execute in content script context
      // This gives access to browser.storage API
      (1, eval)(code);
      console.log('[Promedico Helper] Script executed in content script context');
    } catch (error) {
      console.error('[Promedico Helper] Script execution error:', error);
    }
  }
  
  // Load script from file
  function loadScriptFile(scriptPath) {
    fetch(browser.runtime.getURL(scriptPath))
      .then(response => response.text())
      .then(code => {
        console.log('[Promedico Helper] Script loaded successfully:', scriptPath);
        executeScriptCode(code);
      })
      .catch(error => {
        console.error('[Promedico Helper] Failed to load script:', scriptPath, error);
      });
  }
  
})();