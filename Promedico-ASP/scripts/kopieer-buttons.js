(function() {
    'use strict';

    // Eenmalig geladen bij script-start; bepaalt of de belknop getoond wordt
    // én of Promedico's eigen belicoontje verborgen moet worden.
    let teleqBellenEnabled = true;
    window.chrome.storage.local.get('teleqBellenEnabled', function(result) {
        teleqBellenEnabled = result.teleqBellenEnabled !== false;
    });

    function extractPhoneNumber(text) {
        if (!text) return null;
        text = text.replace(/\([^)]*\)/g, '').trim();
        const phoneMatch = text.match(/(\+?\d[\d\s-]+)/);
        if (phoneMatch) return phoneMatch[1].trim();
        return null;
    }

    function extractEmail(text) {
        if (!text) return null;
        const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
        if (emailMatch) return emailMatch[1].trim();
        return null;
    }

    function addCopyBirthdateButton() {
        const infoDiv = document.getElementById('PanelPatientDossierBarCore-lblPatientPersonalInfo');
        if (!infoDiv) return;
        if (infoDiv.querySelector('.copy-birthdate-btn')) return;

        const text = infoDiv.textContent;
        const match = text.match(/(\d{2}-\d{2}-\d{4})/);
        if (!match) return;

        const birthdate = match[1];
        const textNodes = Array.from(infoDiv.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
        const dateNode = textNodes.find(n => n.textContent.includes(birthdate));
        if (!dateNode) return;

        const pos = dateNode.textContent.indexOf(birthdate) + birthdate.length;
        const after = dateNode.splitText(pos);

        const copyBtn = createCopyButton(birthdate, 'birthdate');
        after.before(copyBtn);
    }

    function createCopyButton(value, type) {
        const copyBtn = document.createElement('button');
        copyBtn.className = `copy-${type}-btn`;
        copyBtn.innerHTML = '📋';

        let label = 'nummer';
        if (type === 'phone') label = 'telefoonnummer';
        else if (type === 'email') label = 'e-mailadres';
        else if (type === 'bsn') label = 'BSN';
        else if (type === 'address') label = 'adres';
        else if (type === 'birthdate') label = 'geboortedatum';

        copyBtn.title = `Kopieer ${label}: ${value}`;
        copyBtn.style.cssText = `
            margin-left: 5px;
            padding: 2px 6px;
            border: 1px solid #ccc;
            background: #f0f0f0;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            vertical-align: middle;
        `;

        copyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            navigator.clipboard.writeText(value).then(() => {
                const originalContent = copyBtn.innerHTML;
                copyBtn.innerHTML = '✓';
                copyBtn.style.background = '#90EE90';

                setTimeout(() => {
                    copyBtn.innerHTML = originalContent;
                    copyBtn.style.background = '#f0f0f0';
                }, 1000);
            }).catch(err => {
                console.error(`Failed to copy ${type}:`, err);
                alert(`Kon ${label} niet kopiëren`);
            });
        });

        return copyBtn;
    }

    function createBelButton(nummer) {
        const belBtn = document.createElement('button');
        belBtn.className = 'bel-teleq-btn';
        belBtn.innerHTML = '📞';
        belBtn.title = `Bel ${nummer} via TeleQ`;
        belBtn.style.cssText = `
            margin-left: 3px;
            padding: 2px 6px;
            border: 1px solid #ccc;
            background: #f0f0f0;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            vertical-align: middle;
        `;

        belBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            belBtn.disabled = true;
            belBtn.innerHTML = '…';

            window.promedicoHelper.bellen(nummer).then(() => {
                belBtn.innerHTML = '📨'; // verstuurd — het daadwerkelijke bellen gebeurt in TeleQ zelf
                belBtn.style.background = '#cfe8ff';
            }).catch(err => {
                console.error('Bellen via TeleQ mislukt:', err);
                belBtn.innerHTML = '✕';
                belBtn.style.background = '#f8a0a0';
                alert(`Bellen mislukt: ${err.message}`);
            }).finally(() => {
                setTimeout(() => {
                    belBtn.innerHTML = '📞';
                    belBtn.style.background = '#f0f0f0';
                    belBtn.disabled = false;
                }, 2000);
            });
        });

        return belBtn;
    }

    function addCopyPhoneButton() {
        const phoneLinks = document.querySelectorAll('a[id^="callTelefoonnummer"]');

        phoneLinks.forEach(link => {
            if (teleqBellenEnabled) {
                const nativeIcon = link.querySelector('i.fa-phone');
                if (nativeIcon) nativeIcon.style.display = 'none';
            }

            if (link.parentElement.querySelector('.copy-phone-btn')) return;

            const phoneText = link.textContent.trim();
            const phoneNumber = extractPhoneNumber(phoneText);

            if (phoneNumber) {
                const copyBtn = createCopyButton(phoneNumber, 'phone');
                link.after(copyBtn);
                if (teleqBellenEnabled) {
                    const belBtn = createBelButton(phoneNumber);
                    copyBtn.after(belBtn);
                }
            }
        });
    }

    function addCopyEmailButton() {
        const emailSpans = document.querySelectorAll('span[title="Mailen"]');

        emailSpans.forEach(span => {
            if (span.parentElement.querySelector('.copy-email-btn')) return;

            const emailText = span.textContent.trim();
            const email = extractEmail(emailText);

            if (email) {
                const copyBtn = createCopyButton(email, 'email');
                span.after(copyBtn);
            }
        });
    }

    // ── BSN elfproef (11-proef) ──────────────────────────────────────────────
    function geldigBSN(bsn) {
        if (!/^\d{8,9}$/.test(bsn)) return false;
        const cijfers = bsn.length === 8 ? '0' + bsn : bsn;
        const gewichten = [9, 8, 7, 6, 5, 4, 3, 2, -1];
        const som = cijfers.split('').reduce((acc, c, i) => acc + parseInt(c, 10) * gewichten[i], 0);
        return som !== 0 && som % 11 === 0;
    }

    function addCopyBSNButton() {
        const bsnSpans = document.querySelectorAll('span.GEM3CPJDOIC');

        bsnSpans.forEach(span => {
            if (span.parentElement.querySelector('.copy-bsn-btn')) return;

            const bsn = span.textContent.trim();

            if (bsn && geldigBSN(bsn)) {
                const copyBtn = createCopyButton(bsn, 'bsn');
                span.after(copyBtn);
            }
        });
    }

    function addCopyAddressButton() {
        const addressDiv = document.getElementById('PanelPatientDossierBarCore-lblPersoonAddressInfo');

        if (addressDiv) {
            if (addressDiv.querySelector('.copy-address-btn')) return;

            const address = addressDiv.textContent.trim();

            if (address) {
                const copyBtn = createCopyButton(address, 'address');
                addressDiv.appendChild(copyBtn);
            }
        }
    }

    function addAllCopyButtons() {
        addCopyBirthdateButton();
        addCopyPhoneButton();
        addCopyEmailButton();
        addCopyBSNButton();
        addCopyAddressButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addAllCopyButtons);
    } else {
        addAllCopyButtons();
    }

    setTimeout(addAllCopyButtons, 1000);
    setTimeout(addAllCopyButtons, 2000);
    setTimeout(addAllCopyButtons, 3000);

    const observer = new MutationObserver(() => {
        addAllCopyButtons();
    });

    setTimeout(() => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }, 500);
})();
