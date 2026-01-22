// Promedico-ZNeller Auto Transfer - Chrome Extension Version
// Add this to your content script

(function() {
    'use strict';

    // Check which domain we're on
    const isPromedico = window.location.hostname.includes('promedico-asp.nl');
    const isZNeller = window.location.hostname.includes('zneller.nl');

    if (isPromedico) {
        initPromedico();
    } else if (isZNeller) {
        initZNeller();
    }

    // ==================== PROMEDICO PART ====================
    function initPromedico() {
        // Voeg CSS animaties toe
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flyoverFadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes flyoverFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            .plan-flyover {
                position: fixed;
                background-color: #fffbcc;
                border: 1px solid #e6db55;
                padding: 10px 15px;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                z-index: 10000;
                font-size: 13px;
                max-width: 400px;
                animation: flyoverFadeIn 0.3s ease-in;
            }
            .plan-flyover a {
                margin-left: 10px;
                color: #0066cc;
                text-decoration: underline;
                cursor: pointer;
            }
            .plan-flyover a:hover {
                color: #004499;
            }
            .plan-flyover .link-separator {
                margin: 0 5px;
                color: #666;
            }
        `;
        
        // Wait for head to exist
        const addStyle = () => {
            if (document.head) {
                document.head.appendChild(style);
            } else {
                setTimeout(addStyle, 100);
            }
        };
        addStyle();

        let hideTimeout = null;
        let lastTriggeredWord = '';

        function extractPatientData() {
            const data = {};
            
            // We need to look in the parent/top window for patient data
            const topDoc = window.top.document;
            
            console.log('=== Starting data extraction from top window ===');
            
            // Extract name and DOB from the patient info div
            const patientInfoDiv = topDoc.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
            
            if (patientInfoDiv) {
                const infoText = patientInfoDiv.textContent.trim();
                console.log('Patient info text:', infoText);
                
                // Format: "Test2, t.e.s.t. /  / 01-01-1950 (76) / Man / BSN:  onbekend"
                const parts = infoText.split('/').map(s => s.trim());
                
                if (parts.length >= 3) {
                    // First part: complete name "Test2, t.e.s.t."
                    data.naam = parts[0];
                    
                    // Third part: "01-01-1950 (76)" - extract just the date
                    const dobMatch = parts[2].match(/(\d{2}-\d{2}-\d{4})/);
                    
                    if (dobMatch) {
                        data.geboortedatum = dobMatch[1];
                    }
                }
            }
            
            // Extract address
            const addressDiv = topDoc.getElementById('PanelPatientDossierBarCore-lblPersoonAddressInfo');
            
            if (addressDiv) {
                let addressText = addressDiv.textContent.trim();
                // Remove the copy button emoji if present
                addressText = addressText.replace(/📋/g, '').trim();
                console.log('Address text (cleaned):', addressText);
                
                // Format: "Dorpsstraat 1, 1011AA, Testcity, NL"
                const addressParts = addressText.split(',').map(s => s.trim());
                
                if (addressParts.length >= 3) {
                    data.straat = addressParts[0]; // "Dorpsstraat 1"
                    data.postcode = addressParts[1]; // "1011AA"
                    data.gemeente = addressParts[2]; // "Testcity"
                }
            }
            
            console.log('=== Final extracted data ===', data);
            return data;
        }

        function sendToZNeller(url) {
            const data = extractPatientData();
            
            console.log('Storing patient data with chrome.storage.local');
            console.log('Data:', data);
            
            // Store in Chrome storage (works cross-domain within extension)
            chrome.storage.local.set({
                'zneller_patient_data': JSON.stringify(data),
                'zneller_timestamp': Date.now()
            }, function() {
                if (chrome.runtime.lastError) {
                    console.error('Error storing data:', chrome.runtime.lastError);
                    return;
                }
                
                console.log('Data stored successfully');
                
                // Verify storage
                chrome.storage.local.get(['zneller_patient_data'], function(result) {
                    console.log('Verified stored data:', result.zneller_patient_data);
                });
                
                console.log('Opening ZNeller URL:', url);
                
                // Open ZNeller in new tab
                window.open(url, '_blank');
            });
        }

        function showFlyover(inputElement, config) {
            // config = { message, triggerWord, links: [{text, url}, ...] }
            
            // Don't show again if already showing for this word
            if (lastTriggeredWord === config.triggerWord && document.querySelector('.plan-flyover')) {
                return;
            }

            lastTriggeredWord = config.triggerWord;

            // Clear any existing hide timeout
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }

            // Verwijder bestaande flyover
            const existingFlyover = document.querySelector('.plan-flyover');
            if (existingFlyover) {
                existingFlyover.remove();
            }

            // Maak nieuwe flyover
            const flyover = document.createElement('div');
            flyover.className = 'plan-flyover';

            // Voeg bericht toe
            const messageSpan = document.createElement('span');
            messageSpan.textContent = config.message;
            flyover.appendChild(messageSpan);

            // Voeg links toe
            config.links.forEach((linkConfig, index) => {
                if (index > 0) {
                    const separator = document.createElement('span');
                    separator.className = 'link-separator';
                    separator.textContent = '|';
                    flyover.appendChild(separator);
                }
                
                const link = document.createElement('a');
                link.textContent = linkConfig.text;
                link.href = '#';
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Opening:', linkConfig.url);
                    sendToZNeller(linkConfig.url);
                });
                flyover.appendChild(link);
            });

            // Positioneer onder het inputveld
            const rect = inputElement.getBoundingClientRect();
            flyover.style.left = rect.left + 'px';
            flyover.style.top = (rect.bottom + 5) + 'px';

            document.body.appendChild(flyover);

            // Function to start hide timer
            function startHideTimer() {
                // Clear existing timeout
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                }

                // Start new timeout
                hideTimeout = setTimeout(() => {
                    if (flyover.parentNode) {
                        flyover.style.animation = 'flyoverFadeOut 0.3s ease-out';
                        setTimeout(() => {
                            if (flyover.parentNode) {
                                flyover.remove();
                                lastTriggeredWord = '';
                            }
                        }, 300);
                    }
                }, 5000);
            }

            // Stop hide timer when mouse enters
            flyover.addEventListener('mouseenter', () => {
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
            });

            // Restart hide timer when mouse leaves
            flyover.addEventListener('mouseleave', () => {
                startHideTimer();
            });

            // Start initial hide timer
            startHideTimer();
        }

        // Wacht tot veld beschikbaar is
        function initPlanHelper() {
            const planVeld = document.getElementById('contactForm.regelP');

            if (!planVeld) {
                setTimeout(initPlanHelper, 500);
                return;
            }

            planVeld.addEventListener('input', function(e) {
                const currentValue = planVeld.value.toLowerCase();

                // Check for all medication triggers
                
                // Liraglutide / Saxenda
                if (currentValue.includes('liraglutide') || currentValue.includes('saxenda')) {
                    showFlyover(planVeld, {
                        message: 'Vergeet ZN formulier niet!',
                        triggerWord: 'saxenda',
                        links: [{
                            text: 'Open formulier',
                            url: 'https://www.zneller.nl/formulier/liraglutide'
                        }]
                    });
                }
                // Naltrexon / Bupropion
                else if (currentValue.includes('naltrexon') || currentValue.includes('bupropion')) {
                    showFlyover(planVeld, {
                        message: 'Vergeet ZN formulier niet!',
                        triggerWord: 'naltrexon-bupropion',
                        links: [{
                            text: 'Open formulier',
                            url: 'https://www.zneller.nl/formulier/naltrexon-bupropion'
                        }]
                    });
                }
                // Exenatide / Dulaglutide / Semaglutide (GLP-1 agonisten)
                else if (currentValue.includes('exenatide') || currentValue.includes('dulaglutide') || currentValue.includes('semaglutide')) {
                    showFlyover(planVeld, {
                        message: 'Vergeet ZN formulier niet!',
                        triggerWord: 'glp1-agonist',
                        links: [
                            {
                                text: 'Met insuline',
                                url: 'https://www.zneller.nl/formulier/glp-1-agonist-met-insuline'
                            },
                            {
                                text: 'Zonder insuline',
                                url: 'https://www.zneller.nl/formulier/glp-1-agonist-zonder-insuline'
                            }
                        ]
                    });
                }
                // Als geen van de woorden aanwezig is, reset de trigger
                else {
                    if (lastTriggeredWord) {
                        const existingFlyover = document.querySelector('.plan-flyover');
                        if (existingFlyover) {
                            existingFlyover.remove();
                        }
                        lastTriggeredWord = '';
                        if (hideTimeout) {
                            clearTimeout(hideTimeout);
                            hideTimeout = null;
                        }
                    }
                }
            });
        }

        // Start de helper
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initPlanHelper);
        } else {
            initPlanHelper();
        }
    }

    // ==================== ZNELLER PART ====================
    function initZNeller() {
        console.log('=== ZNeller form filler started ===');
        
        function fillForm() {
            console.log('Starting fillForm function');
            
            // Get data from Chrome storage
            chrome.storage.local.get(['zneller_patient_data', 'zneller_timestamp'], function(result) {
                const dataStr = result.zneller_patient_data;
                const timestamp = result.zneller_timestamp;
                
                console.log('Retrieved data from chrome.storage.local:', dataStr);
                console.log('Timestamp:', timestamp);
                
                if (!dataStr) {
                    console.log('No patient data found in storage');
                    return;
                }
                
                // Check if data is not too old (5 minutes)
                if (timestamp && (Date.now() - timestamp > 5 * 60 * 1000)) {
                    console.log('Patient data is too old, clearing');
                    chrome.storage.local.remove(['zneller_patient_data', 'zneller_timestamp']);
                    return;
                }
                
                try {
                    const data = JSON.parse(dataStr);
                    console.log('Parsed patient data:', data);
                    
                    // Wait for form to be ready
                    const checkFormReady = setInterval(() => {
                        const nameField = document.getElementById('patientname');
                        
                        if (nameField) {
                            clearInterval(checkFormReady);
                            console.log('Form is ready, filling fields...');
                            
                            // Fill patient name (complete name as-is)
                            if (data.naam) {
                                nameField.value = data.naam;
                                nameField.dispatchEvent(new Event('input', { bubbles: true }));
                                nameField.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log('Name filled:', nameField.value);
                            }
                            
                            // Fill date of birth
                            const dobField = document.getElementById('patientdob');
                            if (dobField && data.geboortedatum) {
                                dobField.value = data.geboortedatum;
                                dobField.dispatchEvent(new Event('input', { bubbles: true }));
                                dobField.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log('DOB filled:', dobField.value);
                            }
                            
                            // Fill address
                            const addressField = document.getElementById('patientaddress');
                            if (addressField && data.straat) {
                                addressField.value = data.straat;
                                addressField.dispatchEvent(new Event('input', { bubbles: true }));
                                addressField.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log('Address filled:', addressField.value);
                            }
                            
                            // Fill postal code
                            const postalField = document.getElementById('patientpostalcode');
                            if (postalField && data.postcode) {
                                postalField.value = data.postcode;
                                postalField.dispatchEvent(new Event('input', { bubbles: true }));
                                postalField.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log('Postal code filled:', postalField.value);
                            }
                            
                            // Fill city
                            const cityField = document.getElementById('patientcity');
                            if (cityField && data.gemeente) {
                                cityField.value = data.gemeente;
                                cityField.dispatchEvent(new Event('input', { bubbles: true }));
                                cityField.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log('City filled:', cityField.value);
                            }
                            
                            console.log('Form filled successfully');
                            
                            // Click the indication accordion button after a short delay
                            setTimeout(() => {
                                const indicationButton = document.getElementById('indication-accordion-button');
                                if (indicationButton) {
                                    indicationButton.click();
                                    console.log('Clicked indication accordion button');
                                }
                            }, 500);
                            
                            // Clear the stored data after successful fill
                            chrome.storage.local.remove(['zneller_patient_data', 'zneller_timestamp'], function() {
                                console.log('Cleared stored data');
                            });
                        }
                    }, 100);
                    
                    // Stop checking after 10 seconds
                    setTimeout(() => {
                        clearInterval(checkFormReady);
                    }, 10000);
                    
                } catch (error) {
                    console.error('Error parsing patient data:', error);
                }
            });
        }

        // Run fillForm
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fillForm);
        } else {
            fillForm();
        }
    }

})();
