// zorgdomein-menus/menu-utrecht.js
// Regio Utrecht — Diakonessenhuis e.o.
// Vul de PLACEHOLDER UUIDs in via HAR-analyse:
//   DevTools → Network → klik op het gewenste product → zoek op 'choose-product' in de URL
// Alle andere items gebruiken hcrCode en zijn regio-naïef (werken landelijk).

const ZORGDOMEIN_MENU_ITEMS_UTRECHT = [

    // --- 1. DIAGNOSTIEK ---
    {
        text: 'Diagnostiek',
        code: 'LAB',
        url: 'https://www.zorgdomein.nl/healthcare-request/diagnostics',
        submenu: [
            {
                text: 'Lab',
                code: 'LAB',
                hcrCode: '1ELKLC', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics',
                submenu: [
                    { text: 'Klinische Chemie (Diakonessenhuis)', code: 'LAB', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' }
                ]
            },
            {
                text: 'Röntgen',
                code: 'RON',
                hcrCode: '1ELRON', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics',
                submenu: [
                    { text: 'Röntgen (Diakonessenhuis)', code: 'RON', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' }
                ]
            },
            {
                text: 'Echo',
                code: 'ECH',
                hcrCode: '1ELBEC', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics',
                submenu: [
                    { text: 'Echo (Diakonessenhuis)', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' }
                ]
            },
            { text: 'CT',                    code: 'RON', hcrCode: '1ELBCT', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics' },
            { text: 'MRI',                   code: 'RON', hcrCode: '1ELMRI', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics' },
            { text: 'Functieonderzoek',      code: 'FUN', hcrCode: '1ELFNC', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics' },
            { text: 'Endoscopie',            code: 'MDL', hcrCode: '1ELEND', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics' },
            { text: 'Nucleaire Geneeskunde', code: 'NUC', hcrCode: 'NUCOVE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics' }
        ]
    },

    // --- 2. SPECIALISTISCHE ZORG ---
    // Vul choose-product UUIDs in voor de specialismen van het Diakonessenhuis.
    {
        text: 'Specialistische zorg',
        code: 'XXX',
        url: 'https://www.zorgdomein.nl/healthcare-request/medicalCare',
        submenu: [
            { text: 'Cardiologie',   code: 'CAR', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' },
            { text: 'Dermatologie',  code: 'DER', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' },
            { text: 'Gynaecologie',  code: 'GYN', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' },
            { text: 'Interne',       code: 'INT', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' },
            { text: 'KNO',           code: 'KNO', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' },
            { text: 'Longziekten',   code: 'LNG', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' },
            { text: 'MDL',           code: 'MDL', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' },
            { text: 'Neurologie',    code: 'NEU', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' },
            { text: 'Oogheelkunde',  code: 'OOG', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' },
            { text: 'Orthopedie',    code: 'ORT', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' },
            { text: 'Reumatologie',  code: 'REU', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' },
            { text: 'Urologie',      code: 'URO', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' },
            { text: 'Chirurgie',     code: 'CHI', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/PLACEHOLDER' }
        ]
    },

    // --- 3. PARAMEDISCHE ZORG --- (regio-naïef)
    {
        text: 'Paramedische zorg',
        code: 'FYS',
        url: 'https://www.zorgdomein.nl/healthcare-request/paramedicalCare',
        submenu: [
            { text: 'Diëtetiek',              code: 'DIE', hcrCode: 'PAZDIE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/paramedicalCare' },
            { text: 'Ergotherapie',            code: 'ERT', hcrCode: 'PAZERG', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/paramedicalCare' },
            { text: 'Fysio- en oefentherapie', code: 'FYS', hcrCode: 'PAZFOT', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/paramedicalCare' },
            { text: 'Huidtherapie',            code: 'HUT', hcrCode: 'PAZHUI', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/paramedicalCare' },
            { text: 'Logopedie',               code: 'LOG', hcrCode: 'PAZLOG', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/paramedicalCare' },
            { text: 'Optometrie / orthoptie',  code: 'OPM', hcrCode: 'PAZOPT', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/paramedicalCare' },
            { text: 'Podotherapie',            code: 'POT', hcrCode: 'PAZPOD', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/paramedicalCare' },
            { text: 'Verloskunde',             code: 'VLK', hcrCode: 'PAZVLK', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/paramedicalCare' }
        ]
    },

    // --- 4. MEEDENKADVIES --- (regio-naïef)
    {
        text: 'Meedenkadvies',
        code: 'XXX',
        hcrCode: '1ELTLC', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request'
    },

    // --- 5. AANVULLENDE ZORG --- (regio-naïef)
    {
        text: 'Aanvullende zorg',
        code: 'XXX',
        url: 'https://www.zorgdomein.nl/healthcare-request/additionalCare',
        submenu: [
            { text: 'Leefstijlcoaching',  code: 'XXX', hcrCode: 'LIFCOA', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/additionalCare' },
            { text: 'Overgangsconsulent', code: 'XXX', hcrCode: 'OVGCSL', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/additionalCare' },
            { text: 'Pedicure',           code: 'PDC', hcrCode: 'PDCURE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/additionalCare' }
        ]
    },

    // --- 6. GEESTELIJKE GEZONDHEIDSZORG --- (regio-naïef)
    {
        text: 'Geestelijke gezondheidszorg',
        code: 'PSY',
        url: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth',
        submenu: [
            { text: 'Aanpassings- en verwerkingsproblemen',           code: 'PSY', hcrCode: 'PSYAVP',  categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'ADHD',                                           code: 'PSY', hcrCode: 'PSYADHD', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Angstklachten',                                  code: 'PSY', hcrCode: 'PSYANG',  categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Autisme',                                        code: 'PSY', hcrCode: 'PSYAUTI', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Cognitieve problemen (o.a. dementie)',           code: 'PSY', hcrCode: 'PSYCOGN', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Eetproblemen',                                   code: 'PSY', hcrCode: 'PSYEETP', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Gedragsproblemen',                               code: 'PSY', hcrCode: 'PSYGEDR', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Persoonlijkheidsproblemen',                      code: 'PSY', hcrCode: 'PSYPERS', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Psychose',                                       code: 'PSY', hcrCode: 'PSYPSYC', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Psychotraumatische klachten',                    code: 'PSY', hcrCode: 'PSYPSYT', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Relatie- en gezinsproblemen',                    code: 'PSY', hcrCode: 'PSYREL',  categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Seksuologische problemen',                       code: 'SEX', hcrCode: 'PSYSEP',  categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Somatoforme klachten',                           code: 'PSY', hcrCode: 'PSYSOMA', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Stemmingsklachten',                              code: 'PSY', hcrCode: 'PSYSTK',  categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Verslavingsproblemen',                           code: 'VER', hcrCode: 'PSYVERP', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Overige zorgvragen Geestelijke gezondheidszorg', code: 'PSY', hcrCode: 'PSYOVE',  categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' }
        ]
    },

    // --- 7. JEUGDZORG --- (regio-naïef)
    {
        text: 'Jeugdzorg',
        code: 'JGZ',
        url: 'https://www.zorgdomein.nl/healthcare-request/youthCare',
        submenu: [
            { text: 'Cognitieve ontwikkeling',                 code: 'JGZ', hcrCode: 'OPOCOG', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/youthCare' },
            { text: 'Gezins- en omgevingsproblemen',           code: 'JGZ', hcrCode: 'OPOGEZ', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/youthCare' },
            { text: 'Opvoedingsproblemen',                     code: 'JGZ', hcrCode: 'OPOOOI', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/youthCare' },
            { text: 'Problemen in ouder-kind relatie',         code: 'JGZ', hcrCode: 'OPOREL', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/youthCare' },
            { text: 'Verwaarlozing / mishandeling / misbruik', code: 'JGZ', hcrCode: 'OPOVMM', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/youthCare' },
            { text: 'Overige zorgvragen Jeugdzorg',            code: 'JGZ', hcrCode: 'OPOOVE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/youthCare' }
        ]
    },

    // --- 8. VERPLEGING EN VERZORGING --- (regio-naïef)
    {
        text: 'Verpleging en verzorging',
        code: 'WVK',
        url: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare',
        submenu: [
            { text: 'Complexe gezondheidsproblemen',              code: 'WVK', hcrCode: 'VVTCOM', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare' },
            { text: 'Palliatieve zorg',                           code: 'INT', hcrCode: 'VVTPAL', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare' },
            { text: 'Persoonlijke verzorging',                    code: 'WVK', hcrCode: 'VVTPER', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare' },
            { text: 'Specialistische verpleging',                 code: 'WVK', hcrCode: 'VVTSPE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare' },
            { text: 'Verpleging',                                 code: 'WVK', hcrCode: 'VVTVER', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare' },
            { text: 'Overige zorgvragen Verpleging & verzorging', code: 'WVK', hcrCode: 'VVTOVE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare' }
        ]
    },

    // --- 9. VERBLIJF EN WONEN --- (regio-naïef)
    {
        text: 'Verblijf en wonen',
        code: 'VPH',
        url: 'https://www.zorgdomein.nl/healthcare-request/stayAndLiving',
        submenu: [
            { text: 'Dagbehandeling',                      code: 'VPH', hcrCode: 'VBWDAG', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/stayAndLiving' },
            { text: 'Kortdurend verblijf',                 code: 'VPH', hcrCode: 'VBWKOR', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/stayAndLiving' },
            { text: 'Langdurend verblijf',                 code: 'VPH', hcrCode: 'VBWLAN', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/stayAndLiving' },
            { text: 'Overige zorgvragen Verblijf & wonen', code: 'VPH', hcrCode: 'VBWOVE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/stayAndLiving' }
        ]
    },

    // --- 10. SCEN ARTS ---
    {
        text: 'SCEN arts aanvragen',
        code: 'SCE',
        url: 'https://www.zorgdomein.nl/protocol/7d726008-4da6-44ec-87eb-ebdad54c8319'
    },

    // --- 11. HULPMIDDELEN --- (regio-naïef)
    {
        text: 'Hulpmiddelen',
        code: 'XXX',
        url: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices',
        submenu: [
            { text: 'Auditieve en visuele hulpmiddelen',      code: 'OPT', hcrCode: 'HMZAUDV', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Compressie- en wondmaterialen',          code: 'WVK', hcrCode: 'HMZCOMW', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Continentie- en urologische materialen', code: 'URO', hcrCode: 'HMZCONU', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Diabetesmaterialen',                     code: 'DBM', hcrCode: 'HMZDIAB', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Irrigatie- en stomamaterialen',          code: 'CHI', hcrCode: 'HMZIRST', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Mobiliteit',                             code: 'ORT', hcrCode: 'HMZMOBI', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Orthesen en prothesen',                  code: 'ORH', hcrCode: 'HMZORPR', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Pijnbehandeling',                        code: 'PIJ', hcrCode: 'HMZPIJN', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Respiratoire hulpmiddelen',              code: 'LNG', hcrCode: 'HMZRESP', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Verpleeghulpmiddelen',                   code: 'WVK', hcrCode: 'HMZVERP', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Verzorgingshulpmiddelen',                code: 'WVK', hcrCode: 'HMZVERZ', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Voedings- en medicatiematerialen',       code: 'DIE', hcrCode: 'HMZVDME', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Voethulpmiddelen',                       code: 'POT', hcrCode: 'HMZVOET', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Overige hulpmiddelen',                   code: 'XXX', hcrCode: 'HMZOVE2', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' }
        ]
    }
];