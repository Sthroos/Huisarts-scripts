(function() {
    'use strict';

    // Voeg CSS animaties toe
    const style = document.createElement('style');
    style.textContent = `
        @keyframes flyoverFadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes flyoverFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        .plan-flyover {
            position: fixed;
            background-color: #fffbcc;
            border: 1px solid #e6db55;
            padding: 10px 15px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 13px;
            max-width: 400px;
            animation: flyoverFadeIn 0.3s ease-in;
        }
        .plan-flyover a {
            margin-left: 10px;
            color: #0066cc;
            text-decoration: underline;
            cursor: pointer;
        }
        .plan-flyover a:hover {
            color: #004499;
        }
    `;
    document.head.appendChild(style);

    let hideTimeout = null;
    let lastTriggeredWord = '';

    function showFlyover(inputElement, message, linkUrl = null, linkText = null, triggerWord = '') {
        // Don't show again if already showing for this word
        if (lastTriggeredWord === triggerWord && document.querySelector('.plan-flyover')) {
            return;
        }

        lastTriggeredWord = triggerWord;

        // Clear any existing hide timeout
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        // Verwijder bestaande flyover
        const existingFlyover = document.querySelector('.plan-flyover');
        if (existingFlyover) {
            existingFlyover.remove();
        }

        // Maak nieuwe flyover
        const flyover = document.createElement('div');
        flyover.className = 'plan-flyover';

        // Voeg bericht toe
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        flyover.appendChild(messageSpan);

        // Voeg link toe indien aanwezig
        if (linkUrl && linkText) {
            flyover.appendChild(document.createTextNode(' '));
            const link = document.createElement('a');
            link.href = linkUrl;
            link.textContent = linkText;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            flyover.appendChild(link);
        }

        // Positioneer onder het inputveld
        const rect = inputElement.getBoundingClientRect();
        flyover.style.left = rect.left + 'px';
        flyover.style.top = (rect.bottom + 5) + 'px';

        document.body.appendChild(flyover);

        // Function to start hide timer
        function startHideTimer() {
            // Clear existing timeout
            if (hideTimeout) {
                clearTimeout(hideTimeout);
            }

            // Start new timeout
            hideTimeout = setTimeout(() => {
                if (flyover.parentNode) {
                    flyover.style.animation = 'flyoverFadeOut 0.3s ease-out';
                    setTimeout(() => {
                        if (flyover.parentNode) {
                            flyover.remove();
                            lastTriggeredWord = '';
                        }
                    }, 300);
                }
            }, 5000);
        }

        // Stop hide timer when mouse enters
        flyover.addEventListener('mouseenter', () => {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
        });

        // Restart hide timer when mouse leaves
        flyover.addEventListener('mouseleave', () => {
            startHideTimer();
        });

        // Start initial hide timer
        startHideTimer();
    }

    // Wacht tot veld beschikbaar is
    function initPlanHelper() {
        const planVeld = document.getElementById('contactForm.regelP');

        if (!planVeld) {
            setTimeout(initPlanHelper, 500);
            return;
        }

        planVeld.addEventListener('input', function(e) {
            const currentValue = planVeld.value.toLowerCase();

            // Check DIRECT of trigger woord aanwezig is (geen delay!)

            // Liraglutide / Saxenda
            if (currentValue.includes('liraglutide') || currentValue.includes('saxenda')) {
                showFlyover(
                    planVeld,
                    'Vergeet ZN formulier niet!',
                    'https://www.zn.nl/znform/saxenda-liraglutide-artsenverklaring/',
                    'Open formulier',
                    'saxenda'
                );
            }
            // Als het woord verwijderd is, reset de trigger
            else if (!currentValue.includes('liraglutide') && !currentValue.includes('saxenda')) {
                if (lastTriggeredWord === 'saxenda') {
                    const existingFlyover = document.querySelector('.plan-flyover');
                    if (existingFlyover) {
                        existingFlyover.remove();
                    }
                    lastTriggeredWord = '';
                    if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        hideTimeout = null;
                    }
                }
            }
        });
    }

    // Start de helper
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlanHelper);
    } else {
        initPlanHelper();
    }

})();
