(function() {
    'use strict';

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

    function voegInitialenToe(sVeld, initialen) {
        const prefix = initialen + ': ';
        // Ruimere check zonder spatie: Promedico gooit de trailing spatie weg bij
        // opslaan/herladen waardoor "SR: " terugkomt als "SR:" — dan zou de smalle
        // check falen en de initialen opnieuw worden toegevoegd.
        const aanwezigheidsCheck = initialen + ':';
        const huidigeWaarde = sVeld.value;

        if (huidigeWaarde.includes(aanwezigheidsCheck)) {
            return;
        }

        if (huidigeWaarde.trim() === '') {
            sVeld.value = prefix;
        } else {
            sVeld.value = huidigeWaarde + '\n' + prefix;
        }

        sVeld.dispatchEvent(new Event('input',  { bubbles: true }));
        sVeld.dispatchEvent(new Event('change', { bubbles: true }));
        sVeld.setSelectionRange(sVeld.value.length, sVeld.value.length);
        sVeld.focus();
    }

    function initialize() {
        const sVeld = document.getElementById('contactForm.regelS');
        if (!sVeld) { return; }

        const naam = getUserName();
        if (!naam) { return; }

        const initialen = berekenInitialen(naam);
        if (!initialen) { return; }

        let vorigeWaarde = null;
        let stabielCount = 0;

        const stabilisatieInterval = setInterval(() => {
            const huidigeWaarde = sVeld.value;

            if (huidigeWaarde === vorigeWaarde) {
                stabielCount++;
            } else {
                stabielCount = 0;
                vorigeWaarde = huidigeWaarde;
            }

            if (stabielCount >= 2) {
                clearInterval(stabilisatieInterval);
                voegInitialenToe(sVeld, initialen);
            }
        }, 150);

        setTimeout(() => {
            clearInterval(stabilisatieInterval);
        }, 5000);
    }


    const checkInterval = setInterval(() => {
        const veld = document.getElementById('contactForm.regelS');
        if (veld) {
            clearInterval(checkInterval);
            initialize();
        }
    }, 300);

    setTimeout(() => {
        clearInterval(checkInterval);
    }, 15000);

})();
