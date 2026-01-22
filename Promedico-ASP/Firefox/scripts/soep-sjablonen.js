(function() {
    'use strict';

    console.log('SOEP Sjablonen script loaded');

    // Template definitions
    const templates = {
        'CRP aanvragen': {
            action: 'crp'
        },
        'BVO': {
            action: 'bvo'
        },
        'UWI': {
            submenu: {
                'Normale urine': {
                    O: 'Urine strip gecontroleerd, geen afwijkingen',
                    P: 'Patiënt heeft geen urineweginfectie'
                },
                'Urineweginfectie': {
                    O: 'Afwijkende strip passend bij urineweginfectie, nitriet positief',
                    P: `Behandeling conform NHG-standaard met antibiotica en zelfzorgadviezen: veel drinken, cranberry overwegen. Informatie verstrekt over:
- Voldoende drinken (1,5-2 liter per dag)
- Bij pijn: paracetamol
- Signalen waarmee terug te komen (koorts, bloederig, pijn in rug)
- Informatie: https://www.thuisarts.nl/blaasontsteking`,
                    icpc: 'U71'
                },
                'Op dip gezet': {
                    O: 'Urine afwijkend, nitriet negatief',
                    P: 'Dipslide ingezet, patiënt kan morgen bellen voor de uitslag'
                },
                'Op kweek gestuurd': {
                    O: '',
                    P: 'Urine op kweek naar het laboratorium gestuurd'
                }
            }
        }
    };

    // Function to extract BSN from patient info bar
    function extractBSN() {
        let topBar = null;

        // Try parent window
        try {
            if (window.parent && window.parent.document) {
                topBar = window.parent.document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
            }
        } catch(e) {}

        // Try top window
        if (!topBar) {
            try {
                if (window.top && window.top.document) {
                    topBar = window.top.document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
                }
            } catch(e) {}
        }

        // Try current document
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

        // Fallback: search entire page text
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

    // Insert text into O, E, or P field
    function insertText(fieldId, text) {
        const field = document.getElementById(fieldId);
        if (!field) {
            console.error('Field not found:', fieldId);
            return;
        }

        // Add text on new line if field already has content
        if (field.value.trim()) {
            field.value += '\n' + text;
        } else {
            field.value = text;
        }

        // Trigger change event
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Apply template
    function applyTemplate(template) {
        if (template.O) {
            insertText('contactForm.regelO', template.O);
        }
        if (template.E) {
            insertText('contactForm.regelE', template.E);
        }
        if (template.P) {
            insertText('contactForm.regelP', template.P);
        }

        // Handle ICPC code if present
        if (template.icpc) {
            const icpcCode = template.icpc;

            // Fill ICPC code field FIRST, before opening popup
            const icpcField = document.getElementById('icpcCodeERegel');
            if (icpcField) {
                icpcField.value = icpcCode;
                icpcField.dispatchEvent(new Event('change', { bubbles: true }));
                icpcField.dispatchEvent(new Event('input', { bubbles: true }));
                icpcField.dispatchEvent(new Event('blur', { bubbles: true }));
                console.log('ICPC field set to:', icpcCode);
            }

            // Wait for ICPC field to be processed, THEN trigger the search popup
            setTimeout(() => {
                if (typeof popUpERegelICPC === 'function') {
                    console.log('Opening ICPC popup...');
                    popUpERegelICPC();

                    // Poll to find the ICPC iframe after popup opens
                    let attempts = 0;
                    const pollInterval = setInterval(() => {
                        attempts++;
                        console.log('Attempt', attempts, '- searching for ICPC iframe...');

                        const icpcFrame = findICPCFrame(window.top);

                        if (icpcFrame) {
                            try {
                                if (icpcFrame.document.readyState === 'complete' &&
                                    typeof icpcFrame.save === 'function') {

                                    console.log('ICPC iframe found and ready, calling save(' + icpcCode + ')');
                                    clearInterval(pollInterval);
                                    icpcFrame.save(icpcCode);
                                }
                            } catch (e) {
                                console.log('ICPC iframe not ready yet:', e.message);
                            }
                        }

                        if (attempts > 20) {
                            clearInterval(pollInterval);
                            console.error('Gave up waiting for ICPC iframe after 20 attempts');
                        }
                    }, 300); // Check every 300ms
                }
            }, 600);
        }
    }

    // CRP action - copy BSN and open POCTConnect
    function executeCRPAction() {
        const bsn = extractBSN();

        if (!bsn) {
            alert('Geen BSN gevonden. Zorg ervoor dat er een actieve patiënt is geselecteerd.');
            return;
        }

        // Copy BSN to clipboard
        try {
            navigator.clipboard.writeText(bsn);

            // Show confirmation
            const notification = document.createElement('div');
            notification.textContent = 'BSN gekopieerd!';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #28a745;
                color: white;
                padding: 12px 20px;
                border-radius: 4px;
                z-index: 10001;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(notification);

            // Remove notification after 2 seconds
            setTimeout(() => {
                notification.remove();
            }, 2000);

            // Navigate to POCTConnect
            setTimeout(() => {
                window.open('https://www.poctconnect.nl/ui/#/order/patient/search', '_blank');
            }, 500);

        } catch (error) {
            alert('Er is een fout opgetreden bij het kopiëren van het BSN.');
        }
    }

    // Helper function to find ICPC popup iframe recursively
    function findICPCFrame(win, depth = 0) {
        if (depth > 5) return null; // Prevent infinite recursion

        try {
            if (win.location.href.includes('medischdossier.journaal.icpc.m')) {
                return win;
            }
            for (let i = 0; i < win.frames.length; i++) {
                const result = findICPCFrame(win.frames[i], depth + 1);
                if (result) return result;
            }
        } catch (e) {
            // Cross-origin or access denied - skip this frame
        }
        return null;
    }

    // BVO action - fill fields, open URL, fill ICPC code, and trigger search
    function executeBVOAction() {
        // Fill O, E, and P fields
        insertText('contactForm.regelO', 'Uitstrijkje lege artis afgenomen, geen bijzonderheden a vue');
        insertText('contactForm.regelE', 'Bevolkingsonderzoek baarmoederhalskanker');
        insertText('contactForm.regelP', 'Uitstrijkje wordt opgehaald door koerier, zorgdomein verwijzing gemaakt. Patient krijgt uitslag thuis.');

        // Fill ICPC code FIRST
        const icpcField = document.getElementById('icpcCodeERegel');
        if (icpcField) {
            icpcField.value = 'X49';
            icpcField.dispatchEvent(new Event('change', { bubbles: true }));
            icpcField.dispatchEvent(new Event('input', { bubbles: true }));
            icpcField.dispatchEvent(new Event('blur', { bubbles: true }));
        }

        // Wait for ICPC field to be processed, THEN trigger the search popup
        setTimeout(() => {
            if (typeof popUpERegelICPC === 'function') {
                popUpERegelICPC();

                // Poll to find the ICPC iframe after popup opens
                let attempts = 0;
                const pollInterval = setInterval(() => {
                    attempts++;
                    console.log('Attempt', attempts, '- searching for ICPC iframe...');

                    const icpcFrame = findICPCFrame(window.top);

                    if (icpcFrame) {
                        try {
                            if (icpcFrame.document.readyState === 'complete' &&
                                typeof icpcFrame.save === 'function') {

                                console.log('ICPC iframe found and ready, calling save(X49)');
                                clearInterval(pollInterval);
                                icpcFrame.save('X49');

                                // Open URL only AFTER save() succeeds
                                setTimeout(() => {
                                    window.open('https://app.medischelogistiek.nl/#/home', '_blank');
                                }, 300);
                            }
                        } catch (e) {
                            console.log('ICPC iframe not ready yet:', e.message);
                        }
                    }

                    if (attempts > 20) {
                        clearInterval(pollInterval);
                        console.error('Gave up waiting for ICPC iframe after 20 attempts');
                    }
                }, 300); // Check every 300ms
            }
        }, 600);
    }

    // Create styled menu
    function createMenu() {
        // Find the O field to place button next to it
        const oField = document.getElementById('contactForm.regelO');
        if (!oField) {
            console.log('O field not found');
            return;
        }

        // Check if button already exists
        if (document.getElementById('sjablonenMenuButton')) {
            console.log('Sjablonen button already exists');
            return;
        }

        console.log('Creating Sjablonen menu...');

        // Create menu button
        const menuButton = document.createElement('button');
        menuButton.id = 'sjablonenMenuButton';
        menuButton.type = 'button';
        menuButton.textContent = 'Sjablonen';
        menuButton.style.cssText = `
            padding: 6px 12px;
            margin-left: 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        `;

        // Hover effects
        menuButton.addEventListener('mouseenter', () => {
            menuButton.style.backgroundColor = '#45a049';
        });
        menuButton.addEventListener('mouseleave', () => {
            menuButton.style.backgroundColor = '#4CAF50';
        });

        // Create dropdown menu
        const dropdown = document.createElement('div');
        dropdown.id = 'sjablonenDropdown';
        dropdown.style.cssText = `
            display: none;
            position: absolute;
            background-color: white;
            min-width: 200px;
            box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
            z-index: 10000;
            border-radius: 4px;
            overflow: hidden;
        `;

        // Build menu items
        Object.keys(templates).forEach(key => {
            const template = templates[key];
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                position: relative;
            `;
            item.textContent = key;

            // Hover effect
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f5f5f5';
            });
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'white';
            });

            // Click handler
            if (template.submenu) {
                // Add arrow indicator
                item.textContent = key + ' ›';

                // Create submenu
                const submenu = document.createElement('div');
                submenu.className = 'soep-submenu';
                submenu.style.cssText = `
                    display: none;
                    position: fixed !important;
                    background-color: white !important;
                    min-width: 250px !important;
                    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2) !important;
                    border-radius: 4px !important;
                    overflow: visible !important;
                    z-index: 100001 !important;
                    border: 2px solid #4CAF50;
                `;

                Object.keys(template.submenu).forEach(subKey => {
                    const subTemplate = template.submenu[subKey];
                    const subItem = document.createElement('div');
                    subItem.style.cssText = `
                        padding: 12px 16px !important;
                        cursor: pointer !important;
                        border-bottom: 1px solid #f0f0f0 !important;
                        background-color: white !important;
                    `;
                    subItem.textContent = subKey;

                    subItem.addEventListener('mouseenter', () => {
                        subItem.style.backgroundColor = '#f5f5f5 !important';
                    });
                    subItem.addEventListener('mouseleave', () => {
                        subItem.style.backgroundColor = 'white !important';
                    });

                    subItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        console.log('Submenu item clicked:', subKey);
                        applyTemplate(subTemplate);
                        dropdown.style.display = 'none';
                        submenu.style.display = 'none';
                    });

                    submenu.appendChild(subItem);
                });

                let submenuTimeout = null;

                // Show submenu on hover
                item.addEventListener('mouseenter', () => {
                    console.log('UWI item hovered');
                    item.style.backgroundColor = '#f5f5f5';

                    // Clear any pending hide timeout
                    if (submenuTimeout) {
                        clearTimeout(submenuTimeout);
                        submenuTimeout = null;
                    }

                    // Position submenu next to the item
                    const rect = item.getBoundingClientRect();
                    const submenuWidth = 250; // min-width of submenu
                    const windowWidth = window.innerWidth;

                    // Check if submenu would go off-screen to the right
                    const wouldOverflow = (rect.right + 5 + submenuWidth) > windowWidth;

                    if (wouldOverflow) {
                        // Position to the left
                        submenu.style.top = rect.top + 'px';
                        submenu.style.left = (rect.left - submenuWidth - 5) + 'px';
                        submenu.style.right = 'auto';
                        console.log('Positioning submenu to the LEFT');
                    } else {
                        // Position to the right (default)
                        submenu.style.top = rect.top + 'px';
                        submenu.style.left = (rect.right + 5) + 'px';
                        submenu.style.right = 'auto';
                        console.log('Positioning submenu to the RIGHT');
                    }

                    submenu.style.display = 'block';

                    console.log('Submenu positioned at:', {
                        top: submenu.style.top,
                        left: submenu.style.left,
                        wouldOverflow: wouldOverflow,
                        windowWidth: windowWidth
                    });
                });

                // Keep submenu visible when hovering over it
                submenu.addEventListener('mouseenter', () => {
                    console.log('Submenu hovered');

                    // Clear any pending hide timeout
                    if (submenuTimeout) {
                        clearTimeout(submenuTimeout);
                        submenuTimeout = null;
                    }

                    submenu.style.display = 'block';
                });

                // Hide submenu when leaving the item
                item.addEventListener('mouseleave', (e) => {
                    console.log('Left UWI item');

                    // Delay hiding to allow time to move to submenu
                    submenuTimeout = setTimeout(() => {
                        const hoveredElement = document.querySelector(':hover');
                        if (hoveredElement !== submenu && !submenu.contains(hoveredElement)) {
                            console.log('Hiding submenu after delay');
                            submenu.style.display = 'none';
                            item.style.backgroundColor = 'white';
                        }
                    }, 300); // Increased delay to 300ms
                });

                // Hide submenu when leaving the submenu
                submenu.addEventListener('mouseleave', () => {
                    console.log('Left submenu');

                    // Delay hiding to allow moving back to item
                    submenuTimeout = setTimeout(() => {
                        const hoveredElement = document.querySelector(':hover');
                        if (hoveredElement !== item && !item.contains(hoveredElement)) {
                            console.log('Hiding submenu after leaving submenu');
                            submenu.style.display = 'none';
                            item.style.backgroundColor = 'white';
                        }
                    }, 200);
                });

                // Append submenu to body instead of item
                document.body.appendChild(submenu);

            } else if (template.action === 'crp') {
                item.addEventListener('click', () => {
                    executeCRPAction();
                    dropdown.style.display = 'none';
                });
            } else if (template.action === 'bvo') {
                item.addEventListener('click', () => {
                    executeBVOAction();
                    dropdown.style.display = 'none';
                });
            } else {
                // Regular template - fill O, E, P fields
                item.addEventListener('click', () => {
                    applyTemplate(template);
                    dropdown.style.display = 'none';
                });
            }

            dropdown.appendChild(item);
        });

        // Toggle dropdown
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                // Position dropdown below button
                const rect = menuButton.getBoundingClientRect();
                dropdown.style.top = (rect.bottom + 5) + 'px';
                dropdown.style.left = rect.left + 'px';
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });

        // Insert button after O field
        if (oField.nextSibling) {
            oField.parentNode.insertBefore(menuButton, oField.nextSibling);
        } else {
            oField.parentNode.appendChild(menuButton);
        }

        document.body.appendChild(dropdown);

        console.log('Sjablonen menu created successfully');
    }

    // Wait for content to load
    function initialize() {
        console.log('Initializing SOEP Sjablonen script, URL:', window.location.href);

        const checkInterval = setInterval(() => {
            if (document.getElementById('contactForm.regelO')) {
                console.log('O field found, creating menu');
                clearInterval(checkInterval);
                createMenu();
            }
        }, 500);

        // Stop checking after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            console.log('Stopped checking for O field');
        }, 10000);
    }

    // Start when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
