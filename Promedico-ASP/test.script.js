// ==UserScript==
// @name         Promedico ASP - Complete Automation Suite + Document Upload
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Auto-fill patient forms + MEDOVD EDI/ZIP import + Document upload drag & drop + Custom menu items
// @match        https://www.promedico-asp.nl/promedico/*
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // ============================================================================
    // SHARED VARIABLES
    // ============================================================================
    
    // Document upload variables
    let overlayCreated = false;
    let uploadedFileName = '';
    let globalDragDropAttached = false;
    
    // MEDOVD import variables
    let pendingMEDOVDFiles = { edi: null, zip: null };
    let isNavigatingToMEDOVD = false;

    // ============================================================================
    // SHARED UTILITIES
    // ============================================================================

    function debug(message, data = null) {
        console.log(`[PROMEDICO] ${message}`, data || '');
    }

    function showNotification(message, type = 'success') {
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#0275d8'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${colors[type]};
            color: white;
            border-radius: 4px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 100000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        if (!document.head.querySelector('style[data-notification="true"]')) {
            style.setAttribute('data-notification', 'true');
            document.head.appendChild(style);
        }

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(400px)';
            notification.style.transition = 'all 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

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

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // ============================================================================
    // DRAG & DROP OVERLAY (for document uploads)
    // ============================================================================

    function createDragDropOverlay() {
        if (overlayCreated) return;

        debug('Creating drag & drop overlay');

        const overlay = document.createElement('div');
        overlay.id = 'dragDropOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(2, 117, 216, 0.9);
            display: none;
            z-index: 99999;
            pointer-events: none;
        `;
        overlay.innerHTML = `
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                 color: white; font-size: 32px; font-weight: bold; text-align: center; font-family: Arial, sans-serif;">
                <div style="font-size: 64px; margin-bottom: 20px;">📁</div>
                Drop bestanden hier om te uploaden
            </div>
        `;
        document.body.appendChild(overlay);
        overlayCreated = true;
        debug('✓ Overlay created');
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
    // MEDOVD IMPORT (EDI + ZIP) - Existing functionality
    // ============================================================================

    function isOnMedovdImportPage() {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return false;
        const doc = iframe.contentDocument;
        return !!doc.getElementById('ediFile') && !!doc.getElementById('correspondentieFile');
    }

    function fillMedovdFormWithFiles(ediFile, zipFile) {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;
        const ediInput = doc.getElementById('ediFile');
        const zipInput = doc.getElementById('correspondentieFile');
        const submitButton = doc.getElementById('Script_Bestand inlezen');

        if (!ediInput || !zipInput || !submitButton) return;

        const ediDataTransfer = new DataTransfer();
        ediDataTransfer.items.add(ediFile);
        ediInput.files = ediDataTransfer.files;

        const zipDataTransfer = new DataTransfer();
        zipDataTransfer.items.add(zipFile);
        zipInput.files = zipDataTransfer.files;

        ediInput.dispatchEvent(new Event('change', { bubbles: true }));
        zipInput.dispatchEvent(new Event('input', { bubbles: true }));

        showNotification('✓ MEDOVD bestanden toegevoegd', 'success');

        setTimeout(() => {
            submitButton.click();
            showNotification('🔄 Bestand wordt ingelezen...', 'success');
        }, 500);
    }

    function processMedovdDroppedFiles(files) {
        if (files.length !== 2) return false;
        if (!isOnMedovdImportPage()) return false;

        let ediFile = null;
        let zipFile = null;

        for (let file of files) {
            const fileName = file.name.toLowerCase();
            if (fileName.endsWith('.edi')) {
                ediFile = file;
            } else if (fileName.endsWith('.zip')) {
                zipFile = file;
            }
        }

        if (!ediFile || !zipFile) return false;
        
        fillMedovdFormWithFiles(ediFile, zipFile);
        return true;
    }

    function setupMedovdIframeListeners() {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;
        if (doc.hasMedovdDropListener) return;

        doc.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, true);

        doc.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            processMedovdDroppedFiles(Array.from(e.dataTransfer.files));
        }, true);

        doc.hasMedovdDropListener = true;
    }

    function initMedovdImport() {
        setInterval(setupMedovdIframeListeners, 2000);
    }

    // ============================================================================
    // DOCUMENT UPLOAD WORKFLOW (Correspondentie)
    // ============================================================================

    function isOnDocumentUploadPage() {
        const mainText = document.body.textContent || '';
        const iframe = document.querySelector('iframe#panelBackCompatibility-frame');
        let iframeText = '';
        let iframeSrc = '';

        if (iframe) {
            iframeSrc = iframe.src || '';
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                iframeText = iframeDoc.body.textContent || '';
            } catch (error) {}
        }

        const combinedText = mainText + ' ' + iframeText;

        // Check if we're on contact page (initial choice screen OR upload screens)
        return iframeSrc.includes('journaal.contact.m') ||
               combinedText.includes('Document uploaden') ||
               combinedText.includes('Document scannen') ||
               combinedText.includes('Brief samenstellen') ||
               combinedText.includes('Correspondentie toevoegen') ||
               (combinedText.includes('Omschrijving') && combinedText.includes('Bestand'));
    }

    function isOnInitialChoiceScreen() {
        const iframe = document.querySelector('iframe#panelBackCompatibility-frame');
        if (!iframe) return false;

        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const text = iframeDoc.body.textContent || '';
            const hasAllOptions = text.includes('Brief samenstellen') &&
                                 text.includes('Document scannen') &&
                                 text.includes('Document uploaden');
            const hasFileInput = iframeDoc.querySelector('input[type="file"]') !== null;

            // Initial screen has all three options but NO file input
            return hasAllOptions && !hasFileInput;
        } catch (error) {
            return false;
        }
    }

    function isOnFileUploadScreen() {
        // Check main document first
        const mainFileInput = document.querySelector('input[type="file"]');
        if (mainFileInput) {
            return true;
        }

        // Check iframe
        const iframe = document.querySelector('iframe#panelBackCompatibility-frame');
        if (!iframe) return false;

        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            return iframeDoc.querySelector('input[type="file"]') !== null;
        } catch (error) {
            return false;
        }
    }

    function isOnDescriptionScreen() {
        const iframe = document.querySelector('iframe#panelBackCompatibility-frame');
        if (!iframe) return false;

        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            return iframeDoc.querySelector('input[name*="omschrijving" i], textarea[name*="omschrijving" i]') !== null;
        } catch (error) {
            return false;
        }
    }

    function handleDocumentUpload(file) {
        debug('Document upload - File dropped:', file.name);
        uploadedFileName = file.name.replace(/\.[^/.]+$/, '');

        if (!isOnDocumentUploadPage()) {
            debug('Not on document upload page');
            showNotification('⚠️ Niet op document upload pagina', 'error');
            return;
        }

        if (isOnInitialChoiceScreen()) {
            debug('On initial choice screen, clicking Document uploaden');
            clickDocumentUploaden(file);
            return;
        }

        if (isOnFileUploadScreen()) {
            debug('On file upload screen, performing upload');
            performDocumentUpload(file);
            return;
        }

        debug('Unknown state, showing info message');
        showNotification('Upload het bestand direct op de upload pagina', 'info');
    }

    function clickDocumentUploaden(file) {
        const iframe = document.querySelector('iframe#panelBackCompatibility-frame');
        if (!iframe) {
            debug('Iframe not found');
            return;
        }

        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const buttons = Array.from(iframeDoc.querySelectorAll('button, a, input[type="button"], span[onclick], div[onclick], td[onclick]'));

            debug('Searching for Document uploaden button in', buttons.length, 'elements');

            const uploadButton = buttons.find(el => {
                const text = (el.textContent || el.value || '').toLowerCase();
                return text.includes('document uploaden');
            });

            if (uploadButton) {
                debug('Found Document uploaden button, clicking');
                uploadButton.click();
                showNotification('→ Navigeren naar Document uploaden...', 'info');

                // Wait for navigation
                setTimeout(() => {
                    if (isOnFileUploadScreen()) {
                        performDocumentUpload(file);
                    } else {
                        debug('Not on file upload screen yet, waiting more...');
                        setTimeout(() => performDocumentUpload(file), 1500);
                    }
                }, 1500);
            } else {
                debug('Document uploaden button not found');
                showNotification('Klik handmatig op Document uploaden', 'info');
            }
        } catch (error) {
            debug('Error in clickDocumentUploaden', error);
            showNotification('Fout bij navigatie', 'error');
        }
    }

    function performDocumentUpload(file) {
        // Try main document first
        let fileInput = document.querySelector('input[type="file"]');
        let targetDoc = document;

        if (!fileInput) {
            const iframe = document.querySelector('iframe#panelBackCompatibility-frame');
            if (iframe) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    fileInput = iframeDoc.querySelector('input[type="file"]');
                    targetDoc = iframeDoc;
                } catch (error) {}
            }
        }

        if (fileInput) {
            debug('Found file input, uploading file');
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            showNotification('✓ Bestand toegevoegd: ' + file.name, 'success');

            setTimeout(() => autoClickVerderButton(targetDoc), 500);
        } else {
            debug('File input not found');
            showNotification('Upload veld niet gevonden', 'error');
        }
    }

    function autoClickVerderButton(targetDoc = null) {
        if (!targetDoc) {
            const iframe = document.querySelector('iframe#panelBackCompatibility-frame');
            if (iframe) {
                try {
                    targetDoc = iframe.contentDocument || iframe.contentWindow.document;
                } catch (error) {
                    targetDoc = document;
                }
            } else {
                targetDoc = document;
            }
        }

        try {
            const buttons = Array.from(targetDoc.querySelectorAll('button, input[type="submit"], input[type="button"]'));
            const verderButton = buttons.find(el => {
                const text = (el.textContent || el.value || '').toLowerCase();
                return text.includes('verder') || text.includes('upload') || text.includes('volgende');
            });

            if (verderButton) {
                debug('Found Verder button, clicking');
                verderButton.click();
                showNotification('→ Verder...', 'success');
                setTimeout(() => checkAndAutoClickSecondVerder(), 2000);
            } else {
                debug('Verder button not found');
            }
        } catch (error) {
            debug('Error in autoClickVerderButton', error);
        }
    }

    function checkAndAutoClickSecondVerder() {
        const iframe = document.querySelector('iframe#panelBackCompatibility-frame');
        if (!iframe) return;

        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const text = iframeDoc.body.textContent || '';

            // Check if we're on Step 2
            if (text.includes('Stap 2 van 3') || text.includes('Inzien document voor controle')) {
                debug('On Step 2, looking for Verder button with verder2');
                const buttons = Array.from(iframeDoc.querySelectorAll('input[type="button"], button'));
                const verderButton = buttons.find(el => {
                    const onclick = el.getAttribute('onclick') || '';
                    return onclick.includes('verder2');
                });

                if (verderButton) {
                    debug('Found Verder button (verder2), clicking');
                    verderButton.click();
                    showNotification('→ Naar stap 3...', 'success');
                    setTimeout(() => autoFillDescription(), 1500);
                } else {
                    debug('Verder button (verder2) not found, checking again in 1 second');
                    setTimeout(() => checkAndAutoClickSecondVerder(), 1000);
                }
            } else if (isOnDescriptionScreen()) {
                debug('Already on description screen');
                autoFillDescription();
            } else {
                debug('Not on Step 2 yet, checking again in 1 second');
                setTimeout(() => checkAndAutoClickSecondVerder(), 1000);
            }
        } catch (error) {
            debug('Error in checkAndAutoClickSecondVerder', error);
        }
    }

    function autoFillDescription() {
        if (!uploadedFileName || !isOnDocumentUploadPage()) return;

        const iframe = document.querySelector('iframe#panelBackCompatibility-frame');
        if (!iframe) return;

        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const omschrijvingField =
                iframeDoc.querySelector('input[name*="omschrijving" i]') ||
                iframeDoc.querySelector('textarea[name*="omschrijving" i]') ||
                iframeDoc.querySelector('textarea');

            if (omschrijvingField && !omschrijvingField.value) {
                debug('Found description field, filling with:', uploadedFileName);
                omschrijvingField.value = uploadedFileName;
                omschrijvingField.dispatchEvent(new Event('input', { bubbles: true }));
                showNotification('✓ Omschrijving ingevuld: ' + uploadedFileName, 'success');
            } else {
                debug('Description field not found or already filled');
            }
        } catch (error) {
            debug('Error in autoFillDescription', error);
        }
    }

    // ============================================================================
    // GLOBAL DROP HANDLER - ROUTER
    // ============================================================================

    function handleGlobalDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files.length === 0) return;

        let ediFile = null, zipFile = null, otherFiles = [];

        Array.from(files).forEach(file => {
            const fileName = file.name.toLowerCase();
            if (fileName.endsWith('.edi')) {
                ediFile = file;
            } else if (fileName.endsWith('.zip')) {
                zipFile = file;
            } else {
                otherFiles.push(file);
            }
        });

        // MEDOVD workflow - both files dropped together
        if (ediFile && zipFile) {
            debug('MEDOVD files detected (.edi + .zip)');
            
            // If already on MEDOVD page, fill form directly
            if (isOnMedovdImportPage()) {
                fillMedovdFormWithFiles(ediFile, zipFile);
            } else {
                showNotification('⚠️ Ga naar MEDOVD import pagina en drop bestanden daar', 'info');
            }
            return;
        }

        // Document upload workflow
        if (otherFiles.length > 0) {
            handleDocumentUpload(otherFiles[0]);
            return;
        }

        // Error: only one MEDOVD file
        if (ediFile || zipFile) {
            showNotification('⚠️ Upload beide MEDOVD bestanden (.EDI en .ZIP) tegelijk', 'error');
            return;
        }
    }

    function attachGlobalDragDropHandlers() {
        if (globalDragDropAttached) return;

        createDragDropOverlay();

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, preventDefaults, false);
        });

        let dragCounter = 0;
        document.addEventListener('dragenter', () => {
            dragCounter++;
            if (dragCounter === 1) {
                document.getElementById('dragDropOverlay').style.display = 'block';
            }
        });

        document.addEventListener('dragleave', () => {
            dragCounter--;
            if (dragCounter === 0) {
                document.getElementById('dragDropOverlay').style.display = 'none';
            }
        });

        document.addEventListener('drop', () => {
            dragCounter = 0;
            document.getElementById('dragDropOverlay').style.display = 'none';
        });

        document.addEventListener('drop', handleGlobalDrop, false);

        globalDragDropAttached = true;
        debug('✓ Global drag & drop handlers attached');
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

        // Meisjesnaam (maiden name) goes to Achternaam
        if (data['Meisjesnaam']) {
            if (fillField('patientPersoonWrapper.persoon.achternaam', data['Meisjesnaam'])) filled++;
        }

        // Achternaam (from data) goes to Partner achternaam
        if (data['Achternaam']) {
            if (fillField('patientPersoonWrapper.persoon.partnerachternaam', data['Achternaam'])) filled++;
        }

        // Tussenvoegsel (prefix like "van", "de", etc.)
        if (data['Tussenvoegsel']) {
            if (fillField('patientPersoonWrapper.persoon.tussenvoegsel', data['Tussenvoegsel'])) filled++;
        }

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
                if (option.text.includes('E.A.') && option.text.includes('Westerbeek van Eerten')) {
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
    // PAGE MONITORING
    // ============================================================================

    function monitorPageContent() {
        setInterval(() => {
            // Document upload description auto-fill monitoring
            if (uploadedFileName && isOnDescriptionScreen()) {
                autoFillDescription();
            }
        }, 500);
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        debug('Initializing Complete Automation Suite v2.0');

        // Custom menu items (only on main page)
        initCustomMenus();

        // MEDOVD import drag & drop (iframe-specific)
        initMedovdImport();

        // Global drag & drop for document uploads
        attachGlobalDragDropHandlers();

        // Patient form auto-fill button
        initPatientForm();

        // Page monitoring for auto-fill features
        monitorPageContent();

        debug('✓ All features initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
