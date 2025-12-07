// ==UserScript==
// @name         Promedico ASP - CRP Aanvragen Button
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Add CRP aanvragen button to copy BSN and navigate to POCTConnect
// @author       You
// @match        https://www.promedico-asp.nl/promedico/medischdossier.journaal.contact.m*
// @grant        GM_setClipboard
// @grant        window.close
// ==/UserScript==

(function() {
    'use strict';

    let lastRegelOElement = null;

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

    // Find the textarea in the main document or any iframe
    function findRegelOTextarea() {
        // Check main document
        let regelO = document.getElementById('contactForm.regelO');
        if (regelO) {
            return { element: regelO, doc: document };
        }

        // Check all iframes
        const iframes = document.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
            const iframe = iframes[i];
            
            if (!iframe.contentDocument) continue;
            
            try {
                const doc = iframe.contentDocument;
                regelO = doc.getElementById('contactForm.regelO');
                
                if (regelO) {
                    return { element: regelO, doc: doc };
                }
            } catch(e) {}
        }
        
        return null;
    }

    // Function to create and insert the button
    function createCRPButton() {
        const result = findRegelOTextarea();
        
        if (!result) {
            lastRegelOElement = null;
            return false;
        }
        
        const regelO = result.element;
        const doc = result.doc;

        // Check if this is a new regelO element (page reloaded)
        const isNewElement = (regelO !== lastRegelOElement);
        lastRegelOElement = regelO;

        // Check if button already exists in this document
        const existingButton = doc.getElementById('crp-aanvragen-btn');
        
        // If button exists and element hasn't changed, we're done
        if (existingButton && !isNewElement) {
            return true;
        }
        
        // If button exists but element changed (page reloaded), remove old button
        if (existingButton) {
            existingButton.remove();
        }

        // Find the parent row/container of regelO
        let parentContainer = regelO.parentElement;
        while (parentContainer && parentContainer.tagName !== 'TR' && parentContainer.tagName !== 'TD') {
            parentContainer = parentContainer.parentElement;
        }

        if (!parentContainer) {
            return false;
        }

        // Create the button
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

            const bsn = extractBSN();

            if (!bsn) {
                alert('Geen BSN gevonden. Zorg ervoor dat er een actieve patiënt is geselecteerd.');
                return false;
            }

            // Copy BSN to clipboard
            try {
                GM_setClipboard(bsn);

                // Visual feedback
                const originalValue = button.value;
                button.value = 'BSN gekopieerd!';
                button.style.backgroundColor = '#28a745';
                button.style.color = 'white';

                // Navigate to POCTConnect
                setTimeout(() => {
                    window.open('https://www.poctconnect.nl/ui/#/order/patient/search', '_blank');
                }, 500);

                // Reset button after 2 seconds
                setTimeout(() => {
                    button.value = originalValue;
                    button.style.backgroundColor = '';
                    button.style.color = '';
                }, 2000);

            } catch (error) {
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

        return true;
    }

    // Initialize - continuous monitoring
    function initialize() {
        setInterval(() => {
            createCRPButton();
        }, 2000);
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
