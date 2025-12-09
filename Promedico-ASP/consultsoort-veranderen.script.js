// ==UserScript==
// @name         Promedico Contactsoort Quick Buttons
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add quick access buttons (E/C/T/V) between Contactsoort dropdown and Contactdatum
// @author       Your Name
// @match        https://www.promedico-asp.nl/promedico/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ============================================================================
    // CONFIGURATION
    // ============================================================================
    
    const CONTACT_TYPES = [
        {
            key: 'E',
            label: 'E-consult',
            value: 'EC - electronisch consult',
            color: '#0275d8',
            hoverColor: '#025aa5'
        },
        {
            key: 'C',
            label: 'Consult',
            value: 'C - consult',
            color: '#5cb85c',
            hoverColor: '#449d44'
        },
        {
            key: 'T',
            label: 'Telefonisch',
            value: 'T - telefonisch contact',
            color: '#f0ad4e',
            hoverColor: '#ec971f'
        },
        {
            key: 'V',
            label: 'Visite',
            value: 'V - visite',
            color: '#d9534f',
            hoverColor: '#c9302c'
        }
    ];

    // ============================================================================
    // BUTTON CREATION
    // ============================================================================
    
    function createQuickButton(contactType, dropdown) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'contactsoort-quick-btn';
        button.textContent = contactType.key;
        button.title = contactType.label;
        
        button.style.cssText = `
            width: 30px;
            height: 24px;
            padding: 0;
            margin: 0 2px;
            background-color: ${contactType.color};
            color: white;
            border: 1px solid ${contactType.color};
            border-radius: 3px;
            cursor: pointer;
            font-family: Arial, sans-serif;
            font-size: 13px;
            font-weight: bold;
            text-align: center;
            line-height: 24px;
            transition: all 0.2s;
            vertical-align: middle;
        `;
        
        // Hover effects
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = contactType.hoverColor;
            button.style.borderColor = contactType.hoverColor;
            button.style.transform = 'scale(1.1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = contactType.color;
            button.style.borderColor = contactType.color;
            button.style.transform = 'scale(1)';
        });
        
        // Click handler
        button.addEventListener('click', (e) => {
            e.preventDefault();
            setContactType(dropdown, contactType.value);
            highlightSelectedButton(button);
        });
        
        return button;
    }

    // ============================================================================
    // DROPDOWN MANIPULATION
    // ============================================================================
    
    function setContactType(dropdown, value) {
        if (!dropdown) return;
        
        // Find the option with matching text
        const options = dropdown.querySelectorAll('option');
        for (let option of options) {
            if (option.textContent.trim() === value) {
                dropdown.value = option.value;
                
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                dropdown.dispatchEvent(event);
                
                return;
            }
        }
    }

    function getCurrentContactType(dropdown) {
        if (!dropdown) return null;
        
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        return selectedOption ? selectedOption.textContent.trim() : null;
    }

    // ============================================================================
    // BUTTON HIGHLIGHTING
    // ============================================================================
    
    function highlightSelectedButton(selectedButton) {
        // Remove active state from all buttons
        const allButtons = selectedButton.parentElement.querySelectorAll('.contactsoort-quick-btn');
        allButtons.forEach(btn => {
            btn.style.boxShadow = 'none';
        });
        
        // Highlight selected button
        selectedButton.style.boxShadow = '0 0 0 2px white, 0 0 0 4px ' + selectedButton.style.backgroundColor;
    }

    function updateButtonHighlighting(container, dropdown) {
        if (!dropdown) return;
        
        const currentType = getCurrentContactType(dropdown);
        const buttons = container.querySelectorAll('.contactsoort-quick-btn');
        
        buttons.forEach(button => {
            const contactType = CONTACT_TYPES.find(ct => ct.key === button.textContent);
            if (contactType && currentType === contactType.value) {
                highlightSelectedButton(button);
            }
        });
    }

    // ============================================================================
    // BUTTON CONTAINER CREATION
    // ============================================================================
    
    function createButtonContainer(dropdown) {
        const container = document.createElement('span');
        container.className = 'contactsoort-quick-buttons';
        container.style.cssText = `
            display: inline-block;
            margin: 0 8px;
            vertical-align: middle;
            white-space: nowrap;
        `;
        
        // Create all buttons
        CONTACT_TYPES.forEach(contactType => {
            const button = createQuickButton(contactType, dropdown);
            container.appendChild(button);
        });
        
        // Update highlighting based on current selection
        setTimeout(() => {
            updateButtonHighlighting(container, dropdown);
        }, 100);
        
        // Listen for dropdown changes to update highlighting
        dropdown.addEventListener('change', () => {
            updateButtonHighlighting(container, dropdown);
        });
        
        return container;
    }

    // ============================================================================
    // FIND ELEMENTS
    // ============================================================================
    
    function findContactsoortElements(iframeDoc) {
        // Find the row containing "Contactsoort"
        const labels = iframeDoc.querySelectorAll('td');
        
        for (let label of labels) {
            if (label.textContent.trim() === 'Contactsoort') {
                // Found the label, now find the dropdown in the same row
                const row = label.closest('tr');
                if (!row) continue;
                
                const dropdown = row.querySelector('select[name*="contactsoort"], select');
                if (!dropdown) continue;
                
                // Find the "Contactdatum" label cell in the same row
                const contactdatumLabel = Array.from(row.querySelectorAll('td')).find(
                    td => td.textContent.trim() === 'Contactdatum'
                );
                
                if (contactdatumLabel) {
                    return {
                        dropdown: dropdown,
                        insertPoint: contactdatumLabel
                    };
                }
            }
        }
        
        return null;
    }

    // ============================================================================
    // INJECTION
    // ============================================================================
    
    function injectQuickButtons() {
        // Find iframe
        const iframe = document.querySelector('iframe#panelBackCompatibility-frame');
        if (!iframe) return false;
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Check if we're on a Journaal page
        if (!iframeDoc.body.textContent.includes('Journaal')) {
            return false;
        }
        
        // Check if buttons already exist
        if (iframeDoc.querySelector('.contactsoort-quick-buttons')) {
            return true;
        }
        
        // Find Contactsoort elements
        const elements = findContactsoortElements(iframeDoc);
        if (!elements) {
            return false;
        }
        
        const { dropdown, insertPoint } = elements;
        
        // Create button container
        const buttonContainer = createButtonContainer(dropdown);
        
        // Insert before Contactdatum label
        insertPoint.parentNode.insertBefore(buttonContainer, insertPoint);
        
        return true;
    }

    // ============================================================================
    // INITIALIZATION AND MONITORING
    // ============================================================================
    
    function initialize() {
        // Try to inject buttons periodically
        setInterval(() => {
            injectQuickButtons();
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
