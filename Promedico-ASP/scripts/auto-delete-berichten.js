(function() {
    'use strict';

    console.log('[Berichten Auto-delete] Script initialized');

    // Check if we're on the Berichten page and return the document
    function isOnBerichtenPage() {
        // Check main document
        const mainCheck = document.querySelector('[id*="WerklijstBerichtenView"]');
        if (mainCheck) {
            return document;
        }

        // Check iframe
        const iframe = document.getElementById('panelBackCompatibility-frame');

        if (iframe) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                const iframeCheck = doc ? doc.querySelector('[id*="WerklijstBerichtenView"]') : null;

                if (iframeCheck) {
                    return doc;
                }
            } catch (e) {
                // Cannot access iframe
            }
        }

        return null;
    }

    // Find and check messages to delete
    function selectMessagesToDelete(doc) {
        let selectedCount = 0;
        let rowIndex = 0;

        console.log('[Berichten Auto-delete] Scanning messages...');

        // Keep checking rows until we don't find any more
        while (rowIndex < 100) { // Safety limit
            // Get checkbox for this row
            const checkbox = doc.querySelector(`#WerklijstBerichtenView-grid-chkBox-grid-checkbox${rowIndex}`);
            if (!checkbox) {
                // No more rows
                break;
            }

            // Get the row element - find parent tr
            let row = checkbox;
            while (row && row.tagName !== 'TR') {
                row = row.parentElement;
            }

            if (row) {
                // Get all text in the row
                const rowText = row.textContent || row.innerText || '';

                let shouldDelete = false;
                let reason = '';

                // Check for ZorgMail FileTransfer with Vrije tekst
                if (rowText.includes('ZorgMail FileTransfer') && rowText.includes('Vrije tekst')) {
                    shouldDelete = true;
                    reason = 'ZorgMail FileTransfer';
                }

                // Check for Mutatiebericht
                if (rowText.includes('Mutatiebericht')) {
                    shouldDelete = true;
                    reason = 'Mutatiebericht';
                }

                if (shouldDelete && !checkbox.checked) {
                    checkbox.click();
                    selectedCount++;
                    console.log(`[Berichten Auto-delete] Selected row ${rowIndex} (${reason})`);
                }
            }

            rowIndex++;
        }

        console.log(`[Berichten Auto-delete] Selected ${selectedCount} messages for deletion out of ${rowIndex} total`);
        return selectedCount;
    }

    // Click the delete button
    function clickDeleteButton(doc) {
        // The delete button is the one with class "gwt-Button GEM3CPJDO5"
        // It's button 39 in the list - disabled when nothing selected
        const deleteButton = doc.querySelector('button.gwt-Button.GEM3CPJDO5');

        if (deleteButton) {
            console.log('[Berichten Auto-delete] Found delete button, clicking...');
            deleteButton.click();
            return true;
        }

        console.log('[Berichten Auto-delete] Delete button not found');
        return false;
    }

    // Main function to auto-delete messages
    function autoDeleteMessages() {
        const doc = isOnBerichtenPage();
        if (!doc) {
            return;
        }

        console.log('[Berichten Auto-delete] Processing...');

        const selectedCount = selectMessagesToDelete(doc);

        if (selectedCount > 0) {
            console.log(`[Berichten Auto-delete] ${selectedCount} spam messages selected, deleting...`);

            // Click delete button immediately (Promedico will show its own confirmation)
            setTimeout(() => {
                clickDeleteButton(doc);
            }, 300);
        } else {
            alert('Geen spam berichten gevonden.');
            console.log('[Berichten Auto-delete] No spam messages found');
        }
    }

    // Create a visible button
    function createAutoDeleteButton() {
        const doc = isOnBerichtenPage();
        if (!doc) {
            return;
        }

        // Check if button already exists
        if (doc.getElementById('auto-delete-berichten-btn')) {
            return;
        }

        // The delete button is button index 39 in your list
        // Let's look for the button container near the search button
        const searchButton = doc.getElementById('WerklijstBerichtenView-btnZoeken');

        if (!searchButton) {
            return;
        }

        // Find the container that has all the action buttons
        let buttonContainer = searchButton.parentElement;
        while (buttonContainer && !buttonContainer.className.includes('GEM3CPJDDFC')) {
            buttonContainer = buttonContainer.parentElement;
        }

        if (!buttonContainer) {
            // Try a different approach - look for buttons with the action button class
            const actionButtons = doc.querySelectorAll('button.gwt-Button.GEM3CPJDKFC');

            if (actionButtons.length > 0) {
                buttonContainer = actionButtons[0].parentElement;
            }
        }

        if (!buttonContainer) {
            return;
        }

        // Create the auto-delete button
        const autoDeleteBtn = doc.createElement('button');
        autoDeleteBtn.id = 'auto-delete-berichten-btn';
        autoDeleteBtn.type = 'button';
        autoDeleteBtn.className = 'gwt-Button GEM3CPJDFV GEM3CPJDEFC';
        autoDeleteBtn.textContent = '🗑️ Auto-delete spam';
        autoDeleteBtn.style.cssText = `
            margin-left: 10px;
            background-color: #dc3545 !important;
            color: white !important;
            font-weight: bold !important;
            padding: 5px 10px !important;
            border: 1px solid #c82333 !important;
            cursor: pointer !important;
        `;

        autoDeleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            autoDeleteMessages();
        });

        // Append to button container
        buttonContainer.appendChild(autoDeleteBtn);
        console.log('[Berichten Auto-delete] Button created');
    }

    // Monitor for page changes
    function monitorPage() {
        const doc = isOnBerichtenPage();
        if (doc && !doc.getElementById('auto-delete-berichten-btn')) {
            createAutoDeleteButton();
        }
    }

    // Initialize
    function init() {
        // Check immediately (multiple times to catch quick page loads)
        monitorPage();
        setTimeout(monitorPage, 100);
        setTimeout(monitorPage, 300);
        setTimeout(monitorPage, 500);
        setTimeout(monitorPage, 1000);

        // Then check every 3 seconds for page changes
        setInterval(monitorPage, 3000);
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();