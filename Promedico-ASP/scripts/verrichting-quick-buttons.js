(function() {
    'use strict';

    // ─── DEBUG ────────────────────────────────────────────────────────────────
    // Zet op false om alle logging uit te schakelen (later)
    const DEBUG = true;
    function dbg(...args) {
        if (DEBUG) console.log('[PMH-VQB]', ...args);
    }
    function dbgWarn(...args) {
        if (DEBUG) console.warn('[PMH-VQB]', ...args);
    }
    function dbgErr(...args) {
        if (DEBUG) console.error('[PMH-VQB]', ...args);
    }
    dbg('Script geladen.');

    // ─── STORAGE KEYS ─────────────────────────────────────────────────────────
    const PENDING_SKIP_CODE_KEY     = 'pmh_pending_skip_code';
    const PENDING_CLEANUP_KEY       = 'pmh_pending_cleanup';
    const CACHE_KEY                 = 'pmh_verrichting_cache';       // alle beschikbare codes (van server)
    const CUSTOM_VERRICHTINGEN_KEY  = 'pmh_custom_verrichtingen';   // gepinde eigen codes [{id,code,label}]

    // ─── VASTE VERRICHTINGEN ──────────────────────────────────────────────────
    const VERRICHTINGEN = [
        // ── Contact-types ──────────────────────────────────────────────────────
        { id: '653259669454880', code: 'C',    label: 'Consult regulier 5-20 min',          color: '#5cb85c', hover: '#449d44', type: 'contact'   },
        { id: '173',             code: 'C2',   label: 'Consult regulier 20 min en langer',  color: '#5cb85c', hover: '#449d44', type: 'contact'   },
        { id: '653259669454882', code: 'CP',   label: 'Consult passant 5-20 min',           color: '#5cb85c', hover: '#449d44', type: 'contact'   },
        { id: '194',             code: 'C2P',  label: 'Consult passant 20 min en langer',   color: '#5cb85c', hover: '#449d44', type: 'contact'   },
        { id: '174',             code: 'V',    label: 'Visite regulier korter dan 20 min',  color: '#0275d8', hover: '#025aa5', type: 'contact'   },
        { id: '175',             code: 'V2',   label: 'Visite regulier 20 min en langer',   color: '#0275d8', hover: '#025aa5', type: 'contact'   },
        { id: '307',             code: 'VITK', label: 'Intensieve zorg overdag',            color: '#9b59b6', hover: '#7d3c98', type: 'contact'   },
        // ── Handelingen (stapelen altijd) ──────────────────────────────────────
        { id: '1063',              code: 'CRP',  pmCode: 'CRPCAS', label: 'Materiaalkosten CRP-sneltest',                                    color: '#f0ad4e', hover: '#ec971f', type: 'handeling' },
        { id: '283',               code: 'MMSE',                   label: 'Cognitieve functietest (MMSE)',                                    color: '#e67e22', hover: '#ca6f1e', type: 'handeling' },
        { id: '265',               code: 'DIP',                    label: 'Materiaalkosten dipslides',                                        color: '#f0ad4e', hover: '#ec971f', type: 'handeling' },
        { id: '267',               code: 'STI',                    label: 'Materiaalkosten vloeibaar stikstof',                               color: '#f0ad4e', hover: '#ec971f', type: 'handeling' },
        { id: '285',               code: 'CHI',                    label: 'Chirurgie',                                                        color: '#e67e22', hover: '#ca6f1e', type: 'handeling' },
        { id: '296',               code: 'INJ',  pmCode: 'COR',    label: 'Therapeutische injectie (Cyriax)',                                 color: '#e67e22', hover: '#ca6f1e', type: 'handeling' },
        { id: '279',               code: 'ECG',                    label: 'ECG-diagnostiek',                                                  color: '#e67e22', hover: '#ca6f1e', type: 'handeling' },
        { id: '253',               code: 'BVO',  pmCode: 'BCU',    label: 'Uitstrijkje (BCU)',                                                color: '#f0ad4e', hover: '#ec971f', type: 'handeling' },
        { id: '266',               code: 'GLUC', pmCode: 'BSS',    label: 'Materiaalkosten teststrips bloedsuikerbepaling diabetespatiënten', color: '#f0ad4e', hover: '#ec971f', type: 'handeling' },
        { id: '315',               code: 'IUD',                    label: 'IUD/implantatiestaafje aanbrengen of verwijderen',                 color: '#e67e22', hover: '#ca6f1e', type: 'handeling' },
        { id: '297',               code: 'OOG',  pmCode: 'OOGB',   label: 'Oogboring',                                                        color: '#e67e22', hover: '#ca6f1e', type: 'handeling' },
        { id: '653259001796612',   code: 'SPEC',                   label: 'Meedenkadvies medisch specialistische zorg',                       color: '#9b59b6', hover: '#7d3c98', type: 'handeling' },
    ];

    const HANDELING_CODES = new Set([
        ...VERRICHTINGEN.filter(v => v.type === 'handeling').map(v => v.pmCode || v.code),
        'BC', 'BCU', 'BSS', 'HM', 'TAP', 'ZWT', 'VAK', 'VACP', 'ROOKG',
        'ECG', 'SPI', 'TYM', 'DOP', 'HOLT', 'HYPT', 'MRSA', 'OOGB',
        'COM', 'IUD', 'POFA', 'PACT', 'PACV', 'EUT', 'GHMO', 'GHVZ', 'VIDK',
    ]);

    // ─── CACHE HELPERS ────────────────────────────────────────────────────────

    function getCachedVerrichtingen() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) { dbg('Cache: leeg (nog niet opgehaald)'); return []; }
            const parsed = JSON.parse(raw);
            dbg(`Cache: ${parsed.length} codes geladen uit localStorage.`);
            return parsed;
        } catch (e) {
            dbgErr('Cache lezen mislukt:', e);
            return [];
        }
    }

    function getCustomVerrichtingen() {
        try {
            const raw = localStorage.getItem(CUSTOM_VERRICHTINGEN_KEY);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch (e) {
            dbgErr('Custom verrichtingen lezen mislukt:', e);
            return [];
        }
    }

    function saveCustomVerrichtingen(lijst) {
        try {
            localStorage.setItem(CUSTOM_VERRICHTINGEN_KEY, JSON.stringify(lijst));
            dbg('Custom verrichtingen opgeslagen:', lijst.map(v => v.code));
        } catch (e) {
            dbgErr('Custom verrichtingen opslaan mislukt:', e);
        }
    }

    // ─── ACHTERGROND CACHE REFRESH ────────────────────────────────────────────
    // Wordt eenmalig per inject aangeroepen. Haalt de volledige verrichtingenlijst
    // op via fetch en overschrijft de cache. Zo is de lijst altijd actueel.

    let cacheRefreshGestart = false;

    async function refreshVerrichtingCache(iframeDoc) {
        if (cacheRefreshGestart) {
            dbg('Cache refresh: al gestart in deze sessie, overgeslagen.');
            return;
        }
        cacheRefreshGestart = true;
        dbg('Cache refresh: gestart.');

        // Haal token en datum op uit de iframe
        const tokenEl = iframeDoc.querySelector('input[name="r_token"]');
        if (!tokenEl || !tokenEl.value) {
            dbgWarn('Cache refresh: geen r_token gevonden in iframeDoc — afgebroken.');
            cacheRefreshGestart = false; // retry toegestaan
            return;
        }
        const token = tokenEl.value;
        dbg('Cache refresh: r_token gevonden:', token);

        // Datum in dd-mm-yyyy formaat (zoals Promedico verwacht)
        const nu = new Date();
        const datum = `${String(nu.getDate()).padStart(2,'0')}-${String(nu.getMonth()+1).padStart(2,'0')}-${nu.getFullYear()}`;
        dbg('Cache refresh: datum:', datum);

        // Bouw de URL op. We doen een GET met de bekende parameters.
        // Promedico accepteert de verrichtingselectie normaal via POST vanuit het iframe,
        // maar een GET zonder filters geeft de volledige lijst terug.
        const url = `/promedico/medischdossier.journaal.verrichtingselectie.m?datum=${datum}&handmatig=false&inschrijfgeld=false&r_token=${encodeURIComponent(token)}`;
        dbg('Cache refresh: fetch URL:', url);

        let html;
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin', // stuur sessie-cookies mee
                headers: { 'Accept': 'text/html' }
            });
            dbg('Cache refresh: HTTP status:', response.status, response.statusText);
            if (!response.ok) {
                dbgErr('Cache refresh: server gaf foutcode terug:', response.status);
                cacheRefreshGestart = false;
                return;
            }
            html = await response.text();
            dbg('Cache refresh: HTML ontvangen, lengte:', html.length, 'tekens.');
        } catch (e) {
            dbgErr('Cache refresh: fetch mislukt (netwerk/CORS?):', e);
            cacheRefreshGestart = false;
            return;
        }

        // Parse de HTML
        let doc;
        try {
            doc = new DOMParser().parseFromString(html, 'text/html');
        } catch (e) {
            dbgErr('Cache refresh: DOMParser mislukt:', e);
            cacheRefreshGestart = false;
            return;
        }

        // Extraheer alle rijen met klaar('id')
        const codes = [];
        const rijen = doc.querySelectorAll('tr[onclick*="klaar"]');
        dbg(`Cache refresh: ${rijen.length} rijen gevonden in response.`);

        rijen.forEach((tr, i) => {
            const onclick = tr.getAttribute('onclick') || '';
            const match = onclick.match(/klaar\('([^']+)'\)/);
            const tds = tr.querySelectorAll('td');
            if (!match) {
                dbgWarn(`Cache refresh: rij ${i} heeft geen klaar()-match in onclick="${onclick}"`);
                return;
            }
            if (tds.length < 2) {
                dbgWarn(`Cache refresh: rij ${i} heeft minder dan 2 <td>'s`);
                return;
            }
            const entry = {
                id:    match[1],
                code:  tds[0].textContent.trim(),
                label: tds[1].textContent.trim(),
            };
            codes.push(entry);
            dbg(`Cache refresh: gevonden → id=${entry.id} code=${entry.code} label="${entry.label}"`);
        });

        if (codes.length === 0) {
            dbgWarn('Cache refresh: 0 codes geparsed — iets klopt niet. HTML snippet:', html.substring(0, 500));
            cacheRefreshGestart = false;
            return;
        }

        // Sla op
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(codes));
            dbg(`Cache refresh: ✓ ${codes.length} codes opgeslagen in localStorage.`);
        } catch (e) {
            dbgErr('Cache refresh: localStorage schrijven mislukt:', e);
        }

        // Herrender de eigen rij als die er al staat (codes kunnen gewijzigd zijn)
        herenderEigenRij();
    }

    // ─── EIGEN RIJ HERRENDEREN ─────────────────────────────────────────────────
    // Na een cache-refresh kunnen we de eigen-rij opnieuw opbouwen zodat
    // verwijderde codes grijs worden en nieuwe codes beschikbaar komen.

    function herenderEigenRij() {
        // Zoek de container die al geïnjecteerd is
        const container = document.querySelector('.verrichting-quick-buttons');
        if (!container) { dbg('Herrender: geen container gevonden, overgeslagen.'); return; }
        const eigenRijEl = container.querySelector('.pmh-eigen-rij');
        if (!eigenRijEl) { dbg('Herrender: geen eigen-rij gevonden, overgeslagen.'); return; }

        dbg('Herrender: eigen rij wordt opnieuw opgebouwd.');
        // We wissen de knoppen-span (niet het label)
        const knoppen = eigenRijEl.querySelector('.pmh-eigen-knoppen');
        if (knoppen) knoppen.innerHTML = '';

        vulEigenKnoppen(knoppen, eigenRijEl._iframeDoc, eigenRijEl._iframeWin);
    }

    // ─── EIGEN VERRICHTING KNOPPEN VULLEN ─────────────────────────────────────

    function vulEigenKnoppen(knoppen, iframeDoc, iframeWin) {
        const custom    = getCustomVerrichtingen();
        const cache     = getCachedVerrichtingen();
        const cacheIds  = new Set(cache.map(v => v.id));

        dbg(`Eigen knoppen: ${custom.length} gepinde codes.`);

        if (custom.length === 0) {
            const hint = document.createElement('span');
            hint.style.cssText = 'font-size: 11px; color: #999; font-family: Arial, sans-serif; font-style: italic;';
            hint.textContent = 'Nog geen eigen codes — klik ⚙ om toe te voegen';
            knoppen.appendChild(hint);
            return;
        }

        custom.forEach(v => {
            const beschikbaar = cache.length === 0 || cacheIds.has(v.id);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'verrichting-quick-btn pmh-eigen-btn';
            btn.textContent = v.code;

            if (beschikbaar) {
                btn.title = `${v.label}\n(wordt opgestapeld)\n[eigen code]`;
                btn.style.cssText = `
                    height: 20px; padding: 0 5px; margin: 0 2px;
                    background-color: #17a2b8; color: white;
                    border: 1px solid #17a2b8; border-radius: 3px;
                    cursor: pointer; font-family: Arial, sans-serif;
                    font-size: 11px; font-weight: bold;
                    line-height: 20px; vertical-align: middle; white-space: nowrap;
                `;
                btn.addEventListener('mouseenter', () => { btn.style.backgroundColor = '#138496'; btn.style.borderColor = '#138496'; });
                btn.addEventListener('mouseleave', () => { btn.style.backgroundColor = '#17a2b8'; btn.style.borderColor = '#17a2b8'; });
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    dbg(`Eigen knop geklikt: code=${v.code} id=${v.id}`);
                    const fn = iframeWin.addVerrichting;
                    if (typeof fn === 'function') fn(v.id);
                    else dbgErr('addVerrichting niet beschikbaar op iframeWin');
                });
            } else {
                // Code bestaat niet meer in Promedico
                btn.title = `${v.label}\n⚠ Deze code is niet meer beschikbaar in Promedico.\nVerwijder hem via ⚙.`;
                btn.style.cssText = `
                    height: 20px; padding: 0 5px; margin: 0 2px;
                    background-color: #aaa; color: #fff;
                    border: 1px solid #999; border-radius: 3px;
                    cursor: not-allowed; font-family: Arial, sans-serif;
                    font-size: 11px; font-weight: bold;
                    line-height: 20px; vertical-align: middle; white-space: nowrap;
                    text-decoration: line-through; opacity: 0.7;
                `;
                dbgWarn(`Eigen knop grijs gemaakt (niet in cache): code=${v.code} id=${v.id}`);
            }

            knoppen.appendChild(btn);
        });
    }

    // ─── INSTELLINGEN MODAL ───────────────────────────────────────────────────
    // Eenvoudige overlay om codes te selecteren/deselecteren.

    function openInstellingenModal() {
        dbg('Instellingen modal: openen.');

        // Verwijder eventuele bestaande modal
        const bestaand = document.getElementById('pmh-modal-overlay');
        if (bestaand) bestaand.remove();

        const cache  = getCachedVerrichtingen();
        const custom = getCustomVerrichtingen();
        const customIds = new Set(custom.map(v => v.id));

        dbg(`Modal: cache heeft ${cache.length} codes, ${custom.length} zijn gepind.`);

        // ── Overlay ──
        const overlay = document.createElement('div');
        overlay.id = 'pmh-modal-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            font-family: Arial, sans-serif;
        `;

        // ── Dialoog ──
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #fff; border-radius: 6px; padding: 16px;
            width: 420px; max-height: 70vh;
            display: flex; flex-direction: column;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

        // Titel
        const titel = document.createElement('div');
        titel.style.cssText = 'font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #333;';
        titel.textContent = '⚙ Eigen declaratiecodes instellen';
        dialog.appendChild(titel);

        // Info tekst
        const info = document.createElement('div');
        info.style.cssText = 'font-size: 11px; color: #666; margin-bottom: 8px;';
        if (cache.length === 0) {
            info.textContent = '⚠ Nog geen codes in cache. De lijst wordt automatisch opgehaald zodra de pagina volledig geladen is. Probeer het over een moment opnieuw.';
            info.style.color = '#c0392b';
        } else {
            info.textContent = `Selecteer de codes die je in de "Eigen:" rij wilt zien. (${cache.length} beschikbare codes)`;
        }
        dialog.appendChild(info);

        // Zoekbalk
        const zoek = document.createElement('input');
        zoek.type = 'text';
        zoek.placeholder = 'Zoek op code of omschrijving...';
        zoek.style.cssText = `
            width: 100%; box-sizing: border-box; padding: 4px 6px;
            font-size: 11px; border: 1px solid #ccc; border-radius: 3px;
            margin-bottom: 6px;
        `;

        // Lijst container
        const lijstContainer = document.createElement('div');
        lijstContainer.style.cssText = 'overflow-y: auto; flex: 1; border: 1px solid #ddd; border-radius: 3px;';

        // Filter de vaste codes eruit — die staan al in rij 1 en 2
        const vasteIds = new Set(VERRICHTINGEN.map(v => v.id));
        // We tonen ALLE codes uit de cache (inclusief vaste), zodat de gebruiker bewust kan kiezen.
        // Vaste codes worden gemarkeerd.

        function bouwLijst(filter) {
            lijstContainer.innerHTML = '';
            const gefilterd = cache.filter(v =>
                !filter ||
                v.code.toLowerCase().includes(filter) ||
                v.label.toLowerCase().includes(filter)
            );

            dbg(`Modal lijst: filter="${filter}", ${gefilterd.length} resultaten.`);

            if (gefilterd.length === 0) {
                const leeg = document.createElement('div');
                leeg.style.cssText = 'padding: 8px; font-size: 11px; color: #999;';
                leeg.textContent = 'Geen codes gevonden.';
                lijstContainer.appendChild(leeg);
                return;
            }

            gefilterd.forEach(v => {
                const rij = document.createElement('label');
                rij.style.cssText = `
                    display: flex; align-items: center; padding: 4px 8px;
                    cursor: pointer; border-bottom: 1px solid #f0f0f0;
                    font-size: 11px;
                `;
                rij.addEventListener('mouseenter', () => rij.style.background = '#f5f5f5');
                rij.addEventListener('mouseleave', () => rij.style.background = '');

                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = customIds.has(v.id);
                cb.style.cssText = 'margin-right: 8px; flex-shrink: 0;';
                cb.addEventListener('change', () => {
                    if (cb.checked) {
                        customIds.add(v.id);
                        dbg(`Modal: ${v.code} aangevinkt.`);
                    } else {
                        customIds.delete(v.id);
                        dbg(`Modal: ${v.code} uitgevinkt.`);
                    }
                });

                const codeSpan = document.createElement('span');
                codeSpan.style.cssText = 'font-weight: bold; min-width: 60px; flex-shrink: 0; color: #333;';
                codeSpan.textContent = v.code;

                const labelSpan = document.createElement('span');
                labelSpan.style.cssText = 'color: #555; flex: 1;';
                labelSpan.textContent = v.label;

                // Markeer als al aanwezig in vaste rijen
                if (vasteIds.has(v.id)) {
                    const badge = document.createElement('span');
                    badge.style.cssText = 'font-size: 10px; color: #aaa; margin-left: 6px; flex-shrink: 0;';
                    badge.textContent = '(al in rij 1/2)';
                    rij.appendChild(cb);
                    rij.appendChild(codeSpan);
                    rij.appendChild(labelSpan);
                    rij.appendChild(badge);
                } else {
                    rij.appendChild(cb);
                    rij.appendChild(codeSpan);
                    rij.appendChild(labelSpan);
                }

                lijstContainer.appendChild(rij);
            });
        }

        zoek.addEventListener('input', () => bouwLijst(zoek.value.trim().toLowerCase()));
        bouwLijst('');

        dialog.appendChild(zoek);
        dialog.appendChild(lijstContainer);

        // ── Knoppen onderaan ──
        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; justify-content: flex-end; gap: 6px; margin-top: 10px;';

        const annuleerBtn = document.createElement('button');
        annuleerBtn.type = 'button';
        annuleerBtn.textContent = 'Annuleren';
        annuleerBtn.style.cssText = `
            padding: 4px 12px; font-size: 11px; cursor: pointer;
            background: #fff; border: 1px solid #ccc; border-radius: 3px;
        `;
        annuleerBtn.addEventListener('click', () => {
            dbg('Modal: geannuleerd.');
            overlay.remove();
        });

        const opslaanBtn = document.createElement('button');
        opslaanBtn.type = 'button';
        opslaanBtn.textContent = 'Opslaan';
        opslaanBtn.style.cssText = `
            padding: 4px 12px; font-size: 11px; cursor: pointer;
            background: #17a2b8; color: white; border: 1px solid #17a2b8; border-radius: 3px;
            font-weight: bold;
        `;
        opslaanBtn.addEventListener('click', () => {
            // Sla de nieuwe selectie op (in volgorde van de cache)
            const nieuw = cache.filter(v => customIds.has(v.id));
            dbg(`Modal: opslaan — ${nieuw.length} codes geselecteerd:`, nieuw.map(v => v.code));
            saveCustomVerrichtingen(nieuw);
            overlay.remove();
            herenderEigenRij();
        });

        footer.appendChild(annuleerBtn);
        footer.appendChild(opslaanBtn);
        dialog.appendChild(footer);

        // Sluit bij klik buiten dialog
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                dbg('Modal: gesloten via overlay klik.');
                overlay.remove();
            }
        });

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        dbg('Modal: zichtbaar.');
    }

    // ─── BESTAANDE LOGICA ─────────────────────────────────────────────────────

    function isPageReady(iframeDoc) {
        if (!iframeDoc.contactform) { dbg('isPageReady: geen contactform'); return false; }
        const token = iframeDoc.querySelector('input[name="r_token"]');
        if (!token || !token.value) { dbg('isPageReady: geen r_token'); return false; }
        if (!iframeDoc.getElementById('Script_Verrichting toevoegen')) { dbg('isPageReady: geen "Verrichting toevoegen" knop'); return false; }
        return true;
    }

    function getHuidigeVerrichtingen(iframeDoc) {
        const result = [];
        iframeDoc.querySelectorAll('a[onclick*="deleteContactVerrichting"]').forEach(link => {
            const match = link.getAttribute('onclick').match(/'([^']+)'/);
            if (!match) return;
            const row = link.closest('tr');
            result.push({
                verrichtingId: match[1],
                code: row?.querySelector('td')?.textContent.trim() ?? ''
            });
        });
        return result;
    }

    function checkPendingDeletes(iframeDoc, iframeWin) {
        if (!sessionStorage.getItem(PENDING_CLEANUP_KEY)) return;
        if (!isPageReady(iframeDoc)) return;

        const deleteVerrichtingFn = iframeWin.deleteContactVerrichting;
        if (typeof deleteVerrichtingFn !== 'function') return;

        const skipCode = sessionStorage.getItem(PENDING_SKIP_CODE_KEY) || '';
        const huidige = getHuidigeVerrichtingen(iframeDoc);

        const teVerwijderen = huidige.find(v =>
            v.code !== skipCode && !HANDELING_CODES.has(v.code)
        );

        if (!teVerwijderen) {
            sessionStorage.removeItem(PENDING_CLEANUP_KEY);
            sessionStorage.removeItem(PENDING_SKIP_CODE_KEY);
            dbg('checkPendingDeletes: opruimen klaar.');
            return;
        }

        dbg(`checkPendingDeletes: verwijder code="${teVerwijderen.code}" id="${teVerwijderen.verrichtingId}"`);
        deleteVerrichtingFn(teVerwijderen.verrichtingId);
    }

    function handleVerrichtingClick(verrichting, iframeDoc, iframeWin) {
        const addVerrichtingFn = iframeWin.addVerrichting;
        if (typeof addVerrichtingFn !== 'function') { dbgErr('addVerrichting niet beschikbaar'); return; }

        if (verrichting.type === 'contact') {
            const huidige = getHuidigeVerrichtingen(iframeDoc);
            const erZijnContacttypen = huidige.some(({ code }) => !HANDELING_CODES.has(code));
            if (erZijnContacttypen) {
                dbg(`handleVerrichtingClick: bestaand contacttype aanwezig → cleanup na toevoegen van "${verrichting.code}"`);
                sessionStorage.setItem(PENDING_SKIP_CODE_KEY, verrichting.code);
                sessionStorage.setItem(PENDING_CLEANUP_KEY, '1');
            }
        }

        dbg(`handleVerrichtingClick: addVerrichting("${verrichting.id}") voor code="${verrichting.code}"`);
        addVerrichtingFn(verrichting.id);
    }

    function createVerrichtingButton(verrichting, iframeDoc, iframeWin) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'verrichting-quick-btn';
        btn.textContent = verrichting.code;
        btn.title = verrichting.label + (verrichting.type === 'contact'
            ? '\n(vervangt bestaand contacttype)'
            : '\n(wordt opgestapeld)');
        btn.style.cssText = `
            height: 20px; padding: 0 5px; margin: 0 2px;
            background-color: ${verrichting.color}; color: white;
            border: 1px solid ${verrichting.color}; border-radius: 3px;
            cursor: pointer; font-family: Arial, sans-serif;
            font-size: 11px; font-weight: bold;
            line-height: 20px; vertical-align: middle; white-space: nowrap;
        `;
        btn.addEventListener('mouseenter', () => { btn.style.backgroundColor = verrichting.hover; btn.style.borderColor = verrichting.hover; });
        btn.addEventListener('mouseleave', () => { btn.style.backgroundColor = verrichting.color; btn.style.borderColor = verrichting.color; });
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleVerrichtingClick(verrichting, iframeDoc, iframeWin);
        });
        return btn;
    }

    // ─── INJECT ───────────────────────────────────────────────────────────────

    function inject(iframeDoc, iframeWin) {
        if (iframeDoc.querySelector('.verrichting-quick-buttons')) return true;
        if (typeof iframeWin.addVerrichting !== 'function') {
            dbg('inject: addVerrichting nog niet beschikbaar.');
            return false;
        }

        const headers = Array.from(iframeDoc.querySelectorAll('h2'));
        const verrichtingHeader = headers.find(h =>
            h.textContent.trim() === 'Verrichtingen horende bij dit contact' ||
            h.textContent.trim() === 'Geselecteerde verrichtingen'
        );
        if (!verrichtingHeader) { dbg('inject: verrichting-header niet gevonden.'); return false; }

        const headerTd = verrichtingHeader.closest('td');
        if (!headerTd) { dbg('inject: headerTd niet gevonden.'); return false; }

        dbg('inject: header gevonden, knoppen worden ingevoegd.');

        const container = document.createElement('div');
        container.className = 'verrichting-quick-buttons';
        container.style.cssText = 'margin-bottom: 6px;';

        // ── Rij builder voor vaste rijen ──
        const maakRij = (type, labelTekst) => {
            const rij = document.createElement('div');
            rij.style.cssText = 'white-space: nowrap; margin-bottom: 3px; display: flex; align-items: center;';
            const lbl = document.createElement('span');
            lbl.textContent = labelTekst;
            lbl.style.cssText = 'font-size: 11px; color: #555; margin-right: 4px; font-family: Arial, sans-serif; min-width: 68px; flex-shrink: 0;';
            rij.appendChild(lbl);
            const knoppen = document.createElement('span');
            VERRICHTINGEN.filter(v => v.type === type).forEach(v => {
                knoppen.appendChild(createVerrichtingButton(v, iframeDoc, iframeWin));
            });
            rij.appendChild(knoppen);
            return rij;
        };

        container.appendChild(maakRij('contact',   'Consult:'));
        container.appendChild(maakRij('handeling', 'Verrichting:'));

        // ── Eigen rij ──
        const eigenRij = document.createElement('div');
        eigenRij.className = 'pmh-eigen-rij';
        eigenRij.style.cssText = 'white-space: nowrap; margin-bottom: 3px; display: flex; align-items: center;';
        // Bewaar referenties voor herrender
        eigenRij._iframeDoc = iframeDoc;
        eigenRij._iframeWin = iframeWin;

        const eigenLbl = document.createElement('span');
        eigenLbl.textContent = 'Eigen:';
        eigenLbl.style.cssText = 'font-size: 11px; color: #555; margin-right: 4px; font-family: Arial, sans-serif; min-width: 68px; flex-shrink: 0;';
        eigenRij.appendChild(eigenLbl);

        const eigenKnoppen = document.createElement('span');
        eigenKnoppen.className = 'pmh-eigen-knoppen';
        eigenRij.appendChild(eigenKnoppen);

        // ⚙ Instellingen knop
        const instellingenBtn = document.createElement('button');
        instellingenBtn.type = 'button';
        instellingenBtn.textContent = '⚙';
        instellingenBtn.title = 'Eigen declaratiecodes instellen';
        instellingenBtn.style.cssText = `
            height: 20px; padding: 0 5px; margin: 0 0 0 4px;
            background-color: #6c757d; color: white;
            border: 1px solid #6c757d; border-radius: 3px;
            cursor: pointer; font-size: 12px;
            line-height: 20px; vertical-align: middle;
        `;
        instellingenBtn.addEventListener('mouseenter', () => { instellingenBtn.style.backgroundColor = '#545b62'; });
        instellingenBtn.addEventListener('mouseleave', () => { instellingenBtn.style.backgroundColor = '#6c757d'; });
        instellingenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            dbg('Instellingen knop geklikt.');
            openInstellingenModal();
        });
        eigenRij.appendChild(instellingenBtn);

        container.appendChild(eigenRij);
        headerTd.insertBefore(container, verrichtingHeader);

        // Vul eigen knoppen
        vulEigenKnoppen(eigenKnoppen, iframeDoc, iframeWin);

        dbg('inject: ✓ volledig geïnjecteerd (3 rijen).');
        return true;
    }

    // ─── MAIN LOOP ────────────────────────────────────────────────────────────

    let heeftGeinjected = false;

    function tryInject() {
        const mainFrame = document.querySelector('iframe#panelBackCompatibility-frame');
        if (!mainFrame) return false;

        let mainDoc, mainWin;
        try {
            mainWin = mainFrame.contentWindow;
            mainDoc = mainFrame.contentDocument || mainWin.document;
        } catch (e) {
            dbgErr('tryInject: toegang tot iframe geblokkeerd:', e);
            return false;
        }

        if (!mainDoc || !mainDoc.body) return false;

        const hasVerrichtingHeader =
            mainDoc.body.textContent.includes('Verrichtingen horende bij dit contact') ||
            mainDoc.body.textContent.includes('Geselecteerde verrichtingen');
        const iframeUrl = mainWin.location?.href || '';
        const isVerrichtingenBeheer = iframeUrl.includes('admin.onderhoud.patienten.verrichtingen');

        if (!hasVerrichtingHeader && !isVerrichtingenBeheer) {
            if (heeftGeinjected) {
                dbg('tryInject: pagina veranderd, reset inject-vlag.');
                heeftGeinjected = false;
                cacheRefreshGestart = false; // ook cache refresh resetten voor volgende pagina
            }
            return false;
        }

        const injected = inject(mainDoc, mainWin);

        if (injected && !heeftGeinjected) {
            heeftGeinjected = true;
            dbg('tryInject: inject geslaagd, start achtergrond cache refresh.');
            // Start cache refresh op de achtergrond — blokkeer inject niet
            refreshVerrichtingCache(mainDoc).catch(e => dbgErr('Cache refresh onverwachte fout:', e));
        }

        checkPendingDeletes(mainDoc, mainWin);
        return injected;
    }

    function init() {
        dbg('init: interval gestart (800ms).');
        setInterval(() => { tryInject(); }, 800);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
