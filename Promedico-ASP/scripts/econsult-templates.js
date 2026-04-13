(function() {
    'use strict';



    // ============================================================================
    // CONFIGURATION - EASILY EDITABLE TEMPLATES
    // ============================================================================

    // Templates als object met submenu-structuur — zelfde patroon als soep-sjablonen.js
    const TEMPLATES = {
        'Antwoord': {
            submenu: {
                'Arts (leeg)': {
                    rol: 'arts',
                    text: `{aanhef}\n\nMet vriendelijke groet,`
                },
                'Assistente (leeg)': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nMet vriendelijke groet,`
                },
                'Laagdrempelig': {
                    rol: 'arts',
                    text: `{aanhef}\n\nAls ik uw verhaal lees schat ik in dat contact met onze huisartsenpraktijk op dit moment (nog) niet nodig is. Op www.thuisarts.nl kunt u veel informatie vinden over uw klacht.\n\nMet vriendelijke groet,`
                },
                'Onvoldoende info': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nOm uw vraag goed te kunnen beantwoorden heb ik wat meer informatie nodig. Zou u onderstaande vragen willen beantwoorden via een reactie op dit bericht?\n\n- Wat is precies uw klacht?\n- Hoe lang heeft u deze klacht?\n- Wat heeft u zelf al gedaan?\n- Wat verlangt u van uw zorgverlener/praktijk?\n\nIk hoor graag van u.\n\nMet vriendelijke groet,`
                },
            }
        },
        'Lab': {
            submenu: {
                'Geen bijzonderheden': {
                    rol: 'arts',
                    text: `{aanhef}\n\nUw aangevraagde labuitslag is binnen.\nDe uitslag is goed.\n\nMet vriendelijke groet,`
                },
                'Afwijkend, geen actie': {
                    rol: 'arts',
                    text: `{aanhef}\n\nUw aangevraagde labuitslag is binnen.\nDe waarden zijn in orde en er is verder geen actie nodig.\n\nDe waarden kunnen afwijken van de norm. De afwijking is in dit geval niet ernstig.\n\nMet vriendelijke groet,`
                },
                'Afwijkend, afspraak maken': {
                    rol: 'arts',
                    text: `{aanhef}\n\nUw aangevraagde labuitslag is binnen.\nDe waarden wijken (licht) af en ik wil u daarom vragen een afspraak te maken zodat we het verder kunnen bespreken.\n\nU kunt voor het maken van een afspraak gebruik maken van de functie "afspraken" in dit portaal.\n\nMet vriendelijke groet,`
                },
                'Bespreken bij POH': {
                    rol: 'arts',
                    text: `{aanhef}\n\nUw aangevraagde labuitslag is binnen.\nDe uitslagen worden tijdens de volgende controle bij de praktijkondersteuner besproken.\n\nAls u nog geen afspraak heeft staan kunt u via de functie "afspraken" in dit portaal een afspraak maken.\n\nMet vriendelijke groet,`
                },
            }
        },
        'Urine': {
            submenu: {
                'Niet afwijkend': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nU heeft een urineonderzoek laten verrichten. De uitslag hiervan is in orde.\n\nMocht u nog vragen hebben dan kunt u contact opnemen door een bericht te sturen of bij dringende vragen te bellen naar de doktersassistente.\n\nMet vriendelijke groet,`
                },
                'Uricult ingezet': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nU heeft een urineonderzoek laten verrichten. De eerste test heeft geen uitsluitsel gegeven. Er is een extra onderzoek ingezet. De uitslag hiervan is morgen bekend, hierover krijgt u een bericht via dit portaal.\n\nAls de klachten plotseling verergeren of veranderen (koorts, een ziek gevoel, pijn in uw zij) neem dan telefonisch contact op met de doktersassistente.\n\nMet vriendelijke groet,`
                },
                'UWI met labkweek': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nU heeft een urineonderzoek laten verrichten. Hieruit is gebleken dat er sprake is van een blaasontsteking. Er is een recept voor een kuur antibiotica naar uw apotheek gestuurd en de urine is voor verdere analyse naar het laboratorium gestuurd. De uitslag hiervan is binnen 3 werkdagen bekend.\n\nHet kan zijn dat uw klachten eerder verdwijnen, toch is het belangrijk dat u de kuur afmaakt. Indien de klachten plotseling verergeren of veranderen (koorts, een ziek gevoel, pijn in uw zij) neem dan telefonisch contact op met de doktersassistente. Meer informatie: www.thuisarts.nl/blaasontsteking\n\nMet vriendelijke groet,`
                },
                'UWI zonder labkweek': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nU heeft een urineonderzoek laten verrichten. Hieruit is gebleken dat er sprake is van een blaasontsteking. Er is een recept voor een kuur antibiotica naar uw apotheek gestuurd. Het kan zijn dat uw klachten eerder verdwijnen, toch is het belangrijk dat u de kuur afmaakt.\n\nIndien de klachten plotseling verergeren of veranderen (koorts, een ziek gevoel, pijn in uw zij) neem dan telefonisch contact op met de doktersassistente. Meer informatie: www.thuisarts.nl/blaasontsteking\n\nMet vriendelijke groet,`
                },
                'Kweek: mengbeeld': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nUw urine is recent opgestuurd naar het laboratorium voor verder onderzoek. Het laboratorium heeft de urinekweek helaas niet kunnen beoordelen vanwege de aanwezigheid van omgevingsbacteriën.\n\nOns advies is om bij aanhoudende klachten opnieuw urine te laten onderzoeken (middenstraalsurine, ochtendurine).\n\nMet vriendelijke groet,`
                },
                'Kweek: start AB': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nUw urine is recent opgestuurd naar het laboratorium voor verder onderzoek. Uit dit onderzoek blijkt dat er sprake is van een blaasontsteking. Er is een recept voor een kuur antibiotica naar uw apotheek gestuurd. Toch is het belangrijk dat u de kuur afmaakt.\n\nIndien de klachten plotseling verergeren of veranderen neem dan telefonisch contact op. Meer informatie: www.thuisarts.nl/blaasontsteking\n\nMet vriendelijke groet,`
                },
                'Kweek: switch AB': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nUw urine is recent opgestuurd naar het laboratorium voor verder onderzoek. Uit dit onderzoek blijkt dat de bacterie in uw blaas niet gevoelig is voor de antibiotica die u heeft gekregen. Er is een recept voor de geschikte kuur antibiotica naar uw apotheek gestuurd. U kunt direct starten met de nieuwe kuur.\n\nMet vriendelijke groet,`
                },
            }
        },
        'Afspraken': {
            submenu: {
                'Afspraak maken nav e-consult': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nNaar aanleiding van dit e-consult acht ik het noodzakelijk om een afspraak te maken om bij mij langs te komen in de praktijk.\n\nU kunt voor het maken van een afspraak gebruik maken van de functie "afspraken" in dit portaal.\n\nMet vriendelijke groet,`
                },
                'Bloedprikken afspraak': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nU kunt een afspraak maken voor bloedprikken via onze assistente of online via de website. Nuchter verschijnen is niet nodig, tenzij anders aangegeven.\n\nMet vriendelijke groet,`
                },
                'Verwijzing aangevraagd': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nUw verwijzing is aangevraagd. U ontvangt deze per post of kunt deze ophalen aan de balie.\n\nMaak een afspraak bij de desbetreffende specialist zodra u de verwijzing heeft ontvangen.\n\nMet vriendelijke groet,`
                },
                'Recept gemaakt': {
                    rol: 'assistente',
                    text: `{aanhef}\n\nIk heb het recept voor u gemaakt. U ontvangt een e-mail van de apotheek zodra de medicatie daar voor u klaarligt.\n\nMet vriendelijke groet,`
                },
            }
        },
    };

    // ============================================================================
    // USER NAME EXTRACTION
    // ============================================================================

    // Haal gebruikersnaam op uit het top-level frame (GWT topbar).
    // Geeft naam terug in formaat "S.T. Roos" (voornaamletters achternaam).
    function getCurrentUserName() {
        try {
            // Probeer window.top — staat in de GWT-app boven het iframe
            const wins = [window, window.top];
            for (const w of wins) {
                try {
                    // "Aangemeld als S.T. Roos " → "S.T. Roos"
                    const aangemeld = w.document.querySelector('.GEM3CPJDGMC');
                    if (aangemeld) {
                        const m = aangemeld.textContent.trim().match(/Aangemeld als\s+(.+)/);
                        if (m) return m[1].trim();
                    }
                    // Fallback: arts-label "Roos, S.T." → omzetten naar "S.T. Roos"
                    const artsLabel = w.document.getElementById('PanelPatientDossierBarCore-lblPatientArtsInfo');
                    if (artsLabel) {
                        const raw = artsLabel.textContent.trim(); // bijv. "Roos, S.T."
                        const parts = raw.split(',');
                        if (parts.length === 2) {
                            return parts[1].trim() + ' ' + parts[0].trim(); // "S.T. Roos"
                        }
                        return raw;
                    }
                } catch(e) {}
            }
        } catch(e) {}
        return '';
    }

    // Bouw handtekening op basis van rol (arts/assistente/poh)
    function getSignature(rol) {
        const naam = getCurrentUserName();
        const rolTekst = {
            'arts':       'huisarts',
            'assistente': 'assistente',
            'poh':        'praktijkondersteuner',
        }[rol] || 'huisarts';
        return naam ? naam + ', ' + rolTekst : rolTekst;
    }

    // Haal aanhef op uit topbar: "Man" → "geachte heer", "Vrouw" → "geachte mevrouw"
    // Volledige zin: "Beste heer Roos," of "Beste mevrouw Roos,"
    function getAanhef() {
        try {
            const wins = [window, window.top];
            for (const w of wins) {
                try {
                    const bar = w.document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
                    if (!bar) continue;
                    const tekst = bar.textContent;

                    // Geslacht staat als "/ Man /" of "/ Vrouw /"
                    if (/\/\s*Man\s*\//.test(tekst))   return 'Beste heer,';
                    if (/\/\s*Vrouw\s*\//.test(tekst)) return 'Beste mevrouw,';
                } catch(e) {}
            }
        } catch(e) {}
        return 'Beste,'; // fallback als geslacht niet bepaalbaar
    }

    // ============================================================================
    // DROPDOWN + SUBMENU — exact zelfde patroon als soep-sjablonen.js
    // ============================================================================

    function insertEcTemplate(template, reactieTextarea) {
        if (!reactieTextarea || !template.text) return;
        const handtekening = getSignature(template.rol || 'arts');
        const tekst = template.text.replace('{aanhef}', getAanhef());
        reactieTextarea.value = tekst + '\n' + handtekening;
        reactieTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        reactieTextarea.focus();
    }

    function createEcMenu(doc, button, reactieTextarea) {
        const existing = doc.getElementById('ec-sjablonen-dropdown');
        if (existing) {
            existing.style.display = existing.style.display === 'block' ? 'none' : 'block';
            return;
        }

        const dropdown = doc.createElement('div');
        dropdown.id = 'ec-sjablonen-dropdown';
        dropdown.style.cssText = `
            display: none;
            position: fixed;
            background-color: white;
            min-width: 200px;
            box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
            z-index: 10000;
            border-radius: 4px;
            overflow: hidden;
        `;

        let activeSubmenu = null;
        let activeSubmenuItem = null;
        let submenuHideTimer = null;

        function hideActiveSubmenu() {
            if (activeSubmenu) { activeSubmenu.style.display = 'none'; activeSubmenu = null; }
            if (activeSubmenuItem) { activeSubmenuItem.style.backgroundColor = 'white'; activeSubmenuItem = null; }
        }
        function cancelHideTimer() {
            if (submenuHideTimer) { clearTimeout(submenuHideTimer); submenuHideTimer = null; }
        }
        function scheduleHide(delay = 200) {
            cancelHideTimer();
            submenuHideTimer = setTimeout(() => {
                const hovered = doc.querySelector(':hover');
                const overSub  = activeSubmenu && activeSubmenu.contains(hovered);
                const overItem = activeSubmenuItem && activeSubmenuItem.contains(hovered);
                if (!overSub && !overItem) hideActiveSubmenu();
            }, delay);
        }

        Object.keys(TEMPLATES).forEach(key => {
            const template = TEMPLATES[key];
            const item = doc.createElement('div');
            item.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                position: relative;
                font-family: Arial, sans-serif;
                font-size: 13px;
            `;
            item.textContent = template.submenu ? key + ' ›' : key;
            item.addEventListener('mouseenter', () => { item.style.backgroundColor = '#f5f5f5'; });
            item.addEventListener('mouseleave', () => { item.style.backgroundColor = 'white'; });

            if (template.submenu) {
                const submenu = doc.createElement('div');
                submenu.style.cssText = `
                    display: none;
                    position: fixed !important;
                    background-color: white !important;
                    min-width: 270px !important;
                    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2) !important;
                    border-radius: 4px !important;
                    z-index: 100001 !important;
                    border: 2px solid #4CAF50;
                `;

                Object.keys(template.submenu).forEach(subKey => {
                    const subTpl = template.submenu[subKey];
                    const subItem = doc.createElement('div');
                    subItem.style.cssText = `
                        padding: 12px 16px !important;
                        cursor: pointer !important;
                        border-bottom: 1px solid #f0f0f0 !important;
                        background-color: white !important;
                        font-family: Arial, sans-serif;
                        font-size: 13px;
                    `;
                    subItem.textContent = subKey;
                    subItem.addEventListener('mouseenter', () => { subItem.style.backgroundColor = '#f5f5f5'; });
                    subItem.addEventListener('mouseleave', () => { subItem.style.backgroundColor = 'white'; });
                    subItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdown.style.display = 'none';
                        hideActiveSubmenu();
                        insertEcTemplate(subTpl, reactieTextarea);
                    });
                    submenu.appendChild(subItem);
                });

                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = '#f5f5f5';
                    cancelHideTimer();
                    if (activeSubmenu && activeSubmenu !== submenu) hideActiveSubmenu();

                    const rect = item.getBoundingClientRect();
                    const submenuWidth = 270;
                    const windowWidth  = window.innerWidth;
                    const windowHeight = window.innerHeight;
                    const left = (rect.right + 5 + submenuWidth) > windowWidth
                        ? rect.left - submenuWidth - 5
                        : rect.right + 5;

                    submenu.style.display = 'block';
                    const submenuHeight = submenu.offsetHeight;
                    const top = Math.max(0, Math.min(rect.top, windowHeight - submenuHeight - 8));
                    submenu.style.top  = top + 'px';
                    submenu.style.left = left + 'px';
                    submenu.style.right = 'auto';

                    activeSubmenu = submenu;
                    activeSubmenuItem = item;
                });
                item.addEventListener('mouseleave', () => { scheduleHide(200); });
                submenu.addEventListener('mouseenter', () => { cancelHideTimer(); });
                submenu.addEventListener('mouseleave', () => { scheduleHide(200); });
                doc.body.appendChild(submenu);

            } else {
                item.addEventListener('click', () => {
                    dropdown.style.display = 'none';
                    insertEcTemplate(template, reactieTextarea);
                });
            }

            dropdown.appendChild(item);
        });

        doc.body.appendChild(dropdown);

        // Toon dropdown, positie onder knop met overflow-correctie
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dropdown.style.display === 'block';
            hideActiveSubmenu();
            dropdown.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                const rect = button.getBoundingClientRect();
                dropdown.style.top  = (rect.bottom + 5) + 'px';
                dropdown.style.left = rect.left + 'px';

                requestAnimationFrame(() => {
                    const ddRect = dropdown.getBoundingClientRect();
                    if (ddRect.bottom > window.innerHeight) {
                        const newTop = rect.top - ddRect.height - 5;
                        dropdown.style.top = Math.max(0, newTop) + 'px';
                    }
                });
            }
        });

        // Sluit bij klik buiten
        doc.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== button) {
                dropdown.style.display = 'none';
                hideActiveSubmenu();
            }
        });
    }

    // ============================================================================
    // BUTTON INJECTION
    // ============================================================================

    function injectTemplateButton() {
        // E-consult frame herkennen: heeft contactForm.regelP maar GEEN contactForm.regelO
        // (gewone consulten hebben beide; e-consult heeft alleen P als "Reactie(P)")
        const reactieTextarea = document.getElementById('contactForm.regelP');
        if (!reactieTextarea) return false;

        const oField = document.getElementById('contactForm.regelO');
        if (oField) return false; // gewoon consult — soep-sjablonen.js handelt dit af

        // Al aanwezig?
        if (document.getElementById('ec-sjablonen-btn')) return true;

        // Maak groene knop — zelfde stijl als soep-sjablonen
        const btn = document.createElement('button');
        btn.id   = 'ec-sjablonen-btn';
        btn.type = 'button';
        btn.textContent = 'Sjablonen';
        btn.style.cssText = `
            padding: 6px 12px;
            margin-left: 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            font-family: Arial, sans-serif;
            vertical-align: top;
        `;
        btn.addEventListener('mouseenter', () => { btn.style.backgroundColor = '#45a049'; });
        btn.addEventListener('mouseleave', () => { btn.style.backgroundColor = '#4CAF50'; });
        // Click listener wordt gezet door createEcMenu
        createEcMenu(document, btn, reactieTextarea);

        // Plaats direct na de textarea
        if (reactieTextarea.nextSibling) {
            reactieTextarea.parentNode.insertBefore(btn, reactieTextarea.nextSibling);
        } else {
            reactieTextarea.parentNode.appendChild(btn);
        }

        return true;
    }

    // ============================================================================
    // INITIALIZATION AND MONITORING
    // ============================================================================

    function initialize() {
        const injectionInterval = setInterval(() => {
            injectTemplateButton();
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