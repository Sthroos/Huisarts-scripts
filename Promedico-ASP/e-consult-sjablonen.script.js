// ==UserScript==
// @name         Promedico E-consult Template Responses
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Add template response buttons for E-consult with customizable messages
// @author       Your Name
// @match        https://www.promedico-asp.nl/promedico/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';



    // ============================================================================
    // CONFIGURATION - EASILY EDITABLE TEMPLATES
    // ============================================================================
    
    const TEMPLATES = [
        {
            id: 'bloedprikken',
            label: 'Bloedprikken afspraak',
            text: `Beste,

Dank voor uw bericht. U kunt een afspraak maken voor bloedprikken via onze assistente of online via de website.

Nuchter verschijnen is niet nodig, tenzij anders aangegeven.

Met vriendelijke groet,`
        },
        {
            id: 'recept',
            label: 'Recept herhaalmedicatie',
            text: `Beste,

Uw receptaanvraag is in behandeling genomen. U kunt het recept binnen 2 werkdagen ophalen bij uw apotheek.

Met vriendelijke groet,`
        },
        {
            id: 'verwijzing',
            label: 'Verwijzing aangevraagd',
            text: `Beste,

Uw verwijzing is aangevraagd. U ontvangt deze per post of kunt deze ophalen aan de balie.

Maak een afspraak bij de desbetreffende specialist zodra u de verwijzing heeft ontvangen.

Met vriendelijke groet,`
        },
        {
            id: 'uitslagen',
            label: 'Uitslagen zijn binnen',
            text: `Beste,

De uitslagen van uw onderzoek zijn binnen en zijn besproken. Er zijn geen bijzonderheden.

Heeft u nog vragen, neem dan contact op met de praktijk.

Met vriendelijke groet,`
        },
        {
            id: 'afspraak',
            label: 'Afspraak maken',
            text: `Beste,

Dank voor uw bericht. Graag zou ik u uitnodigen voor een consult om dit verder te bespreken.

U kunt een afspraak maken via onze assistente of online.

Met vriendelijke groet,`
        },
        {
            id: 'onvoldoende_info',
            label: 'Onvoldoende informatie',
            text: `Beste,

Dank voor uw bericht. Om u goed te kunnen adviseren heb ik wat meer informatie nodig:

- [Specificeer welke informatie nodig is]

Kunt u deze informatie aanvullen?

Met vriendelijke groet,`
        },
        {
            id: 'custom',
            label: '--- Eigen tekst ---',
            text: '' // Empty template for custom text
        }
    ];

    // ============================================================================
    // USER NAME EXTRACTION
    // ============================================================================
    
    function getCurrentUserName() {
        
        // Try to find the user name in the top bar
        const userDiv = document.querySelector('.GEM3CPJDGMC');
        
        if (userDiv) {
            const fullText = userDiv.textContent.trim();
            
            // Extract name after "Aangemeld als"
            const match = fullText.match(/Aangemeld als\s+(.+)/);
            if (match) {
                const name = match[1].trim();
                return name;
            }
        }
        
        return 'De huisarts';
    }

    // ============================================================================
    // TEMPLATE BUTTON CREATION
    // ============================================================================
    
    function createTemplateButton() {
        
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'econsult-template-btn';
        button.innerHTML = '📝 Sjablonen';
        button.style.cssText = `
            padding: 5px 10px;
            margin-left: 10px;
            background-color: #0275d8;
            color: white;
            border: 1px solid #0275d8;
            border-radius: 3px;
            cursor: pointer;
            font-family: Arial, sans-serif;
            font-size: 13px;
            vertical-align: middle;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#025aa5';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#0275d8';
        });
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            showTemplateMenu(button);
        });
        
        return button;
    }

    // ============================================================================
    // TEMPLATE MENU CREATION
    // ============================================================================
    
    function createTemplateMenu() {
        
        const menu = document.createElement('div');
        menu.id = 'econsult-template-menu';
        menu.style.cssText = `
            position: absolute;
            background: white;
            border: 2px solid #0275d8;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            min-width: 250px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
        `;
        
        // Add header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px;
            background: #0275d8;
            color: white;
            font-weight: bold;
            border-bottom: 1px solid #025aa5;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = '<span>Kies een sjabloon</span><span style="cursor: pointer;">✕</span>';
        
        header.querySelector('span:last-child').addEventListener('click', () => {
            hideTemplateMenu();
        });
        
        menu.appendChild(header);
        
        // Add template items
        TEMPLATES.forEach(template => {
            const item = document.createElement('div');
            item.className = 'template-menu-item';
            item.textContent = template.label;
            item.style.cssText = `
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 1px solid #e0e0e0;
                font-family: Arial, sans-serif;
                font-size: 13px;
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f0f8ff';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'white';
            });
            
            item.addEventListener('click', () => {
                insertTemplate(template);
                hideTemplateMenu();
            });
            
            menu.appendChild(item);
        });
        
        document.body.appendChild(menu);
        return menu;
    }

    // ============================================================================
    // MENU SHOW/HIDE
    // ============================================================================
    
    function showTemplateMenu(button) {
        
        let menu = document.getElementById('econsult-template-menu');
        
        if (!menu) {
            menu = createTemplateMenu();
        }
        
        // Position menu below button
        const rect = button.getBoundingClientRect();
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.left = rect.left + 'px';
        menu.style.display = 'block';
        
    }

    function hideTemplateMenu() {
        const menu = document.getElementById('econsult-template-menu');
        if (menu) {
            menu.style.display = 'none';
        }
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('econsult-template-menu');
        const button = document.getElementById('econsult-template-btn');
        
        if (menu && button && 
            !menu.contains(e.target) && 
            !button.contains(e.target)) {
            hideTemplateMenu();
        }
    });

    // ============================================================================
    // TEMPLATE INSERTION
    // ============================================================================
    
    function insertTemplate(template) {
        
        // Find the Reactie textarea
        const reactieTextarea = findReactieTextarea();
        
        if (!reactieTextarea) {
            alert('Kon het Reactie veld niet vinden');
            return;
        }
        
        
        // Get user name
        const userName = getCurrentUserName();
        
        // Build complete message
        let message = template.text;
        
        // Add signature if not empty template
        if (template.text) {
            message += '\n' + userName;
        }
        
        // Insert into textarea
        reactieTextarea.value = message;
        
        // Trigger input event to ensure the application registers the change
        const event = new Event('input', { bubbles: true });
        reactieTextarea.dispatchEvent(event);
        
    }

    // ============================================================================
    // FIND REACTIE TEXTAREA
    // ============================================================================
    
    function findReactieTextarea() {
        
        // Try to find iframe first
        const iframe = document.querySelector('iframe#panelBackCompatibility-frame');
        if (!iframe) {
            return null;
        }
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Search for textarea with name containing "reactie"
        const textareas = iframeDoc.querySelectorAll('textarea');
        
        for (let textarea of textareas) {
            
            if (textarea.name && textarea.name.toLowerCase().includes('reactie')) {
                return textarea;
            }
        }
        
        // Alternative: find by looking at nearby labels
        const labels = iframeDoc.querySelectorAll('td');
        for (let label of labels) {
            if (label.textContent.includes('Reactie(P)')) {
                const parentRow = label.closest('tr');
                if (parentRow) {
                    const textarea = parentRow.querySelector('textarea');
                    if (textarea) {
                        return textarea;
                    }
                }
            }
        }
        
        return null;
    }

    // ============================================================================
    // BUTTON INJECTION
    // ============================================================================
    
    function injectTemplateButton() {
        
        // Find iframe
        const iframe = document.querySelector('iframe#panelBackCompatibility-frame');
        if (!iframe) {
            return false;
        }
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Check if we're on the right page
        if (!iframeDoc.body.textContent.includes('Journaal/E-consult')) {
            return false;
        }
        
        
        // Check if button already exists
        if (iframeDoc.getElementById('econsult-template-btn')) {
            return true;
        }
        
        // Find Reactie(P) label
        const labels = iframeDoc.querySelectorAll('td');
        for (let label of labels) {
            if (label.textContent.includes('Reactie(P)')) {
                
                // Insert button after the label
                const button = createTemplateButton();
                label.appendChild(button);
                
                return true;
            }
        }
        
        return false;
    }

    // ============================================================================
    // INITIALIZATION AND MONITORING
    // ============================================================================
    
    function initialize() {
        
        // Try to inject button periodically
        const injectionInterval = setInterval(() => {
            if (injectTemplateButton()) {
                // Keep checking in case page changes
            }
        }, 1000);
        
    }

    // ============================================================================
    // START SCRIPT
    // ============================================================================
    
    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }


})();
