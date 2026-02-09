(function() {
    'use strict';

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
        const iframe = getContentIframe();
        if (!iframe) return false;

        let doc;
        try {
            doc = iframe.contentDocument || iframe.contentWindow.document;
            if (!doc) return false;
            
            // Test access
            const testAccess = doc.body;
            if (!testAccess) return false;
        } catch (e) {
            // Dead object of andere error - niet toegankelijk
            return false;
        }

        // Look for the file input in iframe
        const fileInput = doc.getElementById('bestand') ||
                         doc.querySelector('input[name="uploadfile"]') ||
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

    // Upload file from chrome.storage
    function uploadCorrespondenceFile() {
        console.log('[Correspondence] uploadCorrespondenceFile called');
        
        // Haal file data op uit chrome.storage
        chrome.storage.local.get([
            'correspondence_pending_file',
            'correspondence_file_name',
            'correspondence_upload_attempted'
        ], function(data) {
            
            if (!data.correspondence_pending_file) {
                console.log('[Correspondence] No pending file in storage');
                return;
            }

            if (data.correspondence_upload_attempted) {
                console.log('[Correspondence] Upload already attempted, skipping');
                return;
            }

            console.log('[Correspondence] Looking for file input in IFRAME...');

            // Get FRESH iframe reference
            const iframe = getContentIframe();
            if (!iframe) {
                console.log('[Correspondence] ERROR: No iframe found');
                return;
            }

            let doc;
            try {
                doc = iframe.contentDocument || iframe.contentWindow.document;
                if (!doc || !doc.body) {
                    console.log('[Correspondence] ERROR: Cannot access iframe document');
                    return;
                }
            } catch (e) {
                console.log('[Correspondence] ERROR: Cannot access iframe:', e);
                return;
            }

            // Look for file input
            const fileInput = doc.querySelector('input[type="file"][name="uploadfile"]') ||
                             doc.querySelector('input[type="file"]');
            
            if (!fileInput) {
                console.log('[Correspondence] ERROR: File input not found!');
                return;
            }

            const verderButton = doc.getElementById('Script_Verder');
            if (!verderButton) {
                console.log('[Correspondence] ERROR: Verder button not found!');
                return;
            }

            // Mark as attempted FIRST
            chrome.storage.local.set({'correspondence_upload_attempted': true}, function() {
                console.log('[Correspondence] Uploading file:', data.correspondence_file_name);

                try {
                    // Convert base64 back to File object
                    fetch(data.correspondence_pending_file)
                        .then(res => res.blob())
                        .then(blob => {
                            const file = new File([blob], data.correspondence_file_name, {
                                type: blob.type
                            });

                            // Attach file
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(file);
                            fileInput.files = dataTransfer.files;

                            console.log('[Correspondence] Files attached:', fileInput.files.length);
                            console.log('[Correspondence] File name in input:', fileInput.files[0]?.name);

                            // Trigger events
                            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                            fileInput.dispatchEvent(new Event('input', { bubbles: true }));

                            console.log('[Correspondence] Events triggered, clicking Verder...');

                            // Click Verder
                            verderButton.click();
                            console.log('[Correspondence] Verder clicked!');
                        });
                } catch (e) {
                    console.log('[Correspondence] ERROR during upload:', e);
                    chrome.storage.local.set({'correspondence_upload_attempted': false});
                }
            });
        });
    }

    // Simple function to auto-click Verder button after upload
    function autoClickVerderIfNeeded() {
        chrome.storage.local.get([
            'correspondence_pending_file',
            'correspondence_upload_attempted',
            'correspondence_verder_click_count',
            'correspondence_last_verder_click_time'
        ], function(data) {
            // Only work if we have a pending file and have uploaded it
            if (!data.correspondence_pending_file || !data.correspondence_upload_attempted) {
                return;
            }

            const verderClickCount = data.correspondence_verder_click_count || 0;
            const lastVerderClickTime = data.correspondence_last_verder_click_time || 0;

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
                        const newCount = verderClickCount + 1;
                        chrome.storage.local.set({
                            'correspondence_verder_click_count': newCount,
                            'correspondence_last_verder_click_time': now
                        });
                        console.log('[Correspondence] Auto-clicking Verder button #' + newCount + ' on page:', url);
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

                const newCount = verderClickCount + 1;
                chrome.storage.local.set({
                    'correspondence_verder_click_count': newCount,
                    'correspondence_last_verder_click_time': now
                });
                console.log('[Correspondence] Auto-clicking Verder button #' + newCount + ' on main page:', url);
                verderButton.click();
            }
        });
    }

    // Fill the Omschrijving field with filename
    function fillCorrespondenceDescription() {
        chrome.storage.local.get(['correspondence_file_name'], function(data) {
            if (!data.correspondence_file_name) return;

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
                const description = data.correspondence_file_name.replace(/\.[^/.]+$/, '');
                omschrijvingInput.value = description;

                // Trigger events
                omschrijvingInput.dispatchEvent(new Event('input', { bubbles: true }));
                omschrijvingInput.dispatchEvent(new Event('change', { bubbles: true }));
                omschrijvingInput.dispatchEvent(new Event('blur', { bubbles: true }));

                console.log('[Correspondence] Filled Omschrijving with:', description);

                // Clear stored data
                chrome.storage.local.remove([
                    'correspondence_pending_file',
                    'correspondence_file_name',
                    'correspondence_upload_attempted',
                    'correspondence_verder_click_count',
                    'correspondence_last_verder_click_time'
                ]);
            }
        });
    }

    // Store the dropped file in chrome.storage
    function processCorrespondenceFile(file) {
        console.log('[Correspondence] Processing file:', file.name);

        // Read file as base64
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result;
            
            // Store in chrome.storage
            chrome.storage.local.set({
                'correspondence_pending_file': base64Data,
                'correspondence_file_name': file.name,
                'correspondence_upload_attempted': false,
                'correspondence_verder_click_count': 0,
                'correspondence_last_verder_click_time': 0
            }, function() {
                console.log('[Correspondence] File stored in chrome.storage');
            });
        };
        reader.readAsDataURL(file);
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
                        uploadLink.click();
                        console.log('[Correspondence] Clicked Document uploaden link');
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
        try {
            const iframe = getContentIframe();
            if (!iframe) return;

            let doc;
            try {
                doc = iframe.contentDocument || iframe.contentWindow.document;
            } catch (e) {
                return;
            }
            
            if (!doc) return;
            
            try {
                const bodyTest = doc.body;
                if (!bodyTest) return;
            } catch (e) {
                return;
            }

            // Step 1: Upload page - check chrome.storage for pending file
            chrome.storage.local.get([
                'correspondence_pending_file',
                'correspondence_upload_attempted'
            ], function(data) {
                if (data.correspondence_pending_file && !data.correspondence_upload_attempted) {
                    const onUploadPage = isOnCorrespondenceUploadPage();
                    
                    if (onUploadPage) {
                        console.log('[Correspondence] On upload page, attempting upload...');
                        uploadCorrespondenceFile();
                    }
                }
            });

            // Step 2: Auto-click any Verder buttons (up to 2 times)
            autoClickVerderIfNeeded();

            // Step 3: Description page - fill Omschrijving
            chrome.storage.local.get(['correspondence_file_name'], function(data) {
                if (data.correspondence_file_name) {
                    const onDescriptionPage = isOnCorrespondenceDescriptionPage();
                    
                    if (onDescriptionPage) {
                        console.log('[Correspondence] On description page, filling Omschrijving...');
                        setTimeout(() => {
                            fillCorrespondenceDescription();
                        }, 300);
                    }
                }
            });
        } catch (e) {
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