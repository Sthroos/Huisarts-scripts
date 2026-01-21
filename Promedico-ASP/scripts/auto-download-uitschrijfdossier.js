// ==UserScript==
// @name         Promedico - Auto-check MEDOVD & Auto-download Files
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Auto-check MEDOVD checkbox on uitschrijven form and auto-download files on results page
// @author       Moi
// @match        https://*/promedico/admin.onderhoud.patienten.uitschrijven.m*
// @match        http://*/promedico/admin.onderhoud.patienten.uitschrijven.m*
// @match        https://*/promedico/admin.onderhoud.patienten.uitschrijving.m*
// @match        http://*/promedico/admin.onderhoud.patienten.uitschrijving.m*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('[MEDOVD Auto] Script loaded');

    // ========== CHECKBOX FUNCTIONALITY ==========
    function checkVerhuisberichtCheckbox() {
        const checkbox = document.querySelector('input[type="checkbox"][id^="verhuisBerichtPatientIds"]');

        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            console.log('[MEDOVD Auto] Checkbox automatically checked');

            // Trigger change event
            const changeEvent = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(changeEvent);

            // Call setChanged if it exists
            if (typeof setChanged === 'function') {
                setChanged(true);
            }
        }
    }

    // ========== DOWNLOAD FUNCTIONALITY ==========
    function downloadFile(url, filename) {
        console.log(`[MEDOVD Auto] Downloading: ${filename}`);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    let downloadsProcessed = false;

    function autoDownloadFiles() {
        if (downloadsProcessed) {
            return;
        }

        // Get patient number for filename
        let patientNum = 'patient';
        const patientNumInput = document.querySelector('input.inputReadonly[readonly]');

        if (patientNumInput && patientNumInput.value) {
            patientNum = patientNumInput.value.trim();
        }

        // Get current date for filename
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);

        // Find all download links
        const downloadLinks = document.querySelectorAll('a[href*="download?id="]');

        if (downloadLinks.length > 0) {
            console.log(`[MEDOVD Auto] Found ${downloadLinks.length} download link(s)`);
            downloadsProcessed = true;

            downloadLinks.forEach((link, index) => {
                let href = link.getAttribute('href');

                // Make sure href is absolute
                if (href.startsWith('/')) {
                    href = window.location.origin + href;
                }

                const row = link.closest('tr');
                let label = 'download';

                if (row) {
                    const labelCell = row.querySelector('td.label');
                    if (labelCell) {
                        label = labelCell.textContent.trim();
                    }
                }

                // Determine filename based on label
                let filename;
                if (label.includes('MEDOVD')) {
                    filename = `${patientNum}_${dateStr}_MEDOVD.xml`;
                } else if (label.includes('Correspondentie')) {
                    filename = `${patientNum}_${dateStr}_Correspondentie.zip`;
                } else if (label.includes('Patiëntdossier') || label.includes('Patient')) {
                    filename = `${patientNum}_${dateStr}_Patientdossier.pdf`;
                } else {
                    filename = `${patientNum}_${dateStr}_download_${index + 1}`;
                }

                // Stagger downloads by 1 second each
                setTimeout(() => {
                    downloadFile(href, filename);
                }, index * 1000);
            });
        }
    }

    // ========== INITIALIZATION ==========
    // Check for checkbox immediately
    checkVerhuisberichtCheckbox();

    // Check for downloads immediately
    autoDownloadFiles();

    // Retry after delays
    setTimeout(checkVerhuisberichtCheckbox, 500);
    setTimeout(checkVerhuisberichtCheckbox, 1000);
    setTimeout(autoDownloadFiles, 1000);
    setTimeout(autoDownloadFiles, 2000);

    // Observe DOM changes
    const observer = new MutationObserver(() => {
        checkVerhuisberichtCheckbox();
        if (!downloadsProcessed) {
            autoDownloadFiles();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Stop observing after 10 seconds
    setTimeout(() => {
        observer.disconnect();
        console.log('[MEDOVD Auto] Observer stopped');
    }, 10000);

})();