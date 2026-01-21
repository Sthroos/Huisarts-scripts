// ==UserScript==
// @name         Promedico SOEP Measurements
// @namespace    http://tampermonkey.net/
// @version      3.0.2
// @description  Intercepts form submit on all journal pages - Fixes Loops & Button Detection
// @author       Moi
// @match        https://www.promedico-asp.nl/promedico/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    console.log('🔄 Promedico SOEP Measurements v3.0.2 - All Pages Form Intercept');

    // Configuration
    const CONFIG = {
        MAX_WAIT_ATTEMPTS: 150,
        WAIT_INTERVAL_MS: 200,
        AUTO_SUBMIT_DELAY_MS: 500,
        BUTTON_SEARCH_INTERVAL: 200, // Iets trager gezet voor stabiliteit
        BUTTON_SEARCH_MAX_TIME: 20000
    };

    const BEPALING_IDS = {
        'gewicht': '10356',
        'lengte': '10559',
        'bovendruk': '11740',
        'onderdruk': '11736',
        'pols': '11864',
        'temperatuur': '11356',
        'saturatie': '12649'
    };

    const MEASUREMENTS = [
        { id: 'gewicht', label: 'Gewicht', unit: 'kg', placeholder: 'kg', min: 0.5, max: 500, decimals: 1 },
        { id: 'lengte', label: 'Lengte', unit: 'cm', placeholder: 'cm', min: 20, max: 250, decimals: 0 },
        { id: 'bovendruk', label: 'RR Systolisch', unit: 'mmHg', placeholder: 'mmHg', min: 40, max: 300, decimals: 0 },
        { id: 'onderdruk', label: 'RR Diastolisch', unit: 'mmHg', placeholder: 'mmHg', min: 20, max: 200, decimals: 0 },
        { id: 'pols', label: 'Pols', unit: '/min', placeholder: '/min', min: 20, max: 300, decimals: 0 },
        { id: 'saturatie', label: 'Saturatie', unit: '%', placeholder: '%', min: 50, max: 100, decimals: 0 },
        { id: 'temperatuur', label: 'Temperatuur', unit: '°C', placeholder: '°C', min: 30, max: 45, decimals: 1 }
    ];

    const STORAGE_KEY = 'promedico_measurements';
    let measurementValues = {};
    let submissionAttempts = 0;
    const MAX_SUBMISSION_ATTEMPTS = 20;

    // =============================================================================
    // INTERCEPT FORM SUBMIT
    // =============================================================================

    function interceptFormSubmit() {
        const form = document.querySelector('form[name="contactform"]');
        if (!form) {
            console.log('⏳ Contact form not found yet...');
            return false;
        }

        if (form.dataset.intercepted) {
            return true; // Already intercepted
        }

        console.log('🎯 INTERCEPTING form submit on:', window.location.href);

        // Store original submit
        const originalSubmit = form.submit.bind(form);

        // Override submit method
        form.submit = function() {
            console.log('\n🛑 ===== FORM SUBMIT INTERCEPTED =====');
            console.log('Current URL:', window.location.href);
            console.log('Current measurements:', measurementValues);

            const hasMeasurements = Object.keys(measurementValues).length > 0;

            // Check if this is the final save action
            const actionInput = form.querySelector('input[name="controllerAction"]');
            const action = actionInput ? actionInput.value : '';

            console.log('Form action:', action);
            console.log('Has measurements:', hasMeasurements);

            if (action === 'savecontact' && hasMeasurements) {
                // FIX 2: Check of er al een queue loopt
                const existingQueue = sessionStorage.getItem('promedico_measurement_queue');
                if (existingQueue && JSON.parse(existingQueue).length > 0) {
                     console.log('⚠️ Queue exists, resuming instead of restarting...');
                     processNextMeasurement();
                     return;
                }

                console.log('📊 SAVECONTACT WITH MEASUREMENTS - Saving them first!');
                console.log('=====================================\n');

                // Store that we need to complete the save after measurements
                sessionStorage.setItem('promedico_original_save_pending', 'true');
                sessionStorage.setItem('promedico_original_form_data', JSON.stringify({
                    action: action
                }));

                // Start measurement saving process
                submitAllMeasurements();
            } else {
                console.log('📝 Regular submit (action: ' + action + ') - proceeding normally');
                console.log('=====================================\n');
                // Call original submit
                originalSubmit();
            }
        };

        // Also intercept submit event
        form.addEventListener('submit', function(e) {
            console.log('\n🛑 ===== FORM SUBMIT EVENT INTERCEPTED =====');
            console.log('Current URL:', window.location.href);

            const hasMeasurements = Object.keys(measurementValues).length > 0;
            const actionInput = form.querySelector('input[name="controllerAction"]');
            const action = actionInput ? actionInput.value : '';

            console.log('Form action:', action);
            console.log('Has measurements:', hasMeasurements);

            if (action === 'savecontact' && hasMeasurements) {
                e.preventDefault();
                e.stopPropagation();

                // FIX 2: Check of er al een queue loopt
                const existingQueue = sessionStorage.getItem('promedico_measurement_queue');
                if (existingQueue && JSON.parse(existingQueue).length > 0) {
                     console.log('⚠️ Queue exists, resuming instead of restarting...');
                     processNextMeasurement();
                     return;
                }

                console.log('📊 PREVENTED SUBMIT - Saving measurements first!');
                console.log('=====================================\n');

                sessionStorage.setItem('promedico_original_save_pending', 'true');
                submitAllMeasurements();
            } else {
                console.log('📝 Allowing submit to proceed');
                console.log('=====================================\n');
            }
        }, true); // Use capture phase to intercept early

        form.dataset.intercepted = 'true';
        console.log('✅ Form submit intercepted successfully!');
        return true;
    }

    // =============================================================================
    // HELPER FUNCTIONS
    // =============================================================================

    function safeSetItem(key, value) {
        try {
            sessionStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }

    function showNotification(message, type = 'info') {
        const colors = { info: '#2196F3', success: '#4CAF50', warning: '#FF9800', error: '#f44336' };
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px 20px;
            background: ${colors[type] || colors.info}; color: white;
            border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            z-index: 10000; font-family: Arial; font-size: 14px; max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    function validateMeasurement(measurementId, value) {
        const measurement = MEASUREMENTS.find(m => m.id === measurementId);
        if (!measurement) return { valid: false, error: 'Onbekende meting' };

        const cleanValue = value.toString().trim()
            .replace(/kg$/i, '').replace(/cm$/i, '').replace(/mmhg$/i, '')
            .replace(/min$/i, '').replace(/°c$/i, '').replace(/%$/i, '')
            .replace(/\s+/g, '').replace(',', '.');

        const numValue = parseFloat(cleanValue);
        if (isNaN(numValue)) return { valid: false, error: `"${value}" is geen geldig getal`, cleanValue: null };
        if (numValue < measurement.min || numValue > measurement.max) {
            return { valid: false, error: `Waarde moet tussen ${measurement.min} en ${measurement.max} zijn`, cleanValue: null };
        }

        const roundedValue = measurement.decimals === 0
            ? Math.round(numValue)
            : Math.round(numValue * Math.pow(10, measurement.decimals)) / Math.pow(10, measurement.decimals);

        return { valid: true, error: null, cleanValue: roundedValue.toString() };
    }

    function shouldShowMeasurementsPanel() {
        if (window.self === window.top) return false;
        const url = window.location.href;
        return url.includes('medischdossier.journaal.contact.m') ||
               url.includes('medischdossier.journaal.bewaardossier.m') ||
               url.includes('medischdossier.journaal.wisseldossier.m');
    }

    function loadStoredValues() {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return {};
            }
        }
        return {};
    }

    function saveToStorage(values) {
        safeSetItem(STORAGE_KEY, JSON.stringify(values));
    }

    function clearStorage() {
        sessionStorage.removeItem(STORAGE_KEY);
    }

    function getCurrentDate() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        return `${day}-${month}-${year}`;
    }

    function getPatientId() {
        const stored = sessionStorage.getItem('promedico_patient_id');
        if (stored) return stored;

        const urlParams = new URLSearchParams(window.location.search);
        let patientId = urlParams.get('actievePatient') || urlParams.get('patientId') || urlParams.get('id');
        if (patientId) {
            sessionStorage.setItem('promedico_patient_id', patientId);
            return patientId;
        }

        return null;
    }

    // =============================================================================
    // BUTTON CLICKING
    // =============================================================================

    function findAndClickButton(buttonId, buttonName) {
        console.log(`\n🔍 ========== SEARCHING FOR: ${buttonName} ==========`);

        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            let attemptCount = 0;

            const tryFind = () => {
                attemptCount++;
                const elapsed = Date.now() - startTime;

                if (attemptCount % 20 === 0) {
                    console.log(`   ⏱️  Attempt ${attemptCount} (${elapsed}ms)`);
                }

                try {
                    let button = null;
                    let foundIn = null;

                    button = document.getElementById(buttonId);
                    if (button) {
                        foundIn = 'current document';
                    }

                    if (!button && window.self !== window.top) {
                        try {
                            button = window.top.document.getElementById(buttonId);
                            if (button) {
                                foundIn = 'TOP document';
                            }
                        } catch (e) {}
                    }

                    if (button) {
                        console.log(`\n✅ FOUND: ${buttonName} (in ${foundIn})`);

                        try {
                            button.click();
                            console.log(`✅ CLICKED "${buttonName}"`);
                            resolve(true);
                            return;
                        } catch (e) {
                            console.error(`❌ Click failed:`, e);
                            reject(e);
                            return;
                        }
                    }
                } catch (e) {}

                if (elapsed >= CONFIG.BUTTON_SEARCH_MAX_TIME) {
                    console.error(`\n❌ TIMEOUT: ${buttonName}`);
                    reject(new Error(`Timeout after ${elapsed}ms`));
                    return;
                }

                setTimeout(tryFind, CONFIG.BUTTON_SEARCH_INTERVAL);
            };

            tryFind();
        });
    }

    // FIX 3: Robust clickNaarContactButton
    function clickNaarContactButton() {
        console.log('\n🔘 clickNaarContactButton() CALLED');

        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            let attempts = 0;

            const tryClick = () => {
                attempts++;

                // 1. Probeer exact ID (snelst & veiligst)
                const btnById = document.getElementById('MD-Uitslagen-lbNaarDeelcontact');

                if (btnById) {
                    console.log('✅ Found "Naar contact" by ID');
                    btnById.click();
                    resolve(true);
                    return;
                }

                // 2. Fallback: Zoek knop met tekst 'Naar contact'
                const buttons = Array.from(document.querySelectorAll('button'));
                const btnByText = buttons.find(b => b.textContent && b.textContent.includes('Naar contact'));

                if (btnByText) {
                    console.log('✅ Found "Naar contact" by Text Content');
                    btnByText.click();
                    resolve(true);
                    return;
                }

                if (Date.now() - startTime > 10000) { // 10 seconden timeout
                    console.error('❌ Could not find Naar Contact button');
                    showNotification('Klik handmatig op "Naar contact"', 'warning');
                    reject(new Error('Button not found'));
                    return;
                }

                setTimeout(tryClick, 200);
            };

            tryClick();
        });
    }

    // =============================================================================
    // MEASUREMENT SUBMISSION
    // =============================================================================

    async function submitMeasurementViaUI(measurementId, value) {
        const bepalingId = BEPALING_IDS[measurementId];
        if (!bepalingId) {
            console.error(`No bepaling ID for ${measurementId}`);
            return false;
        }

        console.log(`Starting UI automation for ${measurementId}: ${value}`);

        const pendingMeasurement = {
            measurementId, value, bepalingId,
            measurementName: MEASUREMENTS.find(m => m.id === measurementId)?.label || measurementId
        };

        if (!safeSetItem('promedico_pending_measurement', JSON.stringify(pendingMeasurement))) {
            console.error('Failed to store pending measurement');
            return false;
        }

        const patientId = getPatientId();
        if (!patientId) {
            console.error('Cannot submit: patient ID not found');
            showNotification('Fout: Geen patiënt-ID gevonden', 'error');
            return false;
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/promedico/medischdossier.meetwaarden.losseuitslag.m';

        const inputs = {
            'controllerAction': 'findbepaling',
            'bepaling.id': bepalingId,
            'actievePatient': patientId
        };

        for (const [name, value] of Object.entries(inputs)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        }

        document.body.appendChild(form);
        console.log('Submitting POST form:', inputs);
        form.submit();
        return true;
    }

    function fillUitslagForm() {
        const pendingData = sessionStorage.getItem('promedico_pending_measurement');
        if (!pendingData) return;

        let pending;
        try {
            pending = JSON.parse(pendingData);
        } catch (e) {
            sessionStorage.removeItem('promedico_pending_measurement');
            return;
        }

        if (!window.location.href.includes('medischdossier.meetwaarden.losseuitslag.m')) {
            return;
        }

        console.log('✓ On uitslag page, filling form...');

        let attempts = 0;
        const waitAndFill = () => {
            attempts++;
            const datumInput = document.querySelector('input[name="uitslag.datum"]');
            const waardeInput = document.querySelector('input[name="uitslag.waarde"]');
            const bepalingInput = document.querySelector('input[name="bepaling.id"]');

            if (!datumInput || !waardeInput) {
                if (attempts < CONFIG.MAX_WAIT_ATTEMPTS) {
                    setTimeout(waitAndFill, CONFIG.WAIT_INTERVAL_MS);
                } else {
                    sessionStorage.removeItem('promedico_pending_measurement');
                }
                return;
            }

            try {
                if (bepalingInput) {
                    bepalingInput.value = pending.bepalingId;
                }

                const dateValue = getCurrentDate();
                datumInput.value = dateValue;
                datumInput.dispatchEvent(new Event('input', { bubbles: true }));
                datumInput.dispatchEvent(new Event('change', { bubbles: true }));

                waardeInput.value = pending.value;
                waardeInput.dispatchEvent(new Event('input', { bubbles: true }));
                waardeInput.dispatchEvent(new Event('change', { bubbles: true }));

                sessionStorage.removeItem('promedico_pending_measurement');

                setTimeout(() => {
                    let submitButton = document.querySelector('input[name="Opslaan_losseuitslag"]') ||
                                       document.querySelector('input[type="submit"][value*="Opslaan"]') ||
                                       document.querySelector('input[type="submit"]');

                    if (submitButton) {
                        safeSetItem('promedico_just_submitted', 'true');
                        submitButton.click();

                        const form = waardeInput.closest('form');
                        setTimeout(() => {
                            if (form && window.location.href.includes('losseuitslag')) {
                                form.submit();
                            }
                        }, 500);
                    }
                }, CONFIG.AUTO_SUBMIT_DELAY_MS);
            } catch (error) {
                console.error('Error filling form:', error);
                sessionStorage.removeItem('promedico_pending_measurement');
            }
        };

        waitAndFill();
    }

    async function submitAllMeasurements() {
        console.log('=== SUBMIT ALL MEASUREMENTS ===');
        const measurementsToSubmit = Object.keys(measurementValues);

        if (measurementsToSubmit.length === 0) return;

        const validMeasurements = [];
        for (const id of measurementsToSubmit) {
            const value = measurementValues[id];
            const validation = validateMeasurement(id, value);
            if (validation.valid) {
                validMeasurements.push({ id, value: validation.cleanValue });
            }
        }

        if (validMeasurements.length === 0) return;

        submissionAttempts = 0;
        safeSetItem('promedico_submission_attempts', '0');

        if (!safeSetItem('promedico_measurement_queue', JSON.stringify(validMeasurements))) {
            console.error('Failed to create queue');
            showNotification('Fout: Kan wachtrij niet aanmaken', 'error');
            return;
        }

        console.log('Stored queue:', validMeasurements);
        showNotification(`${validMeasurements.length} metingen worden opgeslagen...`, 'info');
        processNextMeasurement();
    }

    function processNextMeasurement() {
        const attemptsStr = sessionStorage.getItem('promedico_submission_attempts') || '0';
        submissionAttempts = parseInt(attemptsStr, 10);

        if (submissionAttempts >= MAX_SUBMISSION_ATTEMPTS) {
            console.error(`Exceeded ${MAX_SUBMISSION_ATTEMPTS} attempts`);
            sessionStorage.removeItem('promedico_measurement_queue');
            sessionStorage.removeItem('promedico_submission_attempts');
            showNotification('Fout: Te veel pogingen', 'error');
            return;
        }

        const queueData = sessionStorage.getItem('promedico_measurement_queue');
        if (!queueData) return;

        let queue;
        try {
            queue = JSON.parse(queueData);
        } catch (e) {
            sessionStorage.removeItem('promedico_measurement_queue');
            return;
        }

        if (queue.length === 0) {
            console.log('=== ALL MEASUREMENTS PROCESSED ===');

            // FIX 1: RUIM DE ROMMEL OP VOORDAT WE ORIGINEEL OPSLAAN
            // Dit voorkomt dat de loop opnieuw start
            sessionStorage.removeItem('promedico_measurement_queue');
            sessionStorage.removeItem('promedico_submission_attempts');

            // Wis interne state
            clearStorage();
            measurementValues = {};

            // Update UI voor de zekerheid (visueel leegmaken)
            const inputs = document.querySelectorAll('input[data-measurement-id]');
            inputs.forEach(el => {
                el.value = '';
                el.style.borderColor = '#ccc';
                // Reset validatie icoontje
                const id = el.dataset.measurementId;
                const span = document.getElementById(`validation-${id}`);
                if(span) span.textContent = '';
            });
            const badge = document.getElementById('measurements-count');
            if (badge) badge.textContent = '';

            showNotification('Alle metingen opgeslagen!', 'success');

            // NOW trigger the original save action
            triggerOriginalSave();
            return;
        }

        submissionAttempts++;
        safeSetItem('promedico_submission_attempts', submissionAttempts.toString());

        const next = queue.shift();
        safeSetItem('promedico_measurement_queue', JSON.stringify(queue));
        console.log(`Processing ${next.id} (${queue.length} remaining)`);
        submitMeasurementViaUI(next.id, next.value);
    }

    function triggerOriginalSave() {
        console.log('\n🎯 ===== TRIGGERING ORIGINAL SAVE =====');

        const savePending = sessionStorage.getItem('promedico_original_save_pending');
        sessionStorage.removeItem('promedico_original_save_pending');
        sessionStorage.removeItem('promedico_original_form_data');

        if (savePending) {
            console.log('   Save was pending, completing now...');
            console.log('   Looking for saveContact function...');

            // Try to find and call saveContact in the current window or parent
            let saveContactFunc = null;

            if (typeof window.saveContact === 'function') {
                saveContactFunc = window.saveContact;
                console.log('   Found saveContact in current window');
            } else if (window.parent && typeof window.parent.saveContact === 'function') {
                saveContactFunc = window.parent.saveContact;
                console.log('   Found saveContact in parent window');
            }

            if (saveContactFunc) {
                console.log('   Calling saveContact("savecontact")...');
                saveContactFunc('savecontact');
                console.log('   ✅ Original save triggered!');
            } else {
                console.error('   ❌ saveContact function not found!');
                showNotification('Fout: Kan opslaan niet voltooien', 'error');
            }
        } else {
            console.log('   No pending save found');
        }

        console.log('=====================================\n');
    }

    // =============================================================================
    // PING PONG BACK TO CONTACT
    // =============================================================================

    function handleUitslagenPage() {
        const queueData = sessionStorage.getItem('promedico_measurement_queue');
        const justSubmitted = sessionStorage.getItem('promedico_just_submitted');

        if (!queueData || !justSubmitted) return;

        try {
            const queue = JSON.parse(queueData);
            console.log(`📊 On uitslagen page, ${queue.length} items remaining in queue`);

            const clickAttempted = sessionStorage.getItem('promedico_click_attempted');

            if (!clickAttempted) {
                console.log('🎯 Attempting to click Naar Contact...');
                sessionStorage.setItem('promedico_click_attempted', 'true');
                sessionStorage.removeItem('promedico_just_submitted');

                setTimeout(() => {
                    clickNaarContactButton();
                }, 2000);
            }
        } catch (e) {
            console.error('Error handling uitslagen page:', e);
        }
    }

    function handleJournaalPage() {
        const queueData = sessionStorage.getItem('promedico_measurement_queue');

        sessionStorage.removeItem('promedico_click_attempted');

        if (!queueData) return;

        const url = window.location.href;
        if (!url.includes('medischdossier.journaal') || url.includes('wisseldossier')) return;

        try {
            const queue = JSON.parse(queueData);

            if (queue.length > 0) {
                console.log(`\n🔄 PING PONG: Back on journal, ${queue.length} measurements remaining`);
                setTimeout(() => processNextMeasurement(), 1500);
            }
        } catch (e) {
            console.error('Error processing queue:', e);
        }
    }

    // =============================================================================
    // UI PANEL
    // =============================================================================

    function createMeasurementsPanel() {
        const panel = document.createElement('div');
        panel.id = 'soep-measurements-panel';
        panel.style.cssText = 'margin: 10px 0; width: 100%;';

        let html = `
            <div id="measurements-header" style="padding: 8px 12px; background: linear-gradient(to right, #0275d8, #0056b3); color: white; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>📊</span>
                    <strong>Metingen</strong>
                    <span id="measurements-count" style="font-size: 11px; opacity: 0.9;"></span>
                </div>
                <span id="measurements-toggle" style="font-size: 18px; transition: transform 0.3s;">▼</span>
            </div>
            <div id="measurements-content" style="display: none; padding: 12px; background: #f0f8ff; border: 1px solid #0275d8; border-top: none; border-radius: 0 0 4px 4px; margin-top: -4px;">
                <div style="font-size: 11px; color: #666; margin-bottom: 10px;">Vul in wat je wilt opslaan</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 10px;">
        `;

        MEASUREMENTS.forEach(m => {
            html += `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label for="measurement-${m.id}" style="font-size: 12px; min-width: 95px;">${m.label}:</label>
                    <div style="display: flex; align-items: center; gap: 4px; flex: 1;">
                        <input type="text" id="measurement-${m.id}" data-measurement-id="${m.id}" placeholder="${m.placeholder}" style="width: 70px; padding: 4px 6px; border: 1px solid #ccc; border-radius: 3px; font-size: 13px;" />
                        <span id="validation-${m.id}" style="font-size: 11px; color: #666; min-width: 16px;"></span>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #d0e8f7; font-size: 11px; color: #666;">💡 Metingen worden automatisch opgeslagen bij klikken op Opslaan</div>
            </div>
        `;

        panel.innerHTML = html;
        return panel;
    }

    function setupEventListeners() {
        const header = document.getElementById('measurements-header');
        const content = document.getElementById('measurements-content');
        const toggle = document.getElementById('measurements-toggle');

        if (header && content && toggle) {
            header.addEventListener('click', () => {
                const isVisible = content.style.display === 'block';
                content.style.display = isVisible ? 'none' : 'block';
                toggle.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
            });
        }

        function updateCountBadge() {
            const badge = document.getElementById('measurements-count');
            if (badge) {
                const count = Object.keys(measurementValues).length;
                badge.textContent = count > 0 ? `(${count} ingevuld)` : '';
            }
        }

        updateCountBadge();

        MEASUREMENTS.forEach(m => {
            const input = document.getElementById(`measurement-${m.id}`);
            const validationSpan = document.getElementById(`validation-${m.id}`);

            if (input) {
                if (measurementValues[m.id]) {
                    input.value = measurementValues[m.id];
                    validationSpan.textContent = '✓';
                    validationSpan.style.color = '#4CAF50';
                }

                input.addEventListener('input', (e) => {
                    let value = e.target.value;
                    if (m.decimals > 0) {
                        if (value.includes(',')) value = value.replace(',', '.');
                    } else {
                        value = value.replace(/[,.]/g, '');
                    }
                    e.target.value = value;
                    value = value.trim();

                    if (!value) {
                        delete measurementValues[m.id];
                        validationSpan.textContent = '';
                        validationSpan.style.color = '#666';
                        input.style.borderColor = '#ccc';
                        saveToStorage(measurementValues);
                        updateCountBadge();
                        return;
                    }

                    const validation = validateMeasurement(m.id, value);
                    if (validation.valid) {
                        measurementValues[m.id] = validation.cleanValue;
                        validationSpan.textContent = '✓';
                        validationSpan.style.color = '#4CAF50';
                        input.style.borderColor = '#4CAF50';
                        saveToStorage(measurementValues);
                        updateCountBadge();
                    } else {
                        delete measurementValues[m.id];
                        validationSpan.textContent = '✗';
                        validationSpan.style.color = '#f44336';
                        input.style.borderColor = '#f44336';
                        input.title = validation.error;
                        updateCountBadge();
                    }
                });
            }
        });
    }

    function insertMeasurementsPanel() {
        if (!shouldShowMeasurementsPanel()) return false;
        if (document.getElementById('soep-measurements-panel')) return true;

        const labels = document.querySelectorAll('td.label, label');
        for (const label of labels) {
            const text = label.textContent.trim();
            if (text === 'O' || text.includes('Objectief')) {
                const oFieldRow = label.closest('tr');
                if (oFieldRow) {
                    const panel = createMeasurementsPanel();
                    const panelRow = document.createElement('tr');
                    const panelCell = document.createElement('td');
                    panelCell.colSpan = 10;
                    panelCell.appendChild(panel);
                    panelRow.appendChild(panelCell);
                    oFieldRow.parentNode.insertBefore(panelRow, oFieldRow);
                    setupEventListeners();
                    return true;
                }
            }
        }

        const firstTextarea = document.querySelector('textarea');
        if (firstTextarea) {
            const panel = createMeasurementsPanel();
            firstTextarea.parentNode.insertBefore(panel, firstTextarea);
            setupEventListeners();
            return true;
        }

        return false;
    }

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    function init() {
        console.log('=== INIT v3.0.2 - ALL PAGES INTERCEPT ===');
        console.log('Current URL:', window.location.href);

        const urlParams = new URLSearchParams(window.location.search);
        const patientId = urlParams.get('actievePatient');
        if (patientId) {
            sessionStorage.setItem('promedico_patient_id', patientId);
        }

        if (window.location.href.includes('controllerAction=new')) {
            console.log('New contact, clearing old data');
            sessionStorage.removeItem('promedico_measurement_queue');
            sessionStorage.removeItem('promedico_just_submitted');
            sessionStorage.removeItem('promedico_submission_attempts');
            sessionStorage.removeItem('promedico_click_attempted');
            sessionStorage.removeItem('promedico_original_save_pending');
            sessionStorage.removeItem('promedico_original_form_data');
            clearStorage();
            measurementValues = {};
            submissionAttempts = 0;
        }

        measurementValues = loadStoredValues();

        // Handle different pages
        const url = window.location.href;

        if (url.includes('medischdossier.meetwaarden.losseuitslag.m')) {
            fillUitslagForm();
        } else if (url.includes('medischdossier.meetwaarden.uitslagen') || url.includes('gwtredirect.m')) {
            handleUitslagenPage();
        } else if (url.includes('medischdossier.journaal')) {
            handleJournaalPage();
        }

        // Intercept form on ALL journal pages
        const shouldIntercept = url.includes('medischdossier.journaal.bewaardossier.m') ||
                                url.includes('medischdossier.journaal.wisseldossier.m') ||
                                url.includes('medischdossier.journaal.contact.m');

        setTimeout(() => {
            const inserted = insertMeasurementsPanel();
            if (inserted) {
                console.log('✅ Panel inserted');
            }

            // Try to intercept form on contact/bewaardossier/wisseldossier pages
            if (shouldIntercept) {
                console.log('🎯 Should intercept on this page');
                let attempts = 0;
                const tryIntercept = setInterval(() => {
                    attempts++;
                    if (interceptFormSubmit() || attempts > 50) {
                        clearInterval(tryIntercept);
                    }
                }, 200);
            } else {
                console.log('⏭️  No intercept needed on this page');
            }
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }

})();