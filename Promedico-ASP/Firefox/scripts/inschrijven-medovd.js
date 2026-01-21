(function() {
    'use strict';

    // ============================================================================
    // SHARED UTILITIES
    // ============================================================================

    // Get the content iframe
    function getContentIframe() {
        return document.getElementById('panelBackCompatibility-frame');
    }

    // Get the correct document (iframe or main)
    function getTargetDocument() {
        if (window.location.href.includes('admin.onderhoud.patienten')) {
            return document;
        }
        const iframe = getContentIframe();
        if (iframe) {
            try {
                return iframe.contentDocument || iframe.contentWindow.document;
            } catch (e) {
                console.error('Cannot access iframe:', e);
            }
        }
        return document;
    }

    // ============================================================================
    // CUSTOM MENU ITEMS
    // ============================================================================

    function clickSidebarButton(buttonId) {
        const script = document.createElement('script');
        script.textContent = `
            (function() {
                try {
                    const patientZoeken = document.getElementById('MainMenu-Patiënt-Zoeken');
                    if (patientZoeken) {
                        patientZoeken.click();
                        setTimeout(() => {
                            const iframe = document.getElementById('panelBackCompatibility-frame');
                            if (iframe && iframe.contentDocument) {
                                const button = iframe.contentDocument.getElementById('${buttonId}');
                                if (button) button.click();
                            }
                        }, 1000);
                    }
                } catch (e) {
                    console.error('Navigation error:', e);
                }
            })();
        `;
        document.head.appendChild(script);
        script.remove();
    }

    function addCustomMenuItem(afterElementId, newItemId, newItemText, sidebarButtonId) {
        const afterElement = document.getElementById(afterElementId);
        if (!afterElement) return false;
        if (document.getElementById(newItemId)) return true;

        const newMenuItem = afterElement.cloneNode(true);
        newMenuItem.id = newItemId;
        newMenuItem.textContent = newItemText;
        const cleanMenuItem = newMenuItem.cloneNode(true);

        cleanMenuItem.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            clickSidebarButton(sidebarButtonId);
        });

        afterElement.parentNode.insertBefore(cleanMenuItem, afterElement.nextSibling);
        return true;
    }

    function tryAddMenuItems() {
        const patientZoeken = document.getElementById('MainMenu-Patiënt-Zoeken');
        if (!patientZoeken) return false;
        if (document.getElementById('MainMenu-Patiënt-MedovdImport')) return true;

        const added1 = addCustomMenuItem(
            'MainMenu-Patiënt-Zoeken',
            'MainMenu-Patiënt-MedovdImport',
            'MEDOVD import',
            'action_medOvdImporteren'
        );

        const afterElement = added1 ? 'MainMenu-Patiënt-MedovdImport' : 'MainMenu-Patiënt-Zoeken';
        addCustomMenuItem(
            afterElement,
            'MainMenu-Patiënt-NieuwePatiënt',
            'Nieuwe patiënt',
            'action_Nieuwe patient inschrijven'
        );

        return added1;
    }

    function initCustomMenus() {
        // Only run on main index.html page
        if (!window.location.href.includes('index.html')) return;

        setTimeout(() => {
            tryAddMenuItems();
        }, 2000);

        const observer = new MutationObserver(() => {
            const patientZoeken = document.getElementById('MainMenu-Patiënt-Zoeken');
            const medovdImport = document.getElementById('MainMenu-Patiënt-MedovdImport');
            if (patientZoeken && !medovdImport) {
                tryAddMenuItems();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ============================================================================
    // AUTO MEDOVD IMPORT (EDI + ZIP)
    // ============================================================================

function isOnMedovdImportPage() {
    const iframe = getContentIframe();
    if (!iframe || !iframe.contentDocument) return false;
    const doc = iframe.contentDocument;

    // Check if we're on the MEDOVD import page by looking for the specific form elements
    const ediInput = doc.getElementById('ediFile');
    const zipInput = doc.getElementById('correspondentieFile');

    return !!(ediInput && zipInput);
}

function fillFormWithFiles(ediFile, zipFile) {
    const iframe = getContentIframe();
    if (!iframe || !iframe.contentDocument) return;

    const doc = iframe.contentDocument;
    const ediInput = doc.getElementById('ediFile');
    const zipInput = doc.getElementById('correspondentieFile');
    const submitButton = doc.getElementById('Script_Bestand inlezen');

    if (!ediInput || !zipInput || !submitButton) {
        console.log('Form fields not found');
        return;
    }

    console.log('Filling form with files:', ediFile.name, zipFile.name);

    const ediDataTransfer = new DataTransfer();
    ediDataTransfer.items.add(ediFile);
    ediInput.files = ediDataTransfer.files;

    const zipDataTransfer = new DataTransfer();
    zipDataTransfer.items.add(zipFile);
    zipInput.files = zipDataTransfer.files;

    ediInput.dispatchEvent(new Event('change', { bubbles: true }));
    zipInput.dispatchEvent(new Event('input', { bubbles: true }));
    zipInput.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('Files assigned, submitting...');

    setTimeout(() => {
        submitButton.click();
        console.log('Submit clicked');
    }, 500);
}

function processDroppedFiles(files) {
    console.log('Files dropped:', files.length);

    if (files.length !== 2) {
        console.log('Need exactly 2 files, got', files.length);
        return;
    }

    if (!isOnMedovdImportPage()) {
        console.log('Not on MEDOVD import page');
        return;
    }

    let ediFile = null;
    let zipFile = null;

    for (let file of files) {
        const fileName = file.name.toLowerCase();
        console.log('Processing file:', fileName);
        if (fileName.endsWith('.edi')) {
            ediFile = file;
        } else if (fileName.endsWith('.zip')) {
            zipFile = file;
        }
    }

    if (!ediFile || !zipFile) {
        console.log('Missing required files. EDI:', ediFile?.name, 'ZIP:', zipFile?.name);
        return;
    }

    console.log('Both files found, filling form...');
    fillFormWithFiles(ediFile, zipFile);
}

function setupIframeListeners() {
    const iframe = getContentIframe();
    if (!iframe) {
        console.log('Iframe not found');
        return;
    }

    let doc;
    try {
        doc = iframe.contentDocument || iframe.contentWindow.document;
    } catch (e) {
        console.log('Cannot access iframe document:', e);
        return;
    }

    if (!doc) {
        console.log('Iframe document not accessible');
        return;
    }

    // Check if we're on the right page
    if (!isOnMedovdImportPage()) {
        return;
    }

    // Always re-attach listeners (in case iframe reloaded)
    if (doc.body.dataset.medovdListenersAttached === 'true') {
        return;
    }

    console.log('Attaching drag and drop listeners to iframe');

    // Create a drop zone overlay for better visual feedback
    let dropOverlay = doc.getElementById('medovd-drop-overlay');
    if (!dropOverlay) {
        dropOverlay = doc.createElement('div');
        dropOverlay.id = 'medovd-drop-overlay';
        dropOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(76, 175, 80, 0.1);
            border: 3px dashed #4CAF50;
            display: none;
            z-index: 9999;
            pointer-events: none;
            justify-content: center;
            align-items: center;
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
        `;
        dropOverlay.innerHTML = '📁 Drop EDI + ZIP files here';
        doc.body.appendChild(dropOverlay);
    }

    let dragCounter = 0; // Track nested drag enter/leave events

    doc.addEventListener('dragenter', (e) => {
        // Check if dragging files (not just text or other draggables)
        if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            e.stopPropagation();
            dragCounter++;
            dropOverlay.style.display = 'flex';
            console.log('Drag enter with files, counter:', dragCounter);
        }
    }, true);

    doc.addEventListener('dragover', (e) => {
        // Check if dragging files
        if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
        }
    }, true);

    doc.addEventListener('dragleave', (e) => {
        // Only process if we were dragging files
        if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            e.stopPropagation();
            dragCounter--;
            console.log('Drag leave, counter:', dragCounter);

            // Only hide overlay when all drag enters have been matched with leaves
            if (dragCounter === 0) {
                dropOverlay.style.display = 'none';
            }
        }
    }, true);

    doc.addEventListener('drop', (e) => {
        // Check if dropping files
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            dropOverlay.style.display = 'none';
            dragCounter = 0; // Reset counter

            console.log('Drop event triggered with', e.dataTransfer.files.length, 'files');
            processDroppedFiles(Array.from(e.dataTransfer.files));
        }
    }, true);

    // Also reset counter if drag ends outside the window
    doc.addEventListener('dragend', (e) => {
        dragCounter = 0;
        dropOverlay.style.display = 'none';
        console.log('Drag ended');
    }, true);

    doc.body.dataset.medovdListenersAttached = 'true';
    console.log('Listeners attached successfully with visual overlay');
}

function initMedovdImport() {
    // Check and setup listeners every 2 seconds
    setInterval(() => {
        setupIframeListeners();
    }, 2000);

    // Also try immediately
    setTimeout(setupIframeListeners, 1000);
}

    // ============================================================================
    // PATIENT FORM AUTO-FILL
    // ============================================================================

function parseData(text) {
    const data = {};
    let lines = text.split(/\r?\n/);

    if (lines.length === 1 && text.length > 100) {
        const fieldPattern = /(Van|Berichtinhoud|Voorletters|Voornamen|Tussenvoegsel|Achternaam|Meisjesnaam|Naam volgorde|BSN|Type ID bewijs|ID bewijs nummer|Geboorteplaats|Geboortedatum|Geslacht|Gender|Beroep|Adresgegevens|Telefoonnummer|Zorgverzekeraar|Polisnummer|Polisdatum|Apotheek|LSP toestemming|Vorige huisarts|Adres huisarts|Telefoonnummer huisarts|Toestemming opvragen dossier|Opmerkingen patient):/g;
        let matches = [];
        let match;
        while ((match = fieldPattern.exec(text)) !== null) {
            matches.push({ name: match[1], index: match.index });
        }
        lines = [];
        for (let i = 0; i < matches.length; i++) {
            const start = matches[i].index;
            const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
            const line = text.substring(start, end).trim();
            lines.push(line);
        }
    }

    for (let line of lines) {
        if (line.includes(':')) {
            const colonIndex = line.indexOf(':');
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            if (key && value) {
                data[key] = value;
            }
        }
    }

    if (data['Van'] && !data['E-mail']) {
        const emailMatch = data['Van'].match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) {
            data['E-mail'] = emailMatch[0];
        }
    }

    return data;
}

    function fillField(fieldId, value) {
        const targetDoc = getTargetDocument();
        const field = targetDoc.getElementById(fieldId);

        if (!field) return false;

        if (field.tagName === 'SELECT') {
            let found = false;
            for (let option of field.options) {
                if (option.text.toLowerCase().includes(value.toLowerCase()) ||
                    option.value.toLowerCase() === value.toLowerCase()) {
                    field.value = option.value;
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        } else if (field.type === 'radio') {
            field.checked = true;
        } else {
            field.value = value;
        }

        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));

        if (field.onchange) {
            try {
                field.onchange();
            } catch(e) {}
        }

        return true;
    }

function fillForm(data) {
    let filled = 0;

    // Handle Achternaam and Meisjesnaam logic
    if (data['Meisjesnaam']) {
        // If maiden name exists, it goes to Achternaam
        if (fillField('patientPersoonWrapper.persoon.achternaam', data['Meisjesnaam'])) filled++;

        // And current last name goes to Partner achternaam
        if (data['Achternaam']) {
            if (fillField('patientPersoonWrapper.persoon.partnerachternaam', data['Achternaam'])) filled++;
        }
    } else if (data['Achternaam']) {
        // If only Achternaam exists (no maiden name), it goes to Achternaam field
        if (fillField('patientPersoonWrapper.persoon.achternaam', data['Achternaam'])) filled++;
    }

    // Tussenvoegsel (prefix like "van", "de", etc.)
    if (data['Tussenvoegsel']) {
        if (fillField('patientPersoonWrapper.persoon.tussenvoegsel', data['Tussenvoegsel'])) filled++;
    }

    // ... rest of your code stays the same

if (data['Naam volgorde']) {
    // Map the input format to the field format
    let naamgebruik = data['Naam volgorde'].toLowerCase().trim();

    // Remove dashes and extra spaces
    naamgebruik = naamgebruik.replace(/\s*[-–]\s*/g, ' ').trim();

    // Only replace space with underscore if there are multiple words
    if (naamgebruik.includes(' ')) {
        naamgebruik = naamgebruik.replace(/\s+/g, '_');
    }

    if (fillField('patientPersoonWrapper.persoon.naamgebruik', naamgebruik)) filled++;
}

    if (data['Voorletters']) {
        const voorletters = data['Voorletters'].replace(/\./g, '');
        if (fillField('patientPersoonWrapper.persoon.voorletters', voorletters)) filled++;
    }

    if (data['Voornamen']) {
        if (fillField('patientPersoonWrapper.persoon.roepnaam', data['Voornamen'])) filled++;
    }

    if (data['Geboortedatum']) {
        let geboortedatum = data['Geboortedatum'];
        const monthMap = {
            'jan': '01', 'feb': '02', 'mrt': '03', 'apr': '04',
            'mei': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'okt': '10', 'nov': '11', 'dec': '12'
        };
        const match = geboortedatum.match(/(\d+)\s+(\w+)\s+(\d{4})/);
        if (match) {
            const day = match[1].padStart(2, '0');
            const month = monthMap[match[2].toLowerCase()] || match[2];
            const year = match[3];
            geboortedatum = `${day}-${month}-${year}`;
        }
        if (fillField('patientPersoonWrapper.persoon.geboortedatum', geboortedatum)) filled++;
    }

    if (data['Geboorteplaats']) {
        if (fillField('patientPersoonWrapper.persoon.geboorteplaats', data['Geboorteplaats'])) filled++;
    }

    if (data['Geslacht']) {
        const geslacht = data['Geslacht'].toLowerCase().includes('man') ? 'M' : 'V';
        if (fillField('patientPersoonWrapper.persoon.geslachtString', geslacht)) filled++;
    }

    if (data['Beroep']) {
        if (fillField('patientPersoonWrapper.persoon.beroep', data['Beroep'])) filled++;
    }

    if (data['Telefoonnummer']) {
        if (fillField('patientPersoonWrapper.persoon.telefoonnummer1', data['Telefoonnummer'])) filled++;
    }

    if (data['E-mail']) {
        if (fillField('patientPersoonWrapper.persoon.email', data['E-mail'])) filled++;
    }

    const targetDoc = getTargetDocument();
    const huisartsField = targetDoc.getElementById('praktijkMedewerker');
    if (huisartsField) {
        for (let option of huisartsField.options) {
            if (option.text.includes('E.A.') && option.text.includes('Westerbeek')) {
                huisartsField.value = option.value;
                huisartsField.dispatchEvent(new Event('change', { bubbles: true }));
                if (huisartsField.onchange) huisartsField.onchange();
                filled++;
                break;
            }
        }
    }

    if (data['BSN']) {
        if (fillField('bsn', data['BSN'])) filled++;
    }

    if (data['ID bewijs nummer']) {
        if (fillField('patientPersoonWrapper.persoon.identificatieDocNumber', data['ID bewijs nummer'])) filled++;
    }

    if (data['Type ID bewijs']) {
        const typeMap = {
            'Paspoort': 'P',
            'Rijbewijs': 'R',
            'Identiteitskaart': 'I'
        };
        const typeValue = typeMap[data['Type ID bewijs']] || data['Type ID bewijs'];
        if (fillField('patientPersoonWrapper.persoon.widDocSoort', typeValue)) filled++;
    }

    const identiteitJa = targetDoc.getElementById('identiteitVergewistJa');
    if (identiteitJa) {
        identiteitJa.checked = true;
        identiteitJa.dispatchEvent(new Event('change', { bubbles: true }));
        filled++;
    }

    return filled;
}

    function isPatientFormPage() {
        return window.location.href.includes('admin.onderhoud.patienten');
    }

    function createUI() {
        if (!isPatientFormPage()) return;

        const targetDoc = getTargetDocument();

        // Check if button already exists
        if (targetDoc.getElementById('promedico-autofill-btn')) return;

        // Find the "Terug" button
        const terugButton = targetDoc.getElementById('Button_<< Terug');
        if (!terugButton) return;

        // Create new button styled like existing buttons
        const button = targetDoc.createElement('input');
        button.id = 'promedico-autofill-btn';
        button.type = 'BUTTON';
        button.value = 'Informatie vullen';
        button.tabIndex = 101;
        button.style.cssText = 'cursor: pointer; margin-right: 5px;';

        button.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();

            const text = prompt('Plak de patiëntgegevens hier:');
            if (text) {
                const data = parseData(text);
                const filled = fillForm(data);
                alert(`✓ ${filled} velden ingevuld!`);
            }
            return false;
        };

        // Insert before "Terug" button
        terugButton.parentNode.insertBefore(button, terugButton);
    }

    function initPatientForm() {
        // Initial attempt
        if (document.body) {
            createUI();
        } else {
            setTimeout(initPatientForm, 500);
        }

        // Monitor for page changes (iframe navigation)
        setInterval(() => {
            createUI();
        }, 2000);
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        // Custom menu items (only on main page)
        initCustomMenus();

        // MEDOVD import drag & drop
        initMedovdImport();

        // Patient form auto-fill button
        initPatientForm();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();