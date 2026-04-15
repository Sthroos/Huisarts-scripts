(function() {
    'use strict';

    // ============================================================================
    // CONFIGURATION - EASILY EDITABLE TEMPLATES
    // ============================================================================

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
                'Afspraak nav e-consult': {
                    rol: 'arts',
                    text: `{aanhef}\n\nNaar aanleiding van dit e-consult acht ik het noodzakelijk om een afspraak te maken om bij mij langs te komen in de praktijk.\n\nU kunt voor het maken van een afspraak gebruik maken van de functie "afspraken" in dit portaal.\n\nMet vriendelijke groet,`
                },
                'Doorverwijzen HAP': {
                    rol: 'arts',
                    text: `{aanhef}\n\nOp basis van uw klachten adviseer ik u om vandaag contact op te nemen met de huisartsenpost. De huisartsenpost is bereikbaar via het landelijke nummer 0900-1010 (lokaal tarief). Zij kunnen u verder helpen en indien nodig een afspraak inplannen.\n\nMet vriendelijke groet,`
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
        'Klachten': {
            submenu: {
                'Koorts bij kind': {
                    rol: 'arts',
                    text: `{aanhef}\n\nIk heb naar de klachten gekeken. De klachten zijn vervelend maar lijken niet ernstig. Koorts komt meestal door een onschuldige infectie en gaat na enkele dagen vanzelf over.\n\nZorg dat uw kind blijft drinken om uitdroging te voorkomen. Aandringen om te eten is niet nodig. Voldoende rust is belangrijk, maar in bed blijven hoeft niet. Dunne kleding helpt het lichaam de warmte kwijt te raken. Bij koude rillingen mag u uw kind tijdelijk extra toedekken. Het is normaal dat de temperatuur 's avonds iets hoger is.\n\nBij koorts hoeft u geen paracetamol te geven. U kunt paracetamol wel geven als uw kind ergens pijn van heeft. Kijk voor de maximale dosering op de verpakking of op: https://www.thuisarts.nl/pijn/ik-wil-mijn-kind-pijnstiller-geven\n\nMeer informatie: https://www.thuisarts.nl/koorts-bij-kinderen/mijn-kind-heeft-koorts\n\nNeem direct contact op als uw kind:\n- Suf is of niet makkelijk wakker te krijgen\n- Ontroostbaar huilt of kreunt\n- Een grauwe of vlekkerige huidskleur heeft of blauwe lippen\n- Rode of donkere vlekjes of stipjes op de huid heeft\n- Steeds zieker wordt\n- Pijn aan de nek heeft of erge hoofdpijn\n- Moeite heeft met ademhalen\n- Kwijlt\n- Meerdere keren per uur overgeeft\n- Veel minder drinkt dan normaal of een halve dag niet plast\n\nNeem ook contact op als uw kind:\n- Na een aantal koortsvrije dagen opnieuw koorts krijgt\n- Langer dan 5 dagen koorts heeft\n- Dikke, warme of rode gewrichten heeft\n\nNeem ook contact op als u zich ernstig zorgen maakt.\n\nMet vriendelijke groet,`
                },
                'Keelpijn waarvoor AB': {
                    rol: 'arts',
                    text: `{aanhef}\n\nIk heb naar uw klachten gekeken. Meestal gaat een keelontsteking binnen 10 dagen vanzelf over. Maar omdat de klachten heftig zijn en de kans groter is dat het om een bacteriële infectie gaat, schrijf ik een antibioticakuur voor. Het gaat om een 7-daagse kuur feneticilline (3 keer per dag 500 mg innemen).\n\nMeer informatie over dit medicijn: https://www.apotheek.nl/medicijnen/feneticilline\n\nBij een pijnlijke keel helpt het om iets kouds te drinken of op een ijsblokje te zuigen. U kunt ook 3 keer per dag 2 tabletten paracetamol van 500 mg innemen.\n\nMeer informatie: https://www.thuisarts.nl/keelpijn/ik-heb-keelpijn\n\nNeem contact op als u:\n- Benauwd wordt of een piepende ademhaling krijgt\n- Uw mond nauwelijks meer kunt openen\n- Slijm of drinken helemaal niet meer kunt doorslikken\n- Gaat kwijlen\n- Ernstige pijn aan één kant van uw hoofd krijgt\n- Langer dan 3 dagen koorts heeft\n- Keelpijn die langer duurt dan 10 dagen\n\nMet vriendelijke groet,`
                },
                'Verstuikte enkel': {
                    rol: 'arts',
                    text: `{aanhef}\n\nIk heb naar uw klachten gekeken. Dit past het beste bij een verstuikte enkel. De kans dat er iets gebroken is, is erg klein. Een verstuikte enkel geneest bijna altijd vanzelf, ook als de enkelbanden zijn gescheurd. De enkel kan een paar maanden gevoelig of een beetje dik blijven.\n\nAdvies:\n- Koel de enkel direct: gebruik een ice-pack of doe ijsklontjes in een plastic zak gewikkeld in een theedoek. Koel minimaal 10 minuten.\n- Breng daarna een drukverband aan om de zwelling te beperken (verkrijgbaar bij drogist of apotheek, 8 cm breed).\n- Hoe u een drukverband aanlegt ziet u hier: https://www.youtube.com/watch?v=QSqsEe1krJE\n\nVoor de pijn kunt u maximaal 3 keer per dag 2 tabletten paracetamol van 500 mg innemen. Als paracetamol onvoldoende helpt kunt u ibuprofen, diclofenac of naproxen nemen. Wees voorzichtig met deze middelen als u een verminderde nierfunctie of maagklachten heeft. Kijk voor de dosering op de verpakking.\n\nMeer informatie: https://www.sportzorg.nl/sportblessures/verzwikte-of-verstuikte-enkel\n\nMet vriendelijke groet,`
                },
                'Verstuikte enkel (kind)': {
                    rol: 'arts',
                    text: `{aanhef}\n\nDe pijn wordt vaak veroorzaakt door de zwelling. Ik adviseer de enkel goed te koelen en daarna een drukverband aan te brengen. Dit gaat de zwelling tegen en geeft het gewricht rust.\n\nKoelen: gebruik een ice-pack of doe ijsklontjes in een plastic zak gewikkeld in een theedoek. Koel minimaal 10 minuten.\n\nDrukverband aanbrengen: kijk hoe dat moet in dit filmpje: https://www.youtube.com/watch?v=QSqsEe1krJE\nEen drukverband is verkrijgbaar bij de drogist of apotheek. Gebruik voor de enkel een drukverband van 8 cm breed. Is dit te groot voor de enkel van uw kind, gebruik dan een drukverband van 6 cm breed.\n\nVoor de pijn mag u uw kind paracetamol geven. Als paracetamol onvoldoende helpt mag uw kind ibuprofen nemen. Paracetamol en ibuprofen mogen niet tegelijk worden gebruikt. Kijk voor de maximale dosering op de verpakking: https://www.thuisarts.nl/pijn/ik-wil-mijn-kind-pijnstiller-geven\n\nMet vriendelijke groet,`
                },
                'Rugpijn': {
                    rol: 'arts',
                    text: `{aanhef}\n\nIk heb naar uw klachten gekeken. Het lijkt er niet op dat er iets beschadigd is of dat het om een hernia gaat. Vaak komt rugpijn door een verkeerde beweging, stress of overbelasting. De klachten zijn vervelend maar zullen meestal binnen een maand vanzelf verdwijnen.\n\nHet is belangrijk dat u blijft bewegen. Kijk voor meer informatie en oefeningen op: https://www.thuisarts.nl/lage-rugpijn/ik-heb-pijn-onderin-rug\n\nOm de pijn te verminderen schrijf ik een recept voor diclofenac. Neem 2 tot 3 keer per dag 1 tablet van 50 mg. Wees voorzichtig met diclofenac als u een verminderde nierfunctie of maagklachten heeft. Meer informatie: https://www.apotheek.nl/medicijnen/diclofenac\n\nDaarnaast kunt u maximaal 3 keer per dag 2 tabletten paracetamol van 500 mg nemen. Ibuprofen werkt vergelijkbaar met diclofenac: u mag 3 keer per dag 400 mg innemen naast de paracetamol. Bij veel pijn en geen maagklachten of zuurbranden mag u een paar dagen 4 keer per dag 400 mg nemen.\n\nNeem direct contact op als u geen gevoel meer heeft bij de penis/vagina of anus, of minder kracht in de benen heeft (niet meer goed op hakken of tenen kunnen staan). Neem ook contact op als er binnen 4 weken geen verbetering optreedt.\n\nMet vriendelijke groet,`
                },
                'Tekenbeet': {
                    rol: 'arts',
                    text: `{aanhef}\n\nIk heb naar uw tekenbeet gekeken. De teek heeft langer dan 24 uur vastgezeten. Dit betekent dat u twee keuzes heeft:\n\n1. Preventief een antibioticakuur gebruiken\n2. Afwachten\n\nHet heeft op dit moment geen zin om een bloedonderzoek te laten doen, omdat de test nu niet kan aantonen of de teek u heeft besmet. De kans dat u de ziekte van Lyme krijgt is 2 tot 3%.\n\nEen antibioticakuur kan bijwerkingen geven en uit onderzoek is nog niet helemaal duidelijk of een preventieve kuur de ziekte van Lyme voorkomt. Als u afwacht en toch tekenen van de ziekte van Lyme krijgt, kunt u alsnog antibiotica gebruiken om de ziekte te behandelen.\n\nMeer informatie: https://www.thuisarts.nl/tekenbeet/ik-heb-tekenbeet (zie kopje 'Teek langer dan 24 uur op de huid')\n\nIk hoor graag of u wilt afwachten of wilt starten met de preventieve antibioticakuur.\n\nMet vriendelijke groet,`
                },
            }
        },
        'Afspraken': {
            submenu: {
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

    function getCurrentUserName() {
        try {
            const wins = [window, window.top];
            for (const w of wins) {
                try {
                    const aangemeld = w.document.querySelector('.GEM3CPJDGMC');
                    if (aangemeld) {
                        const m = aangemeld.textContent.trim().match(/Aangemeld als\s+(.+)/);
                        if (m) return m[1].trim();
                    }
                    const artsLabel = w.document.getElementById('PanelPatientDossierBarCore-lblPatientArtsInfo');
                    if (artsLabel) {
                        const raw = artsLabel.textContent.trim();
                        const parts = raw.split(',');
                        if (parts.length === 2) {
                            return parts[1].trim() + ' ' + parts[0].trim();
                        }
                        return raw;
                    }
                } catch(e) {}
            }
        } catch(e) {}
        return '';
    }

    function getSignature(rol) {
        const naam = getCurrentUserName();
        const rolTekst = {
            'arts':       'huisarts',
            'assistente': 'assistente',
            'poh':        'praktijkondersteuner',
        }[rol] || 'huisarts';
        return naam ? naam + ', ' + rolTekst : rolTekst;
    }

    function getAanhef() {
        try {
            const wins = [window, window.top];
            for (const w of wins) {
                try {
                    const bar = w.document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
                    if (!bar) continue;
                    const tekst = bar.textContent;
                    if (/\/\s*Man\s*\//.test(tekst))   return 'Beste heer,';
                    if (/\/\s*Vrouw\s*\//.test(tekst)) return 'Beste mevrouw,';
                } catch(e) {}
            }
        } catch(e) {}
        return 'Beste,';
    }

    // ============================================================================
    // DROPDOWN + SUBMENU
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
        const reactieTextarea = document.getElementById('contactForm.regelP');
        if (!reactieTextarea) return false;

        const oField = document.getElementById('contactForm.regelO');
        if (oField) return false; // gewoon consult — soep-sjablonen.js handelt dit af

        if (document.getElementById('ec-sjablonen-btn')) return true;

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
        createEcMenu(document, btn, reactieTextarea);

        if (reactieTextarea.nextSibling) {
            reactieTextarea.parentNode.insertBefore(btn, reactieTextarea.nextSibling);
        } else {
            reactieTextarea.parentNode.appendChild(btn);
        }

        return true;
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function initialize() {
        const injectionInterval = setInterval(() => {
            injectTemplateButton();
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
