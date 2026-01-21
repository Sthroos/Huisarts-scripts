// ==UserScript==
// @name         Promedico ASP - Agenda Menu Items
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Add Berichten, E-consult, and Recept buttons to Agenda menu
// @match        https://www.promedico-asp.nl/promedico/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('[Agenda Menu] Script initialized');

    // Click a sidebar button in the MAIN document (not iframe)
    function clickSidebarButton(buttonId) {
        const script = document.createElement('script');
        script.textContent = `
            (function() {
                try {
                    // First click Werklijst to open the Agenda section
                    const agendaWerklijst = document.getElementById('MainMenu-Agenda-Werklijst');
                    if (agendaWerklijst) {
                        agendaWerklijst.click();
                        console.log('[Agenda Menu] Clicked Werklijst, waiting for sidebar buttons...');

                        // Wait for sidebar buttons to appear in MAIN document
                        setTimeout(() => {
                            const button = document.getElementById('${buttonId}');
                            if (button) {
                                button.click();
                                console.log('[Agenda Menu] Clicked sidebar button: ${buttonId}');
                            } else {
                                console.log('[Agenda Menu] Button not found in main document: ${buttonId}');
                            }
                        }, 1000);
                    } else {
                        console.log('[Agenda Menu] Werklijst menu item not found');
                    }
                } catch (e) {
                    console.error('[Agenda Menu] Navigation error:', e);
                }
            })();
        `;
        document.head.appendChild(script);
        script.remove();
    }

    // Add a custom menu item
    function addCustomMenuItem(afterElementId, newItemId, newItemText, sidebarButtonId) {
        const afterElement = document.getElementById(afterElementId);
        if (!afterElement) {
            console.log('[Agenda Menu] After element not found:', afterElementId);
            return false;
        }

        // Check if already exists
        if (document.getElementById(newItemId)) {
            return true;
        }

        // Clone the element to get the same styling
        const newMenuItem = afterElement.cloneNode(true);
        newMenuItem.id = newItemId;
        newMenuItem.textContent = newItemText;

        // Create a clean copy without old event listeners
        const cleanMenuItem = newMenuItem.cloneNode(true);

        // Add click handler
        cleanMenuItem.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Agenda Menu] Clicked:', newItemText, '→', sidebarButtonId);
            clickSidebarButton(sidebarButtonId);
        });

        // Insert after the reference element
        afterElement.parentNode.insertBefore(cleanMenuItem, afterElement.nextSibling);
        console.log('[Agenda Menu] Added menu item:', newItemText);
        return true;
    }

    // Try to add all menu items
    function tryAddMenuItems() {
        // Check if Agenda-Werklijst exists (this is our anchor point)
        const agendaWerklijst = document.getElementById('MainMenu-Agenda-Werklijst');
        if (!agendaWerklijst) {
            console.log('[Agenda Menu] Agenda-Werklijst not found yet');
            return false;
        }

        // Check if already added
        if (document.getElementById('MainMenu-Agenda-Berichten')) {
            return true;
        }

        console.log('[Agenda Menu] Adding menu items...');

        // Add Berichten (first, right after Werklijst)
        const added1 = addCustomMenuItem(
            'MainMenu-Agenda-Werklijst',
            'MainMenu-Agenda-Berichten',
            'Berichten',
            'WerklijstLeftMenu-lbBerichten'
        );

        // Add E-consult (after Berichten)
        const afterElement1 = added1 ? 'MainMenu-Agenda-Berichten' : 'MainMenu-Agenda-Werklijst';
        const added2 = addCustomMenuItem(
            afterElement1,
            'MainMenu-Agenda-Econsult',
            'E-consult',
            'WerklijstLeftMenu-lbEconsulten'
        );

        // Add Recept (after E-consult)
        const afterElement2 = added2 ? 'MainMenu-Agenda-Econsult' : afterElement1;
        addCustomMenuItem(
            afterElement2,
            'MainMenu-Agenda-Recept',
            'Recept',
            'WerklijstLeftMenu-lbReceptAanvraag'
        );

        return added1;
    }

    // Initialize the script
    function init() {
        // Only run on main index.html page
        if (!window.location.href.includes('index.html')) {
            console.log('[Agenda Menu] Not on index.html, skipping');
            return;
        }

        console.log('[Agenda Menu] Initializing on index.html');

        // Try after a delay
        setTimeout(() => {
            tryAddMenuItems();
        }, 2000);

        // Monitor for menu changes (in case it loads later)
        const observer = new MutationObserver(() => {
            const agendaWerklijst = document.getElementById('MainMenu-Agenda-Werklijst');
            const berichtenItem = document.getElementById('MainMenu-Agenda-Berichten');

            if (agendaWerklijst && !berichtenItem) {
                console.log('[Agenda Menu] Menu detected, adding items...');
                tryAddMenuItems();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[Agenda Menu] Observer started');
    }

    // Start when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();