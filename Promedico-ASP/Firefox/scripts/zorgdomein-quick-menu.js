(function() {
    'use strict';

    // Handle ZorgDomein pages
    if (window.location.hostname === 'www.zorgdomein.nl') {
        handleZorgDomeinPage();
        return;
    }

    // Get the content iframe
    function getContentIframe() {
        return document.getElementById('panelBackCompatibility-frame');
    }

    // Check if we're on the contact processing page
    function isOnContactPage() {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return false;

        try {
            const url = iframe.contentDocument.location.href;
            return url.includes('medischdossier.journaal');
        } catch(e) {
            return false;
        }
    }

    // Handle ZorgDomein pages - redirect after login
    function handleZorgDomeinPage() {
        chrome.storage.local.get(['zorgdomein_target_url_global'], function(result) {
            // Kijk eerst in chrome storage, anders in session/local storage
            const targetUrl = result.zorgdomein_target_url_global ||
                              sessionStorage.getItem('zd_target_url') ||
                              localStorage.getItem('zd_target_url');
            
            if (targetUrl) {
                const indicator = document.createElement('div');
                indicator.textContent = `ZD Menu: Redirecting in 2 seconds...`;
                indicator.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 999999;
                    background: orange;
                    color: black;
                    padding: 15px;
                    border-radius: 5px;
                    font-weight: bold;
                    font-size: 14px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                `;
                document.body.appendChild(indicator);

                setTimeout(() => {
                    chrome.storage.local.remove('zorgdomein_target_url_global');
                    try {
                        sessionStorage.removeItem('zd_target_url');
                        localStorage.removeItem('zd_target_url');
                    } catch(e) {}

                    window.location.href = targetUrl;
                }, 500);
            }
        });
    }

    // Navigate to Verwijzen and start the ZorgDomein flow
    function navigateToZorgDomein(specialisme, targetUrl, callback) {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;
        const actionButtons = doc.getElementById('actionbuttons');
        if (!actionButtons) return;

        const allClickable = actionButtons.querySelectorAll('td.actie');
        let verwijzenButton = null;
        for (let td of allClickable) {
            if (td.textContent.trim().includes('Verwijzen')) {
                verwijzenButton = td;
                break;
            }
        }

        if (!verwijzenButton) {
            return;
        }

        if (targetUrl) {
            chrome.storage.local.set({'zorgdomein_target_url_global': targetUrl });

            try {
                localStorage.setItem('zd_target_url', targetUrl);
            } catch(e) {}
        }

        verwijzenButton.click();

        setTimeout(() => {
            fillSpecialismeAndClickZorgDomein(specialisme, callback);
        }, 500);
    }

    // Fill the specialisme field and click Via ZorgDomein
    function fillSpecialismeAndClickZorgDomein(specialisme, callback) {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;

        const specMnemField = doc.getElementById('specMnem');
        if (specMnemField) {
            specMnemField.value = specialisme;
            specMnemField.dispatchEvent(new Event('input', { bubbles: true }));
            specMnemField.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const script = doc.createElement('script');
        script.textContent = `
            (function() {
                if (typeof disableScreen !== 'function') {
                    window.disableScreen = function() { return true; };
                }

                var button = document.getElementById('action_via zorgDomein');
                if (button) {
                    button.click();
                    setTimeout(function() {
                        button.click();
                    }, 200);
                }
            })();
        `;
        doc.head.appendChild(script);
        script.remove();

        setTimeout(() => {
            clickScriptZorgDomein(callback);
        }, 1200);
    }

    // Click the Script_ZorgDomein button
    function clickScriptZorgDomein(callback) {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;
        const zorgDomeinButton = doc.getElementById('Script_ZorgDomein');

        if (zorgDomeinButton) {
            zorgDomeinButton.click();
            if (callback) callback();
        }
    }

    // Rest van je code blijft hetzelfde...