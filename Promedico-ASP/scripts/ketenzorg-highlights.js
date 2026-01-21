// ==UserScript==
// @name         Promedico Meetwaarden Highlights
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Markeert meetwaarden incl. leeftijdscheck en splitst lange tekst
// @author       JouwNaam
// @match        *://*/promedico/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Functie om de leeftijd te vinden
    function getPatientAge() {
        let el = document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
        if (!el && window.parent && window.parent.document) {
            try {
                el = window.parent.document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
            } catch (e) { return null; }
        }
        if (el) {
            const match = el.innerText.match(/\((\d{1,3})\)/);
            if (match && match[1]) {
                return parseInt(match[1], 10);
            }
        }
        return null;
    }

    // Configuratie van de regels
    const targets = [
        {
            search: "systolische bloeddruk",
            newText: "Systolische bloeddruk (Vereist voor ketenzorg)",
            type: "always"
        },
        {
            search: "lichaamsbeweging vlgs norm gezond bewegn",
            newText: "Lichaamsbeweging (Vereist voor ketenzorg)",
            type: "always"
        },
        {
            search: "diastolische bloeddruk",
            newText: "Diastolische bloeddruk (Vereist voor ketenzorg)",
            type: "always"
        },
        {
            search: "roken (inclusief vapen)",
            newText: "roken (inclusief vapen) (Vereist voor ketenzorg)",
            type: "always"
        },
        {
            search: "aantal ernstige longaanvallen in 12 mnd",
            newText: "aantal ernstige longaanvallen in 12 mnd (Vereist voor ketenzorg)",
            type: "always"
        },
        {
            search: "inhalatietechniek",
            newText: "Inhalatietechniek (Vereist voor ketenzorg)<br>(Vergeet CCQ of MRC niet)",
            type: "always"
        },
        {
            // SPECIAAL: Alleen als leeftijd >= 75
            // <br> zorgt voor de nieuwe regel
            search: "aanwijzingen kwetsbaarheid (ouderenzorg)",
            newText: "Aanwijzingen kwetsbaarheid (ouderenzorg)<br>Zet ICPC A49.01 of A05 in episode lijst als patient kwetsbaar is.",
            type: "conditional_age_75"
        }
    ];

    function applyPromedicoStyles() {
        const age = getPatientAge();
        const cells = document.querySelectorAll('td[valign="top"]');

        cells.forEach(cell => {
            const content = cell.innerText.trim();
            if (!content || cell.children.length > 0) return;

            targets.forEach(target => {
                const isMatch = content.toLowerCase().startsWith(target.search.toLowerCase());

                if (isMatch) {
                    let shouldHighlight = false;

                    if (target.type === "always") {
                        shouldHighlight = true;
                    } else if (target.type === "conditional_age_75") {
                        if (age !== null && age >= 75) {
                            shouldHighlight = true;
                        } else {
                            return; // Stop als patient jonger is dan 75
                        }
                    }

                    if (shouldHighlight) {
                        // 1. Tekst aanpassen (Gebruik innerHTML voor de <br> tag)
                        // We checken innerHTML om te voorkomen dat hij blijft refreshen
                        if (target.newText && cell.innerHTML !== target.newText) {
                            cell.innerHTML = target.newText;
                        }

                        // 2. Stijl aanpassen (Rood en Dikgedrukt)
                        if (cell.style.color !== 'red') {
                            cell.style.fontWeight = "bold";
                            cell.style.color = "red";
                        }
                    }
                }
            });
        });
    }

    // Interval timer
    setInterval(applyPromedicoStyles, 1000);

})();