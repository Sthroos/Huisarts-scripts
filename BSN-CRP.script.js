// ==UserScript==
// @name         Promedico ASP - CRP Aanvragen Button (Debug)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Add CRP aanvragen button to copy BSN and navigate to POCTConnect (with debugging)
// @author       You
// @match        https://www.promedico-asp.nl/promedico/medischdossier.journaal.contact.m*
// @grant        GM_setClipboard
// @grant        window.close
// ==/UserScript==

(function() {
    'use strict';

    // Function to extract BSN from the top bar
    function extractBSN() {
        console.log('=== BSN EXTRACTION DEBUG START ===');
        
        const topBar = document.getElementById('displayPanelTopBar');
        console.log('1. Looking for top bar element with ID "displayPanelTopBar"...');
        
        if (!topBar) {
            console.error('❌ Top bar not found!');
            console.log('Available elements with IDs containing "display":', 
                Array.from(document.querySelectorAll('[id*="display"]')).map(el => el.id));
            console.log('Available elements with IDs containing "top":', 
                Array.from(document.querySelectorAll('[id*="top" i]')).map(el => el.id));
            console.log('Available elements with IDs containing "bar":', 
                Array.from(document.querySelectorAll('[id*="bar" i]')).map(el => el.id));
            console.log('=== BSN EXTRACTION DEBUG END ===');
            return null;
        }

        console.log('✓ Top bar found!');
        console.log('2. Top bar element:', topBar);
        
        const innerText = topBar.innerText;
        console.log('3. Top bar innerText:', innerText);
        console.log('4. Top bar innerText length:', innerText.length);
        console.log('5. Top bar textContent:', topBar.textContent);
        console.log('6. Top bar innerHTML (first 500 chars):', topBar.innerHTML.substring(0, 500));

        // Check if there's an active patient
        console.log('7. Checking for "Geen actieve patiënt"...');
        if (innerText.includes('Geen actieve patiënt')) {
            console.warn('⚠️ No active patient detected in top bar');
            console.log('=== BSN EXTRACTION DEBUG END ===');
            return null;
        }
        console.log('✓ Active patient check passed');

        // Extract BSN using regex - looks for "BSN: " followed by digits
        console.log('8. Attempting to extract BSN with regex pattern: /BSN:\\s*(\\d+)/');
        const bsnMatch = innerText.match(/BSN:\s*(\d+)/);
        console.log('9. Regex match result:', bsnMatch);
        
        if (bsnMatch && bsnMatch[1]) {
            console.log('✓✓✓ BSN FOUND:', bsnMatch[1]);
            console.log('=== BSN EXTRACTION DEBUG END ===');
            return bsnMatch[1];
        }

        // Try alternative patterns
        console.log('10. Primary pattern failed. Trying alternative patterns...');
        
        // Try case-insensitive
        const bsnMatchCI = innerText.match(/bsn:?\s*(\d+)/i);
        console.log('11. Case-insensitive pattern /bsn:?\\s*(\\d+)/i result:', bsnMatchCI);
        if (bsnMatchCI && bsnMatchCI[1]) {
            console.log('✓✓✓ BSN FOUND (case-insensitive):', bsnMatchCI[1]);
            console.log('=== BSN EXTRACTION DEBUG END ===');
            return bsnMatchCI[1];
        }

        // Try looking for 9-digit number (Dutch BSN format)
        const nineDigitMatch = innerText.match(/\b(\d{9})\b/);
        console.log('12. Looking for 9-digit number pattern /\\b(\\d{9})\\b/ result:', nineDigitMatch);
        if (nineDigitMatch && nineDigitMatch[1]) {
            console.log('⚠️ Found 9-digit number (might be BSN):', nineDigitMatch[1]);
            console.log('Consider using this if it\'s the BSN');
        }

        // Show all numbers found
        const allNumbers = innerText.match(/\d+/g);
        console.log('13. All numbers found in top bar:', allNumbers);

        console.error('❌ BSN not found in top bar with any pattern');
        console.log('=== BSN EXTRACTION DEBUG END ===');
        return null;
    }

    // Function to create and insert the button
    function createCRPButton() {
        // Get the iframe that contains the form
        const iframe = document.getElementById('panelBackCompatibility-frame');
        if (!iframe || !iframe.contentDocument) {
            console.log('Iframe not found, retrying...');
            return false;
        }

        const doc = iframe.contentDocument;

        // Find the textarea element for regelO
        const regelO = doc.getElementById('contactForm.regelO');
        if (!regelO) {
            console.log('regelO textarea not found, retrying...');
            return false;
        }

        // Check if button already exists
        if (doc.getElementById('crp-aanvragen-btn')) {
            return true;
        }

        // Find the parent row/container of regelO
        let parentContainer = regelO.parentElement;
        while (parentContainer && parentContainer.tagName !== 'TR' && parentContainer.tagName !== 'TD') {
            parentContainer = parentContainer.parentElement;
        }

        if (!parentContainer) {
            console.log('Parent container not found');
            return false;
        }

        // Create the button matching the style of "Informatie vullen" button
        const button = doc.createElement('input');
        button.id = 'crp-aanvragen-btn';
        button.type = 'BUTTON';
        button.value = 'CRP aanvragen';
        button.tabIndex = 102;
        button.style.cssText = 'cursor: pointer; margin-left: 5px;';

        // Add click handler
        button.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('\n🔘 CRP Button clicked!');
            const bsn = extractBSN();

            if (!bsn) {
                console.error('❌ No BSN found - showing alert to user');
                alert('Geen BSN gevonden. Zorg ervoor dat er een actieve patiënt is geselecteerd.\n\nOpen de browser console (F12) voor debugging informatie.');
                return false;
            }

            // Copy BSN to clipboard
            try {
                GM_setClipboard(bsn);
                console.log('✓ BSN copied to clipboard:', bsn);

                // Visual feedback
                const originalValue = button.value;
                button.value = 'BSN gekopieerd!';
                button.style.backgroundColor = '#28a745';
                button.style.color = 'white';

                // Navigate to POCTConnect
                setTimeout(() => {
                    console.log('Opening POCTConnect...');
                    window.open('https://www.poctconnect.nl/ui/#/order/patient/search', '_blank');
                }, 500);

                // Reset button after 2 seconds
                setTimeout(() => {
                    button.value = originalValue;
                    button.style.backgroundColor = '';
                    button.style.color = '';
                }, 2000);

            } catch (error) {
                console.error('❌ Error copying BSN:', error);
                alert('Er is een fout opgetreden bij het kopiëren van het BSN.');
            }

            return false;
        };

        // Insert the button after the regelO textarea
        if (regelO.nextSibling) {
            regelO.parentNode.insertBefore(button, regelO.nextSibling);
        } else {
            regelO.parentNode.appendChild(button);
        }

        console.log('✓ CRP aanvragen button created successfully');
        return true;
    }

    // Wait for page to load and try to create button
    function initialize() {
        console.log('🚀 Initializing BSN CRP script...');
        let attempts = 0;
        const maxAttempts = 20;

        const intervalId = setInterval(() => {
            attempts++;

            if (createCRPButton()) {
                console.log('✓✓✓ Button initialized successfully');
                clearInterval(intervalId);
            } else if (attempts >= maxAttempts) {
                console.warn('⚠️ Failed to initialize button after', maxAttempts, 'attempts');
                clearInterval(intervalId);
            }
        }, 500);
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();

