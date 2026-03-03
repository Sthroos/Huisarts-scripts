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
                        
                        // Wait for sidebar buttons to appear in MAIN document
                        setTimeout(() => {
                            const button = document.getElementById('${buttonId}');
                            if (button) {
                                button.click();
                            } else {
                            }
                        }, 1000);
                    } else {
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
            clickSidebarButton(sidebarButtonId);
        });

        // Insert after the reference element
        afterElement.parentNode.insertBefore(cleanMenuItem, afterElement.nextSibling);
        return true;
    }

    // Try to add all menu items
    function tryAddMenuItems() {
        // Check if Agenda-Werklijst exists (this is our anchor point)
        const agendaWerklijst = document.getElementById('MainMenu-Agenda-Werklijst');
        if (!agendaWerklijst) {
            return false;
        }

        // Check if already added
        if (document.getElementById('MainMenu-Agenda-Berichten')) {
            return true;
        }

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

        // Try after a delay
        setTimeout(() => {
            tryAddMenuItems();
        }, 2000);

        // Monitor for menu changes (in case it loads later)
        const observer = new MutationObserver(() => {
            const agendaWerklijst = document.getElementById('MainMenu-Agenda-Werklijst');
            const berichtenItem = document.getElementById('MainMenu-Agenda-Berichten');

            if (agendaWerklijst && !berichtenItem) {
                tryAddMenuItems();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

    }

    // Start when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();