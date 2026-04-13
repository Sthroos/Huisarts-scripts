// zorgdomein-menus/menu-eemland.js
// Regio Eemland — Meander Medisch Centrum, Amersfoort e.o.
// Product-IDs zijn specifiek voor de aanbieders in deze regio.
// Pas dit bestand aan voor jouw regio door de choose-product UUIDs te vervangen.

const ZORGDOMEIN_MENU_ITEMS_EEMLAND = [
    //--- 1. DIAGNOSTIEK ---
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
                    { text: 'Klinische Chemie, Microbiologie en Immunologie', code: 'LAB', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/51d786ec-f6e1-4a9e-ae56-b485c498866f' },
                    { text: 'Cervixcytologie Huisartsen', code: 'CYT', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e33a2739-fa72-4555-b03e-68dea508db93' },
                    { text: 'Cytologie Pathologie', code: 'CYT', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/81706206-d955-445d-b2f6-4be7434efed6' },
                    { text: 'Histologie Pathologie', code: 'PAA', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5f294c40-128e-480d-a8c6-8590b471dffd' },
                    { text: 'Trombosedienst - Aanmelden', code: 'THD', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1df21ff0-0b7c-4781-b70e-de9bf07c54a3' },
                    { text: 'Trombosedienst - Afmelden', code: 'THD', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8216cacc-9ab3-41d8-a9b2-d4856801d70d' },
                    { text: 'Trombosedienst - Meldingen', code: 'THD', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/834253e0-6651-45e3-8cd4-eaea4e59df58' },
                    { text: 'Uitstrijkje BVO', code: 'LAB', url: 'https://www.zorgdomein.nl/protocol/10156d2b-9d91-499b-813e-fd981e37ea2f' }
                ]
            },
            {
                text: 'Röntgen',
                code: 'RON',
                hcrCode: '1ELRON', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics',
                submenu: [
                    { text: 'Wervelkolom', code: 'RON', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/632a5125-7fcf-49f3-9270-527282e4f4cf' },
                    { text: 'Bovenste extremiteiten', code: 'RON', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/90118f1c-9172-4cf7-bd1b-e8d3f327018d' },
                    { text: 'Hals/Thorax', code: 'RON', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/130dbc65-3198-41c9-a7c8-280e432806fe' },
                    { text: 'Onderste extremiteiten', code: 'RON', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/00e30944-e4ce-44ba-9fc9-b892774908ed' },
                    { text: 'Schedel/Aangezicht', code: 'RON', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0601d64f-f8e3-4dcd-8d1d-3bcadca6a4a1' },
                    { text: 'Abdomen', code: 'RON', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b478cfcf-10b0-4d4e-81fa-7105581e0ac0' },
                    { text: 'Slokdarm/Maag', code: 'RON', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/33746ddb-e34c-4b6a-aa8e-8f687281d9cb' }
                ]
            },
            { text: 'CT', code: 'RON', hcrCode: '1ELBCT', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics' },
            {
                text: 'Echo',
                code: 'ECH',
                hcrCode: '1ELBCT', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics',
                submenu: [
                    { text: 'Mammografie/echo mammae', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e2dfb2ec-7151-42ac-90fa-0168e3cad179' },
                    { text: 'Vaginale echo (online afspraak)', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6c2767e0-de23-4afb-99cd-81d2acbf4727' },
                    { text: 'Echo abdomen', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/10d7de37-09a8-454c-96b6-af52f2b7c352' },
                    { text: 'Echo onderste extremiteiten', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b21f29ca-2a80-4a94-9d2b-0bb7eacae11f' },
                    { text: 'Echo hoofd/hals', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1b86df11-ec4f-47ad-926d-0b71b80b7c9d' },
                    { text: 'Echo bovenste extremiteiten', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5666d83a-7d8b-40d9-99c2-8eb151df078b' },
                    { text: 'Echo rug/bil', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/9f63339b-f2d5-4d90-ba15-859fbc1232a6' },
                    { text: 'Echo testis/scrotum', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/702a6972-2c72-49fa-b932-59e1af454c23' },
                    { text: 'Echo thorax', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1a0cfd3c-e37f-4c40-b1cf-34b7bf0ae50f' },
                    { text: 'Echo heupen zuigelingen', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2e4b553f-ac97-41ac-85dc-7f65be37dad0' },
                    { text: 'Echo termijn', code: 'ECH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/c9e2f066-dac8-4b7c-af31-a8b922e7765d' }
                ]
            },
            {
                text: 'Functieonderzoek',
                code: 'FUN',
                hcrCode: '1ELBEC', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics',
                submenu: [
                    { text: 'Longfunctie - Astma/COPD', code: 'LFL', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7eecd74d-84b7-4913-bb1e-e93f3b4a2025' },
                    { text: 'Holteronderzoek', code: 'ECG', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8726d7c3-3dee-4fe0-9a40-91e753557ad3' },
                    { text: 'Fundusfotografie', code: 'OOG', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/fa76ec93-50c6-4607-8e74-a8d4cfbe5e37' },
                    { text: 'Echocardiografie (met cardioloog)', code: 'CAR', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1d58929e-6cc6-4825-b61d-7930d68bc98f' },
                    { text: 'Echocardiografie (zonder cardioloog)', code: 'CAR', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d82c4898-ae77-4961-a0ff-67c564462473' },
                    { text: 'Enkel/arm-index met inspanningstest', code: 'VAL', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5411d381-da76-4676-be40-00840e11f6b1' },
                    { text: 'ECG rust', code: 'ECG', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/688dab9d-a9f3-4f7f-b175-485d8346b154' },
                    { text: 'Cardiale onderzoeken (Saltro)', code: 'CAR', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f97cf0fe-d878-4bc5-b576-1a15e57297b0' },
                    { text: '24-uurs ABPM', code: 'CAR', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/303861a9-948c-4740-bd7d-17bac421412d' },
                    { text: 'Longfunctie (Saltro)', code: 'LFL', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/62c4239c-568c-4602-b20f-2bbd4db37ea4' },
                    { text: 'Fundusonderzoek (Saltro)', code: 'OOG', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b22d9d7c-5376-4377-8bd2-1761e39f0e95' },
                    { text: 'Enkel Arm index (Saltro)', code: 'VAL', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/99bb6d69-f5a7-40e4-84f5-6b4ace0a83a5' },
                    { text: 'Diagnostisch Centrum Houten', code: 'FUN', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/4483be06-7f32-43e2-b648-a1f1afd4cb7d' }
                ]
            },
            {
                text: 'Endoscopie',
                code: 'MDL',
                hcrCode: '1ELFNC', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics',
                submenu: [
                    { text: 'Gastroscopie', code: 'MDL', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f4fb0ec7-3034-4c86-b359-73add40418ab' },
                    { text: 'Gastroscopie (onder sedatie)', code: 'MDL', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/fbec7544-63be-432b-96b5-692f93065b72' },
                    { text: 'Sigmoïdoscopie', code: 'MDL', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2be48322-241d-42db-84df-53151e377b8a' }
                ]
            },
            {
                text: 'Nucleaire Geneeskunde',
                code: 'NUC',
                hcrCode: '1ELEND', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/diagnostics',
                submenu: [
                    { text: 'Scintigrafie', code: 'NUC', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a4df1128-6928-4c8d-b98f-52814214bf3a' },
                    { text: 'DEXA', code: 'NUC', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/95bf3841-3715-4d2a-946c-e6e1c79ef148' }
                ]
            }
        ]
    },

    // --- 2. SPECIALISTISCHE ZORG ---
    {
        text: 'Specialistische zorg',
        code: 'XXX',
        url: 'https://www.zorgdomein.nl/healthcare-request/medicalCare'
    },

    // --- 2. PARAMEDISCHE ZORG ---
    // hcrCode + categoryUrl: regio-onafhankelijk via klik op HCR-knop (landelijk stabiel).
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

    // --- 4. MEEDENKADVIES ---
    {
        text: 'Meedenkadvies',
        code: 'XXX',
        url: 'https://www.zorgdomein.nl/healthcare-request/1ELTLC',
        submenu: [
            { text: 'Dermatologie', code: 'DER', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/43aa3fa3-2c03-4177-8281-f91e462caf52' },
            { text: 'Neurologie', code: 'NEU', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/c7397382-f015-4d6e-a536-48bfa8941e77' },
            { text: 'MDL (Maag-Darm-Lever)', code: 'MDL', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5dec5d58-47cb-4144-b302-c008a193cb79' },
            { text: 'KNO', code: 'KNO', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f2fe8680-4398-447d-a361-ca735435c57e' },
            { text: 'Gynaecologie', code: 'GYN', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f1551e60-3bdb-46af-a70f-ba5191179bf8' },
            { text: 'Cardiologie', code: 'CAR', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/c696e0b3-72fa-48a1-b557-fb4d5dada124' },
            { text: 'Interne - Algemeen', code: 'INT', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8788bbad-a204-4b6a-b47c-55e13f702743' },
            { text: 'Interne - Hematologie', code: 'HAE', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/776dad5c-80d9-42b1-b385-4f3767b4500f' },
            { text: 'Interne - Endocrinologie/Diabetes/Vasculair', code: 'END', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/9a74874f-bb86-4f36-8444-0b522dd558ce' },
            { text: 'Interne - Nefrologie', code: 'NEF', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/062300bb-110f-4c8f-ae9c-78f9d971edd1' },
            { text: 'Interne - Infectieziekten', code: 'INT', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a1768b3a-d4b0-44da-93aa-d28091b3ed5e' },
            { text: 'Interne - Oncologie', code: 'ONC', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/99d24d40-6346-4abd-be84-cd9c64cc46e2' },
            { text: 'Interne - Palliatie', code: 'INT', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/54c1d335-e0de-4ccc-99f3-f6ad177c0d25' },
            { text: 'Interne - Veneuze trombose/Antistolling', code: 'HAE', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2dab5d4f-1cc3-4fe1-9126-92eac65e4f7b' },
            { text: 'Longziekten', code: 'LNG', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/15c23f0d-ea1a-4006-b520-291dbc1f92bf' },
            { text: 'Urologie', code: 'URO', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/cca238a4-a252-4695-b8a1-7da261845e3c' },
            { text: 'Reumatologie', code: 'REU', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3fd1f54d-2548-40b6-abfb-5429b17e18ef' },
            { text: 'Oogheelkunde', code: 'OOG', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/731252b7-4eb5-493e-a6e7-df4e422b7289' },
            { text: 'Chirurgie - Algemeen', code: 'CHI', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/ed753d44-f41b-4beb-a619-d83d80b9ed59' },
            { text: 'Chirurgie - Buikchirurgie', code: 'CHI', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/64e06c16-2833-4d6d-80b8-5a458b233153' },
            { text: 'Chirurgie - Kleine verrichtingen', code: 'CHI', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/bc076f4d-2982-414a-b652-b42d9c689044' },
            { text: 'Chirurgie - Mammapathologie', code: 'CHI', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a7231286-75f1-4bc0-bf38-d8bbabb7ba30' },
            { text: 'Chirurgie - Oncologisch', code: 'CHI', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3ccdad92-2558-45eb-bd65-1f3fd0a3562d' },
            { text: 'Chirurgie - Traumachirurgie', code: 'TRA', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5f6dac6d-249e-42d5-8b8c-a50ee859ac04' },
            { text: 'Chirurgie - Vaatchirurgie', code: 'VCH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7a34e49e-82d6-437a-a4dc-77d8c431ce28' },
            { text: 'Kaakchirurgie', code: 'KCH', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2b784963-578c-4c6f-b30a-b94cf0dd3424' },
            { text: 'Orthopedie', code: 'ORT', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a35e437b-ad8e-4d3f-a65c-d8064e213e16' },
            { text: 'Pijngeneeskunde', code: 'PIJ', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/91e8b354-3528-461d-9a8f-c5bba510501f' },
            { text: 'Revalidatie', code: 'REV', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f4266477-4fff-4d9c-8796-e2d40bcd9546' },
            { text: 'Sportgeneeskunde', code: 'SPO', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8c9d9ed1-34a4-4498-ba5a-c8679581d720' },
            { text: 'Verloskunde', code: 'VLK', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7bf8c155-fb67-47f8-881a-0938594f5b53' }
        ]
    },

    // --- 5. AANVULLENDE ZORG ---
    {
        text: 'Aanvullende zorg',
        code: 'XXX',
        url: 'https://www.zorgdomein.nl/healthcare-request/additionalCare',
        submenu: [
            { text: 'Leefstijlcoaching', code: 'XXX', hcrCode: 'LIFCOA', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/additionalCare' },
            { text: 'Overgangsconsulent', code: 'XXX', hcrCode: 'OVGCSL', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/additionalCare' },
            { text: 'Pedicure', code: 'PDC', hcrCode: 'PDCURE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/additionalCare' }
        ]
    },

    // --- 6. GEESTELIJKE GEZONDHEIDSZORG ---
    {
        text: 'Geestelijke gezondheidszorg',
        code: 'PSY',
        url: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth/PSYOVE',
        submenu: [
            { text: 'ADHD', code: 'PSY', hcrCode: 'PSYADHD', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Angstklachten', code: 'PSY', hcrCode: 'PSYANG', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Autisme', code: 'PSY', hcrCode: 'PSYAUTI', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Cognitieve problemen (o.a. dementie)', code: 'PSY', hcrCode: 'PSYCOGN', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Eetproblemen', code: 'PSY', hcrCode: 'PSYEETP', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Gedragsproblemen', code: 'PSY', hcrCode: 'PSYGEDR', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Persoonlijkheidsproblemen', code: 'PSY', hcrCode: 'PSYPERS', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Psychose', code: 'PSY', hcrCode: 'PSYPSYC', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Psychotraumatische klachten', code: 'PSY', hcrCode: 'PSYPSYT', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Relatie- en gezinsproblemen', code: 'PSY', hcrCode: 'PSYREL', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Seksuologische problemen', code: 'SEX', hcrCode: 'PSYSEP', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Somatoforme klachten', code: 'PSY', hcrCode: 'PSYSOMA', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Stemmingsklachten', code: 'PSY', hcrCode: 'PSYSTK', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Verslavingsproblemen', code: 'VER', hcrCode: 'PSYVERP', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' },
            { text: 'Overige zorgvragen Geestelijke gezondheidszorg', code: 'PSY', hcrCode: 'PSYOVE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth' }
        ]
    },

    // --- 7. JEUGDZORG ---
    {
        text: 'Jeugdzorg',
        code: 'JGZ',
        url: 'https://www.zorgdomein.nl/healthcare-request/youthCare/OPOOVE',
        submenu: [
            { text: 'Cognitieve ontwikkeling', code: 'JGZ', hcrCode: 'OPOCOG', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/youthCare' },
            { text: 'Gezins- en omgevingsproblemen', code: 'JGZ', hcrCode: 'OPOGEZ', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/youthCare' },
            { text: 'Opvoedingsproblemen', code: 'JGZ', hcrCode: 'OPOOOI', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/youthCare' },
            { text: 'Problemen in ouder-kind relatie', code: 'JGZ', hcrCode: 'OPOREL', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/youthCare' },
            { text: 'Verwaarlozing / mishandeling / misbruik', code: 'JGZ', hcrCode: 'OPOVMM', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/youthCare' },
            { text: 'Overige zorgvragen Jeugdzorg', code: 'JGZ', hcrCode: 'OPOOVE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/youthCare' }
        ]
    },

    // --- 8. VERPLEGING EN VERZORGING ---
    {
        text: 'Verpleging en verzorging',
        code: 'WVK',
        url: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare/VVTOVE',
        submenu: [
            { text: 'Complexe gezondheidsproblemen', code: 'WVK', hcrCode: 'VVTCOM', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare' },
            { text: 'Palliatieve zorg', code: 'INT', hcrCode: 'VVTPAL', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare' },
            { text: 'Persoonlijke verzorging', code: 'WVK', hcrCode: 'VVTPER', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare' },
            { text: 'Specialistische verpleging', code: 'WVK', hcrCode: 'VVTSPE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare' },
            { text: 'Verpleging', code: 'WVK', hcrCode: 'VVTVER', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare' },
            { text: 'Overige zorgvragen Verpleging & verzorging', code: 'WVK', hcrCode: 'VVTOVE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare' }
        ]
    },

    // --- 9. VERBLIJF EN WONEN ---
    {
        text: 'Verblijf en wonen',
        code: 'VPH',
        url: 'https://www.zorgdomein.nl/healthcare-request/stayAndLiving/VBWKOR',
        submenu: [
            { text: 'Dagbehandeling', code: 'VPH', hcrCode: 'VBWDAG', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/stayAndLiving' },
            { text: 'Kortdurend verblijf', code: 'VPH', hcrCode: 'VBWKOR', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/stayAndLiving' },
            { text: 'Langdurend verblijf', code: 'VPH', hcrCode: 'VBWLAN', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/stayAndLiving' },
            { text: 'Overige zorgvragen Verblijf & wonen', code: 'VPH', hcrCode: 'VBWOVE', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/stayAndLiving' }
        ]
    },

    // --- 10. SCEN ARTS ---
    {
        text: 'SCEN arts aanvragen',
        code: 'SCE',
        url: 'https://www.zorgdomein.nl/protocol/7d726008-4da6-44ec-87eb-ebdad54c8319'
    },

    // --- 11. HULPMIDDELEN ---
    {
        text: 'Hulpmiddelen',
        code: 'XXX',
        url: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices/HMZOVE2',
        submenu: [
            { text: 'Auditieve en visuele hulpmiddelen', code: 'OPT', hcrCode: 'HMZAUDV', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Compressie- en wondmaterialen', code: 'WVK', hcrCode: 'HMZCOMW', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Continentie- en urologische materialen', code: 'URO', hcrCode: 'HMZCONU', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Diabetesmaterialen', code: 'DBM', hcrCode: 'HMZDIAB', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Irrigatie- en stomamaterialen', code: 'CHI', hcrCode: 'HMZIRST', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Mobiliteit', code: 'ORT', hcrCode: 'HMZMOBI', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Orthesen en prothesen', code: 'ORH', hcrCode: 'HMZORPR', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Pijnbehandeling', code: 'PIJ', hcrCode: 'HMZPIJN', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Respiratoire hulpmiddelen', code: 'LNG', hcrCode: 'HMZRESP', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Verpleeghulpmiddelen', code: 'WVK', hcrCode: 'HMZVERP', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Verzorgingshulpmiddelen', code: 'WVK', hcrCode: 'HMZVERZ', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Voedings- en medicatiematerialen', code: 'DIE', hcrCode: 'HMZVDME', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Voethulpmiddelen', code: 'POT', hcrCode: 'HMZVOET', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' },
            { text: 'Overige hulpmiddelen', code: 'XXX', hcrCode: 'HMZOVE2', categoryUrl: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices' }
        ]
    }];