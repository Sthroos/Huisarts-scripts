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
    `;
    document.head.appendChild(style);

    let hideTimeout = null;
    let lastTriggeredWord = '';

    function showFlyover(inputElement, message, triggerWord = '') {
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

            // Check of COPD aanwezig is
            if (currentValue.includes('copd')) {
                showFlyover(
                    planVeld,
                    'Hoort deze patient in ketenzorg?',
                    'copd'
                );
            }
            // Als het woord verwijderd is, reset de trigger
            else if (!currentValue.includes('copd')) {
                if (lastTriggeredWord === 'copd') {
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