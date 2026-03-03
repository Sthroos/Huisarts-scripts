// loader.js
// Injecteert scripts die toegang moeten hebben tot de Main World van Promedico.
// Controleert eerst de extensie-instellingen voordat een script geladen wordt.

(function() {
  // Browser API shim (werkt in Firefox en Chrome)
  const _api = typeof browser !== 'undefined' ? browser : chrome;
  // Scripts die in de main world moeten draaien (met hun config-ID)
  const mainWorldScripts = [
    { id: 'soepSjablonen',    file: 'scripts/soep-sjablonen.js' },
    { id: 'soepMeasurements', file: 'scripts/soep-metingen.js' },
    { id: 'inschrijvenMedovd', file: 'scripts/inschrijven-medovd.js' }
  ];

  // Haal instellingen op en injecteer alleen enabled scripts
  _api.storage.local.get().then(settings => {
    // Als master toggle uit staat: niets injecteren
    const masterEnabled = settings.scriptsEnabled !== undefined ? settings.scriptsEnabled : true;
    if (!masterEnabled) {
      console.log('[Loader] Master toggle uit, geen scripts geladen');
      return;
    }

    mainWorldScripts.forEach(script => {
      const enabledKey = script.id + 'Enabled';
      // Default aan als de instelling nog niet bestaat
      const isEnabled = settings[enabledKey] !== undefined ? settings[enabledKey] : true;

      if (!isEnabled) {
        console.log('[Loader] Script uitgeschakeld:', script.id);
        return;
      }

      var s = document.createElement('script');
      s.src = _api.runtime.getURL(script.file);
      s.onload = function() {
        this.remove();
      };
      (document.head || document.documentElement).appendChild(s);
      console.log('[Loader] Script geladen:', script.file);
    });
  }).catch(err => {
    console.error('[Loader] Kon instellingen niet ophalen:', err);
  });
})();