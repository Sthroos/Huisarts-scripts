(function() {
    'use strict';
    
    // Cross-browser compatibility: gebruik browser API (met fallback naar chrome)
    const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

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
        // Lees hcrCode uit het URL-hash (bijv. #pmh-hcr=PAZDIE)
        // Dit vermijdt storage-timing problemen bij cross-domain navigatie.
        const hash = window.location.hash || '';
        const hcrMatch = hash.match(/[#&]pmh-hcr=([^&]+)/);
        const hcrCodeFromHash = hcrMatch ? decodeURIComponent(hcrMatch[1]) : null;

        if (hcrCodeFromHash) {
            console.log('[ZD Menu] HCR-code uit URL-hash:', hcrCodeFromHash);
            // Verwijder het pmh-hcr fragment uit de URL (schoon houden)
            const cleanUrl = window.location.href.replace(/[#&]pmh-hcr=[^&]+/, '').replace(/#$/, '');
            history.replaceState(null, '', cleanUrl || window.location.pathname);

                // Wacht via polling + MutationObserver tot de HCR-knop verschijnt.
                // Angular laadt de knoppen asynchroon, dus we pollen elke 200ms
                // en zetten ook een MutationObserver in als backup.
                const hcrCode = hcrCodeFromHash;
                (function waitAndClickHcrButton() {
                    let clicked = false;
                    let attempts = 0;
                    const maxAttempts = 60; // 12 seconden max

                    function tryClick() {
                        if (clicked) return;
                        // Zoek op id én op data-attribute als fallback
                        let btn = document.getElementById(hcrCode);
                        if (!btn) {
                            // Angular gebruikt soms een <a> met id in een shadow of nested element
                            btn = document.querySelector('[id="' + hcrCode + '"]');
                        }
                        if (btn) {
                            clicked = true;
                            observer.disconnect();
                            console.log('[ZD Menu] HCR knop gevonden, klikken:', hcrCode);
                            btn.click();
                            return true;
                        }
                        return false;
                    }

                    // Probeer meteen
                    if (tryClick()) return;

                    // MutationObserver op documentElement (Angular bootstrapt mogelijk nog)
                    const observer = new MutationObserver(function() {
                        tryClick();
                    });
                    const observeTarget = document.body || document.documentElement;
                    observer.observe(observeTarget, { childList: true, subtree: true });

                    // Polling als backup (Angular kan de DOM vervangen na de observer-setup)
                    const poll = setInterval(function() {
                        attempts++;
                        if (tryClick() || attempts >= maxAttempts) {
                            clearInterval(poll);
                            observer.disconnect();
                            if (!clicked) {
                                console.log('[ZD Menu] HCR knop niet gevonden na timeout:', hcrCode);
                            }
                        }
                    }, 200);
                })();

        } else {
            // Geen hcrCode in hash — controleer storage voor directe URL-navigatie (choose-product)
            browserAPI.storage.local.get(['zorgdomein_target_url_global'], function(result) {
                const targetUrl = result.zorgdomein_target_url_global ||
                                  sessionStorage.getItem('zd_target_url') ||
                                  localStorage.getItem('zd_target_url');
                if (targetUrl) {
                    browserAPI.storage.local.remove('zorgdomein_target_url_global');
                    try {
                        sessionStorage.removeItem('zd_target_url');
                        localStorage.removeItem('zd_target_url');
                    } catch(e) {}
                    window.location.href = targetUrl;
                }
            });
        }
    }

    // Navigeer via HCR-code: ga naar de categoriepagina, klik automatisch op de HCR-knop.
    // Werkt regio-onafhankelijk — de id's op de knoppen zijn landelijk hetzelfde.
    function navigateViaHcrCode(specialisme, categoryUrl, hcrCode, callback) {
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
        if (!verwijzenButton) return;

        // Encode hcrCode in het URL-hash zodat geen storage nodig is.
        // Na de redirect leest handleZorgDomeinPage de code uit window.location.hash.
        const urlWithHcr = categoryUrl + '#pmh-hcr=' + encodeURIComponent(hcrCode);
        browserAPI.storage.local.set({'zorgdomein_target_url_global': urlWithHcr}, function() {
            try { localStorage.setItem('zd_target_url', urlWithHcr); } catch(e) {}
            verwijzenButton.click();
            setTimeout(() => {
                fillSpecialismeAndClickZorgDomein(specialisme, callback);
            }, 800);
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
            // BELANGRIJK: Wacht tot storage is opgeslagen voordat we verder gaan
            browserAPI.storage.local.set({'zorgdomein_target_url_global': targetUrl }, function() {
                try {
                    localStorage.setItem('zd_target_url', targetUrl);
                } catch(e) {}

                verwijzenButton.click();

                setTimeout(() => {
                    fillSpecialismeAndClickZorgDomein(specialisme, callback);
                }, 800);
            });
        } else {
            verwijzenButton.click();

            setTimeout(() => {
                fillSpecialismeAndClickZorgDomein(specialisme, callback);
            }, 800);
        }
    }

    // Wacht via MutationObserver op een element in een document.
    // Roept callback(element) aan zodra het verschijnt, of onError() na timeout.
    function waitForElementInDoc(doc, selector, callback, onError, timeout = 10000) {
        // Al aanwezig?
        const existing = doc.getElementById(selector.replace('#', ''));
        if (existing) { callback(existing); return; }

        let timer;
        const observer = new MutationObserver(() => {
            const el = doc.querySelector(selector);
            if (!el) return;
            observer.disconnect();
            clearTimeout(timer);
            callback(el);
        });
        observer.observe(doc.body || doc.documentElement, { childList: true, subtree: true });
        timer = setTimeout(() => {
            observer.disconnect();
            if (onError) onError();
        }, timeout);
    }

    // Fill the specialisme field and click Via ZorgDomein.
    // Gebruikt MutationObserver zodat de flow werkt ongeacht serversnelheid.
    function fillSpecialismeAndClickZorgDomein(specialisme, callback) {
        // Na de "Verwijzen" klik laadt het iframe een nieuwe pagina.
        // We luisteren naar het iframe load-event zodat we zeker het nieuwe document observeren.
        const iframe = getContentIframe();
        if (!iframe) {
            console.log('[ZD Menu] ERROR: iframe niet gevonden');
            return;
        }

        function proceedWithDoc(doc) {
            // Override disableScreen zodat de flow niet geblokkeerd wordt
            const overrideScript = doc.createElement('script');
            overrideScript.textContent = `
                var disableScreen = function() { return true; };
                var enableScreen  = function() { return true; };
                window.disableScreen = disableScreen;
                window.enableScreen  = enableScreen;
            `;
            doc.head.appendChild(overrideScript);
            overrideScript.remove();

            // Wacht op specMnem via MutationObserver
            waitForElementInDoc(doc, '#specMnem', (specMnemField) => {
                console.log('[ZD Menu] specMnem gevonden, specialisme invullen:', specialisme);

                // Alleen value + input event - geen change/blur (triggert brief-sjabloonkeuze)
                specMnemField.value = specialisme;
                specMnemField.dispatchEvent(new Event('input', { bubbles: true }));

                // Wacht op "Via ZorgDomein" knop via MutationObserver
                waitForElementInDoc(doc, '#action_via\ zorgDomein', (button) => {
                    console.log('[ZD Menu] Via ZorgDomein knop gevonden, klikken');

                    const script2 = doc.createElement('script');
                    script2.textContent = `
                        var disableScreen = function() { return true; };
                        var enableScreen  = function() { return true; };
                        window.disableScreen = disableScreen;
                        window.enableScreen  = enableScreen;
                        (function() {
                            var button = document.getElementById('action_via zorgDomein');
                            if (!button) { console.log('[ZD] Via ZorgDomein niet gevonden'); return; }
                            if (typeof koppelNaarZorgDomeinNaValidatieSpecialisme === 'function') {
                                koppelNaarZorgDomeinNaValidatieSpecialisme();
                            } else {
                                button.click();
                            }
                        })();
                    `;
                    doc.head.appendChild(script2);
                    script2.remove();

                    // Wacht op Script_ZorgDomein in het (opnieuw geladen) iframe
                    clickScriptZorgDomein(callback);

                }, () => {
                    console.log('[ZD Menu] ERROR: Via ZorgDomein knop niet gevonden binnen timeout');
                });

            }, () => {
                console.log('[ZD Menu] ERROR: specMnem niet gevonden binnen timeout');
            });
        }

        // Als het iframe al geladen is met de juiste pagina, direct doorgaan.
        // Anders wachten op het load-event (na de Verwijzen-klik).
        try {
            const currentDoc = iframe.contentDocument;
            if (currentDoc && currentDoc.getElementById('specMnem')) {
                proceedWithDoc(currentDoc);
            } else {
                iframe.addEventListener('load', function onLoad() {
                    iframe.removeEventListener('load', onLoad);
                    proceedWithDoc(iframe.contentDocument);
                });
            }
        } catch(e) {
            // Cross-origin fout (mag niet voorkomen), fallback naar load-event
            iframe.addEventListener('load', function onLoad() {
                iframe.removeEventListener('load', onLoad);
                proceedWithDoc(iframe.contentDocument);
            });
        }
    }

    // Wacht via MutationObserver op Script_ZorgDomein knop in het iframe.
    // Het iframe laadt opnieuw na de "Via ZorgDomein" klik, dus opnieuw load-event gebruiken.
    function clickScriptZorgDomein(callback) {
        const iframe = getContentIframe();
        if (!iframe) {
            console.log('[ZD] ERROR: iframe niet gevonden voor Script_ZorgDomein stap');
            return;
        }

        function waitForButton(doc) {
            const url = doc.location?.href || '';
            console.log('[ZD] Wacht op Script_ZorgDomein in:', url);

            waitForElementInDoc(doc, '#Script_ZorgDomein', (btn) => {
                console.log('[ZD] Script_ZorgDomein gevonden, klikken');
                btn.click();
                if (callback) callback();
            }, () => {
                console.log('[ZD] ERROR: Script_ZorgDomein niet gevonden binnen timeout. URL:', url);
                console.log('[ZD] Beschikbare knoppen:',
                    [...doc.querySelectorAll('input[type=submit],button,td.actie')]
                    .map(e => `${e.tagName} id="${e.id}" text="${e.textContent.trim().slice(0,30)}"`));
            });
        }

        try {
            const currentDoc = iframe.contentDocument;
            if (currentDoc && currentDoc.getElementById('Script_ZorgDomein')) {
                waitForButton(currentDoc);
            } else {
                iframe.addEventListener('load', function onLoad() {
                    iframe.removeEventListener('load', onLoad);
                    waitForButton(iframe.contentDocument);
                });
            }
        } catch(e) {
            iframe.addEventListener('load', function onLoad() {
                iframe.removeEventListener('load', onLoad);
                waitForButton(iframe.contentDocument);
            });
        }
    }

    // Create the Zorgdomein button
    function createZorgdomeinButton() {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;

        if (doc.getElementById('zorgdomein-button')) return;

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

        if (!verwijzenButton) return;

        const zorgdomeinButton = verwijzenButton.cloneNode(true);
        zorgdomeinButton.id = 'zorgdomein-button';

        const innerText = zorgdomeinButton.querySelector('td[id$="_inner"]');
        if (innerText) {
            innerText.textContent = 'Zorgdomein';
            innerText.id = 'zorgdomein_inner';
        } else {
            const textTd = zorgdomeinButton.querySelector('td[style*="cursor"]');
            if (textTd) {
                textTd.textContent = 'Zorgdomein';
            }
        }

        zorgdomeinButton.onclick = null;
        zorgdomeinButton.removeAttribute('onclick');

        zorgdomeinButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showZorgdomeinMenu();
        });

        const parentRow = verwijzenButton.parentElement;

        if (parentRow.tagName === 'TR') {
            const newRow = doc.createElement('tr');
            newRow.appendChild(zorgdomeinButton);

            if (parentRow.nextSibling) {
                parentRow.parentNode.insertBefore(newRow, parentRow.nextSibling);
            } else {
                parentRow.parentNode.appendChild(newRow);
            }
        } else {
            if (verwijzenButton.nextSibling) {
                verwijzenButton.parentNode.insertBefore(zorgdomeinButton, verwijzenButton.nextSibling);
            } else {
                verwijzenButton.parentNode.appendChild(zorgdomeinButton);
            }
        }
    }

    // Show the Zorgdomein submenu
    // Menu-data is al geladen door content.js vóór dit script, als globale variabele.
    function showZorgdomeinMenu() {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;
        const zorgdomeinButton = doc.getElementById('zorgdomein-button');
        if (!zorgdomeinButton) return;

        const buttonRect = zorgdomeinButton.getBoundingClientRect();

        // Lees menu-items uit de globale variabele die door het menu-bestand is gezet
        const items = (typeof ZORGDOMEIN_MENU_ITEMS_EEMLAND !== 'undefined' && ZORGDOMEIN_MENU_ITEMS_EEMLAND.length)
            ? ZORGDOMEIN_MENU_ITEMS_EEMLAND
            : (typeof ZORGDOMEIN_MENU_ITEMS_ARNHEM !== 'undefined' && ZORGDOMEIN_MENU_ITEMS_ARNHEM.length)
                ? ZORGDOMEIN_MENU_ITEMS_ARNHEM
                : (typeof ZORGDOMEIN_MENU_ITEMS_UTRECHT !== 'undefined' && ZORGDOMEIN_MENU_ITEMS_UTRECHT.length)
                    ? ZORGDOMEIN_MENU_ITEMS_UTRECHT
                    : (typeof ZORGDOMEIN_MENU_ITEMS_GENERIEK !== 'undefined' && ZORGDOMEIN_MENU_ITEMS_GENERIEK.length)
                        ? ZORGDOMEIN_MENU_ITEMS_GENERIEK
                        : [{ text: '⚠ Menu niet geladen — heropen de pagina', code: 'ERR', url: 'https://www.zorgdomein.nl' }];


        const menu = doc.createElement('table');
        menu.id = 'zorgdomein-menu';
        menu.cellPadding = '0';
        menu.cellSpacing = '0';

        const tbody = doc.createElement('tbody');

        items.forEach(item => {
            const tr = doc.createElement('tr');
            const menuItem = createMenuItem(doc, item.text, item.submenu, item.code, item.url, item.hcrCode, item.categoryUrl);
            tr.appendChild(menuItem);
            tbody.appendChild(tr);
        });

        menu.appendChild(tbody);

        menu.style.cssText = `
            position: fixed;
            left: -9999px;
            width: 200px;
            visibility: hidden;
        `;
        doc.body.appendChild(menu);

        const actualMenuHeight = menu.offsetHeight;

        const viewportHeight = doc.defaultView.innerHeight;
        const spaceBelow = viewportHeight - buttonRect.top - 20;
        const spaceAbove = buttonRect.bottom - 20;

        let topPosition = buttonRect.top;
        let maxHeight = spaceBelow;

        if (actualMenuHeight > spaceBelow && spaceAbove > spaceBelow) {
            topPosition = Math.max(10, buttonRect.bottom - Math.min(actualMenuHeight, spaceAbove));
            maxHeight = spaceAbove;
        }

        menu.style.cssText = `
            position: fixed;
            left: ${buttonRect.right + 5}px;
            top: ${topPosition}px;
            width: 200px;
            max-height: ${maxHeight}px;
            overflow-y: auto;
            background: white;
            border: 1px solid #ccc;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            visibility: visible;
        `;

        doc.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !zorgdomeinButton.contains(e.target)) {
                menu.remove();
                doc.removeEventListener('click', closeMenu);
            }
        });
    }

    // Create a menu item - UPDATED to support sub-submenus
    function createMenuItem(doc, text, submenu, code, url, hcrCode, categoryUrl) {
        const item = doc.createElement('td');
        item.className = 'actie';
        item.style.cssText = `height: 30px; width: 200px; cursor: pointer;`;

        const innerTable = doc.createElement('table');
        innerTable.cellPadding = '0';
        innerTable.cellSpacing = '0';
        innerTable.border = '0';
        innerTable.style.width = '200px';

        const innerTbody = doc.createElement('tbody');
        const innerTr = doc.createElement('tr');

        const spacerTd1 = doc.createElement('td');
        spacerTd1.style.width = '15px';
        spacerTd1.innerHTML = '&nbsp;';

        const iconTd = doc.createElement('td');
        iconTd.align = 'left';
        iconTd.style.width = '24px';
        const icon = doc.createElement('img');
        icon.border = '0';
        icon.src = '/promedico/images/action.gif';
        icon.width = '24';
        icon.height = '14';
        iconTd.appendChild(icon);

        const spacerTd2 = doc.createElement('td');
        spacerTd2.style.width = '5px';
        spacerTd2.innerHTML = '&nbsp;';

        const textTd = doc.createElement('td');
        textTd.align = 'left';
        textTd.style.width = '140px';
        textTd.style.cursor = 'pointer';
        textTd.textContent = text;

        const spacerTd3 = doc.createElement('td');
        spacerTd3.style.width = '15px';
        spacerTd3.innerHTML = '&nbsp;';

        innerTr.appendChild(spacerTd1);
        innerTr.appendChild(iconTd);
        innerTr.appendChild(spacerTd2);
        innerTr.appendChild(textTd);
        innerTr.appendChild(spacerTd3);
        innerTbody.appendChild(innerTr);
        innerTable.appendChild(innerTbody);
        item.appendChild(innerTable);

        item.addEventListener('mouseenter', function() {
            item.className = 'actieOver';
            if (submenu) {
                showSubmenu(doc, item, submenu);
            }
        });

        item.addEventListener('mouseleave', function() {
            item.className = 'actie';
        });

        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const mainMenu = doc.getElementById('zorgdomein-menu');
            if (mainMenu) mainMenu.remove();

            // Remove any open submenus
            const existingSubmenus = doc.querySelectorAll('[id^="zorgdomein-submenu"]');
            existingSubmenus.forEach(sm => sm.remove());

            if (hcrCode) {
                navigateViaHcrCode(code, categoryUrl, hcrCode, () => {});
            } else {
                navigateToZorgDomein(code, url, () => {});
            }
        });

        return item;
    }

    // Show submenu - UPDATED to support sub-submenus and better margins
    function showSubmenu(doc, parentItem, items, level = 1) {
        const submenuId = `zorgdomein-submenu-${level}`;
        const existingSubmenu = doc.getElementById(submenuId);
        if (existingSubmenu) existingSubmenu.remove();

        // Remove deeper level submenus when hovering over this level
        for (let i = level + 1; i <= 5; i++) {
            const deeperSubmenu = doc.getElementById(`zorgdomein-submenu-${i}`);
            if (deeperSubmenu) deeperSubmenu.remove();
        }

        const submenu = doc.createElement('table');
        submenu.id = submenuId;
        submenu.cellPadding = '0';
        submenu.cellSpacing = '0';

        const parentRect = parentItem.getBoundingClientRect();
        const viewportHeight = doc.defaultView.innerHeight;
        const viewportWidth = doc.defaultView.innerWidth;

        // Improved multi-column logic
        const BOTTOM_MARGIN = 40;
        const TOP_MARGIN = 20;
        const itemHeight = 31;

        const maxAvailableHeight = viewportHeight - TOP_MARGIN - BOTTOM_MARGIN;
        const maxItemsPerColumn = Math.floor(maxAvailableHeight / itemHeight);

        let numColumns = 1;
        let itemsPerColumn = items.length;

        if (items.length > maxItemsPerColumn) {
            numColumns = Math.ceil(items.length / maxItemsPerColumn);
            itemsPerColumn = Math.ceil(items.length / numColumns);
        } else if (items.length > 12) {
            numColumns = 2;
            itemsPerColumn = Math.ceil(items.length / 2);
        }

        const submenuWidth = numColumns * 200;
        const submenuHeight = Math.min(itemsPerColumn * itemHeight, maxAvailableHeight);

        const spaceBelow = viewportHeight - parentRect.top - BOTTOM_MARGIN;
        const spaceAbove = parentRect.bottom - TOP_MARGIN;
        const spaceRight = viewportWidth - parentRect.right - 10;

        let topPosition;
        let leftPosition = parentRect.right + 5;

        if (spaceBelow >= submenuHeight) {
            topPosition = parentRect.top;
        } else if (spaceAbove >= submenuHeight) {
            topPosition = Math.max(TOP_MARGIN, parentRect.bottom - submenuHeight);
        } else {
            const totalAvailable = viewportHeight - TOP_MARGIN - BOTTOM_MARGIN;
            topPosition = TOP_MARGIN + Math.max(0, (totalAvailable - submenuHeight) / 2);
        }

        if (spaceRight < submenuWidth) {
            leftPosition = parentRect.left - submenuWidth - 5;
            if (leftPosition < 10) {
                leftPosition = Math.min(parentRect.right + 5, viewportWidth - submenuWidth - 10);
            }
        }

        submenu.style.cssText = `
            position: fixed;
            left: ${leftPosition}px;
            top: ${topPosition}px;
            width: ${submenuWidth}px;
            max-height: ${maxAvailableHeight}px;
            overflow-y: auto;
            background: white;
            border: 1px solid #ccc;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
            z-index: ${10000 + level};
        `;

        const tbody = doc.createElement('tbody');

        if (numColumns > 1) {
            const columns = [];
            for (let col = 0; col < numColumns; col++) {
                const startIdx = col * itemsPerColumn;
                const endIdx = Math.min(startIdx + itemsPerColumn, items.length);
                columns.push(items.slice(startIdx, endIdx));
            }

            const maxRows = Math.max(...columns.map(col => col.length));

            for (let row = 0; row < maxRows; row++) {
                const tr = doc.createElement('tr');

                for (let col = 0; col < numColumns; col++) {
                    if (columns[col][row]) {
                        const td = createSubmenuItem(doc, columns[col][row], submenu, level);
                        tr.appendChild(td);
                    } else {
                        const emptyTd = doc.createElement('td');
                        emptyTd.style.width = '200px';
                        tr.appendChild(emptyTd);
                    }
                }

                tbody.appendChild(tr);
            }
        } else {
            items.forEach(item => {
                const tr = doc.createElement('tr');
                const subItem = createSubmenuItem(doc, item, submenu, level);
                tr.appendChild(subItem);
                tbody.appendChild(tr);
            });
        }

        submenu.appendChild(tbody);
        doc.body.appendChild(submenu);

        parentItem.addEventListener('mouseleave', function removeSubmenu() {
            setTimeout(() => {
                if (!submenu.matches(':hover')) {
                    submenu.remove();
                }
            }, 200);
            parentItem.removeEventListener('mouseleave', removeSubmenu);
        });
    }

    // Helper function to create submenu items
    function createSubmenuItem(doc, item, submenu, level) {
        const subItem = doc.createElement('td');
        subItem.className = 'actie';
        subItem.style.cssText = `height: 30px; width: 200px; cursor: pointer;`;

        const innerTable = doc.createElement('table');
        innerTable.cellPadding = '0';
        innerTable.cellSpacing = '0';
        innerTable.border = '0';
        innerTable.style.width = '200px';

        const innerTbody = doc.createElement('tbody');
        const innerTr = doc.createElement('tr');

        const spacerTd1 = doc.createElement('td');
        spacerTd1.style.width = '15px';
        spacerTd1.innerHTML = '&nbsp;';

        const iconTd = doc.createElement('td');
        iconTd.align = 'left';
        iconTd.style.width = '24px';
        const icon = doc.createElement('img');
        icon.border = '0';
        icon.src = '/promedico/images/action.gif';
        icon.width = '24';
        icon.height = '14';
        iconTd.appendChild(icon);

        const spacerTd2 = doc.createElement('td');
        spacerTd2.style.width = '5px';
        spacerTd2.innerHTML = '&nbsp;';

        const textTd = doc.createElement('td');
        textTd.align = 'left';
        textTd.style.width = '140px';
        textTd.style.cursor = 'pointer';
        textTd.textContent = item.text;

        const spacerTd3 = doc.createElement('td');
        spacerTd3.style.width = '15px';
        spacerTd3.innerHTML = '&nbsp;';

        innerTr.appendChild(spacerTd1);
        innerTr.appendChild(iconTd);
        innerTr.appendChild(spacerTd2);
        innerTr.appendChild(textTd);
        innerTr.appendChild(spacerTd3);
        innerTbody.appendChild(innerTr);
        innerTable.appendChild(innerTbody);
        subItem.appendChild(innerTable);

        subItem.addEventListener('mouseenter', function() {
            subItem.className = 'actieOver';
            if (item.submenu) {
                showSubmenu(doc, subItem, item.submenu, level + 1);
            }
        });

        subItem.addEventListener('mouseleave', function() {
            subItem.className = 'actie';
        });

        subItem.addEventListener('click', function(e) {
            e.stopPropagation();
            submenu.remove();
            const mainMenu = doc.getElementById('zorgdomein-menu');
            if (mainMenu) mainMenu.remove();

            const allSubmenus = doc.querySelectorAll('[id^="zorgdomein-submenu"]');
            allSubmenus.forEach(sm => sm.remove());

            if (item.hcrCode) {
                navigateViaHcrCode(item.code, item.categoryUrl, item.hcrCode, () => {});
            } else {
                navigateToZorgDomein(item.code, item.url, () => {});
            }
        });

        return subItem;
    }

    // Initialize
    function init() {
        setInterval(() => {
            if (isOnContactPage()) {
                createZorgdomeinButton();
            }
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();