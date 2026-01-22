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
});
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
    function showZorgdomeinMenu() {
        const iframe = getContentIframe();
        if (!iframe || !iframe.contentDocument) return;

        const doc = iframe.contentDocument;

        const existingMenu = doc.getElementById('zorgdomein-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const zorgdomeinButton = doc.getElementById('zorgdomein-button');
        if (!zorgdomeinButton) return;

        const buttonRect = zorgdomeinButton.getBoundingClientRect();

const items = [
    // --- 1. DIAGNOSTIEK ---
    {
        text: 'Diagnostiek',
        code: 'DGN',
        url: 'https://www.zorgdomein.nl/healthcare-request/diagnostics',
        submenu: [
            {
                text: 'Lab',
                code: 'LAB',
                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/51d786ec-f6e1-4a9e-ae56-b485c498866f',
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
                url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=cfc4fbf6-60b5-4ef2-bd40-bb17fdf93457',
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
            {
                text: 'Echo',
                code: 'ECH',
                url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=00d59326-9d5a-4821-b598-6c7f153d6f39',
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
                url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=958e23ca-77ed-47a3-a0ea-eebb270917de',
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
                url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=6c746eef-afa0-47e4-bca8-5303e18376a9',
                submenu: [
                    { text: 'Gastroscopie', code: 'MDL', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f4fb0ec7-3034-4c86-b359-73add40418ab' },
                    { text: 'Gastroscopie (onder sedatie)', code: 'MDL', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/fbec7544-63be-432b-96b5-692f93065b72' },
                    { text: 'Sigmoïdoscopie', code: 'MDL', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2be48322-241d-42db-84df-53151e377b8a' }
                ]
            },
            {
                text: 'Nucleaire Geneeskunde',
                code: 'NUC',
                url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=a3d3cb5c-52ce-4bfd-a27d-78403cf515e3',
                submenu: [
                    { text: 'Scintigrafie', code: 'NUC', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a4df1128-6928-4c8d-b98f-52814214bf3a' },
                    { text: 'DEXA', code: 'NUC', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/95bf3841-3715-4d2a-946c-e6e1c79ef148' }
                ]
            }
        ]
    },

    // --- 2. PARAMEDISCHE ZORG ---
    {
        text: 'Paramedische zorg',
        code: 'PAZ',
        url: 'https://www.zorgdomein.nl/healthcare-request/paramedicalCare',
        submenu: [
            { text: 'Diëtetiek', code: 'PAZDIE', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=42e12f32-4337-4f87-ae9c-80395225b82c' },
            { text: 'Ergotherapie', code: 'PAZERG', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=e416fc6b-b7eb-4671-bbad-d260552e28de' },
            { text: 'Fysio- en oefentherapie', code: 'PAZFOT', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=6049bd0e-2e3a-465d-b7d0-4fec63ace267' },
            { text: 'Huidtherapie', code: 'PAZHUI', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=c848781e-01c3-4712-a71e-45de1c9db06a' },
            { text: 'Logopedie', code: 'PAZLOG', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=078ed1fc-f065-4600-b644-9156281800d1' },
            { text: 'Optometrie / orthoptie', code: 'PAZOPT', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=ffcff372-2788-4180-afc6-6878d5151af4' },
            { text: 'Podotherapie', code: 'PAZPOD', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=0ed98ea6-d7c1-4309-b867-de4e7067e9e2' },
            { text: 'Verloskunde', code: 'PAZVLK', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=e1b33f03-91cf-47dc-9e24-dff586094d4c' }
        ]
    },

    // --- 3. MEEDENKADVIES / VERWIJZEN ---
    {
        text: 'Meedenkadvies / Verwijzen',
        code: 'XXX',
        url: 'https://www.zorgdomein.nl/healthcare-request/medicalCare',
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

    // --- 4. AANVULLENDE ZORG ---
    {
        text: 'Aanvullende zorg',
        code: 'AVZ',
        url: 'https://www.zorgdomein.nl/healthcare-request/additionalCare',
        submenu: [
            { text: 'Leefstijlcoaching', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=0a1be68c-2c9e-4b13-900f-ac3c4a0da3f4' },
            { text: 'Overgangsconsulent', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=31d649b3-1f80-41a6-b833-c295fd9f583a' },
            { text: 'Pedicure', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=62aed695-8e31-487e-ac4e-738dcb533144' }
        ]
    },

    // --- 5. GEESTELIJKE GEZONDHEIDSZORG ---
    {
        text: 'Geestelijke gezondheidszorg',
        code: 'GGZ',
        url: 'https://www.zorgdomein.nl/healthcare-request/psychiatryMentalHealth/PSYOVE',
        submenu: [
            { text: 'ADHD', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=cfa4f0d0-3af2-4174-899a-4ad8a387836c' },
            { text: 'Angstklachten', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=a880f297-680d-4f8a-9085-0feeae488ac6' },
            { text: 'Autisme', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=49fe3e07-dcdf-43f3-9e93-35df5c4c8bce' },
            { text: 'Cognitieve problemen (o.a. dementie)', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=51abc542-f144-4b1d-a0aa-1ecbaa8324ce' },
            { text: 'Eetproblemen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=175a1b71-9fc3-4fab-80ec-9b447e581232' },
            { text: 'Gedragsproblemen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=e270826c-4d1d-4708-9231-1d12627f27b9' },
            { text: 'Persoonlijkheidsproblemen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=e802d17b-53ef-46e8-ae59-e4c9d142c3b3' },
            { text: 'Psychose', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=efacc43b-a810-4d2c-82a1-cf5565c39709' },
            { text: 'Psychotraumatische klachten', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=c8e21b68-bffe-4a20-8383-006d2c6eabea' },
            { text: 'Relatie- en gezinsproblemen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=b635f44f-1198-4f0d-8575-cddd2165436b' },
            { text: 'Seksuologische problemen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=6a138349-16c1-4006-b26d-0f012ef92fbb' },
            { text: 'Somatoforme klachten', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=de26054e-e8d8-447c-ae37-a03eef56fb8e' },
            { text: 'Stemmingsklachten', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=9e117ccf-382c-43a8-9f9c-989b3533ddfc' },
            { text: 'Verslavingsproblemen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=2ef663a4-47ab-4f5c-9ef9-e0be37dffb0d' },
            { text: 'Overige zorgvragen Geestelijke gezondheidszorg', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=d8190f53-0ce4-4206-8ce6-23c3083f69f6' }
        ]
    },

    // --- 6. JEUGDZORG ---
    {
        text: 'Jeugdzorg',
        code: 'JGZ',
        url: 'https://www.zorgdomein.nl/healthcare-request/youthCare/OPOOVE',
        submenu: [
            { text: 'Cognitieve ontwikkeling', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=53b283ee-cf15-4b61-89f1-04fc29127b9d' },
            { text: 'Gezins- en omgevingsproblemen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=863d01c0-81c1-4a36-bcff-728fa592b2a8' },
            { text: 'Opvoedingsproblemen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=76e6bfde-367e-4ae5-9fd4-a84996367a88' },
            { text: 'Problemen in ouder-kind relatie', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=e753ef97-af50-4837-b3a3-8864f52869e3' },
            { text: 'Verwaarlozing / mishandeling / misbruik', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=caf72f06-86c3-4a8c-81e9-a0a4c1f37cd7' },
            { text: 'Overige zorgvragen Jeugdzorg', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=eddca9bb-3329-4b24-b6b4-a5924dfd72ad' }
        ]
    },

    // --- 7. VERPLEGING EN VERZORGING ---
    {
        text: 'Verpleging en verzorging',
        code: 'VVT',
        url: 'https://www.zorgdomein.nl/healthcare-request/nursingCareAndHomeCare/VVTOVE',
        submenu: [
            { text: 'Complexe gezondheidsproblemen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=8dfd2da8-2fa7-46b1-805f-395524a9242c' },
            { text: 'Palliatieve zorg', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=5f42e23b-c6df-4afb-9a7f-850dba9bd830' },
            { text: 'Persoonlijke verzorging', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=f3b3fe06-039f-4d7d-b1c0-30331987f054' },
            { text: 'Specialistische verpleging', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=b5f2f257-be4f-429d-82c3-c923a030ff55' },
            { text: 'Verpleging', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=10223d2c-c754-4778-b32a-57bb6d98cf0c' },
            { text: 'Overige zorgvragen Verpleging & verzorging', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=7b9a08c8-00cc-453d-9bb2-7134bd2d49ef' }
        ]
    },

    // --- 8. VERBLIJF EN WONEN ---
    {
        text: 'Verblijf en wonen',
        code: 'VBW',
        url: 'https://www.zorgdomein.nl/healthcare-request/stayAndLiving/VBWKOR',
        submenu: [
            { text: 'Dagbehandeling', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=b178414a-268c-497e-b042-1447b4022fa2' },
            { text: 'Kortdurend verblijf', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=762e6b89-c6a8-44f8-8936-c79f2b21a49a' },
            { text: 'Langdurend verblijf', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=070c8a5c-bfcc-47de-864a-97f98bb0c1bc' },
            { text: 'Overige zorgvragen Verblijf & wonen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=a375cb76-bc1e-4817-88f7-152defd77cd3' }
        ]
    },

    // --- 9. HULPMIDDELEN ---
    {
        text: 'Hulpmiddelen',
        code: 'HMZ',
        url: 'https://www.zorgdomein.nl/healthcare-request/assistiveDevices/HMZOVE2',
        submenu: [
            { text: 'Auditieve en visuele hulpmiddelen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=26dc7eff-ca33-4d96-a9fc-e39a293f7d3b' },
            { text: 'Compressie- en wondmaterialen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=f3cd08c5-caef-4fb1-99ed-3036c38542dd' },
            { text: 'Continentie- en urologische materialen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=ba6de09f-e970-408d-b6fb-a96adda21679' },
            { text: 'Diabetesmaterialen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=4a9c22de-338a-49ab-b60a-bdd28d0a87db' },
            { text: 'Irrigatie- en stomamaterialen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=eb35ed6f-ca56-4150-8e29-11de0f05fe8e' },
            { text: 'Mobiliteit', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=af88c707-38de-446f-a348-9208caa717b0' },
            { text: 'Orthesen en prothesen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=44bea61d-1f0a-40cf-934b-8217236e4614' },
            { text: 'Pijnbehandeling', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=b90d6593-7e2c-40b7-854c-cde971a00a86' },
            { text: 'Respiratoire hulpmiddelen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=fdffda18-4796-4532-8586-a2efa0ee0c04' },
            { text: 'Verpleeghulpmiddelen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=1979152e-2b7e-41aa-8253-ad7bc53e6c87' },
            { text: 'Verzorgingshulpmiddelen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=6a3b4454-956d-44c5-b957-bd767f453ec3' },
            { text: 'Voedings- en medicatiematerialen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=8bc50b31-9b1f-497d-8551-e0d5af760a82' },
            { text: 'Voethulpmiddelen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=a51cd651-f7bd-4251-8d28-47778eefc149' },
            { text: 'Overige hulpmiddelen', code: '', url: 'https://www.zorgdomein.nl/supply-matcher/supply?flowId=f7aac6f0-43e4-45d1-b3e1-94c5f05603eb' }
        ]
    }
];

        const menu = doc.createElement('table');
        menu.id = 'zorgdomein-menu';
        menu.cellPadding = '0';
        menu.cellSpacing = '0';

        const tbody = doc.createElement('tbody');

        items.forEach(item => {
            const tr = doc.createElement('tr');
            const menuItem = createMenuItem(doc, item.text, item.submenu, item.code, item.url);
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
    function createMenuItem(doc, text, submenu, code, url) {
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

            navigateToZorgDomein(code, url, () => {});
        });

        return item;
    }

    // Show submenu - UPDATED to support sub-submenus
// Show submenu - UPDATED met betere marges en eerder multi-kolom
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

    // Verbeterde multi-column logica - eerder meerdere kolommen
    const BOTTOM_MARGIN = 40; // Meer marge aan de onderkant
    const TOP_MARGIN = 20;
    const itemHeight = 31;

    // Bereken beschikbare ruimte
    const maxAvailableHeight = viewportHeight - TOP_MARGIN - BOTTOM_MARGIN;
    const maxItemsPerColumn = Math.floor(maxAvailableHeight / itemHeight);

    // Bepaal aantal kolommen - eerder overschakelen naar meerdere kolommen
    let numColumns = 1;
    let itemsPerColumn = items.length;

    if (items.length > maxItemsPerColumn) {
        // Te veel items voor 1 kolom
        numColumns = Math.ceil(items.length / maxItemsPerColumn);
        itemsPerColumn = Math.ceil(items.length / numColumns);
    } else if (items.length > 12) {
        // Bij meer dan 12 items, gebruik 2 kolommen voor betere leesbaarheid
        numColumns = 2;
        itemsPerColumn = Math.ceil(items.length / 2);
    }

    const submenuWidth = numColumns * 200;
    const submenuHeight = Math.min(itemsPerColumn * itemHeight, maxAvailableHeight);

    // Bereken positie met betere marges
    const spaceBelow = viewportHeight - parentRect.top - BOTTOM_MARGIN;
    const spaceAbove = parentRect.bottom - TOP_MARGIN;
    const spaceRight = viewportWidth - parentRect.right - 10;

    let topPosition;
    let leftPosition = parentRect.right + 5;

    // Verticale positionering met marges
    if (spaceBelow >= submenuHeight) {
        // Genoeg ruimte onder
        topPosition = parentRect.top;
    } else if (spaceAbove >= submenuHeight) {
        // Genoeg ruimte boven
        topPosition = Math.max(TOP_MARGIN, parentRect.bottom - submenuHeight);
    } else {
        // Niet genoeg ruimte boven of onder - center in beschikbare ruimte
        const totalAvailable = viewportHeight - TOP_MARGIN - BOTTOM_MARGIN;
        topPosition = TOP_MARGIN + Math.max(0, (totalAvailable - submenuHeight) / 2);
    }

    // Horizontale positionering - check of er genoeg ruimte rechts is
    if (spaceRight < submenuWidth) {
        // Niet genoeg ruimte rechts, probeer links
        leftPosition = parentRect.left - submenuWidth - 5;
        if (leftPosition < 10) {
            // Ook niet genoeg ruimte links, forceer rechts maar met margin
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
        // Multi-column layout
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
                    // Empty cell
                    const emptyTd = doc.createElement('td');
                    emptyTd.style.width = '200px';
                    tr.appendChild(emptyTd);
                }
            }

            tbody.appendChild(tr);
        }
    } else {
        // Single column layout
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

    // Helper function to create submenu items - UPDATED to support sub-submenus
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
            // If this item has a submenu, show it at the next level
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

            // Remove all submenus
            const allSubmenus = doc.querySelectorAll('[id^="zorgdomein-submenu"]');
            allSubmenus.forEach(sm => sm.remove());

            navigateToZorgDomein(item.code, item.url, () => {});
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
