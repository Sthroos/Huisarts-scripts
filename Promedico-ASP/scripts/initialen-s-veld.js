(function() {
    'use strict';

    // ─── Gebruikersnaam uitlezen uit de Promedico top-bar ───────────────────
    // Promedico toont "Aangemeld als Voornaam Achternaam" in .GEM3CPJDGMC.
    // We zoeken in top/parent want dit script draait in een iframe.
    function getUserName() {
        const searchWindows = [window.top, window.parent, window];

        for (const win of searchWindows) {
            try {
                if (!win || !win.document) continue;
                const userDiv = win.document.querySelector('.GEM3CPJDGMC');
                if (userDiv) {
                    const match = userDiv.textContent.trim().match(/Aangemeld als\s+(.+)/);
                    if (match && match[1].trim()) return match[1].trim();
                }
            } catch(e) {}
        }
        return null;
    }

    // ─── Initialen berekenen uit een volledige naam ───────────────────────────
    // "Sebastiaan Roos"             → "SR"
    // "Eline Westerbeek van Eerten" → "EWE"  (tussenvoegsel 'van' wordt overgeslagen)
    // Tussenvoegels (van, de, den, der, het, 't, op, ten, te, ver) worden genegeerd.
    const TUSSENVOEGSELS = new Set([
        'van', 'de', 'den', 'der', 'het', 't', 'op', 'ten', 'te', 'ver',
        'aan', 'bij', 'du', 'in', 'uit', 'over', 'onder'
    ]);

    function berekenInitialen(naam) {
        return naam
            .split(/\s+/)
            .filter(deel => deel.length > 0 && !TUSSENVOEGSELS.has(deel.toLowerCase()))
            .map(deel => deel[0].toUpperCase())
            .join('');
    }

    // ─── Initialen invoegen in het S-veld ────────────────────────────────────
    // Wordt achteraan toegevoegd als het veld al tekst bevat,
    // vooraan als het leeg is — met een spatie erachter.
    function voegInitialenToe(sVeld, initialen) {
        const prefix = initialen + ': ';
        const huidigeWaarde = sVeld.value;

        // Voorkom dubbele toevoeging als het al begint of eindigt met de initialen
        if (huidigeWaarde.includes(prefix)) {
            console.log('[Initialen S-veld] Initialen al aanwezig, overgeslagen');
            return;
        }

        if (huidigeWaarde.trim() === '') {
            sVeld.value = prefix;
        } else {
            sVeld.value = huidigeWaarde + '\n' + prefix;
        }

        // GWT events triggeren zodat Promedico de wijziging registreert
        sVeld.dispatchEvent(new Event('input',  { bubbles: true }));
        sVeld.dispatchEvent(new Event('change', { bubbles: true }));

        // Cursor naar het einde zetten zodat de gebruiker direct kan typen
        sVeld.setSelectionRange(sVeld.value.length, sVeld.value.length);
        sVeld.focus();

        console.log('[Initialen S-veld] Toegevoegd:', prefix);
    }

    // ─── Initialisatie ────────────────────────────────────────────────────────
    function initialize() {
        const sVeld = document.getElementById('contactForm.regelS');
        if (!sVeld) return;

        // Voorkom dubbele initialisatie
        if (sVeld.dataset.initialenGekoppeld) return;
        sVeld.dataset.initialenGekoppeld = '1';

        // Gebruikersnaam ophalen en initialen berekenen
        const naam = getUserName();
        if (!naam) {
            console.warn('[Initialen S-veld] Kon gebruikersnaam niet uitlezen uit Promedico');
            return;
        }

        const initialen = berekenInitialen(naam);
        if (!initialen) {
            console.warn('[Initialen S-veld] Kon initialen niet berekenen uit naam:', naam);
            return;
        }

        console.log('[Initialen S-veld] Gebruiker:', naam, '→ initialen:', initialen);

        // Direct toevoegen zodra het veld geladen is
        voegInitialenToe(sVeld, initialen);
    }

    // Poll tot het S-veld beschikbaar is (GWT laadt laat)
    const checkInterval = setInterval(() => {
        if (document.getElementById('contactForm.regelS')) {
            clearInterval(checkInterval);
            initialize();
        }
    }, 300);

    // Stop na 15 seconden zodat het script niet eindeloos blijft pollen
    setTimeout(() => clearInterval(checkInterval), 15000);

})();