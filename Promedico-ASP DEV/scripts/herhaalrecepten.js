(function () {
    'use strict';

    const SCRIPT_NAME   = '[AutoReceptVerwerken]';
    const WERKLIJST_URL = 'werklijst.receptaanvraag.patientportaal.m';
    const POLL_INTERVAL = 400;
    const MAX_WAIT      = 25000;

    let autoActief = false;

    function log(msg) { console.log(SCRIPT_NAME + ' ' + msg); }
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function getIframeDoc() {
        const f = document.querySelector('iframe#panelBackCompatibility-frame');
        if (!f) return null;
        try { return f.contentDocument || f.contentWindow.document; } catch(e) { return null; }
    }

    function getIframeUrl() {
        // Lees via contentDocument.location (zelfde als wat andere scripts doen)
        const doc = getIframeDoc();
        if (!doc) return '';
        try { return doc.location.href; } catch(e) { return ''; }
    }

    function isWerklijst(url) {
        return url.includes(WERKLIJST_URL) && !url.includes('taakid=');
    }

    function isHerhaling(url) {
        return url.includes(WERKLIJST_URL) && url.includes('taakid=');
    }

    function waitForInIframe(selector, timeout) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const iv = setInterval(() => {
                const doc = getIframeDoc();
                const el  = doc && doc.querySelector(selector);
                if (el && !el.disabled) {
                    clearInterval(iv);
                    resolve(el);
                } else if (Date.now() - start > timeout) {
                    clearInterval(iv);
                    // Debug: wat staat er wel in iframe?
                    const doc2 = getIframeDoc();
                    if (doc2) {
                        const btns = Array.from(doc2.querySelectorAll('button'));
                        log('TIMEOUT "' + selector + '". Buttons in iframe: ' +
                            (btns.length
                                ? btns.map(b => '#' + b.id + '(dis=' + b.disabled + ',"' + b.textContent.trim().substring(0,15) + '")').join(' | ')
                                : '(geen buttons)'));
                        log('Iframe URL bij timeout: ' + getIframeUrl());
                    } else {
                        log('TIMEOUT "' + selector + '" – iframe niet toegankelijk');
                    }
                    reject(new Error('Timeout: ' + selector));
                }
            }, POLL_INTERVAL);
        });
    }

    function waitForIframeUrl(checkFn, timeout) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const iv = setInterval(() => {
                const url = getIframeUrl();
                log('  poll URL: "' + url + '"');
                if (url && checkFn(url)) {
                    clearInterval(iv);
                    resolve(url);
                } else if (Date.now() - start > timeout) {
                    clearInterval(iv);
                    reject(new Error('URL timeout. Laatste URL: "' + url + '"'));
                }
            }, POLL_INTERVAL);
        });
    }

    // ------------------------------------------------------------------ status

    function setStatus(msg) {
        const doc = getIframeDoc();
        if (!doc || !doc.body) return;
        let el = doc.getElementById('pm-auto-verwerk-status');
        if (!el) {
            el = doc.createElement('div');
            el.id = 'pm-auto-verwerk-status';
            el.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#ffffcc;border:1px solid #ccaa00;padding:6px 12px;border-radius:4px;font-size:12px;z-index:9999;max-width:400px;box-shadow:0 2px 6px rgba(0,0,0,.2)';
            doc.body.appendChild(el);
        }
        el.textContent = '⚡ ' + msg;
    }

    // ------------------------------------------------------------------ start knop

    function addStartButton() {
        const doc = getIframeDoc();
        if (!doc) { log('addStartButton: geen iframe doc'); return false; }
        if (doc.getElementById('pm-auto-verwerk-btn')) return true;

        const h2 = doc.querySelector('h2');
        if (!h2 || !h2.textContent.includes('Te beoordelen recept aanvragen')) return false;

        const btn = doc.createElement('button');
        btn.id = 'pm-auto-verwerk-btn';
        btn.textContent = '⚡ Alles automatisch verwerken';
        btn.style.cssText = 'margin-left:20px;padding:4px 12px;background:#2a7ae2;color:white;border:none;border-radius:3px;cursor:pointer;font-size:13px;font-weight:bold;';
        btn.addEventListener('mouseenter', () => btn.style.background = '#1a5cb8');
        btn.addEventListener('mouseleave', () => btn.style.background = '#2a7ae2');
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            btn.disabled = true;
            btn.textContent = '⏳ Bezig...';
            btn.style.background = '#888';
            startAutoVerwerken();
        });
        h2.parentNode.insertBefore(btn, h2.nextSibling);
        log('Start-knop toegevoegd. Iframe URL: ' + getIframeUrl());
        return true;
    }

    // ------------------------------------------------------------------ hoofdlogica

    async function startAutoVerwerken() {
        autoActief = true;
        let verwerkt = 0;
        let fouten   = 0;

        try {
            while (autoActief) {
                const iDoc = getIframeDoc();
                if (!iDoc) throw new Error('Iframe niet toegankelijk');

                const currentUrl = getIframeUrl();
                log('Loop start. URL: ' + currentUrl);

                const btns = Array.from(iDoc.querySelectorAll(
                    'input[type="BUTTON"][value="Verwerken"], input[type="button"][value="Verwerken"]'
                ));

                if (btns.length === 0) {
                    setStatus('Klaar! ' + verwerkt + ' recept(en) verwerkt' +
                        (fouten ? ', ' + fouten + ' fouten' : '') + '.');
                    log('Geen recepten meer. Verwerkt: ' + verwerkt);
                    break;
                }

                log('Nog ' + btns.length + ' recept(en). Stap 1: klik Verwerken...');
                setStatus('Recept ' + (verwerkt + 1) + ' – stap 1/2...');
                btns[0].click();

                // Wacht tot iframe URL verandert naar herhaling (?taakid=...)
                log('Wacht op herhaling URL in iframe...');
                setStatus('Recept ' + (verwerkt + 1) + ' – laden...');

                try {
                    const newUrl = await waitForIframeUrl(isHerhaling, MAX_WAIT);
                    log('Herhaling URL: ' + newUrl);
                } catch(e) {
                    log('URL wacht mislukt: ' + e.message);
                    fouten++;
                    await sleep(2000);
                    continue;
                }

                // Wacht op GWT Verwerken knop in iframe
                log('Wacht op #HerhalingOverzichtTopView-btnVerwerken...');
                setStatus('Recept ' + (verwerkt + 1) + ' – wacht op knop...');

                let btnV2;
                try {
                    btnV2 = await waitForInIframe('#HerhalingOverzichtTopView-btnVerwerken', MAX_WAIT);
                    log('Knop gevonden en enabled!');
                } catch(e) {
                    log('Knop niet gevonden: ' + e.message);
                    fouten++;
                    const iDoc2 = getIframeDoc();
                    const terug = iDoc2 && iDoc2.querySelector('#HerhalingOverzichtTopView-btnTerug');
                    if (terug) terug.click();
                    await sleep(2000);
                    continue;
                }

                await sleep(200);
                log('Stap 2: klik Verwerken...');
                setStatus('Recept ' + (verwerkt + 1) + ' – stap 2/2...');
                btnV2.click();
                verwerkt++;

                // Wacht tot iframe terug is op werklijst
                log('Wacht op terugkeer werklijst...');
                try {
                    await waitForIframeUrl(isWerklijst, MAX_WAIT);
                } catch(e) {
                    log('Werklijst terugkeer timeout: ' + e.message);
                }

                await sleep(600);
                log('Recept ' + verwerkt + ' klaar.');
            }
        } catch(err) {
            log('ONVERWACHTE FOUT: ' + err.message);
            setStatus('Fout: ' + err.message);
        } finally {
            autoActief = false;
        }
    }

    // ------------------------------------------------------------------ init

    function init() {
        log('Init: monitor iframe voor werklijst');

        let lastUrl = '';
        let buttonAdded = false;

        setInterval(() => {
            const url = getIframeUrl();
            if (!url || url === lastUrl) return;
            lastUrl = url;
            log('Iframe URL gewijzigd: ' + url);

            if (isWerklijst(url)) {
                buttonAdded = false;
                setTimeout(() => {
                    if (!buttonAdded) {
                        buttonAdded = addStartButton();
                    }
                }, 600);
            }
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();