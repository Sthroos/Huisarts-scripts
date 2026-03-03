// loader.js
(function() {
    // Scripts die toegang moeten hebben tot de interne functies van Promedico (Main World)
    const scriptsToInject = [
        'scripts/soep-sjablonen.js',
        'scripts/soep-metingen.js',
        'scripts/inschrijven-medovd.js'
    ];

    scriptsToInject.forEach(scriptName => {
        var s = document.createElement('script');
        s.src = chrome.runtime.getURL(scriptName);
        s.onload = function() {
            this.remove(); // Script tag opruimen na laden
        };
        (document.head || document.documentElement).appendChild(s);
    });
})();
