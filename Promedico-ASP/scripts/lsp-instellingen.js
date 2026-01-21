(function() {
    'use strict';

    console.log('LSP-instellingen script loaded v1.2');

    // Track if we're in an automated registration flow
    let isAutomatedRegistration = false;

    // Create custom styled confirmation dialog
    function createConfirmationDialog() {
        return new Promise((resolve) => {
            // Hide the GWT glass overlay temporarily
            const glassOverlay = document.querySelector('.gwt-PopupPanelGlass');
            if (glassOverlay) {
                glassOverlay.style.pointerEvents = 'none';
            }

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'lsp-confirmation-overlay';
            overlay.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0, 0, 0, 0.7) !important;
                z-index: 2147483647 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                pointer-events: auto !important;
            `;

            // Create dialog box
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white !important;
                padding: 30px !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
                min-width: 400px !important;
                text-align: center !important;
                position: relative !important;
                z-index: 2147483647 !important;
                pointer-events: auto !important;
            `;

            // Create message
            const message = document.createElement('p');
            message.textContent = 'Wilt u de patiënt registreren als Ja of Nee?';
            message.style.cssText = `
                margin: 0 0 25px 0 !important;
                font-size: 18px !important;
                color: #333 !important;
                font-weight: 500 !important;
            `;

            // Create button container
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex !important;
                gap: 15px !important;
                justify-content: center !important;
            `;

            // Handler function for cleanup
            function cleanup() {
                if (overlay && overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                // Re-enable glass overlay
                if (glassOverlay) {
                    glassOverlay.style.pointerEvents = '';
                }
            }

            // Simple button creator
            function createButton(text, color, hoverColor, value) {
                const btn = document.createElement('button');
                btn.textContent = text;
                btn.type = 'button';
                btn.className = 'lsp-dialog-button';
                btn.style.cssText = `
                    padding: 12px 24px !important;
                    font-size: 16px !important;
                    border: none !important;
                    border-radius: 4px !important;
                    cursor: pointer !important;
                    font-weight: 600 !important;
                    background-color: ${color} !important;
                    color: white !important;
                    pointer-events: auto !important;
                    user-select: none !important;
                `;

                // Mouse handlers for hover effect
                btn.addEventListener('mouseenter', function() {
                    this.style.backgroundColor = hoverColor + ' !important';
                });
                btn.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = color + ' !important';
                });

                // Store the value on the button for later retrieval
                btn.dataset.value = value || 'null';
                btn.dataset.text = text;

                return btn;
            }

            // Create buttons
            const jaButton = createButton('Ja', '#28a745', '#218838', 'ja');
            const neeButton = createButton('Nee', '#dc3545', '#c82333', 'nee');
            const cancelButton = createButton('Annuleren', '#6c757d', '#5a6268', null);

            // Assemble dialog
            buttonContainer.appendChild(jaButton);
            buttonContainer.appendChild(neeButton);
            buttonContainer.appendChild(cancelButton);
            dialog.appendChild(message);
            dialog.appendChild(buttonContainer);
            overlay.appendChild(dialog);

            // Add to body
            document.body.appendChild(overlay);

            // Attach click handlers AFTER dialog is in DOM, with delay
            setTimeout(() => {
                const handlePointerDown = function(e) {
                    const target = e.target;

                    // Check if a button was clicked
                    if (target.classList && target.classList.contains('lsp-dialog-button')) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();

                        const value = target.dataset.value;

                        cleanup();
                        resolve(value === 'null' ? null : value);
                    }
                };

                overlay.addEventListener('pointerdown', handlePointerDown, true);
            }, 300);

            // Focus first button
            setTimeout(() => {
                jaButton.focus();
            }, 400);
        });
    }

    // Wait for element to appear
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const element = document.querySelector(selector);
                if (element && element.style.display !== 'none') {
                    clearInterval(checkInterval);
                    resolve(element);
                }
                if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error(`Timeout waiting for ${selector}`));
                }
            }, 100);
        });
    }

    // Check if an element is visible
    function isVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
               element.getAttribute('aria-hidden') !== 'true';
    }

    // Handle LSP button click
    async function handleLSPButtonClick(button) {
        // Check button color to determine if automation should run
        const bgColor = button.style.backgroundColor;

        // Only automate for grey buttons
        if (bgColor !== 'grey') {
            return;
        }

        try {
            // Wait for popup to appear
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check which panel is visible
            const prerequisitesPanel = document.getElementById('OptInViewPrerequisitesPanel');
            const inputPanel = document.getElementById('OptInViewInputPanel');

            if (isVisible(prerequisitesPanel)) {
                // Check for any fout.png images
                const images = prerequisitesPanel.querySelectorAll('img');
                let hasMissingRequirements = false;

                for (const img of images) {
                    if (img.src && img.src.includes('/fout.png')) {
                        hasMissingRequirements = true;
                        break;
                    }
                }

                if (hasMissingRequirements) {
                    // Close the popup first
                    const closeButton = document.getElementById('OptInPrerequisiteCancel');
                    if (closeButton) {
                        closeButton.click();
                    }

                    // Wait for popup to close, then remove any remaining glass overlay
                    setTimeout(() => {
                        const glassOverlay = document.querySelector('.gwt-PopupPanelGlass');
                        if (glassOverlay) {
                            glassOverlay.style.display = 'none';
                            glassOverlay.remove();
                        }
                    }, 100);

                    // Navigate to patient registration page
                    setTimeout(() => {
                        const patientMenuItem = document.getElementById('MainMenu-Patiënt-Patiëntgegevens');
                        if (patientMenuItem) {
                            patientMenuItem.click();
                        } else {
                            const contentFrame = document.getElementById('gwt_main');
                            if (contentFrame && contentFrame.contentWindow) {
                                contentFrame.contentWindow.location.href = 'https://www.promedico-asp.nl/promedico/admin.onderhoud.patienten.persoonlijk.edit.m';
                            }
                        }
                    }, 300);
                }

            } else if (isVisible(inputPanel)) {
                // Show confirmation dialog
                const choice = await createConfirmationDialog();

                if (choice === null) {
                    // User cancelled - close the popup
                    const cancelButton = inputPanel.querySelector('#PanelOptInInputActionPanel-btnSave[style*="margin-left"]');
                    if (cancelButton && cancelButton.textContent === 'Annuleren') {
                        cancelButton.click();
                    }
                    return;
                }

                // Mark that we're in automated registration flow
                isAutomatedRegistration = true;

                // Select the appropriate radio button
                const radioButtonId = choice === 'ja'
                    ? 'PanelOptInInputLine3-rbAkkoordJa-input'
                    : 'PanelOptInInputLine3-rbAkkoordNee-input';

                const radioButton = document.getElementById(radioButtonId);

                if (radioButton) {
                    radioButton.click();

                    // Wait for save button to become enabled
                    await new Promise(resolve => setTimeout(resolve, 200));

                    // Click the save button
                    const saveButtons = inputPanel.querySelectorAll('#PanelOptInInputActionPanel-btnSave');
                    let saveButton = null;

                    for (const btn of saveButtons) {
                        if (btn.textContent === 'Opslaan') {
                            saveButton = btn;
                            break;
                        }
                    }

                    if (saveButton) {
                        saveButton.click();

                        // Wait for LSP action panel to appear
                        try {
                            await waitForElement('#OptInViewLSPActionPanel');
                        } catch (error) {
                            console.error('Timeout waiting for LSP action panel');
                        }

                        // Wait for processing to complete
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // Wait for the LSP action panel to disappear
                        let attempts = 0;
                        while (attempts < 50) {
                            const lspActionPanel = document.getElementById('OptInViewLSPActionPanel');
                            const displayPanel = document.getElementById('OptInViewDisplayPanel');

                            if (isVisible(displayPanel) || (lspActionPanel && !isVisible(lspActionPanel))) {
                                break;
                            }

                            await new Promise(resolve => setTimeout(resolve, 100));
                            attempts++;
                        }

                        // Small delay to ensure UI is stable
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // Close the popup
                        const closeButton = document.getElementById('PanelOptInViewActionPanel-btnCancel');
                        if (closeButton) {
                            closeButton.click();
                        }

                        isAutomatedRegistration = false;
                    } else {
                        isAutomatedRegistration = false;
                    }
                } else {
                    isAutomatedRegistration = false;
                }
            }

        } catch (error) {
            console.error('Error in LSP automation:', error);
            isAutomatedRegistration = false;
        }
    }

    // Only run in main page context (not in iframes)
    if (window.self === window.top) {
        // Set up click listener for the Opt-in button
        function setupButtonListener() {
            document.addEventListener('click', function(event) {
                const target = event.target;

                // Check if clicked element is the Opt-in button
                if (target.id === 'PatientBarOptInButton' ||
                    (target.tagName === 'BUTTON' && target.textContent.includes('Opt-in'))) {

                    // Small delay to let the original click handler execute first
                    setTimeout(() => {
                        handleLSPButtonClick(target);
                    }, 100);
                }
            }, true);
        }

        // Initialize when page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupButtonListener);
        } else {
            setupButtonListener();
        }
    }

})();