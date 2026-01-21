(function() {
    'use strict';

    // Store file globally for use across page transitions
    let pendingCorrespondenceFile = null;
    let correspondenceFileName = '';
    let uploadAttempted = false; // Track if we've already tried uploading
    let verderClickCount = 0; // Track how many times we've clicked Verder
    let lastVerderClickTime = 0; // Track when we last clicked Verder

    // Get the content iframe
    function getContentIframe() {
        return document.getElementById('panelBackCompatibility-frame');
    }

    // Check if we're on the correspondence list page (page with "Document uploaden" option)
    function isOnCorrespondenceListPage() {
        // First check main document
        let uploadLink = document.querySelector('tr.line[onclick*="uploadselectie"]');
        if (uploadLink) return true;

        // Check in iframe
        const iframe = getContentIframe();
        if (iframe) {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                uploadLink = iframeDoc.querySelector('tr.line[onclick*="uploadselectie"]');
                if (uploadLink) return true;
            } catch (e) {
                // Cannot access iframe
            }
        }

        return false;
    }

    // Check if we're on the upload page (Step 1 - Browse button)
    function isOnCorrespondenceUploadPage() {
        // First check MAIN document (not iframe!)
        const mainFileInput = document.querySelector('input[type="file"][name="uploadFile"]') ||
                             document.getElementById('bestand') ||
                             document.querySelector('input[type="file"]');
        const mainVerderButton = document.getElementById('Script_Verder');

        if (mainFileInput && mainVerderButton) {
            return true;
        }

        // Then check iframe as fallback
        const iframe = getContentIframe();
        if (!iframe) {
            return false;
        }

        let doc;
        try {
            doc = iframe.contentDocument || iframe.contentWindow.document;
        } catch (e) {
            return false;
        }

        if (!doc) {
            return false;
        }

        // Look for the file input in iframe
        const fileInput = doc.getElementById('bestand') ||
                         doc.querySelector('input[name="uploadFile"]') ||
                         doc.querySelector('input[type="file"]');
        const verderButton = doc.getElementById('Script_Verder');

        return !!(fileInput && verderButton);
    }

    // Check if we're on the preview page (Step 2 - Document preview with Verder button)
    function isOnCorrespondencePreviewPage() {
        // First check main window URL
        const mainUrl = window.location.href;

        // Ignore uploadhandler.m - it's a processing page that will redirect
        if (mainUrl.includes('uploadhandler')) {
            return false;
        }

        if (mainUrl.includes('uploadcontrole')) {
            const verderButton = document.getElementById('Script_Verder');
            if (verderButton) {
                console.log('[Correspondence] Detected preview page (main window uploadcontrole)');
                return true;
            }
        }

        // Check iframe
        const iframe = getContentIframe();
        if (iframe) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                const url = iframe.contentWindow?.location?.href || '';

                // Ignore uploadhandler.m - it's a processing page
                if (url.includes('uploadhandler')) {
                    return false;
                }

                // uploadcontrole.m is the preview/control page - should auto-click Verder
                if (url.includes('uploadcontrole')) {
                    const verderButton = doc?.getElementById('Script_Verder');
                    if (verderButton) {
                        console.log('[Correspondence] Detected preview page (iframe uploadcontrole)');
                        return true;
                    }
                }

                // Make sure we're NOT on uploadkenmerken (description page)
                if (url.includes('uploadkenmerken')) {
                    return false;
                }
            } catch (e) {
                // Cannot access iframe
            }
        }

        // Check main document as fallback
        const mainTerugButton = document.getElementById('Script_Terug');
        const mainVerderButton = document.getElementById('Script_Verder');
        const mainHasViewer = document.querySelector('embed[type="application/pdf"]') ||
                             document.querySelector('iframe[name="zoekrelatie"]');

        // Must have viewer to be preview page in main document
        if (mainTerugButton && mainVerderButton && mainHasViewer) {
            console.log('[Correspondence] Detected preview page (main document with viewer)');
            return true;
        }

        return false;
    }

    // Check if we're on the description page (Step 3 - Omschrijving field)
    function isOnCorrespondenceDescriptionPage() {
        // Check main document first
        const mainOmschrijvingInput = document.querySelector('input[name="briefAdres.omschrijving"]');
        if (mainOmschrijvingInput) {
            return true;
        }

        // Check iframe as fallback
        const iframe = getContentIframe();
        if (!iframe) return false;

        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            if (!doc) return false;

            // Check URL - uploadkenmerken page is the description page
            const url = iframe.contentWindow?.location?.href || '';
            if (url.includes('uploadkenmerken')) {
                return true;
            }

            const omschrijvingInput = doc.querySelector('input[name="briefAdres.omschrijving"]');
            return !!omschrijvingInput;
        } catch (e) {
            return false;
        }
    }

    // Upload the file to the browse button
    function uploadCorrespondenceFile(file) {
        if (uploadAttempted) {
            console.log('[Correspondence] Upload already attempted, skipping');
            return;
        }

        // First try MAIN document
        let fileInput = document.querySelector('input[type="file"][name="uploadFile"]') ||
                       document.getElementById('bestand') ||
                       document.querySelector('input[type="file"]');
        let verderButton = document.getElementById('Script_Verder');
        let location = 'main document';

        // If not found, try iframe
        if (!fileInput || !verderButton) {
            const iframe = getContentIframe();
            if (iframe) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    if (doc) {
                        fileInput = doc.getElementById('bestand') ||
                                   doc.querySelector('input[name="uploadFile"]') ||
                                   doc.querySelector('input[type="file"]');
                        verderButton = doc.getElementById('Script_Verder');
                        location = 'iframe';
                    }
                } catch (e) {
                    console.log('[Correspondence] Cannot access iframe:', e);
                }
            }
        }

        if (!fileInput) {
            console.log('[Correspondence] File input not found in either main document or iframe');
            return;
        }

        if (!verderButton) {
            console.log('[Correspondence] Verder button not found');
            return;
        }

        uploadAttempted = true; // Set flag to prevent multiple attempts

        console.log('[Correspondence] Found file input in', location);
        console.log('[Correspondence] Uploading file:', file.name);

        // Attach file to input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        // Trigger change events
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));

        console.log('[Correspondence] File attached, clicking Verder...');

        // Click "Verder" to proceed to preview
        setTimeout(() => {
            verderButton.click();
            console.log('[Correspondence] Verder clicked');
        }, 300); // Reduced from 500ms to 300ms
    }

    // Simple function to auto-click Verder button after upload
    function autoClickVerderIfNeeded() {
        // Only work if we have a pending file and have uploaded it
        if (!pendingCorrespondenceFile || !uploadAttempted) {
            return;
        }

        // Don't click more than twice (once after upload, once after preview)
        if (verderClickCount >= 2) {
            return;
        }

        // Don't click too quickly (prevent double-clicks)
        const now = Date.now();
        if (now - lastVerderClickTime < 2000) { // Wait at least 2 seconds between clicks
            return;
        }

        // Look for Verder button in iframe first
        const iframe = getContentIframe();
        if (iframe) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                const url = iframe.contentWindow?.location?.href || '';

                // Don't click on uploadkenmerken page (that's the description page - user should click)
                if (url.includes('uploadkenmerken')) {
                    console.log('[Correspondence] On description page, stopping auto-click');
                    return;
                }

                // Don't click on uploadselectie page (that's the initial upload page)
                if (url.includes('uploadselectie')) {
                    return;
                }

                const verderButton = doc?.getElementById('Script_Verder');
                if (verderButton) {
                    verderClickCount++;
                    lastVerderClickTime = now;
                    console.log('[Correspondence] Auto-clicking Verder button #' + verderClickCount + ' on page:', url);
                    verderButton.click();
                    return;
                }
            } catch (e) {
                // Cannot access iframe
            }
        }

        // Check main document
        const verderButton = document.getElementById('Script_Verder');
        if (verderButton) {
            const url = window.location.href;

            // Don't click on uploadkenmerken page
            if (url.includes('uploadkenmerken')) {
                console.log('[Correspondence] On description page, stopping auto-click');
                return;
            }

            verderClickCount++;
            lastVerderClickTime = now;
            console.log('[Correspondence] Auto-clicking Verder button #' + verderClickCount + ' on main page:', url);
            verderButton.click();
        }
    }

    // Fill the Omschrijving field with filename
    function fillCorrespondenceDescription() {
        if (!correspondenceFileName) return;

        // Check main document first
        let omschrijvingInput = document.querySelector('input[name="briefAdres.omschrijving"]');

        // If not in main, check iframe
        if (!omschrijvingInput) {
            const iframe = getContentIframe();
            if (iframe) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    if (doc) {
                        omschrijvingInput = doc.querySelector('input[name="briefAdres.omschrijving"]');
                    }
                } catch (e) {
                    console.error('[Correspondence] Error accessing iframe:', e);
                }
            }
        }

        if (omschrijvingInput && omschrijvingInput.value === '') {
            // Remove file extension and use filename as description
            const description = correspondenceFileName.replace(/\.[^/.]+$/, '');
            omschrijvingInput.value = description;

            // Trigger events
            omschrijvingInput.dispatchEvent(new Event('input', { bubbles: true }));
            omschrijvingInput.dispatchEvent(new Event('change', { bubbles: true }));
            omschrijvingInput.dispatchEvent(new Event('blur', { bubbles: true }));

            console.log('[Correspondence] Filled Omschrijving with:', description);

            // Clear stored data
            correspondenceFileName = '';
            pendingCorrespondenceFile = null;
        }
    }

    // Store the dropped file
    function processCorrespondenceFile(file) {
        console.log('[Correspondence] Processing file:', file.name);

        // Store file and filename globally
        pendingCorrespondenceFile = file;
        correspondenceFileName = file.name;
        uploadAttempted = false; // Reset upload flag for new file
        verderClickCount = 0; // Reset click counter for new file
        lastVerderClickTime = 0; // Reset time tracker
    }

    // Setup drag and drop listeners on the correspondence list page
    function setupCorrespondenceListeners() {
        // Need to check both main document and iframe
        if (!isOnCorrespondenceListPage()) return;

        // Determine which document to attach to
        let targetDoc = null;
        let isInIframe = false;

        // Check if the link is in iframe
        const iframe = getContentIframe();
        if (iframe) {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const uploadLink = iframeDoc.querySelector('tr.line[onclick*="uploadselectie"]');
                if (uploadLink) {
                    targetDoc = iframeDoc;
                    isInIframe = true;
                }
            } catch (e) {
                // Cannot access iframe
            }
        }

        // If not in iframe, check main document
        if (!targetDoc) {
            const uploadLink = document.querySelector('tr.line[onclick*="uploadselectie"]');
            if (uploadLink) {
                targetDoc = document;
            }
        }

        if (!targetDoc) return;

        // Check if listeners already attached
        if (targetDoc.body.dataset.correspondenceListenersAttached === 'true') {
            return;
        }

        console.log('[Correspondence] Attaching drag and drop listeners to', isInIframe ? 'iframe' : 'main document');

        // Create drop overlay
        let dropOverlay = targetDoc.getElementById('correspondence-drop-overlay');
        if (!dropOverlay) {
            dropOverlay = targetDoc.createElement('div');
            dropOverlay.id = 'correspondence-drop-overlay';
            dropOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(33, 150, 243, 0.1);
                border: 3px dashed #2196F3;
                display: none;
                z-index: 9999;
                pointer-events: none;
                justify-content: center;
                align-items: center;
                font-size: 24px;
                font-weight: bold;
                color: #2196F3;
            `;
            dropOverlay.innerHTML = '📄 Drop correspondence document here';
            targetDoc.body.appendChild(dropOverlay);
        }

        let dragCounter = 0;

        targetDoc.addEventListener('dragenter', (e) => {
            if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
                e.stopPropagation();
                dragCounter++;
                dropOverlay.style.display = 'flex';
            }
        }, true);

        targetDoc.addEventListener('dragover', (e) => {
            if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
            }
        }, true);

        targetDoc.addEventListener('dragleave', (e) => {
            if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
                e.stopPropagation();
                dragCounter--;

                if (dragCounter === 0) {
                    dropOverlay.style.display = 'none';
                }
            }
        }, true);

        targetDoc.addEventListener('drop', (e) => {
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                e.preventDefault();
                e.stopPropagation();
                dropOverlay.style.display = 'none';
                dragCounter = 0;

                const files = Array.from(e.dataTransfer.files);
                if (files.length === 1) {
                    console.log('[Correspondence] Single file dropped');
                    processCorrespondenceFile(files[0]);

                    // Need to click "Document uploaden" link
                    // Look in the document where we found it
                    let uploadLink = targetDoc.querySelector('tr.line[onclick*="uploadselectie"]');

                    if (uploadLink) {
                        setTimeout(() => {
                            uploadLink.click();
                            console.log('[Correspondence] Clicked Document uploaden link');
                        }, 300);
                    } else {
                        console.log('[Correspondence] Document uploaden link not found');
                    }
                } else {
                    alert('Please drop only one file at a time');
                }
            }
        }, true);

        targetDoc.addEventListener('dragend', (e) => {
            dragCounter = 0;
            dropOverlay.style.display = 'none';
        }, true);

        targetDoc.body.dataset.correspondenceListenersAttached = 'true';
        console.log('[Correspondence] Listeners attached successfully');
    }

    // Handle the workflow progression across different pages
    function handleCorrespondenceWorkflow() {
        // Step 1: Upload page - attach file if we have one pending
        if (pendingCorrespondenceFile && isOnCorrespondenceUploadPage()) {
            console.log('[Correspondence] On upload page with pending file:', pendingCorrespondenceFile.name);
            if (!uploadAttempted) {
                console.log('[Correspondence] Attempting upload...');
                setTimeout(() => {
                    uploadCorrespondenceFile(pendingCorrespondenceFile);
                }, 500);
            }
            return;
        }

        // Step 2: Auto-click any Verder buttons (up to 2 times)
        autoClickVerderIfNeeded();

        // Step 3: Description page - fill Omschrijving
        if (isOnCorrespondenceDescriptionPage() && correspondenceFileName) {
            console.log('[Correspondence] On description page, filling Omschrijving...');
            setTimeout(() => {
                fillCorrespondenceDescription();
            }, 300);
            return;
        }
    }

    // Main initialization
    function init() {
        console.log('[Correspondence] Script initialized');

        // Setup drag & drop listeners
        setInterval(() => {
            setupCorrespondenceListeners();
        }, 2000);

        setTimeout(setupCorrespondenceListeners, 1000);

        // Handle workflow progression
        setInterval(() => {
            handleCorrespondenceWorkflow();
        }, 1000);
    }

    // Start when document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();