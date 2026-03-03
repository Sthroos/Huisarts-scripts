(function() {
    'use strict';

    // ============================================================================
    // SHARED UTILITIES
    // ============================================================================

    function getContentIframe() {
        return document.getElementById('panelBackCompatibility-frame');
    }

    function getTargetDocument() {
        const iframe = getContentIframe();
        if (iframe) {
            try {
                return iframe.contentDocument || iframe.contentWindow.document;
            } catch (e) {
                console.error('Cannot access iframe:', e);
            }
        }
        return null;
    }

    // Native click op element via ID — werkt voor alle Promedico menu-items
    function clickById(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.click();
        } else {
            console.warn('[Promedico Helper] Element niet gevonden:', elementId);
        }
    }

    // ============================================================================
    // CUSTOM MENU ITEMS (MEDOVD + Nieuwe patiënt in Patiënt-menu)
    // ============================================================================

    function clickSidebarButton(buttonId) {
        const patientZoeken = document.getElementById('MainMenu-Patiënt-Zoeken');
        if (patientZoeken) {
            patientZoeken.click();
            setTimeout(() => {
                const iframe = document.getElementById('panelBackCompatibility-frame');
                if (iframe && iframe.contentDocument) {
                    const button = iframe.contentDocument.getElementById(buttonId);
                    if (button) button.click();
                }
            }, 1000);
        }
    }

    function addCustomMenuItem(afterElementId, newItemId, newItemText, sidebarButtonId) {
        const afterElement = document.getElementById(afterElementId);
        if (!afterElement) return false;
        if (document.getElementById(newItemId)) return true;

        // Maak een verse <a> aan zonder cloneNode (cloneNode kopieert geen jQuery handlers,
        // maar voegt ook geen ongewenste handlers mee die de jQuery-handler verstoren)
        const newA = document.createElement('a');
        newA.href = '#';
        newA.className = 'menu-item';
        newA.id = newItemId;
        newA.textContent = newItemText;

        newA.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            clickSidebarButton(sidebarButtonId);
        }, true);

        // Voeg in na het afterElement (broer-node, zelfde parent)
        afterElement.parentNode.insertBefore(newA, afterElement.nextSibling);
        return true;
    }

    function tryAddMenuItems() {
        const patientZoeken = document.getElementById('MainMenu-Patiënt-Zoeken');
        if (!patientZoeken) return false;
        if (document.getElementById('MainMenu-Patiënt-MedovdImport')) return true;

        const added1 = addCustomMenuItem(
            'MainMenu-Patiënt-Zoeken',
            'MainMenu-Patiënt-MedovdImport',
            'MEDOVD import',
            'action_medOvdImporteren'
        );

        const afterElement = added1 ? 'MainMenu-Patiënt-MedovdImport' : 'MainMenu-Patiënt-Zoeken';
        addCustomMenuItem(
            afterElement,
            'MainMenu-Patiënt-NieuwePatiënt',
            'Nieuwe patiënt',
            'action_Nieuwe patient inschrijven'
        );

        return added1;
    }

    function initCustomMenus() {
        if (!window.location.href.includes('index.html')) return;

        setTimeout(() => tryAddMenuItems(), 2000);

        const observer = new MutationObserver(() => {
            const patientZoeken = document.getElementById('MainMenu-Patiënt-Zoeken');
            const medovdImport = document.getElementById('MainMenu-Patiënt-MedovdImport');
            if (patientZoeken && !medovdImport) {
                tryAddMenuItems();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ============================================================================
    // FAVORIETEN MENU
    // ============================================================================

    // Alle beschikbare menu-items — dynamisch opgebouwd uit de Promedico DOM
    // zodat altijd alle items beschikbaar zijn, ook na Promedico updates.
    // disabledSourceId = volgt disabled-status van het originele element
    let ALLE_MENU_ITEMS = [];

    function bouwAlleMenuItems() {
        const menu = document.getElementById('asp-menu');
        if (!menu) return;

        const items = [];
        // Selecteer alle <a> elementen met een id in het hoofdmenu,
        // maar sla het favorieten-menu zelf over
        menu.querySelectorAll('a[id]').forEach(a => {
            if (a.id.startsWith('MainMenu-Favorieten')) return;
            if (!a.id.startsWith('MainMenu-')) return;
            // Label: tekst zonder underline-tags
            const label = a.textContent.trim();
            if (!label) return;
            // disabledSourceId als het element zelf disabled kan zijn
            const isDisableable = a.classList.contains('disabled') || a.hasAttribute('disabled');
            const parent = a.parentElement;
            const parentDisableable = parent && (parent.classList.contains('disabled') || parent.hasAttribute('disabled'));
            items.push({
                label,
                targetId: a.id,
                disabledSourceId: (isDisableable || parentDisableable) ? a.id : null
            });
        });

        ALLE_MENU_ITEMS = items;
    }

    // Standaard favorieten voor nieuwe gebruikers
    const DEFAULT_FAVORIETEN = [
        'MainMenu-MedischDossier-Zoeken',
        'MainMenu-MedischDossier-Overzicht',
        'MainMenu-MedischDossier-Uitslagen',
        'MainMenu-MedischDossier-Medicatie',
        'MainMenu-MedischDossier-Correspondentie',
        'MainMenu-Patiënt-Patiëntgegevens',
        'MainMenu-Assistenten-Intake',
        'MainMenu-Agenda-Kalender',
        'MainMenu-Agenda-Berichten',
        'MainMenu-Agenda-Econsult',
        'MainMenu-Agenda-Recept',
        'MainMenu-Patiënt-MedovdImport',
        'MainMenu-Patiënt-NieuwePatiënt',
    ];

    const STORAGE_KEY = 'pm_favorieten';

    function loadFavorieten() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : DEFAULT_FAVORIETEN;
        } catch(e) {
            return DEFAULT_FAVORIETEN;
        }
    }

    function saveFavorieten(lijst) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(lijst));
        } catch(e) {}
    }

    function addFavorietenMenu() {
        if (!window.location.href.includes('index.html')) return;
        if (document.getElementById('MainMenu-Favorieten')) return;

        const mainMenu = document.getElementById('asp-menu');
        if (!mainMenu) return;

        // Bouw de lijst van alle beschikbare menu-items op uit de DOM
        bouwAlleMenuItems();



        // CSS voor ster-icoontjes in het menu injecteren
        if (!document.getElementById('pm-favorieten-style')) {
            const style = document.createElement('style');
            style.id = 'pm-favorieten-style';
            style.textContent = `
                .pm-fav-star {
                    display: inline-block;
                    color: #ccc;
                    font-size: 12px;
                    cursor: pointer;
                    padding: 0 6px 0 0;
                    vertical-align: middle;
                    opacity: 0;
                    transition: opacity 0.15s;
                }
                .pm-fav-star.actief {
                    color: #f5a623;
                    opacity: 1;
                }
                .pm-fav-star:hover {
                    color: #f5a623;
                    opacity: 1;
                }
                li:hover > .pm-fav-star,
                li.dropdown-submenu:hover > .pm-fav-star {
                    opacity: 1;
                }
                /* Favorieten bewerken modal */
                #pm-fav-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 99999;
                    background: rgba(0,0,0,0.3);
                }
                #pm-fav-modal {
                    position: fixed;
                    top: 60px; left: 10px;
                    width: 260px;
                    background: #fff;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                    z-index: 100000;
                    font-family: Arial, sans-serif;
                    font-size: 13px;
                }
                #pm-fav-modal-header {
                    background: #336699;
                    color: #fff;
                    padding: 8px 12px;
                    border-radius: 4px 4px 0 0;
                    font-weight: bold;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                #pm-fav-modal-header button {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }
                #pm-fav-modal-list {
                    list-style: none;
                    margin: 0;
                    padding: 8px;
                    max-height: 400px;
                    overflow-y: auto;
                }
                #pm-fav-modal-list li {
                    display: flex;
                    align-items: center;
                    padding: 5px 6px;
                    margin-bottom: 3px;
                    background: #f5f5f5;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    cursor: grab;
                    user-select: none;
                }
                #pm-fav-modal-list li.pm-drag-over {
                    border-color: #336699;
                    background: #e8f0f8;
                }
                #pm-fav-modal-list li.pm-dragging {
                    opacity: 0.4;
                }
                .pm-drag-handle {
                    color: #999;
                    margin-right: 8px;
                    font-size: 14px;
                    cursor: grab;
                }
                .pm-item-label {
                    flex: 1;
                }
                .pm-item-remove {
                    color: #cc0000;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 0 2px;
                    line-height: 1;
                }
                .pm-item-remove:hover { color: #ff0000; }
                #pm-fav-modal-footer {
                    padding: 8px 12px;
                    border-top: 1px solid #eee;
                    display: flex;
                    gap: 6px;
                }
                #pm-fav-modal-footer button {
                    flex: 1;
                    padding: 5px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                }
                #pm-fav-modal-save {
                    background: #336699;
                    color: #fff;
                    border-color: #336699 !important;
                }
                #pm-fav-modal-save:hover { background: #2a5580; }
                #pm-fav-modal-cancel { background: #f5f5f5; }
                #pm-fav-modal-cancel:hover { background: #e5e5e5; }
                #pm-fav-modal-add-section {
                    padding: 0 8px 8px;
                }
                #pm-fav-modal-add-section select {
                    width: 100%;
                    padding: 4px;
                    font-size: 12px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    margin-bottom: 4px;
                }
                #pm-fav-modal-add-btn {
                    width: 100%;
                    padding: 4px;
                    font-size: 12px;
                    background: #f0f0f0;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    cursor: pointer;
                }
                #pm-fav-modal-add-btn:hover { background: #e0e0e0; }
            `;
            document.head.appendChild(style);
        }

        // Voeg sterretjes toe aan alle menu-items in het hoofdmenu
        function voegSterretjesToe() {
            ALLE_MENU_ITEMS.forEach(item => {
                const el = document.getElementById(item.targetId);
                if (!el || el.previousElementSibling?.classList.contains('pm-fav-star')) return;

                const favorieten = loadFavorieten();
                const isActief = favorieten.includes(item.targetId);

                const star = document.createElement('span');
                star.className = 'pm-fav-star' + (isActief ? ' actief' : '');
                star.textContent = '★';
                star.title = isActief ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten';

                star.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const lijst = loadFavorieten();
                    const idx = lijst.indexOf(item.targetId);
                    if (idx >= 0) {
                        lijst.splice(idx, 1);
                        star.classList.remove('actief');
                        star.title = 'Voeg toe aan favorieten';
                    } else {
                        lijst.push(item.targetId);
                        star.classList.add('actief');
                        star.title = 'Verwijder uit favorieten';
                    }
                    saveFavorieten(lijst);
                    herlaadFavorietenMenu();
                }, true);

                // Ster vóór het menu-item invoegen (broer, niet kind)
                // zodat klikken op het item zelf niet geblokkeerd wordt
                el.parentNode.insertBefore(star, el);
            });
        }

        // Bouw het favorieten submenu op vanuit opgeslagen lijst
        function bouwFavorietenSubmenu() {
            if (ALLE_MENU_ITEMS.length === 0) bouwAlleMenuItems();
            const favorieten = loadFavorieten();
            const submenuUl = document.createElement('ul');
            submenuUl.className = 'dropdown-menu';
            submenuUl.style.display = 'none';

            const disabledSyncItems = [];

            favorieten.forEach(targetId => {
                // Zoek label op uit ALLE_MENU_ITEMS of rechtstreeks uit de DOM
                let itemDef = ALLE_MENU_ITEMS.find(i => i.targetId === targetId);
                if (!itemDef) {
                    // Fallback: haal label direct uit de DOM
                    const el = document.getElementById(targetId);
                    if (!el) return;
                    const label = el.textContent.replace('★', '').trim();
                    if (!label) return;
                    const isDisableable = el.classList.contains('disabled') ||
                                         el.hasAttribute('disabled') ||
                                         (el.parentElement && el.parentElement.classList.contains('disabled'));
                    itemDef = { label, targetId, disabledSourceId: isDisableable ? targetId : null };
                }

                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.className = 'menu-item';
                a.textContent = itemDef.label;

                a.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!li.classList.contains('disabled')) {
                        clickById(itemDef.targetId);
                    }
                }, true);

                li.appendChild(a);
                submenuUl.appendChild(li);

                if (itemDef.disabledSourceId) {
                    disabledSyncItems.push({ sourceId: itemDef.disabledSourceId, liEl: li, aEl: a });
                }
            });

            // Scheidingslijn + bewerken link onderaan
            const dividerLi = document.createElement('li');
            dividerLi.className = 'divider';
            dividerLi.style.cssText = 'height: 1px; margin: 4px 0; overflow: hidden; background-color: #e5e5e5;';
            submenuUl.appendChild(dividerLi);

            const bewerkLi = document.createElement('li');
            const bewerkA = document.createElement('a');
            bewerkA.href = '#';
            bewerkA.className = 'menu-item';
            bewerkA.style.cssText = 'color: #666; font-style: italic;';
            bewerkA.textContent = '✎ Bewerken';
            bewerkA.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openFavorietenModal();
            });
            bewerkLi.appendChild(bewerkA);
            submenuUl.appendChild(bewerkLi);

            return { submenuUl, disabledSyncItems };
        }

        // ---- FAVORIETEN BEWERKEN MODAL ----
        function openFavorietenModal() {
            if (document.getElementById('pm-fav-modal-overlay')) return;

            // Zorg dat ALLE_MENU_ITEMS gevuld is
            if (ALLE_MENU_ITEMS.length === 0) bouwAlleMenuItems();

            // Sluit het menu eerst
            document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

            const overlay = document.createElement('div');
            overlay.id = 'pm-fav-modal-overlay';

            const modal = document.createElement('div');
            modal.id = 'pm-fav-modal';

            // Header
            const header = document.createElement('div');
            header.id = 'pm-fav-modal-header';
            header.innerHTML = '<span>★ Favorieten bewerken</span>';
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', sluitModal);
            header.appendChild(closeBtn);

            // Lijst met huidige favorieten (sleepbaar)
            const lijst = document.createElement('ul');
            lijst.id = 'pm-fav-modal-list';

            let huidigeFavorieten = loadFavorieten().slice();
            let dragSrcIndex = null;

            function herbouwLijst() {
                lijst.innerHTML = '';
                huidigeFavorieten.forEach((targetId, index) => {
                    const itemDef = ALLE_MENU_ITEMS.find(i => i.targetId === targetId);
                    if (!itemDef) return;

                    const li = document.createElement('li');
                    li.draggable = true;
                    li.dataset.index = index;

                    const handle = document.createElement('span');
                    handle.className = 'pm-drag-handle';
                    handle.textContent = '⠿';

                    const label = document.createElement('span');
                    label.className = 'pm-item-label';
                    label.textContent = itemDef.label;

                    const removeBtn = document.createElement('span');
                    removeBtn.className = 'pm-item-remove';
                    removeBtn.textContent = '✕';
                    removeBtn.title = 'Verwijder';
                    removeBtn.addEventListener('click', function() {
                        huidigeFavorieten.splice(index, 1);
                        herbouwLijst();
                        herlaadSterretjes();
                    });

                    li.appendChild(handle);
                    li.appendChild(label);
                    li.appendChild(removeBtn);

                    // Drag events
                    li.addEventListener('dragstart', function() {
                        dragSrcIndex = index;
                        li.classList.add('pm-dragging');
                    });
                    li.addEventListener('dragend', function() {
                        li.classList.remove('pm-dragging');
                        lijst.querySelectorAll('li').forEach(el => el.classList.remove('pm-drag-over'));
                    });
                    li.addEventListener('dragover', function(e) {
                        e.preventDefault();
                        lijst.querySelectorAll('li').forEach(el => el.classList.remove('pm-drag-over'));
                        li.classList.add('pm-drag-over');
                    });
                    li.addEventListener('drop', function(e) {
                        e.preventDefault();
                        if (dragSrcIndex === null || dragSrcIndex === index) return;
                        const verplaatst = huidigeFavorieten.splice(dragSrcIndex, 1)[0];
                        huidigeFavorieten.splice(index, 0, verplaatst);
                        dragSrcIndex = null;
                        herbouwLijst();
                    });

                    lijst.appendChild(li);
                });

                // Update dropdown in select
                updateAddSelect();
            }

            // Sectie om items toe te voegen
            const addSection = document.createElement('div');
            addSection.id = 'pm-fav-modal-add-section';

            const addSelect = document.createElement('select');
            addSelect.id = 'pm-fav-modal-select';

            const addBtn = document.createElement('button');
            addBtn.id = 'pm-fav-modal-add-btn';
            addBtn.textContent = '+ Toevoegen';
            addBtn.addEventListener('click', function() {
                const val = addSelect.value;
                if (val && !huidigeFavorieten.includes(val)) {
                    huidigeFavorieten.push(val);
                    herbouwLijst();
                    herlaadSterretjes();
                }
            });

            addSection.appendChild(addSelect);
            addSection.appendChild(addBtn);

            function updateAddSelect() {
                addSelect.innerHTML = '';
                const beschikbaar = ALLE_MENU_ITEMS.filter(i => !huidigeFavorieten.includes(i.targetId));
                if (beschikbaar.length === 0) {
                    const opt = document.createElement('option');
                    opt.textContent = '(alle items al toegevoegd)';
                    opt.disabled = true;
                    addSelect.appendChild(opt);
                    addBtn.disabled = true;
                } else {
                    addBtn.disabled = false;
                    beschikbaar.forEach(item => {
                        const opt = document.createElement('option');
                        opt.value = item.targetId;
                        opt.textContent = item.label;
                        addSelect.appendChild(opt);
                    });
                }
            }

            // Footer
            const footer = document.createElement('div');
            footer.id = 'pm-fav-modal-footer';

            const saveBtn = document.createElement('button');
            saveBtn.id = 'pm-fav-modal-save';
            saveBtn.textContent = 'Opslaan';
            saveBtn.addEventListener('click', function() {
                saveFavorieten(huidigeFavorieten);
                herlaadFavorietenMenu();
                sluitModal();
            });

            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'pm-fav-modal-cancel';
            cancelBtn.textContent = 'Annuleren';
            cancelBtn.addEventListener('click', sluitModal);

            footer.appendChild(saveBtn);
            footer.appendChild(cancelBtn);

            modal.appendChild(header);
            modal.appendChild(lijst);
            modal.appendChild(addSection);
            modal.appendChild(footer);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            herbouwLijst();

            // Sluit bij klik buiten modal
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) sluitModal();
            });

            function sluitModal() {
                overlay.remove();
            }

            function herlaadSterretjes() {
                // Update sterretjes in hoofdmenu zonder volledige herlaad
                ALLE_MENU_ITEMS.forEach(item => {
                    const el = document.getElementById(item.targetId);
                    if (!el) return;
                    const star = el.previousElementSibling && el.previousElementSibling.classList.contains('pm-fav-star')
                        ? el.previousElementSibling : el.querySelector('.pm-fav-star');
                    if (!star) return;
                    const isActief = huidigeFavorieten.includes(item.targetId);
                    star.classList.toggle('actief', isActief);
                    star.title = isActief ? 'Verwijder uit favorieten' : 'Voeg toe aan favorieten';
                });
            }
        }
        // ---- EINDE MODAL ----

        const { submenuUl, disabledSyncItems } = bouwFavorietenSubmenu();

        // Sync disabled-status van Promedico naar favorieten-items
        function syncDisabledStatus() {
            disabledSyncItems.forEach(({ sourceId, liEl, aEl }) => {
                const source = document.getElementById(sourceId);
                if (!source) return;
                const isDisabled = source.classList.contains('disabled') || source.hasAttribute('disabled');
                liEl.classList.toggle('disabled', isDisabled);
                aEl.classList.toggle('disabled', isDisabled);
                if (isDisabled) aEl.setAttribute('disabled', '');
                else aEl.removeAttribute('disabled');
            });
        }

        const menuBtn = document.querySelector('.main-menu-button');
        if (menuBtn) menuBtn.addEventListener('mouseenter', syncDisabledStatus, true);

        syncDisabledStatus();
        [500, 1500, 3000].forEach(ms => setTimeout(syncDisabledStatus, ms));

        const favLi = document.createElement('li');
        favLi.className = 'dropdown-submenu';
        favLi.id = 'MainMenu-Favorieten';

        const favA = document.createElement('a');
        favA.href = '#';
        favA.className = 'menu-item';
        favA.id = 'MainMenu-Favorieten-Trigger';
        favA.textContent = '★ Favorieten';

        favLi.appendChild(favA);
        favLi.appendChild(submenuUl);
        mainMenu.insertBefore(favLi, mainMenu.firstChild);

        // Sterretjes toevoegen aan het menu (met kleine delay zodat Promedico items geladen zijn)
        setTimeout(voegSterretjesToe, 1000);
        setTimeout(voegSterretjesToe, 3000);
    }

    function herlaadFavorietenMenu() {
        const bestaand = document.getElementById('MainMenu-Favorieten');
        if (bestaand) bestaand.remove();
        addFavorietenMenu();
    }

    function initFavorietenMenu() {
        if (!window.location.href.includes('index.html')) return;

        // Wacht tot zowel asp-menu als de Promedico items gevuld zijn
        function tryInit() {
            const menu = document.getElementById('asp-menu');
            const probeItem = document.getElementById('MainMenu-MedischDossier-Zoeken');
            if (menu && probeItem) {
                addFavorietenMenu();
                return true;
            }
            return false;
        }

        // Poll elke 300ms totdat items beschikbaar zijn
        const pollInterval = setInterval(() => {
            if (tryInit()) clearInterval(pollInterval);
        }, 300);
        setTimeout(() => clearInterval(pollInterval), 15000);

        // Herstel als het menu verdwijnt (bijv. na GWT-herlaad)
        const observer = new MutationObserver(() => {
            if (!document.getElementById('MainMenu-Favorieten')) {
                const probeItem = document.getElementById('MainMenu-MedischDossier-Zoeken');
                if (probeItem) addFavorietenMenu();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ============================================================================
    // HOOFDMENU HOVER (in plaats van klik)
    // ============================================================================

    function initMenuHover() {
        if (!window.location.href.includes('index.html')) return;

        let hoverAttached = false;
        let mouseX = 0, mouseY = 0;
        let closeTimer = null;

        // Houd muispositie bij op document niveau (werkt altijd)
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }, true);

        function isMenuOpen() {
            const menu = document.getElementById('asp-menu');
            if (!menu) return false;
            return menu.style.display !== 'none';
        }

        function isMouseOverMenu() {
            // Controleer of muis boven de menuknop of een menu-element is
            const el = document.elementFromPoint(mouseX, mouseY);
            if (!el) return false;
            const btn = document.querySelector('.main-menu-button');
            const container = document.getElementById('asp-menu-container');
            if (!btn || !container) return false;
            return btn.contains(el) || container.contains(el) || el === btn || el === container;
        }

        function openMenu() {
            if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
            if (!isMenuOpen()) {
                const btn = document.querySelector('.main-menu-button');
                if (btn) btn.click();
            }
        }

        const CLOSE_DELAY_MS = 600; // Verander dit voor langere/kortere sluitvertraging

        function startCloseWatch() {
            if (closeTimer) return;
            let outsideCount = 0;
            const checksNeeded = CLOSE_DELAY_MS / 100;
            closeTimer = setInterval(() => {
                if (!isMenuOpen()) {
                    clearInterval(closeTimer);
                    closeTimer = null;
                    return;
                }
                if (!isMouseOverMenu()) {
                    outsideCount++;
                    if (outsideCount >= checksNeeded) {
                        clearInterval(closeTimer);
                        closeTimer = null;
                        document.body.dispatchEvent(new MouseEvent('click', {
                            bubbles: true, cancelable: true, clientX: 0, clientY: 0
                        }));
                    }
                } else {
                    outsideCount = 0; // Reset als muis terug is
                }
            }, 100);
        }

        function setupHover() {
            const menuButton = document.querySelector('.main-menu-button');
            if (!menuButton) return false;
            if (hoverAttached) return true;

            hoverAttached = true;

            menuButton.addEventListener('mouseenter', openMenu, true);
            menuButton.addEventListener('mouseleave', startCloseWatch, true);

            return true;
        }

        const pollInterval = setInterval(() => {
            if (setupHover()) clearInterval(pollInterval);
        }, 500);

        setTimeout(() => clearInterval(pollInterval), 30000);
    }

    // ============================================================================
    // AUTO MEDOVD IMPORT (EDI + ZIP drag & drop)
    // ============================================================================

    function isOnMedovdImportPage() {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return false;
        const doc = iframe.contentDocument;
        return !!(doc.getElementById('ediFile') && doc.getElementById('correspondentieFile'));
    }

    function fillFormWithFiles(ediFile, zipFile) {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;
        const ediInput = doc.getElementById('ediFile');
        const zipInput = doc.getElementById('correspondentieFile');
        const submitButton = doc.getElementById('Script_Bestand inlezen');

        if (!ediInput || !zipInput || !submitButton) {
            return;
        }

        const ediDataTransfer = new DataTransfer();
        ediDataTransfer.items.add(ediFile);
        ediInput.files = ediDataTransfer.files;

        const zipDataTransfer = new DataTransfer();
        zipDataTransfer.items.add(zipFile);
        zipInput.files = zipDataTransfer.files;

        ediInput.dispatchEvent(new Event('change', { bubbles: true }));
        zipInput.dispatchEvent(new Event('input', { bubbles: true }));
        zipInput.dispatchEvent(new Event('change', { bubbles: true }));

        setTimeout(() => {
            submitButton.click();
        }, 500);
    }

    function processDroppedFiles(files) {
        if (files.length !== 2) return;
        if (!isOnMedovdImportPage()) return;

        let ediFile = null, zipFile = null;
        for (let file of files) {
            const name = file.name.toLowerCase();
            if (name.endsWith('.edi')) ediFile = file;
            else if (name.endsWith('.zip')) zipFile = file;
        }

        if (ediFile && zipFile) fillFormWithFiles(ediFile, zipFile);
    }

    function setupIframeListeners() {
        const iframe = getContentIframe();
        if (!iframe) return;

        let doc;
        try {
            doc = iframe.contentDocument || iframe.contentWindow.document;
        } catch (e) { return; }

        if (!doc || !isOnMedovdImportPage()) return;
        if (doc.body.dataset.medovdListenersAttached === 'true') return;

        let dropOverlay = doc.getElementById('medovd-drop-overlay');
        if (!dropOverlay) {
            dropOverlay = doc.createElement('div');
            dropOverlay.id = 'medovd-drop-overlay';
            dropOverlay.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(76, 175, 80, 0.1); border: 3px dashed #4CAF50;
                display: none; z-index: 9999; pointer-events: none;
                justify-content: center; align-items: center;
                font-size: 24px; font-weight: bold; color: #4CAF50;
            `;
            dropOverlay.innerHTML = '📁 Drop EDI + ZIP files here';
            doc.body.appendChild(dropOverlay);
        }

        let dragCounter = 0;

        doc.addEventListener('dragenter', (e) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault(); e.stopPropagation();
                dragCounter++;
                dropOverlay.style.display = 'flex';
            }
        }, true);

        doc.addEventListener('dragover', (e) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault(); e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
            }
        }, true);

        doc.addEventListener('dragleave', (e) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault(); e.stopPropagation();
                if (--dragCounter === 0) dropOverlay.style.display = 'none';
            }
        }, true);

        doc.addEventListener('drop', (e) => {
            if (e.dataTransfer?.files?.length > 0) {
                e.preventDefault(); e.stopPropagation();
                dropOverlay.style.display = 'none';
                dragCounter = 0;
                processDroppedFiles(Array.from(e.dataTransfer.files));
            }
        }, true);

        doc.addEventListener('dragend', () => {
            dragCounter = 0;
            dropOverlay.style.display = 'none';
        }, true);

        doc.body.dataset.medovdListenersAttached = 'true';
    }

    function initMedovdImport() {
        setInterval(setupIframeListeners, 2000);
        setTimeout(setupIframeListeners, 1000);
    }

    // ============================================================================
    // PATIENT FORM AUTO-FILL
    // ============================================================================

    function parseData(text) {
        const data = {};
        let lines = text.split(/\r?\n/);

        if (lines.length === 1 && text.length > 100) {
            const fieldPattern = /(Van|Berichtinhoud|Voorletters|Voornamen|Tussenvoegsel|Achternaam|Meisjesnaam|Naam volgorde|BSN|Type ID bewijs|ID bewijs nummer|Geboorteplaats|Geboortedatum|Geslacht|Gender|Beroep|Adresgegevens|Telefoonnummer|Zorgverzekeraar|Polisnummer|Polisdatum|Apotheek|LSP toestemming|Vorige huisarts|Adres huisarts|Telefoonnummer huisarts|Toestemming opvragen dossier|Opmerkingen patient):/g;
            let matches = [], match;
            while ((match = fieldPattern.exec(text)) !== null) {
                matches.push({ name: match[1], index: match.index });
            }
            lines = [];
            for (let i = 0; i < matches.length; i++) {
                const start = matches[i].index;
                const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
                lines.push(text.substring(start, end).trim());
            }
        }

        for (let line of lines) {
            if (line.includes(':')) {
                const colonIndex = line.indexOf(':');
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                if (key && value) data[key] = value;
            }
        }

        if (data['Van'] && !data['E-mail']) {
            const emailMatch = data['Van'].match(/[\w.-]+@[\w.-]+\.\w+/);
            if (emailMatch) data['E-mail'] = emailMatch[0];
        }

        return data;
    }

    function fillField(targetDoc, fieldId, value) {
        const field = targetDoc.getElementById(fieldId);
        if (!field) return false;

        if (field.tagName === 'SELECT') {
            let found = false;
            for (let option of field.options) {
                if (option.text.toLowerCase().includes(value.toLowerCase()) ||
                    option.value.toLowerCase() === value.toLowerCase()) {
                    field.value = option.value;
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        } else if (field.type === 'radio') {
            field.checked = true;
        } else {
            field.value = value;
        }

        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        if (field.onchange) { try { field.onchange(); } catch(e) {} }

        return true;
    }

    function fillForm(data) {
        const targetDoc = getTargetDocument();
        if (!targetDoc) return 0;

        let filled = 0;

        if (data['Meisjesnaam']) {
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.achternaam', data['Meisjesnaam'])) filled++;
            if (data['Achternaam']) {
                if (fillField(targetDoc, 'patientPersoonWrapper.persoon.partnerachternaam', data['Achternaam'])) filled++;
            }
        } else if (data['Achternaam']) {
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.achternaam', data['Achternaam'])) filled++;
        }

        if (data['Tussenvoegsel']) {
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.tussenvoegsel', data['Tussenvoegsel'])) filled++;
        }

        if (data['Naam volgorde']) {
            let naamgebruik = data['Naam volgorde'].toLowerCase().trim()
                .replace(/\s*[-–]\s*/g, ' ').trim();
            if (naamgebruik.includes(' ')) naamgebruik = naamgebruik.replace(/\s+/g, '_');
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.naamgebruik', naamgebruik)) filled++;
        }

        if (data['Voorletters']) {
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.voorletters', data['Voorletters'].replace(/\./g, ''))) filled++;
        }

        if (data['Voornamen']) {
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.roepnaam', data['Voornamen'])) filled++;
        }

        if (data['Geboortedatum']) {
            let geboortedatum = data['Geboortedatum'];
            const monthMap = {
                'jan': '01', 'feb': '02', 'mrt': '03', 'apr': '04',
                'mei': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                'sep': '09', 'okt': '10', 'nov': '11', 'dec': '12'
            };
            const match = geboortedatum.match(/(\d+)\s+(\w+)\s+(\d{4})/);
            if (match) {
                geboortedatum = `${match[1].padStart(2, '0')}-${monthMap[match[2].toLowerCase()] || match[2]}-${match[3]}`;
            }
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.geboortedatum', geboortedatum)) filled++;
        }

        if (data['Geboorteplaats']) {
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.geboorteplaats', data['Geboorteplaats'])) filled++;
        }

        if (data['Geslacht']) {
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.geslachtString', data['Geslacht'].toLowerCase().includes('man') ? 'M' : 'V')) filled++;
        }

        if (data['Beroep']) {
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.beroep', data['Beroep'])) filled++;
        }

        if (data['Telefoonnummer']) {
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.telefoonnummer1', data['Telefoonnummer'])) filled++;
        }

        if (data['E-mail']) {
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.email', data['E-mail'])) filled++;
        }

        const huisartsField = targetDoc.getElementById('praktijkMedewerker');
        if (huisartsField) {
            for (let option of huisartsField.options) {
                if (option.text.includes('E.A.') && option.text.includes('Westerbeek')) {
                    huisartsField.value = option.value;
                    huisartsField.dispatchEvent(new Event('change', { bubbles: true }));
                    if (huisartsField.onchange) huisartsField.onchange();
                    filled++;
                    break;
                }
            }
        }

        if (data['BSN']) {
            if (fillField(targetDoc, 'bsn', data['BSN'])) filled++;
        }

        if (data['ID bewijs nummer']) {
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.identificatieDocNumber', data['ID bewijs nummer'])) filled++;
        }

        if (data['Type ID bewijs']) {
            const typeMap = { 'Paspoort': 'P', 'Rijbewijs': 'R', 'Identiteitskaart': 'I' };
            if (fillField(targetDoc, 'patientPersoonWrapper.persoon.widDocSoort', typeMap[data['Type ID bewijs']] || data['Type ID bewijs'])) filled++;
        }

        const identiteitJa = targetDoc.getElementById('identiteitVergewistJa');
        if (identiteitJa) {
            identiteitJa.checked = true;
            identiteitJa.dispatchEvent(new Event('change', { bubbles: true }));
            filled++;
        }

        return filled;
    }

    function isPatientFormPage() {
        const iframe = getContentIframe();
        if (!iframe) return false;
        try {
            const iframeSrc = iframe.src || '';
            const iframeHref = iframe.contentWindow?.location?.href || '';
            return iframeSrc.includes('admin.onderhoud.patienten') ||
                   iframeHref.includes('admin.onderhoud.patienten');
        } catch (e) { return false; }
    }

    function createUI() {
        if (!isPatientFormPage()) return;

        const iframe = getContentIframe();
        if (!iframe) return;

        let targetDoc;
        try {
            targetDoc = iframe.contentDocument || iframe.contentWindow.document;
        } catch (e) { return; }

        if (!targetDoc) return;
        if (targetDoc.getElementById('promedico-autofill-btn')) return;

        const terugButton = targetDoc.getElementById('Button_<< Terug');
        if (!terugButton) return;

        const button = targetDoc.createElement('input');
        button.id = 'promedico-autofill-btn';
        button.type = 'BUTTON';
        button.value = 'Informatie vullen';
        button.tabIndex = 101;
        button.style.cssText = 'cursor: pointer; margin-right: 5px;';

        button.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            const text = prompt('Plak de patiëntgegevens hier:');
            if (text) {
                const data = parseData(text);
                const filled = fillForm(data);
                alert(`✓ ${filled} velden ingevuld!`);
            }
            return false;
        };

        terugButton.parentNode.insertBefore(button, terugButton);
    }

    function initPatientForm() {
        if (document.body) createUI();
        else setTimeout(initPatientForm, 500);
        setInterval(createUI, 2000);
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        initCustomMenus();
        initMedovdImport();
        initPatientForm();
        initFavorietenMenu();
        initMenuHover();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();