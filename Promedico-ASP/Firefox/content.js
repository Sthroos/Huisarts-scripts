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
      
      if (!settings[enabledKey]) {
        console.log('[Promedico Helper] Script disabled:', script.name);
        return;
      }
      
      // Check if URL matches (if urlPatterns is defined)
      if (script.urlPatterns && script.urlPatterns.length > 0) {
        const matches = script.urlPatterns.some(pattern => urlMatches(pattern));
        
        if (!matches) {
          console.log('[Promedico Helper] URL does not match for:', script.name);
          return;
        }
      }
      
      console.log('[Promedico Helper] Loading script:', script.name);
      
      // Check if we have a GitHub version first
      if (settings.githubScripts && settings.githubScripts[script.id]) {
        console.log('[Promedico Helper] Using GitHub version of', script.name);
        injectScriptCode(settings.githubScripts[script.id]);
      } else {
        // Load from local file
        loadScriptFile(script.scriptFile);
      }
    });
  });
  
  // Inject script code directly
  function injectScriptCode(code) {
    const script = document.createElement('script');
    script.textContent = code;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }
  
  // Load script from file
  function loadScriptFile(scriptPath) {
    fetch(browser.runtime.getURL(scriptPath))
      .then(response => response.text())
      .then(code => {
        injectScriptCode(code);
      })
      .catch(error => {
        console.error('[Promedico Helper] Failed to load script:', scriptPath, error);
      });
  }
  
})();
