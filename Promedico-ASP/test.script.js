// ==UserScript==
// @name         Promedico ASP - Complete Suite (All Features Combined)
// @namespace    http://tampermonkey.net/
// @version      3.9.1
// @description  Complete automation: Document upload (drag&drop), E-consult templates, Contactsoort buttons, Zorgdomein menu, Patient forms, MEDOVD import, CRP button
// @author       Combined
// @match        https://www.promedico-asp.nl/promedico/*
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // Prevent multiple script instances - CRITICAL CHECK
    if (window.promedicoAutomationLoaded) {
        console.log('[PROMEDICO] Script already loaded, preventing duplicate initialization');
        return;
    }
    window.promedicoAutomationLoaded = true;
    
    // Also check if another version is running
    if (window.promedicoAutomationVersion && !window.promedicoAutomationVersion.startsWith('3.9')) {
        console.error('[PROMEDICO] ERROR: Another version (' + window.promedicoAutomationVersion + ') is already running!');
        console.error('[PROMEDICO] Please DISABLE the old script in Tampermonkey to avoid conflicts!');
        alert('WAARSCHUWING: Er draait al een oude versie van het Promedico script!\n\nGa naar Tampermonkey en schakel alle oude Promedico scripts uit, behalve versie 3.9');
        return;
    }
    window.promedicoAutomationVersion = '3.9';

    console.log('[PROMEDICO] Complete Suite v3.9 - Initializing...');

    // ============================================================================
    // SHARED UTILITIES
    // ============================================================================

    function getContentIframe() {
        return document.getElementById('panelBackCompatibility-frame');
    }

    function getTargetDocument() {
        if (window.location.href.includes('admin.onderhoud.patienten')) {
            return document;
        }
        const iframe = getContentIframe();
        if (iframe) {
            try {
                return iframe.contentDocument || iframe.contentWindow.document;
            } catch (e) {
                console.error('[PROMEDICO] Cannot access iframe:', e);
            }
        }
        return document;
    }

    // ============================================================================
    // FEATURE 1: DOCUMENT UPLOAD WITH DRAG & DROP (v2.8 CLEAN)
    // ============================================================================

    let uploadedFileName = '';
    
    // Store file in sessionStorage to survive page reloads
    function storeFileForUpload(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result, // base64 data
                timestamp: Date.now() // Add timestamp for expiry check
            };
            sessionStorage.setItem('promedicoUploadFile', JSON.stringify(fileData));
            console.log('[PROMEDICO] File stored in sessionStorage: ' + file.name);
        };
        reader.readAsDataURL(file);
    }
    
    function getStoredFile() {
        const stored = sessionStorage.getItem('promedicoUploadFile');
        if (!stored) return null;
        
        try {
            const fileData = JSON.parse(stored);
            
            // Check if file is older than 5 minutes (300000ms)
            const age = Date.now() - (fileData.timestamp || 0);
            if (age > 300000) {
                console.log('[PROMEDICO] Stored file is too old (' + Math.round(age/1000) + 's), clearing');
                clearStoredFile();
                return null;
            }
            
            console.log('[PROMEDICO] Retrieved stored file: ' + fileData.name);
            
            // Convert base64 back to File object
            const arr = fileData.data.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], fileData.name, { type: mime });
        } catch (e) {
            console.error('[PROMEDICO] Error retrieving stored file:', e);
            clearStoredFile();
            return null;
        }
    }
    
    function clearStoredFile() {
        sessionStorage.removeItem('promedicoUploadFile');
        console.log('[PROMEDICO] Cleared stored file from sessionStorage');
    }

    function createDragDropOverlay() {
        if (window.location !== window.top.location) return;
        if (document.getElementById('dragDropOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'dragDropOverlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(2, 117, 216, 0.9); display: none; z-index: 99999;
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
    }

    function showOverlay() {
        const overlay = document.getElementById('dragDropOverlay');
        if (overlay) overlay.style.display = 'block';
    }

    function hideOverlay() {
        const overlay = document.getElementById('dragDropOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    function isOnDocumentUploadPage() {
        const iframe = getContentIframe();
        if (!iframe) {
            console.log('[PROMEDICO] isOnDocumentUploadPage check: No iframe found');
            return false;
        }

        let iframeSrc = iframe.src || '';
        
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const text = iframeDoc.body.textContent || '';
            
            console.log('[PROMEDICO] isOnDocumentUploadPage check:');
            console.log('[PROMEDICO]   - iframe src: ' + iframeSrc);
            
            const checks = {
                'journaal.contact.m': iframeSrc.includes('journaal.contact.m'),
                'uploadselectie': iframeSrc.includes('correspondentie.uploadselectie'),
                'uploadhandler': iframeSrc.includes('correspondentie.uploadhandler'),
                'has "Document uploaden"': text.includes('Document uploaden'),
                'has "Document scannen"': text.includes('Document scannen'),
                'has "Brief samenstellen"': text.includes('Brief samenstellen'),
                'has file input': !!iframeDoc.querySelector('input[type="file"]'),
                'has "Omschrijving"': text.includes('Omschrijving'),
                'has "Bestand"': text.includes('Bestand')
            };
            
            for (let [key, value] of Object.entries(checks)) {
                console.log('[PROMEDICO]   - ' + key + ': ' + value);
            }
            
            const result = iframeSrc.includes('journaal.contact.m') ||
                   iframeSrc.includes('correspondentie.uploadselectie') ||
                   iframeSrc.includes('correspondentie.uploadhandler') ||
                   text.includes('Document uploaden') ||
                   text.includes('Document scannen') ||
                   text.includes('Brief samenstellen') ||
                   (text.includes('Omschrijving') && text.includes('Bestand'));
                   
            console.log('[PROMEDICO]   - RESULT: ' + result);
            
            return result;
        } catch (error) {
            console.log('[PROMEDICO] isOnDocumentUploadPage error:', error);
            return false;
        }
    }

    function isOnJournaalPage() {
        const iframe = getContentIframe();
        if (!iframe) {
            console.log('[PROMEDICO] isOnJournaalPage check: No iframe found');
            return false;
        }

        try {
            const iframeSrc = iframe.src || '';
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const text = iframeDoc.body.textContent || '';
            
            console.log('[PROMEDICO] isOnJournaalPage check:');
            console.log('[PROMEDICO]   - iframe src: ' + iframeSrc);
            console.log('[PROMEDICO]   - has "Correspondentie toevoegen": ' + text.includes('Correspondentie toevoegen'));
            console.log('[PROMEDICO]   - has "Document uploaden": ' + text.includes('Document uploaden'));
            
            // Don't navigate if already on the contact upload workflow
            if (iframeSrc.includes('journaal.contact.m')) {
                console.log('[PROMEDICO]   - Already on journaal.contact.m');
                return false;
            }
            
            if (iframeSrc.includes('correspondentie.uploadselectie')) {
                console.log('[PROMEDICO]   - Already on uploadselectie');
                return false;
            }
            
            if (iframeSrc.includes('correspondentie.uploadhandler')) {
                console.log('[PROMEDICO]   - Already on uploadhandler');
                return false;
            }
            
            // Check if we have "Correspondentie toevoegen" button available
            // This means we need to navigate TO the correspondentie page
            const hasCorrespondentieButton = text.includes('Correspondentie toevoegen');
            
            // Check if we're NOT already on a document upload screen
            const isNotOnUploadScreen = !text.includes('Document uploaden') && 
                                       !text.includes('Document scannen') && 
                                       !text.includes('Brief samenstellen');
            
            const result = hasCorrespondentieButton && isNotOnUploadScreen;
            console.log('[PROMEDICO]   - RESULT: ' + result);
            
            return result;
        } catch (error) {
            console.log('[PROMEDICO] isOnJournaalPage error:', error);
            return false;
        }
    }

    function clickCorrespondentieToevoegen() {
        const iframe = getContentIframe();
        if (!iframe) return false;

        try {
            const iframeDoc = iframe.contentDocument;
            
            const sidebarContainers = [
                iframeDoc.getElementById('leftcontainer'),
                iframeDoc.getElementById('actionbuttons'),
                iframeDoc.getElementById('episode')
            ].filter(el => el);
            
            for (let container of sidebarContainers) {
                const clickableElements = container.querySelectorAll('*');
                
                for (let el of clickableElements) {
                    let text = '';
                    for (let node of el.childNodes) {
                        if (node.nodeType === Node.TEXT_NODE) {
                            text += node.nodeValue || '';
                        }
                    }
                    text = text.toLowerCase().replace(/\s+/g, ' ').trim();
                    
                    if (text.includes('correspondentie toevoegen')) {
                        console.log('[PROMEDICO] → Navigeren naar Correspondentie toevoegen...');
                        el.click();
                        return true;
                    }
                }
            }
        } catch (error) {
            console.error('[PROMEDICO] Error clicking Correspondentie toevoegen:', error);
        }
        
        return false;
    }

    function clickDocumentUploaden() {
        const iframe = getContentIframe();
        if (!iframe) return false;

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const allElements = iframeDoc.querySelectorAll('*');
        
        for (let el of allElements) {
            const text = el.textContent.toLowerCase().trim();
            const onclick = el.getAttribute('onclick') || '';
            
            if ((text === 'document uploaden' || onclick.includes('document uploaden')) &&
                (el.tagName === 'TD' || el.tagName === 'DIV' || el.tagName === 'SPAN' || 
                 el.tagName === 'A' || el.tagName === 'BUTTON')) {
                
                console.log('[PROMEDICO] → Navigeren naar Document uploaden...');
                el.click();
                
                if (el.parentElement && el.parentElement.onclick) {
                    el.parentElement.click();
                }
                
                return true;
            }
        }
        
        return false;
    }

    function uploadFileToInput(file) {
        const iframe = getContentIframe();
        if (!iframe) {
            console.log('[PROMEDICO] ✗ No iframe found');
            return false;
        }

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const fileInput = iframeDoc.querySelector('input[type="file"]');
        
        if (!fileInput) {
            console.log('[PROMEDICO] ✗ No file input found');
            return false;
        }

        // Check if file is valid
        if (!file || typeof file !== 'object' || !file.name) {
            console.log('[PROMEDICO] ✗ Invalid file object:', file);
            return false;
        }

        console.log('[PROMEDICO] Uploading file: ' + file.name);

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        uploadedFileName = file.name.replace(/\.[^/.]+$/, '');
        console.log('[PROMEDICO] ✓ Bestand geupload: ' + file.name);
        
        setTimeout(() => {
            const verderButton = findVerderButton(iframeDoc);
            if (verderButton) {
                console.log('[PROMEDICO] → Klikken op Verder...');
                verderButton.click();
            }
        }, 500);
        
        return true;
    }

    function findVerderButton(doc) {
        const buttons = doc.querySelectorAll('input[type="button"], button');
        
        for (let button of buttons) {
            const buttonText = button.value || button.textContent || '';
            if (buttonText.toLowerCase().includes('verder')) {
                return button;
            }
        }
        
        return null;
    }

    function clickVerder2Button() {
        const iframe = getContentIframe();
        if (!iframe) return;

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const buttons = iframeDoc.querySelectorAll('input[type="button"], button');
        
        for (let button of buttons) {
            const onclick = button.getAttribute('onclick') || '';
            if (onclick.includes('verder2')) {
                console.log('[PROMEDICO] → Klikken op Verder2...');
                button.click();
                return;
            }
        }
    }

    function autoFillDescription() {
        if (!uploadedFileName) return;

        const iframe = getContentIframe();
        if (!iframe) return;

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const descriptionInput = iframeDoc.querySelector('input[name*="omschrijving"]');
        
        if (descriptionInput && !descriptionInput.value) {
            descriptionInput.value = uploadedFileName;
            descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('[PROMEDICO] ✓ Omschrijving ingevuld: ' + uploadedFileName);
        }
    }

    function isOnDescriptionScreen() {
        const iframe = getContentIframe();
        if (!iframe) return false;

        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            return !!iframeDoc.querySelector('input[name*="omschrijving"]');
        } catch (error) {
            return false;
        }
    }

    function handleDocumentUpload(file) {
        console.log('[PROMEDICO] === Document upload handler ===');
        console.log('[PROMEDICO] File: ' + file.name);
        console.log('[PROMEDICO] Checking page state...');
        
        const iframe = getContentIframe();
        
        // Special case: No iframe loaded (just logged in / main page)
        if (!iframe) {
            console.log('[PROMEDICO] ✗ No iframe - probably just logged in');
            console.log('[PROMEDICO] → Storing file and navigating to Correspondentie');
            storeFileForUpload(file);
            
            // Try to click Correspondentie in top menu
            const correspondenteMenu = document.getElementById('MainMenu-Correspondentie');
            if (correspondenteMenu) {
                console.log('[PROMEDICO] → Clicking Correspondentie menu');
                correspondenteMenu.click();
                return;
            }
            
            alert('Navigeer eerst naar een patiënt dossier voordat je een document uploadt');
            clearStoredFile();
            return;
        }
        
        const onJournaal = isOnJournaalPage();
        const onDocUpload = isOnDocumentUploadPage();
        
        console.log('[PROMEDICO] isOnJournaalPage: ' + onJournaal);
        console.log('[PROMEDICO] isOnDocumentUploadPage: ' + onDocUpload);
        
        if (onJournaal) {
            console.log('[PROMEDICO] → Need to navigate to Correspondentie toevoegen');
            storeFileForUpload(file);
            
            if (!clickCorrespondentieToevoegen()) {
                console.log('[PROMEDICO] ✗ Could not find/click Correspondentie toevoegen');
                clearStoredFile();
                return;
            }
            
            console.log('[PROMEDICO] ✓ Clicked Correspondentie toevoegen, file stored, monitoring will handle upload');
            // File is stored in sessionStorage, monitoring will pick it up and click "Document uploaden"
            return;
        }

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const fileInput = iframeDoc.querySelector('input[type="file"]');
        
        if (fileInput) {
            console.log('[PROMEDICO] → Found file input, uploading directly');
            uploadFileToInput(file);
            clearStoredFile();
        } else if (iframeDoc.body.textContent.includes('Document uploaden')) {
            console.log('[PROMEDICO] → On initial choice screen, clicking Document uploaden');
            if (!clickDocumentUploaden()) {
                console.log('[PROMEDICO] ✗ Could not find/click Document uploaden');
                return;
            }
            
            storeFileForUpload(file);
            console.log('[PROMEDICO] ✓ Clicked Document uploaden, file stored, monitoring will handle upload');
        } else {
            console.log('[PROMEDICO] ✗ Unknown state - not on upload page, no file input, no Document uploaden button');
        }
    }

    let pendingMedovdFiles = null;

    function storeMedovdFiles(ediFile, zipFile) {
        const ediReader = new FileReader();
        const zipReader = new FileReader();
        
        ediReader.onload = function(e) {
            const ediData = {
                name: ediFile.name,
                type: ediFile.type,
                data: e.target.result
            };
            
            zipReader.onload = function(e2) {
                const zipData = {
                    name: zipFile.name,
                    type: zipFile.type,
                    data: e2.target.result
                };
                
                sessionStorage.setItem('promedicoMedovdFiles', JSON.stringify({
                    edi: ediData,
                    zip: zipData,
                    timestamp: Date.now()
                }));
                console.log('[PROMEDICO] MEDOVD files stored in sessionStorage');
            };
            zipReader.readAsDataURL(zipFile);
        };
        ediReader.readAsDataURL(ediFile);
    }
    
    function getStoredMedovdFiles() {
        const stored = sessionStorage.getItem('promedicoMedovdFiles');
        if (!stored) return null;
        
        try {
            const filesData = JSON.parse(stored);
            
            // Check if files are older than 5 minutes
            const age = Date.now() - (filesData.timestamp || 0);
            if (age > 300000) {
                console.log('[PROMEDICO] Stored MEDOVD files are too old (' + Math.round(age/1000) + 's), clearing');
                clearStoredMedovdFiles();
                return null;
            }
            
            // Convert both files back to File objects
            const convertToFile = (fileData) => {
                const arr = fileData.data.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while(n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new File([u8arr], fileData.name, { type: mime });
            };
            
            return {
                edi: convertToFile(filesData.edi),
                zip: convertToFile(filesData.zip)
            };
        } catch (e) {
            console.error('[PROMEDICO] Error retrieving MEDOVD files:', e);
            clearStoredMedovdFiles();
            return null;
        }
    }
    
    function clearStoredMedovdFiles() {
        sessionStorage.removeItem('promedicoMedovdFiles');
        console.log('[PROMEDICO] Cleared stored MEDOVD files from sessionStorage');
    }

    function handleGlobalDrop(e) {
        if (window.location !== window.top.location) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        hideOverlay();
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return false;

        // CRITICAL: Check if this is a MEDOVD import FIRST
        if (files.length === 2) {
            let ediFile = null;
            let zipFile = null;
            
            for (let file of files) {
                const fileName = file.name.toLowerCase();
                if (fileName.endsWith('.edi')) ediFile = file;
                if (fileName.endsWith('.zip')) zipFile = file;
            }
            
            // If both .edi and .zip are present, this is MEDOVD
            if (ediFile && zipFile) {
                console.log('[PROMEDICO] MEDOVD files detected');
                
                // Check if we're already on the MEDOVD import page
                if (isOnMedovdImportPage()) {
                    console.log('[PROMEDICO] Already on MEDOVD page, processing files');
                    fillMedovdFormWithFiles(ediFile, zipFile);
                } else {
                    console.log('[PROMEDICO] Not on MEDOVD page, navigating...');
                    storeMedovdFiles(ediFile, zipFile);
                    navigateToMedovdImportPage();
                }
                
                return false;
            }
        }

        // Not MEDOVD, handle as document upload
        const file = files[0];
        handleDocumentUpload(file);
        
        return false;
    }

    function navigateToMedovdImportPage() {
        // Click the MEDOVD import menu item we created
        const medovdMenuItem = document.getElementById('MainMenu-Patiënt-MedovdImport');
        
        if (medovdMenuItem) {
            console.log('[PROMEDICO] Clicking MEDOVD import menu item');
            medovdMenuItem.click();
        } else {
            // Fallback: manually click through menu
            console.log('[PROMEDICO] Menu item not found, using fallback navigation');
            const patientMenu = document.getElementById('MainMenu-Patiënt-Zoeken');
            if (patientMenu) {
                patientMenu.click();
                
                setTimeout(() => {
                    const iframe = getContentIframe();
                    if (iframe && iframe.contentDocument) {
                        const importButton = iframe.contentDocument.getElementById('action_medOvdImporteren');
                        if (importButton) {
                            importButton.click();
                        }
                    }
                }, 1000);
            }
        }
        
        // Files are stored in sessionStorage, will be picked up by monitoring
    }

    function initDocumentUpload() {
        createDragDropOverlay();

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showOverlay();
            return false;
        }, true);

        document.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === document.body || e.target === document.documentElement) {
                hideOverlay();
            }
            return false;
        }, true);

        document.addEventListener('drop', handleGlobalDrop, true);

        setInterval(() => {
            const iframe = getContentIframe();
            if (!iframe) return;

            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const text = iframeDoc.body.textContent || '';
                
                if (text.includes('Inzien document voor controle')) {
                    clickVerder2Button();
                }
                
                // Check if we're on login page - if so, clear any stored files
                if (window.location.href.includes('login') || text.includes('Aanmelden')) {
                    const hasStoredFile = sessionStorage.getItem('promedicoUploadFile');
                    const hasStoredMedovd = sessionStorage.getItem('promedicoMedovdFiles');
                    
                    if (hasStoredFile || hasStoredMedovd) {
                        console.log('[PROMEDICO] Login page detected, clearing stored files');
                        clearStoredFile();
                        clearStoredMedovdFiles();
                    }
                }
            } catch (error) {}
        }, 1000);
    }

    function monitorPageContent() {
        let lastDescriptionFill = 0;
        let lastDocumentUploadenClick = 0;
        let hasClickedDocumentUploaden = false;
        
        setInterval(() => {
            const now = Date.now();
            
            // Check for description field
            if (uploadedFileName && isOnDescriptionScreen() && (now - lastDescriptionFill > 2000)) {
                autoFillDescription();
                lastDescriptionFill = now;
            }
            
            // Check for stored file waiting to be uploaded
            const storedFile = getStoredFile();
            if (storedFile) {
                const iframe = getContentIframe();
                if (iframe) {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    const text = iframeDoc.body.textContent || '';
                    const fileInput = iframeDoc.querySelector('input[type="file"]');
                    
                    // Priority 1: If file input exists, upload immediately
                    if (fileInput) {
                        console.log('[PROMEDICO] ✓ Found file input, uploading stored file');
                        uploadFileToInput(storedFile);
                        clearStoredFile();
                        hasClickedDocumentUploaden = false; // Reset for next upload
                        lastDocumentUploadenClick = 0;
                    }
                    // Priority 2: If on choice screen and haven't clicked yet
                    else if (text.includes('Document uploaden') && 
                             !hasClickedDocumentUploaden && 
                             (now - lastDocumentUploadenClick > 3000)) {
                        console.log('[PROMEDICO] On choice screen, clicking Document uploaden');
                        if (clickDocumentUploaden()) {
                            hasClickedDocumentUploaden = true;
                            lastDocumentUploadenClick = now;
                        }
                    }
                }
            } else {
                // No stored file, reset the click flag
                hasClickedDocumentUploaden = false;
                lastDocumentUploadenClick = 0;
            }
        }, 500);
    }

    // ============================================================================
    // FEATURE 2: E-CONSULT TEMPLATES (v1.1 CLEAN)
    // ============================================================================

    const ECONSULT_TEMPLATES = [
        {
            id: 'bloedprikken',
            label: 'Bloedprikken afspraak',
            text: `Beste,

Dank voor uw bericht. U kunt een afspraak maken voor bloedprikken via onze assistente of online via de website.

Nuchter verschijnen is niet nodig, tenzij anders aangegeven.

Met vriendelijke groet,`
        },
        {
            id: 'recept',
            label: 'Recept herhaalmedicatie',
            text: `Beste,

Uw receptaanvraag is in behandeling genomen. U kunt het recept binnen 2 werkdagen ophalen bij uw apotheek.

Met vriendelijke groet,`
        },
        {
            id: 'verwijzing',
            label: 'Verwijzing aangevraagd',
            text: `Beste,

Uw verwijzing is aangevraagd. U ontvangt deze per post of kunt deze ophalen aan de balie.

Maak een afspraak bij de desbetreffende specialist zodra u de verwijzing heeft ontvangen.

Met vriendelijke groet,`
        },
        {
            id: 'uitslagen',
            label: 'Uitslagen zijn binnen',
            text: `Beste,

De uitslagen van uw onderzoek zijn binnen en zijn besproken. Er zijn geen bijzonderheden.

Heeft u nog vragen, neem dan contact op met de praktijk.

Met vriendelijke groet,`
        },
        {
            id: 'afspraak',
            label: 'Afspraak maken',
            text: `Beste,

Dank voor uw bericht. Graag zou ik u uitnodigen voor een consult om dit verder te bespreken.

U kunt een afspraak maken via onze assistente of online.

Met vriendelijke groet,`
        },
        {
            id: 'onvoldoende_info',
            label: 'Onvoldoende informatie',
            text: `Beste,

Dank voor uw bericht. Om u goed te kunnen adviseren heb ik wat meer informatie nodig:

- [Specificeer welke informatie nodig is]

Kunt u deze informatie aanvullen?

Met vriendelijke groet,`
        },
        {
            id: 'custom',
            label: '--- Eigen tekst ---',
            text: ''
        }
    ];

    function getCurrentUserName() {
        const userDiv = document.querySelector('.GEM3CPJDGMC');
        
        if (userDiv) {
            const fullText = userDiv.textContent.trim();
            const match = fullText.match(/Aangemeld als\s+(.+)/);
            if (match) {
                return match[1].trim();
            }
        }
        
        return 'De huisarts';
    }

    function createEconsultTemplateButton() {
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'econsult-template-btn';
        button.innerHTML = '📝 Sjablonen';
        button.style.cssText = `
            padding: 5px 10px;
            margin-left: 10px;
            background-color: #0275d8;
            color: white;
            border: 1px solid #0275d8;
            border-radius: 3px;
            cursor: pointer;
            font-family: Arial, sans-serif;
            font-size: 13px;
            vertical-align: middle;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#025aa5';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#0275d8';
        });
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            showEconsultTemplateMenu(button);
        });
        
        return button;
    }

    function createEconsultTemplateMenu() {
        const menu = document.createElement('div');
        menu.id = 'econsult-template-menu';
        menu.style.cssText = `
            position: absolute;
            background: white;
            border: 2px solid #0275d8;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            min-width: 250px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
        `;
        
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px;
            background: #0275d8;
            color: white;
            font-weight: bold;
            border-bottom: 1px solid #025aa5;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = '<span>Kies een sjabloon</span><span style="cursor: pointer;">✕</span>';
        
        header.querySelector('span:last-child').addEventListener('click', () => {
            hideEconsultTemplateMenu();
        });
        
        menu.appendChild(header);
        
        ECONSULT_TEMPLATES.forEach(template => {
            const item = document.createElement('div');
            item.className = 'template-menu-item';
            item.textContent = template.label;
            item.style.cssText = `
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 1px solid #e0e0e0;
                font-family: Arial, sans-serif;
                font-size: 13px;
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f0f8ff';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'white';
            });
            
            item.addEventListener('click', () => {
                insertEconsultTemplate(template);
                hideEconsultTemplateMenu();
            });
            
            menu.appendChild(item);
        });
        
        document.body.appendChild(menu);
        return menu;
    }

    function showEconsultTemplateMenu(button) {
        let menu = document.getElementById('econsult-template-menu');
        
        if (!menu) {
            menu = createEconsultTemplateMenu();
        }
        
        const rect = button.getBoundingClientRect();
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.left = rect.left + 'px';
        menu.style.display = 'block';
    }

    function hideEconsultTemplateMenu() {
        const menu = document.getElementById('econsult-template-menu');
        if (menu) {
            menu.style.display = 'none';
        }
    }

    function insertEconsultTemplate(template) {
        const reactieTextarea = findReactieTextarea();
        
        if (!reactieTextarea) {
            alert('Kon het Reactie veld niet vinden');
            return;
        }
        
        const userName = getCurrentUserName();
        let message = template.text;
        
        if (template.text) {
            message += '\n' + userName;
        }
        
        reactieTextarea.value = message;
        const event = new Event('input', { bubbles: true });
        reactieTextarea.dispatchEvent(event);
    }

    function findReactieTextarea() {
        const iframe = getContentIframe();
        if (!iframe) return null;
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const textareas = iframeDoc.querySelectorAll('textarea');
        
        for (let textarea of textareas) {
            if (textarea.name && textarea.name.toLowerCase().includes('reactie')) {
                return textarea;
            }
        }
        
        const labels = iframeDoc.querySelectorAll('td');
        for (let label of labels) {
            if (label.textContent.includes('Reactie(P)')) {
                const parentRow = label.closest('tr');
                if (parentRow) {
                    const textarea = parentRow.querySelector('textarea');
                    if (textarea) {
                        return textarea;
                    }
                }
            }
        }
        
        return null;
    }

    function injectEconsultTemplateButton() {
        const iframe = getContentIframe();
        if (!iframe) return false;
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        if (!iframeDoc.body.textContent.includes('Journaal/E-consult')) {
            return false;
        }
        
        if (iframeDoc.getElementById('econsult-template-btn')) {
            return true;
        }
        
        const labels = iframeDoc.querySelectorAll('td');
        for (let label of labels) {
            if (label.textContent.includes('Reactie(P)')) {
                const button = createEconsultTemplateButton();
                label.appendChild(button);
                return true;
            }
        }
        
        return false;
    }

    function initEconsultTemplates() {
        setInterval(() => {
            injectEconsultTemplateButton();
        }, 1000);
        
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('econsult-template-menu');
            const button = document.getElementById('econsult-template-btn');
            
            if (menu && button && 
                !menu.contains(e.target) && 
                !button.contains(e.target)) {
                hideEconsultTemplateMenu();
            }
        });
    }

    // ============================================================================
    // FEATURE 3: CONTACTSOORT QUICK BUTTONS (v1.0)
    // ============================================================================

    const CONTACT_TYPES = [
        {
            key: 'E',
            label: 'E-consult',
            value: 'EC - electronisch consult',
            color: '#0275d8',
            hoverColor: '#025aa5'
        },
        {
            key: 'C',
            label: 'Consult',
            value: 'C - consult',
            color: '#5cb85c',
            hoverColor: '#449d44'
        },
        {
            key: 'T',
            label: 'Telefonisch',
            value: 'T - telefonisch contact',
            color: '#f0ad4e',
            hoverColor: '#ec971f'
        },
        {
            key: 'V',
            label: 'Visite',
            value: 'V - visite',
            color: '#d9534f',
            hoverColor: '#c9302c'
        }
    ];

    function createContactsoortQuickButton(contactType, dropdown) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'contactsoort-quick-btn';
        button.textContent = contactType.key;
        button.title = contactType.label;
        
        button.style.cssText = `
            width: 30px;
            height: 24px;
            padding: 0;
            margin: 0 2px;
            background-color: ${contactType.color};
            color: white;
            border: 1px solid ${contactType.color};
            border-radius: 3px;
            cursor: pointer;
            font-family: Arial, sans-serif;
            font-size: 13px;
            font-weight: bold;
            text-align: center;
            line-height: 24px;
            transition: all 0.2s;
            vertical-align: middle;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = contactType.hoverColor;
            button.style.borderColor = contactType.hoverColor;
            button.style.transform = 'scale(1.1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = contactType.color;
            button.style.borderColor = contactType.color;
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            setContactType(dropdown, contactType.value);
            highlightSelectedContactButton(button);
        });
        
        return button;
    }

    function setContactType(dropdown, value) {
        if (!dropdown) return;
        
        const options = dropdown.querySelectorAll('option');
        for (let option of options) {
            if (option.textContent.trim() === value) {
                dropdown.value = option.value;
                const event = new Event('change', { bubbles: true });
                dropdown.dispatchEvent(event);
                return;
            }
        }
    }

    function getCurrentContactType(dropdown) {
        if (!dropdown) return null;
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        return selectedOption ? selectedOption.textContent.trim() : null;
    }

    function highlightSelectedContactButton(selectedButton) {
        const allButtons = selectedButton.parentElement.querySelectorAll('.contactsoort-quick-btn');
        allButtons.forEach(btn => {
            btn.style.boxShadow = 'none';
        });
        selectedButton.style.boxShadow = '0 0 0 2px white, 0 0 0 4px ' + selectedButton.style.backgroundColor;
    }

    function updateContactButtonHighlighting(container, dropdown) {
        if (!dropdown) return;
        
        const currentType = getCurrentContactType(dropdown);
        const buttons = container.querySelectorAll('.contactsoort-quick-btn');
        
        buttons.forEach(button => {
            const contactType = CONTACT_TYPES.find(ct => ct.key === button.textContent);
            if (contactType && currentType === contactType.value) {
                highlightSelectedContactButton(button);
            }
        });
    }

    function createContactButtonContainer(dropdown) {
        const container = document.createElement('span');
        container.className = 'contactsoort-quick-buttons';
        container.style.cssText = `
            display: inline-block;
            margin: 0 8px;
            vertical-align: middle;
            white-space: nowrap;
        `;
        
        CONTACT_TYPES.forEach(contactType => {
            const button = createContactsoortQuickButton(contactType, dropdown);
            container.appendChild(button);
        });
        
        setTimeout(() => {
            updateContactButtonHighlighting(container, dropdown);
        }, 100);
        
        dropdown.addEventListener('change', () => {
            updateContactButtonHighlighting(container, dropdown);
        });
        
        return container;
    }

    function findContactsoortElements(iframeDoc) {
        const labels = iframeDoc.querySelectorAll('td');
        
        for (let label of labels) {
            if (label.textContent.trim() === 'Contactsoort') {
                const row = label.closest('tr');
                if (!row) continue;
                
                const dropdown = row.querySelector('select[name*="contactsoort"], select');
                if (!dropdown) continue;
                
                const contactdatumLabel = Array.from(row.querySelectorAll('td')).find(
                    td => td.textContent.trim() === 'Contactdatum'
                );
                
                if (contactdatumLabel) {
                    return {
                        dropdown: dropdown,
                        insertPoint: contactdatumLabel
                    };
                }
            }
        }
        
        return null;
    }

    function injectContactsoortQuickButtons() {
        const iframe = getContentIframe();
        if (!iframe) return false;
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        if (!iframeDoc.body.textContent.includes('Journaal')) {
            return false;
        }
        
        if (iframeDoc.querySelector('.contactsoort-quick-buttons')) {
            return true;
        }
        
        const elements = findContactsoortElements(iframeDoc);
        if (!elements) {
            return false;
        }
        
        const { dropdown, insertPoint } = elements;
        const buttonContainer = createContactButtonContainer(dropdown);
        insertPoint.parentNode.insertBefore(buttonContainer, insertPoint);
        
        return true;
    }

    function initContactsoortButtons() {
        setInterval(() => {
            injectContactsoortQuickButtons();
        }, 1000);
    }

    // ============================================================================
    // FEATURE 4: ZORGDOMEIN QUICK MENU (v2.1)
    // ============================================================================

    function isOnContactPage() {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return false;
        
        try {
            const url = iframe.contentDocument.location.href;
            return url.includes('medischdossier.journaal');
        } catch(e) {
            return false;
        }
    }

    function navigateToZorgDomein(specialisme, targetUrl, callback) {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;
        const actionButtons = doc.getElementById('actionbuttons');
        if (!actionButtons) return;

        const allClickable = actionButtons.querySelectorAll('td.actie');
        let verwijzenButton = null;
        for (let td of allClickable) {
            if (td.textContent.trim().includes('Verwijzen')) {
                verwijzenButton = td;
                break;
            }
        }

        if (!verwijzenButton) return;

        verwijzenButton.click();

        setTimeout(() => {
            fillSpecialismeAndClickZorgDomein(specialisme, targetUrl, callback);
        }, 1000);
    }

    function fillSpecialismeAndClickZorgDomein(specialisme, targetUrl, callback) {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;

        const specMnemField = doc.getElementById('specMnem');
        if (specMnemField) {
            specMnemField.value = specialisme;
            specMnemField.dispatchEvent(new Event('input', { bubbles: true }));
            specMnemField.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const script = doc.createElement('script');
        script.textContent = `
            (function() {
                if (typeof disableScreen !== 'function') {
                    window.disableScreen = function() { return true; };
                }

                var button = document.getElementById('action_via zorgDomein');
                if (button) {
                    button.click();
                    setTimeout(function() {
                        button.click();
                    }, 200);
                }
            })();
        `;
        doc.head.appendChild(script);
        script.remove();

        setTimeout(() => {
            clickScriptZorgDomein(targetUrl, callback);
        }, 1500);
    }

    function clickScriptZorgDomein(targetUrl, callback) {
        if (targetUrl) {
            window.open(targetUrl, '_blank');
            if (callback) callback();
        }
    }

    function createZorgdomeinButton() {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;

        if (doc.getElementById('zorgdomein-button')) return;

        const actionButtons = doc.getElementById('actionbuttons');
        if (!actionButtons) return;

        const allClickable = actionButtons.querySelectorAll('td.actie');

        let verwijzenButton = null;
        for (let td of allClickable) {
            if (td.textContent.trim().includes('Verwijzen')) {
                verwijzenButton = td;
                break;
            }
        }

        if (!verwijzenButton) return;

        const zorgdomeinButton = verwijzenButton.cloneNode(true);
        zorgdomeinButton.id = 'zorgdomein-button';

        const innerText = zorgdomeinButton.querySelector('td[id$="_inner"]');
        if (innerText) {
            innerText.textContent = 'Zorgdomein';
            innerText.id = 'zorgdomein_inner';
        } else {
            const textTd = zorgdomeinButton.querySelector('td[style*="cursor"]');
            if (textTd) {
                textTd.textContent = 'Zorgdomein';
            }
        }

        zorgdomeinButton.onclick = null;
        zorgdomeinButton.removeAttribute('onclick');

        zorgdomeinButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showZorgdomeinMenu();
        });

        const parentRow = verwijzenButton.parentElement;

        if (parentRow.tagName === 'TR') {
            const newRow = doc.createElement('tr');
            newRow.appendChild(zorgdomeinButton);

            if (parentRow.nextSibling) {
                parentRow.parentNode.insertBefore(newRow, parentRow.nextSibling);
            } else {
                parentRow.parentNode.appendChild(newRow);
            }
        } else {
            if (verwijzenButton.nextSibling) {
                verwijzenButton.parentNode.insertBefore(zorgdomeinButton, verwijzenButton.nextSibling);
            } else {
                verwijzenButton.parentNode.appendChild(zorgdomeinButton);
            }
        }
    }

    function showZorgdomeinMenu() {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;

        const existingMenu = doc.getElementById('zorgdomein-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const zorgdomeinButton = doc.getElementById('zorgdomein-button');
        if (!zorgdomeinButton) return;

        const buttonRect = zorgdomeinButton.getBoundingClientRect();

        const menu = doc.createElement('table');
        menu.id = 'zorgdomein-menu';
        menu.cellPadding = '0';
        menu.cellSpacing = '0';
        menu.style.cssText = `
            position: fixed;
            left: ${buttonRect.right + 5}px;
            top: ${buttonRect.top}px;
            width: 200px;
            background: white;
            border: 1px solid #ccc;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
            z-index: 10000;
        `;

        const tbody = doc.createElement('tbody');

        const items = [
            {
                text: 'Lab',
                submenu: null,
                code: 'LAB',
                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/51d786ec-f6e1-4a9e-ae56-b485c498866f'
            },
            {
                text: 'Röntgen',
                code: 'RON',
                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/YOUR_RONTGEN_ID',
                submenu: [
                    { text: 'Bovenste extremiteiten', code: 'RON', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/90118f1c-9172-4cf7-bd1b-e8d3f327018d' },
                    { text: 'Onderste extremiteiten', code: 'RON', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/00e30944-e4ce-44ba-9fc9-b892774908ed' },
                    { text: 'Thorax', code: 'RON', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/130dbc65-3198-41c9-a7c8-280e432806fe' }
                ]
            },
            {
                text: 'Echo',
                code: 'ECH',
                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/YOUR_ECHO_ID',
                submenu: [
                    { text: 'Mammografie', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e2dfb2ec-7151-42ac-90fa-0168e3cad179/1ELBEC' },
                    { text: 'Abdomen', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/10d7de37-09a8-454c-96b6-af52f2b7c352/1ELBEC' },
                    { text: 'Hoofd/hals', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1b86df11-ec4f-47ad-926d-0b71b80b7c9d/1ELBEC' },
                    { text: 'Vaginaal', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/protocol/6c2767e0-de23-4afb-99cd-81d2acbf4727/1ELBEC' }
                ]
            }
        ];

        items.forEach(item => {
            const tr = doc.createElement('tr');
            const menuItem = createZorgdomeinMenuItem(doc, item.text, item.submenu, item.code, item.url);
            tr.appendChild(menuItem);
            tbody.appendChild(tr);
        });

        menu.appendChild(tbody);
        doc.body.appendChild(menu);

        doc.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !zorgdomeinButton.contains(e.target)) {
                menu.remove();
                doc.removeEventListener('click', closeMenu);
            }
        });
    }

    function createZorgdomeinMenuItem(doc, text, submenu, code, url) {
        const item = doc.createElement('td');
        item.className = 'actie';
        item.style.cssText = `
            height: 30px;
            width: 200px;
            cursor: pointer;
        `;

        const innerTable = doc.createElement('table');
        innerTable.cellPadding = '0';
        innerTable.cellSpacing = '0';
        innerTable.border = '0';
        innerTable.style.width = '200px';

        const innerTbody = doc.createElement('tbody');
        const innerTr = doc.createElement('tr');

        const spacerTd1 = doc.createElement('td');
        spacerTd1.style.width = '15px';
        spacerTd1.innerHTML = '&nbsp;';

        const iconTd = doc.createElement('td');
        iconTd.align = 'left';
        iconTd.style.width = '24px';
        const icon = doc.createElement('img');
        icon.border = '0';
        icon.src = '/promedico/images/action.gif';
        icon.width = '24';
        icon.height = '14';
        iconTd.appendChild(icon);

        const spacerTd2 = doc.createElement('td');
        spacerTd2.style.width = '5px';
        spacerTd2.innerHTML = '&nbsp;';

        const textTd = doc.createElement('td');
        textTd.align = 'left';
        textTd.style.width = '140px';
        textTd.style.cursor = 'pointer';
        textTd.textContent = text;

        const spacerTd3 = doc.createElement('td');
        spacerTd3.style.width = '15px';
        spacerTd3.innerHTML = '&nbsp;';

        innerTr.appendChild(spacerTd1);
        innerTr.appendChild(iconTd);
        innerTr.appendChild(spacerTd2);
        innerTr.appendChild(textTd);
        innerTr.appendChild(spacerTd3);
        innerTbody.appendChild(innerTr);
        innerTable.appendChild(innerTbody);
        item.appendChild(innerTable);

        item.addEventListener('mouseenter', function() {
            item.className = 'actieOver';
            if (submenu) {
                showZorgdomeinSubmenu(doc, item, submenu);
            }
        });

        item.addEventListener('mouseleave', function() {
            item.className = 'actie';
        });

        item.addEventListener('click', function(e) {
            e.stopPropagation();

            const mainMenu = doc.getElementById('zorgdomein-menu');
            if (mainMenu) mainMenu.remove();

            navigateToZorgDomein(code, url, () => {});
        });

        return item;
    }

    function showZorgdomeinSubmenu(doc, parentItem, items) {
        const existingSubmenu = doc.getElementById('zorgdomein-submenu');
        if (existingSubmenu) {
            existingSubmenu.remove();
        }

        const submenu = doc.createElement('table');
        submenu.id = 'zorgdomein-submenu';
        submenu.cellPadding = '0';
        submenu.cellSpacing = '0';

        const parentRect = parentItem.getBoundingClientRect();

        const itemHeight = 31;
        const submenuHeight = items.length * itemHeight;

        const viewportHeight = doc.defaultView.innerHeight;
        const spaceBelow = viewportHeight - parentRect.top;
        const spaceAbove = parentRect.bottom;

        let topPosition;
        if (spaceBelow < submenuHeight && spaceAbove > submenuHeight) {
            topPosition = parentRect.bottom - submenuHeight;
        } else if (spaceBelow < submenuHeight) {
            topPosition = viewportHeight - submenuHeight - 10;
        } else {
            topPosition = parentRect.top;
        }

        submenu.style.cssText = `
            position: fixed;
            left: ${parentRect.right + 5}px;
            top: ${topPosition}px;
            width: 200px;
            background: white;
            border: 1px solid #ccc;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
            z-index: 10001;
        `;

        const tbody = doc.createElement('tbody');

        items.forEach(item => {
            const tr = doc.createElement('tr');
            const subItem = doc.createElement('td');
            subItem.className = 'actie';
            subItem.style.cssText = `
                height: 30px;
                width: 200px;
                cursor: pointer;
            `;

            const innerTable = doc.createElement('table');
            innerTable.cellPadding = '0';
            innerTable.cellSpacing = '0';
            innerTable.border = '0';
            innerTable.style.width = '200px';

            const innerTbody = doc.createElement('tbody');
            const innerTr = doc.createElement('tr');

            const spacerTd1 = doc.createElement('td');
            spacerTd1.style.width = '15px';
            spacerTd1.innerHTML = '&nbsp;';

            const iconTd = doc.createElement('td');
            iconTd.align = 'left';
            iconTd.style.width = '24px';
            const icon = doc.createElement('img');
            icon.border = '0';
            icon.src = '/promedico/images/action.gif';
            icon.width = '24';
            icon.height = '14';
            iconTd.appendChild(icon);

            const spacerTd2 = doc.createElement('td');
            spacerTd2.style.width = '5px';
            spacerTd2.innerHTML = '&nbsp;';

            const textTd = doc.createElement('td');
            textTd.align = 'left';
            textTd.style.width = '140px';
            textTd.style.cursor = 'pointer';
            textTd.textContent = item.text;

            const spacerTd3 = doc.createElement('td');
            spacerTd3.style.width = '15px';
            spacerTd3.innerHTML = '&nbsp;';

            innerTr.appendChild(spacerTd1);
            innerTr.appendChild(iconTd);
            innerTr.appendChild(spacerTd2);
            innerTr.appendChild(textTd);
            innerTr.appendChild(spacerTd3);
            innerTbody.appendChild(innerTr);
            innerTable.appendChild(innerTbody);
            subItem.appendChild(innerTable);

            subItem.addEventListener('mouseenter', function() {
                subItem.className = 'actieOver';
            });

            subItem.addEventListener('mouseleave', function() {
                subItem.className = 'actie';
            });

            subItem.addEventListener('click', function(e) {
                e.stopPropagation();

                submenu.remove();
                const mainMenu = doc.getElementById('zorgdomein-menu');
                if (mainMenu) mainMenu.remove();

                navigateToZorgDomein(item.code, item.url, () => {});
            });

            tr.appendChild(subItem);
            tbody.appendChild(tr);
        });

        submenu.appendChild(tbody);
        doc.body.appendChild(submenu);

        parentItem.addEventListener('mouseleave', function removeSubmenu() {
            setTimeout(() => {
                if (!submenu.matches(':hover')) {
                    submenu.remove();
                }
            }, 200);
            parentItem.removeEventListener('mouseleave', removeSubmenu);
        });
    }

    function initZorgdomeinMenu() {
        setInterval(() => {
            if (isOnContactPage()) {
                createZorgdomeinButton();
            }
        }, 2000);
    }

    // ============================================================================
    // FEATURE 5: CRP AANVRAGEN BUTTON (v3.1)
    // ============================================================================

    let lastRegelOElement = null;

    function extractBSN() {
        let topBar = null;
        
        try {
            if (window.parent && window.parent.document) {
                topBar = window.parent.document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
            }
        } catch(e) {}
        
        if (!topBar) {
            try {
                if (window.top && window.top.document) {
                    topBar = window.top.document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
                }
            } catch(e) {}
        }
        
        if (!topBar) {
            topBar = document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
        }
        
        if (topBar) {
            const innerText = topBar.innerText;
            const bsnMatch = innerText.match(/BSN:\s*(\d+)/);
            if (bsnMatch && bsnMatch[1]) {
                return bsnMatch[1];
            }
        }
        
        const searchWindows = [window.parent, window.top, window];
        
        for (let i = 0; i < searchWindows.length; i++) {
            try {
                const win = searchWindows[i];
                if (!win || !win.document || !win.document.body) continue;
                
                const pageText = win.document.body.innerText;
                const bsnMatch = pageText.match(/BSN:\s*(\d{9})/);
                
                if (bsnMatch && bsnMatch[1]) {
                    return bsnMatch[1];
                }
            } catch(e) {}
        }
        
        return null;
    }

    function findRegelOTextarea() {
        let regelO = document.getElementById('contactForm.regelO');
        if (regelO) {
            return { element: regelO, doc: document };
        }

        const iframes = document.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
            const iframe = iframes[i];
            
            if (!iframe.contentDocument) continue;
            
            try {
                const doc = iframe.contentDocument;
                regelO = doc.getElementById('contactForm.regelO');
                
                if (regelO) {
                    return { element: regelO, doc: doc };
                }
            } catch(e) {}
        }
        
        return null;
    }

    function createCRPButton() {
        const result = findRegelOTextarea();
        
        if (!result) {
            lastRegelOElement = null;
            return false;
        }
        
        const regelO = result.element;
        const doc = result.doc;

        const isNewElement = (regelO !== lastRegelOElement);
        lastRegelOElement = regelO;

        const existingButton = doc.getElementById('crp-aanvragen-btn');
        
        if (existingButton && !isNewElement) {
            return true;
        }
        
        if (existingButton) {
            existingButton.remove();
        }

        const button = doc.createElement('input');
        button.id = 'crp-aanvragen-btn';
        button.type = 'BUTTON';
        button.value = 'CRP aanvragen';
        button.tabIndex = 102;
        button.style.cssText = 'cursor: pointer; margin-left: 5px;';

        button.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();

            const bsn = extractBSN();

            if (!bsn) {
                alert('Geen BSN gevonden. Zorg ervoor dat er een actieve patiënt is geselecteerd.');
                return false;
            }

            try {
                GM_setClipboard(bsn);

                const originalValue = button.value;
                button.value = 'BSN gekopieerd!';
                button.style.backgroundColor = '#28a745';
                button.style.color = 'white';

                setTimeout(() => {
                    window.open('https://www.poctconnect.nl/ui/#/order/patient/search', '_blank');
                }, 500);

                setTimeout(() => {
                    button.value = originalValue;
                    button.style.backgroundColor = '';
                    button.style.color = '';
                }, 2000);

            } catch (error) {
                alert('Er is een fout opgetreden bij het kopiëren van het BSN.');
            }

            return false;
        };

        if (regelO.nextSibling) {
            regelO.parentNode.insertBefore(button, regelO.nextSibling);
        } else {
            regelO.parentNode.appendChild(button);
        }

        return true;
    }

    function initCRPButton() {
        setInterval(() => {
            createCRPButton();
        }, 2000);
    }

    // ============================================================================
    // FEATURE 8: PATIENT FORM AUTO-FILL (v1.1)
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

        // Name logic:
        // - If Meisjesnaam exists: use it for Achternaam, use Achternaam for Partner achternaam
        // - If no Meisjesnaam: use Achternaam for Achternaam field
        if (data['Meisjesnaam']) {
            // Has maiden name - use it for main surname
            if (fillField('patientPersoonWrapper.persoon.achternaam', data['Meisjesnaam'])) filled++;
            
            // Use married name for partner surname
            if (data['Achternaam']) {
                if (fillField('patientPersoonWrapper.persoon.partnerachternaam', data['Achternaam'])) filled++;
            }
        } else if (data['Achternaam']) {
            // No maiden name - use Achternaam for main surname field
            if (fillField('patientPersoonWrapper.persoon.achternaam', data['Achternaam'])) filled++;
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

        // Auto-select huisarts X.X. XX van XX
        const targetDoc = getTargetDocument();
        const huisartsField = targetDoc.getElementById('praktijkMedewerker');
        if (huisartsField) {
            console.log('[PROMEDICO] Searching for huisarts in dropdown...');
            let found = false;
            
            for (let option of huisartsField.options) {
                const optionText = option.text.toLowerCase();
                console.log('[PROMEDICO]   Option: "' + option.text + '"');
                
                // Look for any variation of the name
                if ((optionText.includes('xxx') && optionText.includes('xx')) ||
                    (optionText.includes('x.x.') && optionText.includes('xx')) ||
                    optionText.includes('xx van xxx')) {
                    
                    huisartsField.value = option.value;
                    huisartsField.dispatchEvent(new Event('change', { bubbles: true }));
                    if (huisartsField.onchange) {
                        try {
                            huisartsField.onchange();
                        } catch(e) {}
                    }
                    filled++;
                    found = true;
                    console.log('[PROMEDICO] ✓ Selected huisarts: ' + option.text);
                    break;
                }
            }
            
            if (!found) {
                console.log('[PROMEDICO] ✗ Huisarts "xx van xxx" not found in dropdown');
            }
        } else {
            console.log('[PROMEDICO] ✗ Huisarts dropdown not found');
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

    function createPatientFormUI() {
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
        
        console.log('[PROMEDICO] ✓ "Informatie vullen" button added to patient form');
    }

    function initPatientForm() {
        // Initial attempt
        if (document.body) {
            createPatientFormUI();
        } else {
            setTimeout(initPatientForm, 500);
        }

        // Monitor for page changes (iframe navigation)
        setInterval(() => {
            createPatientFormUI();
        }, 2000);
    }

    // ============================================================================
    // FEATURE 6: CUSTOM MENU ITEMS (v1.1)
    // ============================================================================

    function clickSidebarButton(buttonId) {
        console.log('[PROMEDICO] Attempting to click sidebar button: ' + buttonId);
        
        // Wait for iframe to load the correct page
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkAndClick = setInterval(() => {
            attempts++;
            
            if (attempts > maxAttempts) {
                clearInterval(checkAndClick);
                console.log('[PROMEDICO] ✗ Timeout waiting for sidebar button: ' + buttonId);
                return;
            }
            
            const iframe = document.getElementById('panelBackCompatibility-frame');
            if (!iframe || !iframe.contentDocument) {
                return;
            }
            
            try {
                const iframeDoc = iframe.contentDocument;
                
                // Try to find button by ID
                let button = iframeDoc.getElementById(buttonId);
                
                // If not found by ID, search by text in sidebar
                if (!button) {
                    const sidebarContainers = [
                        iframeDoc.getElementById('leftcontainer'),
                        iframeDoc.getElementById('actionbuttons'),
                        iframeDoc.getElementById('episode')
                    ].filter(el => el);
                    
                    for (let container of sidebarContainers) {
                        const clickableElements = container.querySelectorAll('*');
                        
                        for (let el of clickableElements) {
                            // Extract text safely
                            let text = '';
                            for (let node of el.childNodes) {
                                if (node.nodeType === Node.TEXT_NODE) {
                                    text += node.nodeValue || '';
                                }
                            }
                            text = text.toLowerCase().replace(/\s+/g, ' ').trim();
                            
                            // Check if text matches what we're looking for
                            // Match: "Nieuwe patiënt" or "MEDOVD importeren"
                            if ((buttonId.includes('Nieuwe patient') && text.includes('nieuwe patiënt')) ||
                                (buttonId.includes('medOvdImporteren') && text.includes('medovd importeren'))) {
                                button = el;
                                console.log('[PROMEDICO] Found button by text match: "' + text + '"');
                                break;
                            }
                        }
                        if (button) break;
                    }
                }
                
                if (button) {
                    clearInterval(checkAndClick);
                    console.log('[PROMEDICO] ✓ Found sidebar button, clicking');
                    button.click();
                } else {
                    if (attempts % 5 === 0) {
                        console.log('[PROMEDICO] Still waiting for sidebar button (attempt ' + attempts + '/20)');
                    }
                }
            } catch (e) {
                console.error('[PROMEDICO] Error searching for button:', e);
            }
        }, 500);
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
            
            console.log('[PROMEDICO] Menu item clicked: ' + newItemText);
            
            // First click the Patiënt menu to ensure we're in the right section
            const patientMenu = document.getElementById('MainMenu-Patiënt-Zoeken');
            if (patientMenu) {
                console.log('[PROMEDICO] Clicking Patiënt menu first');
                patientMenu.click();
            }
            
            // Then wait and click the sidebar button
            setTimeout(() => {
                clickSidebarButton(sidebarButtonId);
            }, 500);
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
    // FEATURE 7: MEDOVD IMPORT DRAG & DROP (v1.1)
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

        console.log('[PROMEDICO] ✓ MEDOVD bestanden ingevuld');

        setTimeout(() => {
            submitButton.click();
        }, 500);
    }

    function processMedovdDroppedFiles(files) {
        if (files.length !== 2) return;
        if (!isOnMedovdImportPage()) return;

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

        if (!ediFile || !zipFile) return;
        fillMedovdFormWithFiles(ediFile, zipFile);
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
        setInterval(() => {
            setupMedovdIframeListeners();
            
            // Check for stored MEDOVD files waiting to be processed
            const storedFiles = getStoredMedovdFiles();
            if (storedFiles && isOnMedovdImportPage()) {
                console.log('[PROMEDICO] ✓ MEDOVD page loaded, processing stored files');
                fillMedovdFormWithFiles(storedFiles.edi, storedFiles.zip);
                clearStoredMedovdFiles();
            }
        }, 2000);
    }

    // ============================================================================
    // MAIN INITIALIZATION
    // ============================================================================

    function init() {
        console.log('[PROMEDICO] ===================================');
        console.log('[PROMEDICO] Complete Suite v3.9 - Starting');
        console.log('[PROMEDICO] ===================================');
        
        // Feature 1: Document Upload with Drag & Drop
        console.log('[PROMEDICO] ✓ Initializing Document Upload (v2.8)');
        initDocumentUpload();
        monitorPageContent();
        
        // Feature 2: E-consult Templates
        console.log('[PROMEDICO] ✓ Initializing E-consult Templates (v1.1)');
        initEconsultTemplates();
        
        // Feature 3: Contactsoort Quick Buttons
        console.log('[PROMEDICO] ✓ Initializing Contactsoort Buttons (v1.0)');
        initContactsoortButtons();
        
        // Feature 4: Zorgdomein Menu
        console.log('[PROMEDICO] ✓ Initializing Zorgdomein Menu (v2.1)');
        initZorgdomeinMenu();
        
        // Feature 5: CRP Aanvragen Button
        console.log('[PROMEDICO] ✓ Initializing CRP Button (v3.1)');
        initCRPButton();
        
        // Feature 6: Custom Menu Items
        console.log('[PROMEDICO] ✓ Initializing Custom Menus (v1.1)');
        initCustomMenus();
        
        // Feature 7: MEDOVD Import
        console.log('[PROMEDICO] ✓ Initializing MEDOVD Import (v1.1)');
        initMedovdImport();
        
        // Feature 8: Patient Form Auto-Fill
        console.log('[PROMEDICO] ✓ Initializing Patient Form Auto-Fill (v1.1)');
        initPatientForm();
        
        console.log('[PROMEDICO] ===================================');
        console.log('[PROMEDICO] All features initialized successfully!');
        console.log('[PROMEDICO] ===================================');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
