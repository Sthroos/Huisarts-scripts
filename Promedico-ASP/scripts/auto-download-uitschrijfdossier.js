(function() {
    'use strict';

    // ========== CHECKBOX FUNCTIONALITY ==========
    function checkVerhuisberichtCheckbox() {
        const checkbox = document.querySelector('input[type="checkbox"][id^="verhuisBerichtPatientIds"]');

        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;

            const changeEvent = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(changeEvent);

            if (typeof setChanged === 'function') {
                setChanged(true);
            }
        }
    }

    // ========== DOWNLOAD FUNCTIONALITY ==========
    function downloadFile(url, filename) {
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
        if (downloadsProcessed) return;

        // Patiëntnummer voor bestandsnaam
        let patientNum = 'patient';
        const patientNumInput = document.querySelector('input.inputReadonly[readonly]');
        if (patientNumInput && patientNumInput.value) {
            patientNum = patientNumInput.value.trim();
        }

        // Lokale datum (niet UTC) — toISOString() geeft UTC waardoor bij avondgebruik
        // de verkeerde datum op het bestand staat
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const downloadLinks = document.querySelectorAll('a[href*="download?id="]');

        if (downloadLinks.length > 0) {
            downloadsProcessed = true;

            downloadLinks.forEach((link, index) => {
                let href = link.getAttribute('href');
                if (href.startsWith('/')) {
                    href = window.location.origin + href;
                }

                const row = link.closest('tr');
                let label = 'download';
                if (row) {
                    const labelCell = row.querySelector('td.label');
                    if (labelCell) label = labelCell.textContent.trim();
                }

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

                setTimeout(() => downloadFile(href, filename), index * 1000);
            });
        }
    }

    // ========== INITIALIZATION ==========
    checkVerhuisberichtCheckbox();
    autoDownloadFiles();

    setTimeout(checkVerhuisberichtCheckbox, 500);
    setTimeout(checkVerhuisberichtCheckbox, 1000);
    setTimeout(autoDownloadFiles, 1000);
    setTimeout(autoDownloadFiles, 2000);

    const observer = new MutationObserver(() => {
        checkVerhuisberichtCheckbox();
        if (!downloadsProcessed) autoDownloadFiles();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 10000);

})();
