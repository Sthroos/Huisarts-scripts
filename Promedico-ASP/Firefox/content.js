(function() {
  'use strict';
  
  console.log('[Promedico Helper] Content Manager Started');

  // Check URL helper
  function urlMatches(pattern) {
    const currentUrl = window.location.href;
    const regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    const regex = new RegExp('^' + regexPattern + '$');
    return regex.test(currentUrl);
  }
  
  // Functie om scripts in de "Main World" te injecteren (zoals loader.js deed)
  function injectMainWorldScript(scriptPath) {
      const s = document.createElement('script');
      s.src = browser.runtime.getURL(scriptPath);
      s.onload = function() {
          this.remove(); // Opruimen na laden
      };
      (document.head || document.documentElement).appendChild(s);
      console.log('[Promedico Helper] Injected Main World:', scriptPath);
  }

  // Haal settings en config op
  Promise.all([
    browser.runtime.sendMessage({type: 'getSettings'}),
    browser.runtime.sendMessage({type: 'getScriptConfig'})
  ]).then(([settings, config]) => {
    
    // 1. Master Toggle Check
    if (!settings.scriptsEnabled) {
      console.log('[Promedico Helper] Master switch is UIT - Geen scripts geladen.');
      return;
    }

    // 2. Loop door alle scripts
    config.scripts.forEach(script => {
      const enabledKey = script.id + 'Enabled';
      const isEnabled = settings[enabledKey] !== undefined ? settings[enabledKey] : script.enabled;

      if (!isEnabled) return; // Script staat uit

      // URL Check
      if (script.urlPatterns && script.urlPatterns.length > 0) {
        const matches = script.urlPatterns.some(pattern => urlMatches(pattern));
        if (!matches) return;
      }
      
      // 3. BESLISMOMENT: Hoe laden we dit script?
      
      if (script.injectMode === 'main_world') {
          // A: Het is een script dat bij interne Promedico functies moet (popUp, saveContact)
          injectMainWorldScript(script.scriptFile);
      } else {
          // B: Het is een normaal script (heeft chrome.storage nodig, e.g. ZorgDomein)
          // We vragen background.js om dit te doen, zodat de scope veilig blijft
          browser.runtime.sendMessage({
            type: 'injectScript',
            file: script.scriptFile
          });
      }
    });

  });
  
})();
