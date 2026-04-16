(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────
    // CONFIGURATIE
    // Veldmapping: extractiesleutel → Promedico veld-ID
    // ─────────────────────────────────────────────────────────────────────────
    const VELD_IDS = {
        onderwerp:   'ProcessBerichtTopView-txtOnderwerp',
        toelichting: 'ProcessBerichtTopView-txtToelichting',
        objectief:   'ProcessBerichtTopView-txtObjectief',
        evaluatie:   'ProcessBerichtTopView-txtEvaluatie',
        icpc:        'ProcessBerichtTopView-txtEvaluatieICPC',
        plan:        'ProcessBerichtTopView-txtPlan',
    };

    // Welke velden tonen in de preview (in deze volgorde)
    const PREVIEW_VELDEN = [
        { sleutel: 'onderwerp',   label: 'Onderwerp' },
        { sleutel: 'toelichting', label: 'S (Toelichting)' },
        { sleutel: 'objectief',   label: 'O (Objectief)' },
        { sleutel: 'evaluatie',   label: 'E (Evaluatie)' },
        { sleutel: 'icpc',        label: 'ICPC' },
        { sleutel: 'plan',        label: 'P (Plan)' },
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // HULPFUNCTIES
    // ─────────────────────────────────────────────────────────────────────────

    // Geeft het document terug waar de verwerkingspagina in staat.
    // Bij brieven verwerken zit alles DIRECT in het hoofd-GWT document (geen iframe).
    // DisplayMedvry31, ProcessBerichtTopView-* etc. zitten in window.top.document.
    function getIframeDoc() {
        // Eerst: zit de verwerkingspagina in het top-document zelf?
        try {
            const top = window.top.document;
            if (top && top.body) {
                const hasDisplay = top.getElementById('DisplayMedvry31') ||
                                   top.getElementById('DisplayMedspe31') ||
                                   top.getElementById('DisplayMedvri10') ||
                                   top.getElementById('DisplayMedspe10');
                const hasProcess = top.getElementById('ProcessBerichtTopView-btnAfdrukken') ||
                                   top.getElementById('ProcessBerichtTopView-btnTerug');
                if (hasDisplay || hasProcess) return top;
            }
        } catch(e) {}

        // Fallback: panelBackCompatibility-frame (voor andere pagina's)
        try {
            const iframe = window.top.document.getElementById('panelBackCompatibility-frame');
            if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
                return iframe.contentDocument;
            }
        } catch(e) {}

        // Laatste fallback: huidig document
        try {
            if (document.body) return document;
        } catch(e) {}

        return null;
    }

    // Geeft het hoofd-document terug voor modal-detectie
    function getHoofdDoc() {
        try { return window.top.document; } catch(e) { return document; }
    }

    // Schrijft een waarde naar een GWT input/textarea.
    // GWT ICPC-velden luisteren naar keyup per karakter voor de omschrijving-lookup.
    // Andere velden reageren op input + change.
    function schrijfNaarVeld(doc, veldId, waarde) {
        const el = doc.getElementById(veldId);
        if (!el || !waarde) return false;

        // Native value setter omzeilen zodat GWT de wijziging ziet
        const proto = el.tagName === 'TEXTAREA'
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');

        el.focus();
        el.select();

        // ICPC-velden: simuleer karakter-voor-karakter typing zodat
        // GWT de omschrijving-lookup triggert (luistert naar keyup)
        const isIcpcVeld = veldId.includes('ICPC') || veldId.includes('Icpc');
        if (isIcpcVeld) {
            // Eerst leegmaken
            if (nativeSetter) nativeSetter.set.call(el, '');
            else el.value = '';

            // Typ elk karakter apart
            for (let i = 0; i < waarde.length; i++) {
                const huidig = waarde.slice(0, i + 1);
                if (nativeSetter) nativeSetter.set.call(el, huidig);
                else el.value = huidig;

                el.dispatchEvent(new InputEvent('input', {
                    inputType: 'insertText',
                    data: waarde[i],
                    bubbles: true,
                    cancelable: true,
                }));
                el.dispatchEvent(new KeyboardEvent('keyup', {
                    key: waarde[i],
                    code: 'Key' + waarde[i].toUpperCase(),
                    bubbles: true,
                    cancelable: true,
                }));
            }
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }

        // Normale velden: beforeinput → waarde zetten → input → change
        // beforeinput is nodig voor sommige GWT-versies die hiermee de dirty-state bijhouden.
        el.dispatchEvent(new InputEvent('beforeinput', {
            inputType: 'insertText',
            data: waarde,
            bubbles: true,
            cancelable: true,
            composed: true,
        }));
        if (nativeSetter) nativeSetter.set.call(el, waarde);
        else el.value = waarde;
        el.dispatchEvent(new InputEvent('input', {
            inputType: 'insertText',
            data: waarde,
            bubbles: true,
            cancelable: true,
            composed: true,
        }));
        el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        el.blur();
        return true;
    }

    // Verwijdert leading/trailing whitespace en normaliseert meervoudige lege regels
    function opschonen(tekst) {
        if (!tekst) return '';
        return tekst
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXTRACTORS per brieftype
    // ─────────────────────────────────────────────────────────────────────────

    // Medvry31: vrije brief met (S)/(O)/(E)/(P) structuur — bijv. HAP-waarneming
    function extraheerMedvry31(doc) {
        const tekstEl  = doc.getElementById('DisplayMedvry31-txtTekst');
        const afzEl    = doc.getElementById('DisplayMedvry31-txtAfzender');
        if (!tekstEl) return null;

        const tekst   = tekstEl.innerText || '';
        const afzender = afzEl ? afzEl.innerText.trim() : '';

        // S: eerste (S)-blok tot (S Arts), (O) of einde
        const s = tekst.match(/\(S\)\s*([\s\S]*?)(?=\n\(S Arts\)|\n\(O\)|\n\(E\)|$)/);

        // O: (O)-blok tot (E) — kan leeg zijn
        const o = tekst.match(/\(O\)\s*([\s\S]*?)(?=\n\(E\)|\n\(P\)|$)/);
        const oTekst = o ? o[1].trim() : '';

        // E: omschrijving
        const e = tekst.match(/\(E\)\s*([\s\S]*?)(?=\n\(E icpc\)|\n\(P\)|$)/);

        // ICPC: code (bijv. S75.01)
        const icpc = tekst.match(/\(E icpc\)\s*([A-Z]\d+(?:\.\d+)?)/);

        // P: plan tot (R), (Episode) of einde
        const p = tekst.match(/\(P\)\s*([\s\S]*?)(?=\n\(R\)|\n\(Episode\)|$)/);

        // Als er geen SOEP-structuur is (bijv. vrije specialistenbrief via vrij kanaal),
        // zet dan de volledige tekst als toelichting en gebruik afzender als onderwerp
        const heeftSoep = s || o || e || icpc || p;
        if (!heeftSoep) {
            // Haal de volledige tekst op, maar sla administratieve regels over
            const volledigeTekst = opschonen(tekst
                .replace(/OVERIGE PATIENTGEGEVENS:[\s\S]*$/, '')  // verwijder admin-blok achteraan
                .trim()
            );
            return {
                onderwerp:   afzender,
                toelichting: volledigeTekst,
                objectief:   '',
                evaluatie:   '',
                icpc:        '',
                plan:        '',
            };
        }

        return {
            onderwerp:   afzender,
            toelichting: opschonen(s ? s[1] : ''),
            objectief:   opschonen(oTekst),
            evaluatie:   opschonen(e ? e[1] : ''),
            icpc:        icpc ? icpc[1].trim() : '',
            plan:        opschonen(p ? p[1] : ''),
        };
    }

    // Medspe31: specialistenbrief — bijv. ziekenhuis, kinderarts
    function extraheerMedspe31(doc) {
        const briefEl  = doc.getElementById('DisplayMedspe31-txtBrief');
        const afzEl    = doc.getElementById('DisplayMedspe31-txtAfzender');
        const afzConEl = doc.getElementById('DisplayMedspe31-txtAfzenderContacts');
        if (!briefEl) return null;

        const tekst    = briefEl.innerText || '';
        const afzender = afzEl ? afzEl.innerText.trim() : '';

        // Conclusie → Toelichting
        const conclusie = tekst.match(
            /\n\s*Conclusie\s*\n([\s\S]*?)(?=\n\s*\n|\nBeleid|\nBeloop|\nAanvullend|\nMet vriendelijke)/i
        );

        // Beleid → Plan
        const beleid = tekst.match(
            /\n\s*Beleid\s*\n([\s\S]*?)(?=\n\s*\n|\nBeloop|\nAanvullend|\nMet vriendelijke)/i
        );

        // Beloop → Objectief (wat er tijdens opname/consult is gebeurd)
        const beloop = tekst.match(
            /\n\s*Beloop\s*\n([\s\S]*?)(?=\n\s*\n|\nMedisch relevante|\nMet vriendelijke|\nActieve)/i
        );

        // Onderwerp: afdeling uit tekst + afzender
        const afd = tekst.match(/afdeling\s+([\w\s]+?)(?:\s+in verband|\s+vanwege|\s*\n|,)/i);
        let onderwerp;
        if (afd) {
            onderwerp = `${afd[1].trim()}, ${afzender}`;
        } else {
            // Fallback: ondertekening + afzender
            const arts = tekst.match(/Met vriendelijke groet,\s*\n\s*\n?\s*([^\n,]+)/i);
            onderwerp = arts ? `${arts[1].trim()}, ${afzender}` : afzender;
        }

        return {
            onderwerp,
            toelichting: opschonen(conclusie ? conclusie[1] : ''),
            objectief:   opschonen(beloop ? beloop[1] : ''),
            evaluatie:   '',
            icpc:        '',
            plan:        opschonen(beleid ? beleid[1] : ''),
        };
    }

// Medvri10: vrijgevestigd specialist — diëtist, podotherapeut, fysiotherapeut etc.
    // De tekst zit in txtVraagstelling (of txtTekst bij oudere berichten).
    // Structuur verschilt sterk per beroepsgroep — we detecteren patronen.
    function extraheerMedvri10(doc) {
        const vraagEl  = doc.getElementById('DisplayMedvri10-txtVraagstelling');
        const tekstEl  = doc.getElementById('DisplayMedvri10-txtTekst');
        const afzEl    = doc.getElementById('DisplayMedvri10-txtAfzender');
        const afzConEl = doc.getElementById('DisplayMedvri10-txtAfzenderContacts');
        if (!vraagEl && !tekstEl) return null;

        const tekst    = (vraagEl || tekstEl).innerText || '';
        const afzender = afzEl ? afzEl.innerText.trim() : '';
        const afzCon   = afzConEl ? afzConEl.innerText.trim() : '';

        // Onderwerp: organisatienaam uit ondertekening (na naam ondertekenaar)
        let onderwerp = '';
        const orgNaGroet = tekst.match(
            /Met vriendelijke groet[^\n]*\n\s*\n[^\n]+\n\s*\n([^\n]+)/i
        );
        const praktijkRegel = tekst.match(
            /\n((?:Praktijk|praktijk|Centrum|centrum|Bureau|bureau|Voetencentrum|voetencentrum)[^\n]+)/
        );
        const beroepInTekst = tekst.match(
            /\n[^\n]+,\s*(dietist|fysiotherapeut|podotherapeut|ergotherapeut|logopedist|psycholoog|oefentherapeut|verloskundige|huidtherapeut)[^\n]*/i
        );

        if (orgNaGroet) {
            onderwerp = orgNaGroet[1].trim();
        } else if (praktijkRegel) {
            onderwerp = praktijkRegel[1].trim();
        } else if (beroepInTekst) {
            const b = beroepInTekst[1].trim();
            onderwerp = b.charAt(0).toUpperCase() + b.slice(1);
        } else {
            onderwerp = afzCon || afzender;
        }

        // Toelichting (S)
        let toelichting = '';
        const toelDieet = tekst.match(
            /(?:Verwijsreden[^\n]*\n\n+)([\s\S]*?)(?=\n(?:MEET|WEEG|meet|weeg)|Met vriendelijk)/i
        );
        const toelEval = tekst.match(
            /\nEvaluatie\s*\n([\s\S]*?)(?=\n(?:Functie|Vervolg|Concrete|Met vriendelijk))/i
        );
        const toelGeneriek = tekst.match(
            /(?:BSN[^\n]*\n\n+)([\s\S]*?)(?=\n(?:[A-Z]{2,}[^a-z]|Meet|Diagnose|Toegepaste|Behandel|Evaluatie|Met vriendelijk))/i
        );
        if (toelDieet) toelichting = toelDieet[1];
        else if (toelEval) toelichting = toelEval[1];
        else if (toelGeneriek) toelichting = toelGeneriek[1];

        // Objectief (O)
        let objectief = '';
        const meetWeeg = tekst.match(
            /(MEET EN WEEG GEGEVENS:[\s\S]*?)(?=\n\n\n|\nIk vertrouw|\nMet vriendelijk)/i
        );
        const diagnoseBlok = tekst.match(
            /\n(?:Podotherapeutische diagnose|Diagnose|Bevinding)\s*\n([\s\S]*?)(?=\n(?:Toegepaste|Behandel|Evaluatie|Functie|Vervolg|Met vriendelijk))/i
        );
        const interventiesBlok = tekst.match(
            /\nToegepaste interventies\s*\n([\s\S]*?)(?=\n(?:Behandel|Evaluatie|Functie|Vervolg|Met vriendelijk))/i
        );
        if (meetWeeg) {
            objectief = meetWeeg[1];
        } else if (diagnoseBlok) {
            objectief = diagnoseBlok[1];
            if (interventiesBlok) objectief += '\n\n' + interventiesBlok[1];
        }

        // Plan (P)
        const vervolgRegel = tekst.match(/Vervolg:\s*([^\n]+)/i);
        const concreteAfspraken = tekst.match(/Concrete vervolgafspraken:\s*([^\n]+)/i);
        const beleid = tekst.match(
            /(?:Beleid|Advies|Behandelplan)\s*:?\s*\n([\s\S]*?)(?=\n\s*\n|\nMet vriendelijk|$)/i
        );
        const planDelen = [];
        if (concreteAfspraken) planDelen.push(concreteAfspraken[1].trim());
        if (vervolgRegel) planDelen.push('Vervolg: ' + vervolgRegel[1].trim());
        if (beleid && !planDelen.length) planDelen.push(beleid[1]);

        // ICPC
        const icpc = tekst.match(/\(E icpc\)\s*([A-Z]\d+(?:\.\d+)?)/);
        const episode = tekst.match(/\(Episode\)\s*([A-Z]\d+(?:\.\d+)?)/);

        return {
            onderwerp:   opschonen(onderwerp),
            toelichting: opschonen(toelichting),
            objectief:   opschonen(objectief),
            evaluatie:   '',
            icpc:        icpc ? icpc[1].trim() : (episode ? episode[1].trim() : ''),
            plan:        opschonen(planDelen.join('\n')),
        };
    }

        // Medspe10: andere specialistenbrief (kortere notities, teleconsult)
    function extraheerMedspe10(doc) {
        const tekstEl  = doc.getElementById('DisplayMedspe10-txtTekst');
        const afzEl    = doc.getElementById('DisplayMedspe10-txtAfzender');
        const ondEl    = doc.getElementById('DisplayMedspe10-txtOnderwerp');
        if (!tekstEl) return null;

        const tekst    = tekstEl.innerText || '';
        const afzender = afzEl ? afzEl.innerText.trim() : '';
        const onderwerp_brief = ondEl ? ondEl.innerText.trim() : '';

        // Conclusie → toelichting
        const conclusie = tekst.match(
            /(?:Conclusie|Bevinding)\s*:?\s*\n?([\s\S]*?)(?=\n\s*\n|\nBeleid|\nAdvies|\nMet vriendelijk)/i
        );

        // Beleid / Advies → plan
        const beleid = tekst.match(
            /(?:Beleid|Advies)\s*:?\s*\n?([\s\S]*?)(?=\n\s*\n|\nMet vriendelijk|$)/i
        );

        return {
            onderwerp:   onderwerp_brief ? `${onderwerp_brief}, ${afzender}` : afzender,
            toelichting: opschonen(conclusie ? conclusie[1] : tekst.slice(0, 300)),
            objectief:   '',
            evaluatie:   '',
            icpc:        '',
            plan:        opschonen(beleid ? beleid[1] : ''),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DETECTIE: welk brieftype is zichtbaar?
    // ─────────────────────────────────────────────────────────────────────────
    function detecteerBrief(doc) {
        // btnTerug is het bewijs dat we op de verwerkingspagina zijn (niet de werklijst-preview)
        // Op de werklijst staan Display-elementen al als preview, maar btnTerug ontbreekt daar
        const opVerwerkingsPagina = doc.getElementById('ProcessBerichtTopView-btnTerug') ||
                                    doc.getElementById('ProcessBerichtTopView-btnAfronden');
        if (!opVerwerkingsPagina) return null;

        if (doc.getElementById('DisplayMedvry31')) return { type: 'medvry31', extraheer: extraheerMedvry31 };
        if (doc.getElementById('DisplayMedspe31')) return { type: 'medspe31', extraheer: extraheerMedspe31 };
        if (doc.getElementById('DisplayMedvri10')) return { type: 'medvri10', extraheer: extraheerMedvri10 };
        if (doc.getElementById('DisplayMedspe10')) return { type: 'medspe10', extraheer: extraheerMedspe10 };
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PREVIEW BALK
    // ─────────────────────────────────────────────────────────────────────────
    const PREVIEW_ID = 'pmh-brief-preview';

    function verwijderPreview(doc) {
        const bestaand = doc.getElementById(PREVIEW_ID);
        if (bestaand) bestaand.remove();
    }

    function toonPreview(doc, extractie) {
        verwijderPreview(doc);

        // Anker: btnTerug is gegarandeerd aanwezig (detecteerBrief checkt dit)
        const anker = doc.getElementById('ProcessBerichtTopView-btnTerug');
        if (!anker) return;

        const balk = doc.createElement('div');
        balk.id = PREVIEW_ID;
        balk.style.cssText = `
            background: #f0f7ff;
            border: 2px solid #0275d8;
            border-radius: 6px;
            padding: 12px 16px;
            margin: 8px 0 12px 0;
            font-family: Arial, sans-serif;
            font-size: 12px;
            position: relative;
        `;

        // Titel
        const titel = doc.createElement('div');
        titel.style.cssText = 'font-weight: bold; color: #0275d8; margin-bottom: 8px; font-size: 13px;';
        titel.textContent = '📋 Brief verwerker — controleer de extractie';
        balk.appendChild(titel);

        // Tabel met velden
        const tabel = doc.createElement('table');
        tabel.style.cssText = 'width: 100%; border-collapse: collapse; margin-bottom: 10px;';

        PREVIEW_VELDEN.forEach(({ sleutel, label }) => {
            const waarde = extractie[sleutel];
            if (!waarde) return;

            const rij = doc.createElement('tr');

            const labelTd = doc.createElement('td');
            labelTd.style.cssText = 'font-weight: bold; color: #555; padding: 2px 8px 2px 0; vertical-align: top; white-space: nowrap; width: 120px;';
            labelTd.textContent = label + ':';

            const waardeTd = doc.createElement('td');
            waardeTd.style.cssText = 'color: #222; padding: 2px 0; vertical-align: top;';
            // Toon max 120 tekens in preview
            const preview = waarde.length > 120 ? waarde.slice(0, 120) + '…' : waarde;
            waardeTd.textContent = preview;

            rij.appendChild(labelTd);
            rij.appendChild(waardeTd);
            tabel.appendChild(rij);
        });

        balk.appendChild(tabel);

        // Knoppen
        const knoppen = doc.createElement('div');
        knoppen.style.cssText = 'display: flex; gap: 8px;';

        const btnInvullen = doc.createElement('button');
        btnInvullen.type = 'button';
        btnInvullen.textContent = '✓ Invullen';
        btnInvullen.style.cssText = `
            background: #0275d8; color: white; border: none;
            padding: 6px 16px; border-radius: 4px; cursor: pointer;
            font-size: 12px; font-weight: bold;
        `;
        btnInvullen.addEventListener('click', () => {
            vulVeldenIn(doc, extractie);
            verwijderPreview(doc);
        });

        const btnAnnuleren = doc.createElement('button');
        btnAnnuleren.type = 'button';
        btnAnnuleren.textContent = '✕ Sluiten';
        btnAnnuleren.style.cssText = `
            background: #6c757d; color: white; border: none;
            padding: 6px 16px; border-radius: 4px; cursor: pointer;
            font-size: 12px;
        `;
        btnAnnuleren.addEventListener('click', () => verwijderPreview(doc));

        knoppen.appendChild(btnInvullen);
        knoppen.appendChild(btnAnnuleren);
        balk.appendChild(knoppen);

        // Sluitknop rechtsbovenin
        const sluiten = doc.createElement('button');
        sluiten.type = 'button';
        sluiten.textContent = '×';
        sluiten.style.cssText = `
            position: absolute; top: 6px; right: 8px;
            background: none; border: none; font-size: 18px;
            cursor: pointer; color: #666; line-height: 1;
        `;
        sluiten.addEventListener('click', () => verwijderPreview(doc));
        balk.appendChild(sluiten);

        // Invoegen vóór de "Terug" knop (onderaan het verwerkingsformulier)
        anker.parentNode.insertBefore(balk, anker);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INVULLEN
    // ─────────────────────────────────────────────────────────────────────────
    function vulVeldenIn(doc, extractie) {
        Object.entries(VELD_IDS).forEach(([sleutel, veldId]) => {
            const waarde = extractie[sleutel];
            if (waarde) schrijfNaarVeld(doc, veldId, waarde);
        });

        // ICPC ook in het Episode-ICPC veld invullen (bovenaan het formulier)
        // Dit is een apart veld van de Evaluatie-ICPC (onderaan)
        if (extractie.icpc) {
            schrijfNaarVeld(doc, 'ProcessBerichtTopView-txtEpisodeICPC', extractie.icpc);
        }

        // Markeer het formulier als gewijzigd zodat GWT de waarden opslaat bij Afronden.
        // Zonder deze aanroep denkt Promedico dat er niets gewijzigd is.
        try {
            const win = doc.defaultView || doc.parentWindow;
            if (win && typeof win.setChanged === 'function') {
                win.setChanged(true);
            }
        } catch (e) {
            console.warn('pmh brief-verwerker: setChanged niet beschikbaar', e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // KNOP INJECTEREN
    // Voegt "Brief verwerken" knop toe naast de Verwijderen/Afdrukken knoppen
    // ─────────────────────────────────────────────────────────────────────────
    const KNOP_ID = 'pmh-brief-verwerken-btn';

    function bindTerugListener(doc) {
        const btnTerug = doc.getElementById('ProcessBerichtTopView-btnTerug');
        if (btnTerug && !btnTerug.dataset.pmhTerugBound) {
            btnTerug.dataset.pmhTerugBound = '1';
            btnTerug.addEventListener('click', () => {
                verwijderPreview(doc);
                const knop = doc.getElementById(KNOP_ID);
                if (knop) knop.remove();
                if (doc.body) delete doc.body.dataset.pmhBriefId;
                if (btnTerug.dataset) delete btnTerug.dataset.pmhTerugBound;
                // Start observer voor de volgende brief
                setTimeout(() => observeerIframeDoc(), 200);
            });
        }
    }

    // Observer die wacht tot btnTerug beschikbaar is om de listener te binden
    function wachtOpTerugEnBind(doc) {
        bindTerugListener(doc);
        if (doc.getElementById('ProcessBerichtTopView-btnTerug')) return;

        const obs = new MutationObserver(() => {
            if (doc.getElementById('ProcessBerichtTopView-btnTerug')) {
                obs.disconnect();
                bindTerugListener(doc);
            }
        });
        obs.observe(doc.body, { childList: true, subtree: true });
        setTimeout(() => obs.disconnect(), 15000);
    }

    function injecteerKnop(doc, extractie) {
        if (doc.getElementById(KNOP_ID)) return;

        // Wacht op btnAfdrukken voor het ankerpunt — kan later beschikbaar komen
        const anker = doc.getElementById('ProcessBerichtTopView-btnAfdrukken');
        if (!anker) {
            // Probeer opnieuw zodra het element beschikbaar is
            const obs = new MutationObserver(() => {
                if (doc.getElementById('ProcessBerichtTopView-btnAfdrukken')) {
                    obs.disconnect();
                    injecteerKnop(doc, extractie);
                }
            });
            obs.observe(doc.body, { childList: true, subtree: true });
            setTimeout(() => obs.disconnect(), 15000);
            return;
        }

        // Bind Terug-listener (nu of zodra die verschijnt)
        wachtOpTerugEnBind(doc);

        const knop = doc.createElement('button');
        knop.type = 'button';
        knop.id = KNOP_ID;
        knop.textContent = '📋 Brief verwerker';
        knop.title = 'Toon de brief verwerker opnieuw';
        knop.className = 'gwt-Button GEM3CPJDFV GEM3CPJDPRC GEM3CPJDARC';
        knop.style.cssText = 'background-color: #0275d8; color: white; font-weight: bold; margin-left: 8px;';

        knop.addEventListener('click', () => {
            // Herextraheer op moment van klikken (brief kan gewisseld zijn)
            const doc2 = getIframeDoc();
            if (!doc2) return;
            const brief = detecteerBrief(doc2);
            if (!brief) return;
            const ex = brief.extraheer(doc2);
            if (!ex) return;
            toonPreview(doc2, ex);
        });

        anker.parentNode.insertBefore(knop, anker.nextSibling);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INIT
    //
    // Flow bij "Verwerken" vanuit de werklijst:
    //   1. Gebruiker klikt Verwerken → modal "Zoek patiënt" verschijnt
    //   2. Gebruiker selecteert patiënt → modal verdwijnt
    //   3. Iframe laadt de verwerkingspagina (ProcessBerichtTopView)
    //
    // We observeren het hoofddocument op verdwijnen van de modal,
    // en het iframe-document op verschijnen van de verwerkingsknoppen.
    // ─────────────────────────────────────────────────────────────────────────

    // Injecteer knop als de verwerkingspagina geladen is
    function controleerEnInjecteer() {
        const doc = getIframeDoc();
        if (!doc || !doc.body) {
            return;
        }

        const url = doc.location?.href || '(onbekend)';

        // Log welke Display-elementen aanwezig zijn
        ['DisplayMedvry31','DisplayMedspe31','DisplayMedvri10','DisplayMedspe10'].forEach(id => {
            const el = doc.getElementById(id);
        });
        const btnTerug = doc.getElementById('ProcessBerichtTopView-btnTerug');

        // Extra: zoek in alle frames als Display-elementen niet gevonden
        if (!doc.getElementById('DisplayMedvry31') && !doc.getElementById('DisplayMedspe31') &&
            !doc.getElementById('DisplayMedvri10') && !doc.getElementById('DisplayMedspe10')) {
            try {
                for (let i = 0; i < window.top.frames.length; i++) {
                    try {
                        const fd = window.top.frames[i].document;
                        const has = fd.getElementById('DisplayMedvry31') || fd.getElementById('DisplayMedspe31') ||
                                    fd.getElementById('DisplayMedvri10') || fd.getElementById('DisplayMedspe10');
                    } catch(e) {}
                }
            } catch(e) {}
        }

        const brief = detecteerBrief(doc);
        if (!brief) {
            const knop = doc.getElementById(KNOP_ID);
            if (knop) knop.remove();
            verwijderPreview(doc);
            // Wis de brief-ID zodat bij de volgende brief alles vers start
            if (doc.body) delete doc.body.dataset.pmhBriefId;
            return;
        }
        const extractie = brief.extraheer(doc);
        if (!extractie) {
            return;
        }

        // Maak een unieke ID voor deze brief
        const briefId = brief.type + '|' + extractie.onderwerp + '|' + (extractie.toelichting || '').slice(0, 40);
        const huidigeBriefId = doc.body.dataset.pmhBriefId || '';

        if (briefId !== huidigeBriefId) {
            // Nieuwe brief — alles opruimen
            verwijderPreview(doc);
            const oudeKnop = doc.getElementById(KNOP_ID);
            if (oudeKnop) oudeKnop.remove();
        }

        // Toon preview als die er nog niet is
        // btnTerug is gegarandeerd aanwezig (detecteerBrief checkt dit)
        if (!doc.getElementById(PREVIEW_ID)) {
            doc.body.dataset.pmhBriefId = briefId;
            toonPreview(doc, extractie);
        }
        injecteerKnop(doc, extractie);
    }

    // Observeer het iframe-document zelf op verschijnen van de verwerkingsknoppen.
    // Nodig omdat het iframe al geladen kan zijn voordat onze load-listener actief is.
    function observeerIframeDoc() {

        // Wis de brief-ID zodat de volgende brief altijd vers start
        const d = getIframeDoc();
        if (d && d.body) delete d.body.dataset.pmhBriefId;

        const hoofdDoc = getHoofdDoc();
        if (!hoofdDoc || !hoofdDoc.body) return;

        // Observer wacht tot ZOWEL een Display-element ALS een procesknop aanwezig zijn.
        // Display-elementen staan al in de werklijst-preview; de procesknoppen verschijnen
        // pas op de echte verwerkingspagina — dat is het betrouwbare signaal.
        // We checken alle bekende knopvarianten zodat ook "AfrondenEnVolgende" en
        // "AfrondenEnNaarDossier" flows correct getriggerd worden, ook als de patiënt
        // al bekend is en de zoekmodal helemaal niet verschijnt.
        const BRIEF_IDS = ['DisplayMedvry31', 'DisplayMedspe31', 'DisplayMedvri10', 'DisplayMedspe10'];
        const KNOP_IDS  = [
            'ProcessBerichtTopView-btnTerug',
            'ProcessBerichtTopView-btnAfronden',
            'ProcessBerichtTopView-btnAfrondenEnVolgende',
            'ProcessBerichtTopView-btnAfrondenEnNaarDossier',
        ];

        const pageObserver = new MutationObserver(() => {
            const d = getIframeDoc();
            if (!d) return;

            const heeftBrief = BRIEF_IDS.some(id => d.getElementById(id));
            const heeftKnop  = KNOP_IDS.some(id => d.getElementById(id));

            if (heeftBrief && heeftKnop) {
                pageObserver.disconnect();
                controleerEnInjecteer();
            }
        });
        pageObserver.observe(hoofdDoc.body, { childList: true, subtree: true });

        // Stop na 30 seconden
        setTimeout(() => pageObserver.disconnect(), 30000);

        // Ook direct checken voor het geval de brief al aanwezig is
        controleerEnInjecteer();
    }

    function init() {
        // Observer op het hoofddocument:
        // - Detecteert het verdwijnen van de patient-zoek modal
        // - Detecteert directe navigaties (zonder modal)
        let modalWasZichtbaar = false;

        const hoofdObserver = new MutationObserver(() => {
            const modal = getHoofdDoc().getElementById('ZoekPatientDialogView-zoekPatientModal');
            const modalZichtbaar = modal && modal.style.display !== 'none';

            if (modalWasZichtbaar && !modalZichtbaar) {
                // Modal is net verdwenen → patiënt gekozen, iframe gaat laden
                setTimeout(observeerIframeDoc, 300);
            }
            if (!modalWasZichtbaar && modalZichtbaar) {
            }
            modalWasZichtbaar = !!modalZichtbaar;
        });
        hoofdObserver.observe(getHoofdDoc().body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

        // Iframe load-event: vangt navigaties op die zonder modal verlopen
        const iframe = getHoofdDoc().getElementById('panelBackCompatibility-frame');
        if (iframe) {
            iframe.addEventListener('load', () => {
                setTimeout(observeerIframeDoc, 200);
            });
        }

        // Direct checken bij laden (pagina was al open)
        controleerEnInjecteer();

        // Extra: voor brieven waarbij de patiënt al bekend is (geen modal),
        // laadt het iframe direct. We observeren het hoofd-document ook meteen
        // zodat we de verwerkingspagina niet missen.
        observeerIframeDoc();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
