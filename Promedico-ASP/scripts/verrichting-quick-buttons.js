(function() {
    'use strict';

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
        { id: '1063', code: 'CRP',  pmCode: 'CRPCAS', label: 'Materiaalkosten CRP-sneltest',       color: '#f0ad4e', hover: '#ec971f', type: 'handeling' },
        { id: '283',  code: 'MMSE',               label: 'Cognitieve functietest (MMSE)',      color: '#e67e22', hover: '#ca6f1e', type: 'handeling' },
        { id: '265',  code: 'DIP',                label: 'Materiaalkosten dipslides',          color: '#f0ad4e', hover: '#ec971f', type: 'handeling' },
        { id: '267',  code: 'STI',                label: 'Materiaalkosten vloeibaar stikstof', color: '#f0ad4e', hover: '#ec971f', type: 'handeling' },
        { id: '285',  code: 'CHI',                label: 'Chirurgie',                          color: '#e67e22', hover: '#ca6f1e', type: 'handeling' },
        { id: '296',  code: 'INJ',  pmCode: 'COR',    label: 'Therapeutische injectie (Cyriax)',   color: '#e67e22', hover: '#ca6f1e', type: 'handeling' },
        { id: '279',  code: 'ECG',                label: 'ECG-diagnostiek',                    color: '#e67e22', hover: '#ca6f1e', type: 'handeling' },
    ];

    const HANDELING_CODES = new Set([
        ...VERRICHTINGEN.filter(v => v.type === 'handeling').map(v => v.pmCode || v.code),
        'BC', 'BCU', 'BSS', 'HM', 'TAP', 'ZWT', 'VAK', 'VACP', 'ROOKG',
        'ECG', 'SPI', 'TYM', 'DOP', 'HOLT', 'HYPT', 'MRSA', 'OOGB',
        'COM', 'IUD', 'POFA', 'PACT', 'PACV', 'EUT', 'GHMO', 'GHVZ', 'VIDK',
    ]);

    const PENDING_DELETES_KEY = 'pmh_pending_deletes';
    const PENDING_SKIP_ID_KEY = 'pmh_pending_skip_id';

    function isPageReady(iframeDoc) {
        if (!iframeDoc.contactform) return false;
        const token = iframeDoc.querySelector('input[name="r_token"]');
        if (!token || !token.value) return false;
        if (!iframeDoc.getElementById('Script_Verrichting toevoegen')) return false;
        if (!iframeDoc.querySelector('.verrichting-quick-buttons')) return false;
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
        const raw = sessionStorage.getItem(PENDING_DELETES_KEY);
        if (!raw) return;

        if (!isPageReady(iframeDoc)) return;

        let queue;
        try { queue = JSON.parse(raw); } catch(e) { sessionStorage.removeItem(PENDING_DELETES_KEY); return; }
        if (!queue.length) { sessionStorage.removeItem(PENDING_DELETES_KEY); return; }

        const deleteVerrichtingFn = iframeWin.deleteContactVerrichting;
        if (typeof deleteVerrichtingFn !== 'function') return;

        const skipId = sessionStorage.getItem(PENDING_SKIP_ID_KEY);
        const huidige = getHuidigeVerrichtingen(iframeDoc);
        const aanwezigeIds = new Set(huidige.map(v => v.verrichtingId));
        const nogTeVerwijderen = queue.filter(id => aanwezigeIds.has(id) && id !== skipId);

        if (!nogTeVerwijderen.length) {
            sessionStorage.removeItem(PENDING_DELETES_KEY);
            sessionStorage.removeItem(PENDING_SKIP_ID_KEY);
            return;
        }

        const [first, ...rest] = nogTeVerwijderen;
        if (rest.length) {
            sessionStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(rest));
        } else {
            sessionStorage.removeItem(PENDING_DELETES_KEY);
            sessionStorage.removeItem(PENDING_SKIP_ID_KEY);
        }
        deleteVerrichtingFn(first);
    }

    function handleVerrichtingClick(verrichting, iframeDoc, iframeWin) {
        const addVerrichtingFn = iframeWin.addVerrichting;
        if (typeof addVerrichtingFn !== 'function') return;

        if (verrichting.type === 'contact') {
            const huidige = getHuidigeVerrichtingen(iframeDoc);
            const teVerwijderen = huidige
                .filter(({ code }) => !HANDELING_CODES.has(code))
                .map(({ verrichtingId }) => verrichtingId);

            if (teVerwijderen.length) {
                sessionStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(teVerwijderen));
                sessionStorage.setItem(PENDING_SKIP_ID_KEY, verrichting.id);
            }
        }

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
            height: 24px; padding: 0 6px; margin: 0 2px;
            background-color: ${verrichting.color}; color: white;
            border: 1px solid ${verrichting.color}; border-radius: 3px;
            cursor: pointer; font-family: Arial, sans-serif;
            font-size: 12px; font-weight: bold;
            line-height: 24px; vertical-align: middle; white-space: nowrap;
        `;
        btn.addEventListener('mouseenter', () => { btn.style.backgroundColor = verrichting.hover; btn.style.borderColor = verrichting.hover; });
        btn.addEventListener('mouseleave', () => { btn.style.backgroundColor = verrichting.color; btn.style.borderColor = verrichting.color; });
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleVerrichtingClick(verrichting, iframeDoc, iframeWin);
        });
        return btn;
    }

    function inject(iframeDoc, iframeWin) {
        if (iframeDoc.querySelector('.verrichting-quick-buttons')) return true;
        if (typeof iframeWin.addVerrichting !== 'function') return false;

        const headers = Array.from(iframeDoc.querySelectorAll('h2'));
        const verrichtingHeader = headers.find(h => h.textContent.trim() === 'Verrichtingen horende bij dit contact' || h.textContent.trim() === 'Geselecteerde verrichtingen');
        if (!verrichtingHeader) return false;

        const headerTd = verrichtingHeader.closest('td');
        if (!headerTd) return false;

        const container = document.createElement('div');
        container.className = 'verrichting-quick-buttons';
        container.style.cssText = 'margin-bottom: 6px; white-space: nowrap;';

        const label = document.createElement('span');
        label.textContent = 'Snel: ';
        label.style.cssText = 'font-size: 11px; color: #555; margin-right: 4px; vertical-align: middle; font-family: Arial, sans-serif;';
        container.appendChild(label);

        VERRICHTINGEN.forEach(v => {
            container.appendChild(createVerrichtingButton(v, iframeDoc, iframeWin));
        });

        headerTd.insertBefore(container, verrichtingHeader);
        return true;
    }

    function tryInject() {
        const mainFrame = document.querySelector('iframe#panelBackCompatibility-frame');
        if (!mainFrame) return false;

        let mainDoc, mainWin;
        try {
            mainWin = mainFrame.contentWindow;
            mainDoc = mainFrame.contentDocument || mainWin.document;
        } catch (e) {
            return false;
        }

        if (!mainDoc || !mainDoc.body) return false;

        // Detecteer de pagina via iframe-inhoud, niet via src-attribuut
        // (src kan relatief of leeg zijn afhankelijk van hoe Promedico het laadt)
        const hasVerrichtingHeader = mainDoc.body.textContent.includes('Verrichtingen horende bij dit contact') || mainDoc.body.textContent.includes('Geselecteerde verrichtingen');
        const iframeUrl = mainWin.location?.href || '';
        const isVerrichtingenBeheer = iframeUrl.includes('admin.onderhoud.patienten.verrichtingen');

        if (!hasVerrichtingHeader && !isVerrichtingenBeheer) return false;

        inject(mainDoc, mainWin);
        checkPendingDeletes(mainDoc, mainWin);

        return true;
    }

    function init() {
        setInterval(() => { tryInject(); }, 800);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();