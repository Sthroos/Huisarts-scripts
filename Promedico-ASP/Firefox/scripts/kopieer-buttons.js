(function() {
    'use strict';

    function extractPhoneNumber(text) {
        if (!text) return null;

        // Remove any text in parentheses like (zoon), (moeder), etc.
        text = text.replace(/\([^)]*\)/g, '').trim();

        // Extract phone number pattern: optional +, followed by digits, spaces, or hyphens
        const phoneMatch = text.match(/(\+?\d[\d\s-]+)/);

        if (phoneMatch) {
            // Return the matched number, keeping the + if it exists
            return phoneMatch[1].trim();
        }

        return null;
    }

    function extractEmail(text) {
        if (!text) return null;

        // Extract email pattern
        const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);

        if (emailMatch) {
            return emailMatch[1].trim();
        }

        return null;
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

            // Copy to clipboard
            navigator.clipboard.writeText(value).then(() => {
                // Visual feedback
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

    function addCopyPhoneButton() {
        // Find all phone links (they have id starting with "callTelefoonnummer")
        const phoneLinks = document.querySelectorAll('a[id^="callTelefoonnummer"]');

        phoneLinks.forEach(link => {
            // Check if button already exists
            if (link.parentElement.querySelector('.copy-phone-btn')) {
                return;
            }

            // Get the phone number from the link text
            const phoneText = link.textContent.trim();
            const phoneNumber = extractPhoneNumber(phoneText);

            if (phoneNumber) {
                const copyBtn = createCopyButton(phoneNumber, 'phone');
                link.after(copyBtn);
                console.log('Copy phone button added for:', phoneNumber);
            }
        });
    }

    function addCopyEmailButton() {
        // Find all email spans with envelope icon
        const emailSpans = document.querySelectorAll('span[title="Mailen"]');

        emailSpans.forEach(span => {
            // Check if button already exists
            if (span.parentElement.querySelector('.copy-email-btn')) {
                return;
            }

            // Get the email from the span text
            const emailText = span.textContent.trim();
            const email = extractEmail(emailText);

            if (email) {
                const copyBtn = createCopyButton(email, 'email');
                span.after(copyBtn);
                console.log('Copy email button added for:', email);
            }
        });
    }

    function addCopyBSNButton() {
        // Find all BSN spans with class GEM3CPJDOIC
        const bsnSpans = document.querySelectorAll('span.GEM3CPJDOIC');

        bsnSpans.forEach(span => {
            // Check if button already exists
            if (span.parentElement.querySelector('.copy-bsn-btn')) {
                return;
            }

            // Get the BSN number from the span text
            const bsn = span.textContent.trim();

            // Basic validation: BSN should be numeric and typically 8-9 digits
            if (bsn && /^\d{8,9}$/.test(bsn)) {
                const copyBtn = createCopyButton(bsn, 'bsn');
                span.after(copyBtn);
                console.log('Copy BSN button added for:', bsn);
            }
        });
    }

    function addCopyAddressButton() {
        // Find the address div by ID
        const addressDiv = document.getElementById('PanelPatientDossierBarCore-lblPersoonAddressInfo');

        if (addressDiv) {
            // Check if button already exists
            if (addressDiv.querySelector('.copy-address-btn')) {
                return;
            }

            // Get the address from the div text
            const address = addressDiv.textContent.trim();

            if (address) {
                const copyBtn = createCopyButton(address, 'address');
                addressDiv.appendChild(copyBtn);
                console.log('Copy address button added for:', address);
            }
        }
    }

    function addAllCopyButtons() {
        addCopyPhoneButton();
        addCopyEmailButton();
        addCopyBSNButton();
        addCopyAddressButton();
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addAllCopyButtons);
    } else {
        addAllCopyButtons();
    }

    // Also run after delays in case content loads dynamically
    setTimeout(addAllCopyButtons, 1000);
    setTimeout(addAllCopyButtons, 2000);
    setTimeout(addAllCopyButtons, 3000);

    // Watch for dynamic changes
    const observer = new MutationObserver(() => {
        addAllCopyButtons();
    });

    // Start observing after a short delay
    setTimeout(() => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }, 500);
})();
