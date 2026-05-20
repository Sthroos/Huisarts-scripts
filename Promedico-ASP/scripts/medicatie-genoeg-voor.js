(function () {
    'use strict';

    const VELD_ID      = 'MedicatieDoseren-Gebruik-txtGenoegVoor';
    const STANDAARD    = '30';
    const WACHT_MS     = 400;   // wacht tot Promedico het veld eventueel zelf vult
    const POLL_MS      = 200;
    const MAX_WACHT_MS = 10000;

    function simuleerTypen(veld, tekst) {
        // Eerst leegmaken via native setter (omzeilt GWT's eigen value-tracking)
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

        veld.focus();
        if (nativeSetter) nativeSetter.set.call(veld, '');
        else veld.value = '';
        veld.dispatchEvent(new Event('input', { bubbles: true }));

        // Typ elk karakter apart — Promedico triggert einddatum-berekening op keyup
        for (let i = 0; i < tekst.length; i++) {
            const huidig = tekst.slice(0, i + 1);
            const char   = tekst[i];

            veld.dispatchEvent(new KeyboardEvent('keydown',  { key: char, bubbles: true }));
            veld.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));

            if (nativeSetter) nativeSetter.set.call(veld, huidig);
            else veld.value = huidig;

            veld.dispatchEvent(new InputEvent('input', {
                inputType: 'insertText', data: char, bubbles: true
            }));
            veld.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
        }

        veld.dispatchEvent(new Event('change', { bubbles: true }));
        veld.blur();
    }

    function probeerVullen(veld) {
        if (veld.value.trim() !== '') return; // al ingevuld door Promedico
        simuleerTypen(veld, STANDAARD);
        console.log('[GenoegVoor] Leeg veld gevonden — standaard ' + STANDAARD + ' dagen ingevuld');
    }

    function wachtOpVeldEnVul() {
        // Veld al aanwezig?
        const direct = document.getElementById(VELD_ID);
        if (direct) {
            setTimeout(() => probeerVullen(direct), WACHT_MS);
            return;
        }

        // Nog niet aanwezig: poll totdat het verschijnt (GWT laadt asynchroon)
        const start = Date.now();
        const iv = setInterval(() => {
            const veld = document.getElementById(VELD_ID);
            if (veld) {
                clearInterval(iv);
                setTimeout(() => probeerVullen(veld), WACHT_MS);
            } else if (Date.now() - start > MAX_WACHT_MS) {
                clearInterval(iv);
            }
        }, POLL_MS);
    }

    // Het doseerformulier kan meerdere keren per sessie verschijnen
    // (bijv. als de gebruiker een 2e voorschriftregel toevoegt via de +-knop).
    // We observeren de DOM op nieuwe instanties van het veld.
    let bekendVeld = null;

    const observer = new MutationObserver(() => {
        const veld = document.getElementById(VELD_ID);
        if (veld && veld !== bekendVeld) {
            bekendVeld = veld;
            setTimeout(() => probeerVullen(veld), WACHT_MS);
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
            wachtOpVeldEnVul();
        });
    } else {
        observer.observe(document.body, { childList: true, subtree: true });
        wachtOpVeldEnVul();
    }

})();
