(function() {
    'use strict';

    // =========================================================================
    // SESSION STORAGE HELPERS (per-tab, verdwijnt bij sluiten, nooit op disk)
    // =========================================================================
    const SS_FILE    = 'pmh_corr_file';      // base64 data-URL van de PDF
    const SS_NAME    = 'pmh_corr_name';      // bestandsnaam
    const SS_TRIED   = 'pmh_corr_tried';     // upload al geprobeerd?
    const SS_CLICKS  = 'pmh_corr_clicks';    // aantal Verder-kliks
    const SS_LASTCLK = 'pmh_corr_lastclk';  // timestamp laatste klik
    const SS_EXPIRY  = 'pmh_corr_expiry';   // TTL: expires_at timestamp
    const TTL_MS     = 60 * 1000;            // 60 seconden

    function ssGet(k)    { try { return sessionStorage.getItem(k); } catch(e) { return null; } }
    function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch(e) {} }
    function ssDel(k)    { try { sessionStorage.removeItem(k); } catch(e) {} }

    function isExpired() {
        const exp = ssGet(SS_EXPIRY);
        return exp && Date.now() > parseInt(exp, 10);
    }

    function clearAll() {
        [SS_FILE, SS_NAME, SS_TRIED, SS_CLICKS, SS_LASTCLK, SS_EXPIRY].forEach(ssDel);
        _verderClickCount = 0;
        _lastVerderClickTime = 0;
    }

    // Tellers ook in-memory (redundant met sessionStorage, maar veiliger bij race)
    let _verderClickCount = 0;
    let _lastVerderClickTime = 0;

    // =========================================================================
    // PAGE DETECTION
    // =========================================================================
    function getContentIframe() {
        return document.getElementById('panelBackCompatibility-frame');
    }

    function isOnCorrespondenceListPage() {
        if (document.querySelector('tr.line[onclick*="uploadselectie"]')) return true;
        const iframe = getContentIframe();
        if (iframe) {
            try {
                const d = iframe.contentDocument || iframe.contentWindow.document;
                if (d.querySelector('tr.line[onclick*="uploadselectie"]')) return true;
            } catch(e) {}
        }
        return false;
    }

    function isOnCorrespondenceUploadPage() {
        const iframe = getContentIframe();
        if (!iframe) return false;
        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            if (!doc || !doc.body) return false;
            const fileInput = doc.getElementById('bestand') ||
                              doc.querySelector('input[name="uploadfile"]') ||
                              doc.querySelector('input[type="file"]');
            return !!(fileInput && doc.getElementById('Script_Verder'));
        } catch(e) { return false; }
    }

    function isOnCorrespondencePreviewPage() {
        const mainUrl = window.location.href;
        if (mainUrl.includes('uploadhandler')) return false;
        if (mainUrl.includes('uploadcontrole') && document.getElementById('Script_Verder')) return true;
        const iframe = getContentIframe();
        if (iframe) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                const url = iframe.contentWindow?.location?.href || '';
                if (url.includes('uploadhandler')) return false;
                if (url.includes('uploadcontrole') && doc?.getElementById('Script_Verder')) return true;
                if (url.includes('uploadkenmerken')) return false;
            } catch(e) {}
        }
        const mainTerug  = document.getElementById('Script_Terug');
        const mainVerder = document.getElementById('Script_Verder');
        const mainViewer = document.querySelector('embed[type="application/pdf"]') ||
                           document.querySelector('iframe[name="zoekrelatie"]');
        return !!(mainTerug && mainVerder && mainViewer);
    }

    function isOnCorrespondenceDescriptionPage() {
        if (document.querySelector('input[name="briefAdres.omschrijving"]')) return true;
        const iframe = getContentIframe();
        if (!iframe) return false;
        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            const url = iframe.contentWindow?.location?.href || '';
            if (url.includes('uploadkenmerken')) return true;
            return !!doc.querySelector('input[name="briefAdres.omschrijving"]');
        } catch(e) { return false; }
    }

    // =========================================================================
    // UPLOAD — leest file uit sessionStorage
    // =========================================================================
    function uploadCorrespondenceFile() {
        if (isExpired()) { clearAll(); return; }
        const fileData = ssGet(SS_FILE);
        const fileName = ssGet(SS_NAME);
        if (!fileData || ssGet(SS_TRIED) === 'true') return;

        const iframe = getContentIframe();
        if (!iframe) return;
        let doc;
        try {
            doc = iframe.contentDocument || iframe.contentWindow.document;
            if (!doc || !doc.body) return;
        } catch(e) { return; }

        const fileInput = doc.querySelector('input[type="file"][name="uploadfile"]') ||
                          doc.querySelector('input[type="file"]');
        const verderButton = doc.getElementById('Script_Verder');
        if (!fileInput || !verderButton) return;

        ssSet(SS_TRIED, 'true');
        fetch(fileData)
            .then(r => r.blob())
            .then(blob => {
                const file = new File([blob], fileName, { type: blob.type });
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInput.files = dt.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                fileInput.dispatchEvent(new Event('input',  { bubbles: true }));
                verderButton.click();
            })
            .catch(() => ssSet(SS_TRIED, 'false'));
    }

    // =========================================================================
    // AUTO-CLICK VERDER
    // =========================================================================
    function autoClickVerderIfNeeded() {
        if (isExpired()) { clearAll(); return; }
        if (!ssGet(SS_FILE) || ssGet(SS_TRIED) !== 'true') return;
        if (_verderClickCount >= 2) return;
        const now = Date.now();
        if (now - _lastVerderClickTime < 2000) return;

        const iframe = getContentIframe();
        if (iframe) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                const url = iframe.contentWindow?.location?.href || '';
                if (url.includes('uploadkenmerken') || url.includes('uploadselectie')) return;
                const btn = doc?.getElementById('Script_Verder');
                if (btn) {
                    _verderClickCount++;
                    _lastVerderClickTime = now;
                    ssSet(SS_CLICKS, String(_verderClickCount));
                    ssSet(SS_LASTCLK, String(now));
                    btn.click();
                    return;
                }
            } catch(e) {}
        }
        const btn = document.getElementById('Script_Verder');
        if (btn && !window.location.href.includes('uploadkenmerken')) {
            _verderClickCount++;
            _lastVerderClickTime = now;
            ssSet(SS_CLICKS, String(_verderClickCount));
            ssSet(SS_LASTCLK, String(now));
            btn.click();
        }
    }

    // =========================================================================
    // OMSCHRIJVING INVULLEN
    // =========================================================================
    function fillCorrespondenceDescription() {
        if (isExpired()) { clearAll(); return; }
        const fileName = ssGet(SS_NAME);
        if (!fileName) return;

        let field = document.querySelector('input[name="briefAdres.omschrijving"]');
        if (!field) {
            const iframe = getContentIframe();
            if (iframe) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    field = doc.querySelector('input[name="briefAdres.omschrijving"]');
                } catch(e) {}
            }
        }

        if (field && field.value === '') {
            field.value = fileName.replace(/\.[^/.]+$/, '');
            field.dispatchEvent(new Event('input',  { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.dispatchEvent(new Event('blur',   { bubbles: true }));
            clearAll(); // Workflow voltooid — alles wissen
        }
    }

    // =========================================================================
    // BESTAND OPSLAAN IN SESSIONSTORAGE (drag & drop handler)
    // =========================================================================
    function processCorrespondenceFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            clearAll();
            ssSet(SS_FILE,   e.target.result);
            ssSet(SS_NAME,   file.name);
            ssSet(SS_TRIED,  'false');
            ssSet(SS_CLICKS, '0');
            ssSet(SS_LASTCLK,'0');
            ssSet(SS_EXPIRY, String(Date.now() + TTL_MS));
        };
        reader.readAsDataURL(file);
    }

    // =========================================================================
    // DRAG & DROP SETUP
    // =========================================================================
    function setupCorrespondenceListeners() {
        if (!isOnCorrespondenceListPage()) return;

        let targetDoc = null;
        let isInIframe = false;
        const iframe = getContentIframe();
        if (iframe) {
            try {
                const d = iframe.contentDocument || iframe.contentWindow.document;
                if (d.querySelector('tr.line[onclick*="uploadselectie"]')) {
                    targetDoc = d; isInIframe = true;
                }
            } catch(e) {}
        }
        if (!targetDoc && document.querySelector('tr.line[onclick*="uploadselectie"]')) {
            targetDoc = document;
        }
        if (!targetDoc || targetDoc.body.dataset.corrListenersAttached === 'true') return;

        let dropOverlay = targetDoc.getElementById('correspondence-drop-overlay');
        if (!dropOverlay) {
            dropOverlay = targetDoc.createElement('div');
            dropOverlay.id = 'correspondence-drop-overlay';
            dropOverlay.style.cssText = `
                position:fixed;top:0;left:0;right:0;bottom:0;
                background:rgba(33,150,243,0.1);border:3px dashed #2196F3;
                display:none;z-index:9999;pointer-events:none;
                justify-content:center;align-items:center;
                font-size:24px;font-weight:bold;color:#2196F3;`;
            dropOverlay.innerHTML = '📄 Laat los om te uploaden';
            targetDoc.body.appendChild(dropOverlay);
        }

        let dragCounter = 0;
        targetDoc.addEventListener('dragenter', e => {
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault(); e.stopPropagation();
                dragCounter++; dropOverlay.style.display = 'flex';
            }
        }, true);
        targetDoc.addEventListener('dragover', e => {
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault(); e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
            }
        }, true);
        targetDoc.addEventListener('dragleave', e => {
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault(); e.stopPropagation();
                if (--dragCounter === 0) dropOverlay.style.display = 'none';
            }
        }, true);
        targetDoc.addEventListener('drop', e => {
            if (e.dataTransfer?.files?.length > 0) {
                e.preventDefault(); e.stopPropagation();
                dropOverlay.style.display = 'none'; dragCounter = 0;
                const files = Array.from(e.dataTransfer.files);
                if (files.length === 1) {
                    processCorrespondenceFile(files[0]);
                    targetDoc.querySelector('tr.line[onclick*="uploadselectie"]')?.click();
                } else {
                    alert('Slechts één bestand tegelijk.');
                }
            }
        }, true);
        targetDoc.addEventListener('dragend', () => {
            dragCounter = 0; dropOverlay.style.display = 'none';
        }, true);

        if (!targetDoc.getElementById('correspondence-drag-hint')) {
            const hint = targetDoc.createElement('div');
            hint.id = 'correspondence-drag-hint';
            hint.style.cssText = `
                position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
                z-index:9998;background:#e3f2fd;border:2px dashed #2196F3;
                border-radius:10px;padding:14px 28px;font-size:15px;
                font-weight:600;color:#0d47a1;box-shadow:0 4px 16px rgba(33,150,243,0.18);
                display:flex;align-items:center;gap:10px;
                pointer-events:none;user-select:none;white-space:nowrap;`;
            hint.innerHTML = '📄 Sleep een bestand (1 tegelijk) naar dit scherm om te uploaden';
            targetDoc.body.appendChild(hint);
        }

        targetDoc.body.dataset.corrListenersAttached = 'true';
    }

    // =========================================================================
    // WORKFLOW HANDLER
    // =========================================================================
    function handleCorrespondenceWorkflow() {
        try {
            if (isExpired()) { clearAll(); return; }
            if (!ssGet(SS_FILE)) return; // niets te doen

            if (!ssGet(SS_TRIED) || ssGet(SS_TRIED) === 'false') {
                if (isOnCorrespondenceUploadPage()) uploadCorrespondenceFile();
            }
            autoClickVerderIfNeeded();
            if (isOnCorrespondenceDescriptionPage()) {
                setTimeout(() => fillCorrespondenceDescription(), 300);
            }
        } catch(e) {}
    }

    // =========================================================================
    // INIT
    // =========================================================================
    function init() {
        console.log('[Correspondence] Script initialized');
        // Herstel tellers vanuit sessionStorage (na page-navigatie)
        _verderClickCount  = parseInt(ssGet(SS_CLICKS)  || '0', 10);
        _lastVerderClickTime = parseInt(ssGet(SS_LASTCLK) || '0', 10);

        setInterval(() => setupCorrespondenceListeners(), 2000);
        setTimeout(setupCorrespondenceListeners, 1000);
        setInterval(() => handleCorrespondenceWorkflow(), 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
