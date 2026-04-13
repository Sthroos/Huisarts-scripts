// ==UserScript==
// @name         Promedico SOEP Measurements
// @namespace    promedico-soep
// @version      5.0.0
// @description  Metingen panel in SOEP journaal met automatisch opslaan via fetch
// @match        https://www.promedico-asp.nl/promedico/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // =============================================================================
    // CONFIGURATION
    // =============================================================================
    const CONFIG = {
        PANEL_INSERT_POLL_MS:  100,
        PANEL_INSERT_MAX_MS:   10000,
        FETCH_TIMEOUT_MS:      15000,
    };

    const BASE_URL = 'https://www.promedico-asp.nl/promedico/medischdossier.meetwaarden.losseuitslag.m';

    // Promedico bepaling IDs - aanpassen als nodig voor jouw installatie
    const BEPALING_IDS = {
        'gewicht':          '10356',
        'lengte':           '10559',
        'bmi':              '11271',
        'bovendruk':        '11740',
        'onderdruk':        '11736',
        'pols':             '11864',
        'temperatuur':      '11356',
        'saturatie':        '12649',
        'crp':            '653256968453140',
        'glucose_nn':     '653256968453091',
        'glucose_nuchter':'653256968453090'
    };

    // Alleen invoervelden (BMI is berekend, geen eigen invoer)
    // bloeddruk: speciaal gecombineerd veld, geen eigen entry hier
    const MEASUREMENTS = [
        { id: 'gewicht',         label: 'Gewicht',          unit: 'kg',    placeholder: 'kg',    min: 0.5, max: 500,  decimals: 1 },
        { id: 'lengte',          label: 'Lengte',           unit: 'cm',    placeholder: 'cm',    min: 20,  max: 250,  decimals: 0 },
        { id: 'bovendruk',       label: 'RR Systolisch',    unit: 'mmHg',  placeholder: 'mmHg',  min: 40,  max: 300,  decimals: 0 },
        { id: 'onderdruk',       label: 'RR Diastolisch',   unit: 'mmHg',  placeholder: 'mmHg',  min: 20,  max: 200,  decimals: 0 },
        { id: 'pols',            label: 'Pols',             unit: '/min',  placeholder: '/min',  min: 20,  max: 300,  decimals: 0 },
        { id: 'saturatie',       label: 'Saturatie',        unit: '%',     placeholder: '%',     min: 50,  max: 100,  decimals: 0 },
        { id: 'temperatuur',     label: 'Temperatuur',      unit: '°C',    placeholder: '°C',    min: 30,  max: 45,   decimals: 1 },
        { id: 'crp',     label: 'CRP',     unit: 'mg/L',   placeholder: 'mg/L',   min: 0, max: 500, decimals: 1 },
        { id: 'glucose', label: 'Glucose', unit: 'mmol/L', placeholder: 'mmol/L', min: 1, max: 40,  decimals: 1 }
    ];

    const STORAGE_KEY  = 'promedico_measurements';
    const PATIENT_KEY  = 'promedico_patient_id';

    let measurementValues = {};
    let _submitting = false;

    // =============================================================================
    // BMI
    // =============================================================================
    function calcBMI(gewicht, lengte) {
        const g = parseFloat(gewicht);
        const l = parseFloat(lengte);
        if (!g || !l || l <= 0) return null;
        const bmi = g / ((l / 100) * (l / 100));
        return Math.round(bmi * 10) / 10; // 1 decimal
    }

    function updateBMIDisplay(panel) {
        const g = measurementValues['gewicht'];
        const l = measurementValues['lengte'];
        const bmi = calcBMI(g, l);
        const bmiEl = panel ? panel.querySelector('#bmi-display') : document.getElementById('bmi-display');
        if (!bmiEl) return;
        if (bmi !== null) {
            bmiEl.textContent = `BMI: ${bmi}`;
            bmiEl.style.color = bmi < 18.5 || bmi >= 30 ? '#dc3545' : bmi >= 25 ? '#fd7e14' : '#28a745';
        } else {
            bmiEl.textContent = '';
        }
    }

    // =============================================================================
    // STORAGE
    // =============================================================================
    function sg(k)     { try { return sessionStorage.getItem(k); } catch(e) { return null; } }
    function ss(k, v)  { try { sessionStorage.setItem(k, v); } catch(e) {} }
    function sr(k)     { try { sessionStorage.removeItem(k); } catch(e) {} }

    function saveMeasurements(obj)  { ss(STORAGE_KEY, JSON.stringify(obj)); }
    function loadMeasurements()     { try { return JSON.parse(sg(STORAGE_KEY) || '{}'); } catch(e) { return {}; } }
    function clearMeasurements()    { measurementValues = {}; sr(STORAGE_KEY); }

    // =============================================================================
    // PATIENT ID
    // =============================================================================
    function getPatientId() {
        const stored = sg(PATIENT_KEY);
        if (stored) return stored;
        // Try to extract from URL or page
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('patientId') || params.get('patient.id');
        if (fromUrl) { ss(PATIENT_KEY, fromUrl); return fromUrl; }
        // Try from page content
        const match = document.body.innerHTML.match(/callSetSelectedPatientId\(['"]([^'"]+)['"]\)/);
        if (match) { ss(PATIENT_KEY, match[1]); return match[1]; }
        return null;
    }

    // =============================================================================
    // DATE
    // =============================================================================
    function getTodayStr() {
        const d = new Date();
        return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
    }

    // =============================================================================
    // VALIDATION
    // =============================================================================
    function validateMeasurement(id, value) {
        const m = MEASUREMENTS.find(x => x.id === id);
        if (!m) return { valid: false, error: 'Onbekende meting' };
        const num = parseFloat(value);
        if (isNaN(num)) return { valid: false, error: 'Geen geldig getal' };
        if (num < m.min || num > m.max) return { valid: false, error: `Moet tussen ${m.min} en ${m.max} zijn` };
        const clean = m.decimals > 0 ? String(Math.round(num * 10) / 10) : String(Math.round(num));
        return { valid: true, cleanValue: clean };
    }

    // =============================================================================
    // URL CLASSIFICATION - alleen SOEP pagina
    // =============================================================================
    function isSOEPPage() {
        const href = window.location.href;
        if (href.includes('losseuitslag'))  return false;
        if (href.includes('meetwaarden'))   return false;
        if (href.includes('bewaardossier')) return true;
        if (href.includes('wisseldossier')) return true;
        if (href.includes('journaal.contact')) return true;
        if (href.includes('journaal'))      return true;
        return false;
    }

    // =============================================================================
    // FETCH SUBMISSION
    // =============================================================================
    async function fetchWithTimeout(url, options, timeoutMs) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const resp = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timer);
            return resp;
        } catch(e) {
            clearTimeout(timer);
            throw e;
        }
    }

    async function submitOneMeasurementViaFetch(measurementId, value) {
        const m = MEASUREMENTS.find(x => x.id === measurementId) || { label: measurementId };
        const bepalingId = BEPALING_IDS[measurementId];
        const patientId  = getPatientId();
        const dateStr    = getTodayStr();

        if (!bepalingId) return { ok: false, error: `Geen bepaling ID voor ${measurementId}` };
        if (!patientId)  return { ok: false, error: 'Geen patient ID' };

        const body = new URLSearchParams({
            'controllerAction':          'save',
            'bepaling.id':               bepalingId,
            'uitslag.datum':             dateStr,
            'uitslag.waarde':            value,
            'uitslag.opmerking':         '',
            'uitslag.referentieMinimum': '',
            'uitslag.referentieMaximum': ''
        });

        try {
            const resp = await fetchWithTimeout(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                credentials: 'include',
                redirect: 'manual',
                body: body.toString()
            }, CONFIG.FETCH_TIMEOUT_MS);

            // 302 redirect (opaqueredirect with redirect:'manual') = success
            const saved = resp.type === 'opaqueredirect' || resp.status === 0 || resp.status === 302 || resp.ok;
            if (!saved) return { ok: false, error: `HTTP ${resp.status}` };
            return { ok: true };
        } catch(e) {
            return { ok: false, error: e.message };
        }
    }

    // =============================================================================
    // SUBMIT ALL
    // =============================================================================
    async function submitAllMeasurements() {
        if (_submitting) return;
        _submitting = true;

        // Build list: regular measurements + auto-calculated BMI
        const toSubmit = [];
        for (const [id, val] of Object.entries(measurementValues)) {
            const v = validateMeasurement(id, val);
            if (v.valid) toSubmit.push({ id, value: v.cleanValue });
        }

        // Add BMI if both gewicht and lengte are valid
        const bmi = calcBMI(measurementValues['gewicht'], measurementValues['lengte']);
        if (bmi !== null && BEPALING_IDS['bmi']) {
            toSubmit.push({ id: 'bmi', value: String(bmi) });
        }

        if (toSubmit.length === 0) { _submitting = false; return; }

        showNotification(`${toSubmit.length} meting(en) opslaan...`, 'info');

        const results = [];
        for (const item of toSubmit) {
            const result = await submitOneMeasurementViaFetch(item.id, item.value);
            results.push({ ...item, ...result });
            await sleep(200);
        }

        const failed  = results.filter(r => !r.ok);
        const success = results.filter(r => r.ok);

        if (failed.length === 0) {
            showNotification(`✅ Alle ${success.length} meting(en) opgeslagen!`, 'success');
            clearMeasurements();
            updatePanelUI();
        } else {
            showNotification(`⚠️ ${success.length} ok, ${failed.length} mislukt: ${failed.map(f=>f.id).join(', ')}`, 'warning');
        }

        function buildOMeasurementString(submittedItems) {
            const parts = [];
            const g = submittedItems.find(i => i.id === 'gewicht');
            const l = submittedItems.find(i => i.id === 'lengte');
            const boven = submittedItems.find(i => i.id === 'bovendruk');
            const onder = submittedItems.find(i => i.id === 'onderdruk');
            const pols = submittedItems.find(i => i.id === 'pols');
            const temp = submittedItems.find(i => i.id === 'temperatuur');
            const sat = submittedItems.find(i => i.id === 'saturatie');
            const bmi = calcBMI(g?.value, l?.value);

            const crp    = submittedItems.find(i => i.id === 'crp');
            const glucN  = submittedItems.find(i => i.id === 'glucose_nuchter');
            const glucNN = submittedItems.find(i => i.id === 'glucose_nn');
            const gluc   = glucN || glucNN; // één van beide, afhankelijk van checkbox

            if (g) parts.push(`${g.value} kg`);
            if (l) parts.push(`${l.value} cm`);
            if (bmi) parts.push(`BMI ${String(bmi).replace('.', ',')}`);
            if (boven && onder) parts.push(`RR ${boven.value}/${onder.value}`);
            else if (boven) parts.push(`RR ${boven.value}/-`);
            else if (onder) parts.push(`RR -/${onder.value}`);
            if (pols) parts.push(`pols ${pols.value}`);
            if (sat) parts.push(`sat ${sat.value}%`);
            if (temp) parts.push(`temp ${temp.value.replace('.', ',')}°C`);
            if (crp)   parts.push(`CRP ${crp.value.replace('.', ',')} mg/L`);
            if (glucN)  parts.push(`glucose nuchter ${glucN.value.replace('.', ',')} mmol/L`);
            if (glucNN) parts.push(`glucose niet-nuchter ${glucNN.value.replace('.', ',')} mmol/L`);

            return parts.join(', ');
        }

        function prependToOField(text) {
            const oField = document.querySelector('textarea[name="contactForm.regelO"]');
            if (!oField || !text) return;
            const existing = oField.value.trim();
            oField.value = existing ? `${text}\n${existing}` : text;
        }

        // Refresh GWT uitslagen overview
        if (success.length > 0) {
            const oString = buildOMeasurementString(success);
            prependToOField(oString);
            try {
                if (window.parent && window.parent.callGWTRedirect) {
                    window.parent.callGWTRedirect('medischdossier.meetwaarden.uitslagen');
                }
            } catch(e) {}
        }

        _submitting = false;
        return results;
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // =============================================================================
    // FORM / BUTTON INTERCEPT
    // =============================================================================
    function interceptForm(form) {
        if (form._pmIntercepted) return;
        form._pmIntercepted = true;

        const originalSubmit = HTMLFormElement.prototype.submit.bind(form);
        form.submit = function() {
            const action = new URLSearchParams(new FormData(form)).get('controllerAction') || '';
            handleFormSubmit(action, originalSubmit);
        };

        form.addEventListener('submit', function(e) {
            const action = new URLSearchParams(new FormData(form)).get('controllerAction') || '';
            if (Object.keys(measurementValues).length > 0) {
                e.preventDefault();
                e.stopImmediatePropagation();
                handleFormSubmit(action, () => HTMLFormElement.prototype.submit.call(form));
            }
        }, true);
    }

    function handleFormSubmit(action, proceedFn) {
        const hasMeasurements = Object.keys(measurementValues).length > 0;
        const saveTriggers = ['naarafronden', 'opslaan', 'save', ''];
        if (hasMeasurements && saveTriggers.some(t => action.toLowerCase().includes(t))) {
            submitAllMeasurements().then(() => {
                setTimeout(proceedFn, 300);
            });
        } else {
            proceedFn();
        }
    }

    function interceptSaveButtons() {
        const selectors = [
            'input[value="Opslaan"]',
            'input[value="Opslaan en factureren"]',
            'input[value="Verder"]',
            'input[id="Script_Verder"]',
        ];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(btn => {
                if (btn.dataset.pmPassthrough) return;
                if (btn._pmIntercepted) return;
                btn._pmIntercepted = true;

                btn.addEventListener('click', async (e) => {
                    const hasMeasurements = Object.keys(measurementValues).length > 0;
                    if (hasMeasurements && !btn.dataset.pmPassthrough) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        await submitAllMeasurements();
                        btn.dataset.pmPassthrough = '1';
                        setTimeout(() => {
                            delete btn.dataset.pmPassthrough;
                            btn.click();
                        }, 300);
                    }
                }, true);
            });
        });
    }

    function startFormAndButtonWatcher() {
        const observer = new MutationObserver(() => {
            document.querySelectorAll('form').forEach(interceptForm);
            interceptSaveButtons();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        document.querySelectorAll('form').forEach(interceptForm);
        interceptSaveButtons();
    }

    // =============================================================================
    // PANEL - UI
    // =============================================================================
    function shouldShowPanel() {
        if (window.self === window.top) return false;
        return isSOEPPage();
    }

    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'soep-measurements-panel';
        panel.style.cssText = 'margin: 10px 0; width: 100%; box-sizing: border-box;';

        // Helper: maak een standaard invoercel
        function makeField(m) {
            return `
                <div style="display:flex; align-items:center; gap:4px;">
                    <label for="measurement-${m.id}"
                           style="font-size:12px; white-space:nowrap; color:#333;">${m.label}:</label>
                    <input type="text" id="measurement-${m.id}"
                           data-measurement-id="${m.id}"
                           placeholder="${m.placeholder}"
                           style="width:60px; padding:4px 5px; border:1px solid #ccc;
                                  border-radius:3px; font-size:13px; box-sizing:border-box;" />
                    <span id="validation-${m.id}" style="font-size:12px; min-width:14px; color:#666;"></span>
                </div>`;
        }

        // Drie losse flex-rijen. Elk veld heeft een vaste totaalbreedte (W).
        // Labels zijn allemaal even breed (LW, rechts uitgelijnd) zodat invulvelden
        // exact boven elkaar staan per kolom.
        //
        // Rij 1: Sat.(W)  RR-blok(2W)            Pols(W)
        // Rij 2: Temp.(W) CRP(W)  Gluc.nuchter(W) Gluc.n.-nuchter(W)
        // Rij 3: Gewicht(W) Lengte(W) BMI
        //
        // W  = totale celbreedte
        // LW = labelbreedte (vast, rechts uitgelijnd)
        // IW = inputbreedte
        const W  = 155;   // px totaal per cel
        const LW = 68;    // px label
        const IW = 56;    // px input

        const rowStyle  = 'display:flex; align-items:center; gap:0; margin-bottom:5px;';
        const cellStyle = `display:inline-flex; align-items:center; gap:4px; width:${W}px; flex-shrink:0;`;
        const lblStyle  = `font-size:12px; color:#333; width:${LW}px; text-align:right; flex-shrink:0; white-space:nowrap;`;
        const inpStyle  = `width:${IW}px; padding:3px 4px; border:1px solid #ccc; border-radius:3px; font-size:13px; box-sizing:border-box; flex-shrink:0;`;
        const valStyle  = 'font-size:12px; width:14px; flex-shrink:0; color:#666;';

        function mkField(m) {
            return `<div style="${cellStyle}">
                <label for="measurement-${m.id}" style="${lblStyle}">${m.label}:</label>
                <input type="text" id="measurement-${m.id}" data-measurement-id="${m.id}"
                       placeholder="${m.placeholder}" style="${inpStyle}" />
                <span id="validation-${m.id}" style="${valStyle}"></span>
            </div>`;
        }

        // RR-blok: breedte = 2*W, label even breed als andere labels zodat kolom 1 uitlijnt
        const rrBlok = `<div style="display:inline-flex; align-items:center; gap:4px; width:${W*2}px; flex-shrink:0;">
                <label style="${lblStyle}">RR:</label>
                <input type="text" id="measurement-bovendruk" data-measurement-id="bovendruk"
                       placeholder="sys" style="${inpStyle}" />
                <span style="font-size:13px; color:#888; flex-shrink:0;">/</span>
                <input type="text" id="measurement-onderdruk" data-measurement-id="onderdruk"
                       placeholder="dia" style="${inpStyle}" />
                <span style="font-size:11px; color:#aaa; flex-shrink:0; margin-left:2px;">mmHg</span>
                <span id="validation-rr" style="${valStyle}"></span>
            </div>`;

        const rij1 = `<div style="${rowStyle}">
            ${mkField({id:'saturatie',      label:'Sat.',  placeholder:'%'})}
            ${rrBlok}
            ${mkField({id:'pols',           label:'Pols',  placeholder:'/min'})}
        </div>`;

        const rij2 = `<div style="${rowStyle}">
            ${mkField({id:'temperatuur', label:'Temp.', placeholder:'°C'})}
            ${mkField({id:'crp',        label:'CRP',   placeholder:'mg/L'})}
            <div style="display:inline-flex; align-items:center; gap:4px; flex-shrink:0;">
                <label for="measurement-glucose" style="${lblStyle}">Glucose:</label>
                <input type="text" id="measurement-glucose" data-measurement-id="glucose"
                       placeholder="mmol/L"
                       style="${inpStyle}" />
                <span id="validation-glucose" style="${valStyle}"></span>
                <label style="display:inline-flex; align-items:center; gap:3px; font-size:12px; color:#555; cursor:pointer; margin-left:2px; white-space:nowrap;">
                    <input type="checkbox" id="glucose-nuchter-cb" style="margin:0; cursor:pointer;" />
                    nuchter
                </label>
            </div>
        </div>`;

        const rij3 = `<div style="${rowStyle}">
            ${mkField({id:'gewicht', label:'Gewicht', placeholder:'kg'})}
            ${mkField({id:'lengte',  label:'Lengte',  placeholder:'cm'})}
            <span id="bmi-display" style="font-size:12px; font-weight:bold; margin-left:6px;"></span>
        </div>`;

        const grid = rij1 + rij2 + rij3;

        panel.innerHTML = `
            <div id="measurements-header" style="
                padding: 8px 12px;
                background: linear-gradient(to right, #0275d8, #0056b3);
                color: white; border-radius: 4px; cursor: pointer;
                display: flex; align-items: center; justify-content: space-between;
                user-select: none; font-family: Arial, sans-serif;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span>📊</span>
                    <strong>Metingen</strong>
                    <span id="measurements-count" style="font-size:11px; opacity:0.9;"></span>
                </div>
                <span id="measurements-toggle" style="font-size:18px; transition:transform 0.3s;">▼</span>
            </div>
            <div id="measurements-content" style="
                display: none; padding: 12px;
                background: #f0f8ff; border: 1px solid #0275d8;
                border-top: none; border-radius: 0 0 4px 4px;
                margin-top: -4px; font-family: Arial, sans-serif;">
                ${grid}
                <div style="display:flex; gap:8px; margin-top:8px; padding-top:8px;
                            border-top:1px solid #d0e8f7; align-items:center;">
                    <button id="measurements-save-now" type="button" style="
                        padding:4px 12px; background:#28a745; color:white;
                        border:none; border-radius:3px; cursor:pointer; font-size:12px;">
                        💾 Nu metingen opslaan
                    </button>
                    <button id="measurements-clear" type="button" style="
                        padding:4px 12px; background:#dc3545; color:white;
                        border:none; border-radius:3px; cursor:pointer; font-size:12px;">
                        🗑️ Wissen
                    </button>
                    <span style="font-size:11px; color:#666;">
                        💡 Automatisch opgeslagen bij Opslaan/Verder klikken
                    </span>
                </div>
            </div>
        `;

        return panel;
    }

    function setupPanelListeners(panel) {
        const header  = panel.querySelector('#measurements-header');
        const content = panel.querySelector('#measurements-content');
        const toggle  = panel.querySelector('#measurements-toggle');

        header.addEventListener('click', () => {
            const vis = content.style.display === 'block';
            content.style.display = vis ? 'none' : 'block';
            toggle.style.transform = vis ? 'rotate(0deg)' : 'rotate(180deg)';
        });

        panel.querySelector('#measurements-save-now').addEventListener('click', () => {
            submitAllMeasurements();
        });

        panel.querySelector('#measurements-clear').addEventListener('click', () => {
            clearMeasurements();
            updatePanelUI();
            showNotification('Metingen gewist', 'info');
        });

        // Bloeddruk apart: één gecombineerd vinkje voor sys+dia samen
        function updateRRValidation() {
            const bInput = panel.querySelector('#measurement-bovendruk');
            const oInput = panel.querySelector('#measurement-onderdruk');
            const rrSpan = panel.querySelector('#validation-rr');
            if (!bInput || !oInput || !rrSpan) return;

            const bVal = bInput.value.trim();
            const oVal = oInput.value.trim();

            // Geen van beide ingevuld: leeg
            if (!bVal && !oVal) {
                rrSpan.textContent = '';
                bInput.style.borderColor = '#ccc';
                oInput.style.borderColor = '#ccc';
                return;
            }

            const mB = MEASUREMENTS.find(x => x.id === 'bovendruk');
            const mO = MEASUREMENTS.find(x => x.id === 'onderdruk');
            let allOk = true;

            if (bVal) {
                const vB = validateMeasurement('bovendruk', bVal);
                if (vB.valid) {
                    measurementValues['bovendruk'] = vB.cleanValue;
                    bInput.style.borderColor = '#28a745';
                } else {
                    delete measurementValues['bovendruk'];
                    bInput.style.borderColor = '#dc3545';
                    allOk = false;
                }
            } else {
                delete measurementValues['bovendruk'];
                bInput.style.borderColor = '#ccc';
            }

            if (oVal) {
                const vO = validateMeasurement('onderdruk', oVal);
                if (vO.valid) {
                    measurementValues['onderdruk'] = vO.cleanValue;
                    oInput.style.borderColor = '#28a745';
                } else {
                    delete measurementValues['onderdruk'];
                    oInput.style.borderColor = '#dc3545';
                    allOk = false;
                }
            } else {
                delete measurementValues['onderdruk'];
                oInput.style.borderColor = '#ccc';
            }

            // Één vinkje: ✓ als alles wat ingevuld is geldig is, ✗ als er iets fout is
            const anyFilled = bVal || oVal;
            if (anyFilled) {
                rrSpan.textContent = allOk ? '✓' : '✗';
                rrSpan.style.color  = allOk ? '#28a745' : '#dc3545';
            } else {
                rrSpan.textContent = '';
            }

            saveMeasurements(measurementValues);
            updateCountBadge();
        }

        const bInput = panel.querySelector('#measurement-bovendruk');
        const oInput = panel.querySelector('#measurement-onderdruk');
        if (bInput) {
            // Herstel opgeslagen waarden
            if (measurementValues['bovendruk']) {
                bInput.value = measurementValues['bovendruk'];
            }
            bInput.addEventListener('input', () => {
                bInput.value = bInput.value.replace(/[,.]/g, '');
                updateRRValidation();
            });
        }
        if (oInput) {
            if (measurementValues['onderdruk']) {
                oInput.value = measurementValues['onderdruk'];
            }
            oInput.addEventListener('input', () => {
                oInput.value = oInput.value.replace(/[,.]/g, '');
                updateRRValidation();
            });
        }
        // Herstel vinkje als er al waarden zijn
        updateRRValidation();

        // Glucose: één veld, bepaling-ID afhankelijk van checkbox
        const glucoseInput = panel.querySelector('#measurement-glucose');
        const glucoseCb    = panel.querySelector('#glucose-nuchter-cb');
        const glucoseVal   = panel.querySelector('#validation-glucose');

        function getGlucoseKey() {
            return glucoseCb && glucoseCb.checked ? 'glucose_nuchter' : 'glucose_nn';
        }

        function updateGlucose() {
            if (!glucoseInput) return;
            // Verwijder beide mogelijke keys eerst
            delete measurementValues['glucose_nuchter'];
            delete measurementValues['glucose_nn'];

            let val = glucoseInput.value.replace(',', '.').trim();
            if (!val) {
                if (glucoseVal) { glucoseVal.textContent = ''; }
                glucoseInput.style.borderColor = '#ccc';
                saveMeasurements(measurementValues);
                updateCountBadge();
                return;
            }

            const m = MEASUREMENTS.find(x => x.id === 'glucose');
            const v = m ? validateMeasurement('glucose', val) : { valid: false };
            if (v.valid) {
                measurementValues[getGlucoseKey()] = v.cleanValue;
                glucoseInput.style.borderColor = '#28a745';
                if (glucoseVal) { glucoseVal.textContent = '✓'; glucoseVal.style.color = '#28a745'; }
            } else {
                glucoseInput.style.borderColor = '#dc3545';
                if (glucoseVal) { glucoseVal.textContent = '✗'; glucoseVal.style.color = '#dc3545'; }
            }
            saveMeasurements(measurementValues);
            updateCountBadge();
        }

        if (glucoseInput) {
            // Herstel opgeslagen waarde
            const savedGluc = measurementValues['glucose_nuchter'] || measurementValues['glucose_nn'];
            if (savedGluc) {
                glucoseInput.value = savedGluc;
                glucoseInput.style.borderColor = '#28a745';
                if (glucoseVal) { glucoseVal.textContent = '✓'; glucoseVal.style.color = '#28a745'; }
                if (glucoseCb) glucoseCb.checked = !!measurementValues['glucose_nuchter'];
            }
            glucoseInput.addEventListener('input', () => {
                glucoseInput.value = glucoseInput.value.replace(',', '.');
                updateGlucose();
            });
        }
        if (glucoseCb) {
            glucoseCb.addEventListener('change', updateGlucose);
        }

        // Alle andere metingen (niet bovendruk/onderdruk/glucose) via standaard listener
        MEASUREMENTS.filter(m => m.id !== 'bovendruk' && m.id !== 'onderdruk' && m.id !== 'glucose').forEach(m => {
            const input = panel.querySelector(`#measurement-${m.id}`);
            const vSpan = panel.querySelector(`#validation-${m.id}`);
            if (!input) return;

            if (measurementValues[m.id]) {
                input.value = measurementValues[m.id];
                vSpan.textContent = '✓';
                vSpan.style.color = '#28a745';
                input.style.borderColor = '#28a745';
            }

            input.addEventListener('input', () => {
                let val = input.value;
                if (m.decimals > 0) val = val.replace(',', '.');
                else val = val.replace(/[,.]/g, '');
                if (input.value !== val) input.value = val;
                val = val.trim();

                if (!val) {
                    delete measurementValues[m.id];
                    vSpan.textContent = '';
                    input.style.borderColor = '#ccc';
                    saveMeasurements(measurementValues);
                    updateCountBadge();
                    updateBMIDisplay(panel);
                    return;
                }

                const v = validateMeasurement(m.id, val);
                if (v.valid) {
                    measurementValues[m.id] = v.cleanValue;
                    vSpan.textContent = '✓';
                    vSpan.style.color = '#28a745';
                    input.style.borderColor = '#28a745';
                    input.title = '';
                } else {
                    delete measurementValues[m.id];
                    vSpan.textContent = '✗';
                    vSpan.style.color = '#dc3545';
                    input.style.borderColor = '#dc3545';
                    input.title = v.error;
                }
                saveMeasurements(measurementValues);
                updateCountBadge();
                updateBMIDisplay(panel);
            });
        });

        updateCountBadge();
        updateBMIDisplay(panel);
    }

    function updateCountBadge() {
        const badge = document.getElementById('measurements-count');
        if (badge) {
            const n = Object.keys(measurementValues).length;
            badge.textContent = n > 0 ? `(${n} ingevuld)` : '';
        }
    }

    function updatePanelUI() {
        // Bloeddruk apart: herstel velden en het gecombineerde vinkje
        const bInput = document.getElementById('measurement-bovendruk');
        const oInput = document.getElementById('measurement-onderdruk');
        const rrSpan = document.getElementById('validation-rr');
        if (bInput) {
            bInput.value = measurementValues['bovendruk'] || '';
            bInput.style.borderColor = measurementValues['bovendruk'] ? '#28a745' : '#ccc';
        }
        if (oInput) {
            oInput.value = measurementValues['onderdruk'] || '';
            oInput.style.borderColor = measurementValues['onderdruk'] ? '#28a745' : '#ccc';
        }
        if (rrSpan) {
            const anyFilled = measurementValues['bovendruk'] || measurementValues['onderdruk'];
            rrSpan.textContent = anyFilled ? '✓' : '';
            rrSpan.style.color = '#28a745';
        }

        // Glucose apart (slaat op als glucose_nuchter of glucose_nn)
        const glucInput = document.getElementById('measurement-glucose');
        const glucCb    = document.getElementById('glucose-nuchter-cb');
        const glucVal   = document.getElementById('validation-glucose');
        const savedGluc = measurementValues['glucose_nuchter'] || measurementValues['glucose_nn'];
        if (glucInput) {
            glucInput.value = savedGluc || '';
            glucInput.style.borderColor = savedGluc ? '#28a745' : '#ccc';
        }
        if (glucCb)  glucCb.checked = !!measurementValues['glucose_nuchter'];
        if (glucVal) { glucVal.textContent = savedGluc ? '✓' : ''; glucVal.style.color = '#28a745'; }

        // Alle andere metingen
        MEASUREMENTS.filter(m => m.id !== 'bovendruk' && m.id !== 'onderdruk' && m.id !== 'glucose').forEach(m => {
            const input = document.getElementById(`measurement-${m.id}`);
            const vSpan = document.getElementById(`validation-${m.id}`);
            if (input) {
                input.value = measurementValues[m.id] || '';
                input.style.borderColor = measurementValues[m.id] ? '#28a745' : '#ccc';
            }
            if (vSpan) {
                vSpan.textContent = measurementValues[m.id] ? '✓' : '';
                vSpan.style.color = '#28a745';
            }
        });
        updateCountBadge();
        updateBMIDisplay(null);
    }

    // =============================================================================
    // PANEL INSERTION - alleen als S/O/E/P labels aanwezig zijn
    // =============================================================================
    function insertPanel() {
        if (!shouldShowPanel()) return false;
        if (document.getElementById('soep-measurements-panel')) return true;
        if (!document.querySelector('textarea[name="contactForm.regelS"], textarea[name="contactForm.regelO"]')) {
            return false;
        }

        const labels = document.querySelectorAll('td.label, label');
        for (const label of labels) {
            const text = label.textContent.trim();
            if (text === 'S' || text === 'O' || text.startsWith('S') || text.startsWith('O')) {
                const row = label.closest('tr');
                if (row) {
                    const panel = createPanel();
                    const panelRow = document.createElement('tr');
                    const panelCell = document.createElement('td');
                    panelCell.colSpan = 10;
                    panelCell.appendChild(panel);
                    panelRow.appendChild(panelCell);
                    const target = text.startsWith('S') ? row.nextSibling : row;
                    row.parentNode.insertBefore(panelRow, target);
                    setupPanelListeners(panel);
                    return true;
                }
            }
        }
        return false;
    }
    
    // =============================================================================
    // NOTIFICATION
    // =============================================================================
    function showNotification(message, type = 'info') {
        const colors = { info: '#2196F3', success: '#4CAF50', warning: '#FF9800', error: '#f44336' };
        const old = document.getElementById('pm-notification');
        if (old) old.remove();

        const el = document.createElement('div');
        el.id = 'pm-notification';
        el.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 12px 18px;
            background: ${colors[type] || colors.info}; color: white;
            border-radius: 5px; box-shadow: 0 3px 12px rgba(0,0,0,0.3);
            z-index: 99999; font-family: Arial; font-size: 13px;
            max-width: 350px; line-height: 1.4;
        `;
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), type === 'error' ? 6000 : type === 'warning' ? 5000 : 3000);
    }

    // =============================================================================
    // POLL HELPER
    // =============================================================================
    function pollUntil(testFn, intervalMs, maxMs) {
        return new Promise((resolve) => {
            const start = Date.now();
            const tick = () => {
                if (testFn()) { resolve(true); return; }
                if (Date.now() - start >= maxMs) { resolve(false); return; }
                setTimeout(tick, intervalMs);
            };
            tick();
        });
    }

    // =============================================================================
    // INITIALIZATION
    // =============================================================================
    async function init() {
        getPatientId();
        measurementValues = loadMeasurements();

        if (!isSOEPPage()) return;

        await pollUntil(
            () => insertPanel(),
            CONFIG.PANEL_INSERT_POLL_MS,
            CONFIG.PANEL_INSERT_MAX_MS
        );

        startFormAndButtonWatcher();

        // Short poll for buttons that appear after load
        let count = 0;
        const poller = setInterval(() => {
            interceptSaveButtons();
            if (++count >= 50) clearInterval(poller);
        }, 100);
    }

    // =============================================================================
    // ENTRY POINT
    // =============================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
    } else {
        setTimeout(init, 300);
    }

})();