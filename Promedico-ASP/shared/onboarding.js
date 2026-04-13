// onboarding.js

(function () {
  const _api = typeof browser !== 'undefined' ? browser : chrome;

  const TOTAL_STEPS = 3;
  let currentStep = 1;

  // Geselecteerde waarden
  let selectedProfile = null;
  let selectedBvo     = null;
  let selectedCrp     = null;

  // ── Hulpfunctie: kaart-selectie voor een groep ────────────────────────────

  function setupChoiceCards(group, onSelect) {
    document.querySelectorAll(`.choice-card[data-group="${group}"]`).forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll(`.choice-card[data-group="${group}"]`)
          .forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        onSelect(card.dataset.value);
        updateNextButton();
      });
    });
  }

  // ── Stap 1: regio-profielen dynamisch opbouwen ───────────────────────────

  function buildProfileCards() {
    const grid = document.getElementById('profileGrid');
    PROFILES.forEach(profile => {
      const card = document.createElement('div');
      card.className = 'choice-card';
      card.dataset.group = 'profile';
      card.dataset.value = profile.id;
      card.innerHTML = `
        <div class="radio"></div>
        <div class="choice-name">${profile.name}</div>
        <div class="choice-desc">${profile.description}</div>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('.choice-card[data-group="profile"]')
          .forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedProfile = profile.id;

        // Zet BVO/CRP alvast op de profieldefault
        const p = PROFILES.find(p => p.id === profile.id);
        if (p) {
          selectedBvo = p.settings.bvoKoerier ? 'koerier' : 'zelf';
          selectedCrp = p.settings.crpPoct    ? 'poct'    : 'handmatig';
        }
        updateNextButton();
      });
      grid.appendChild(card);
    });
  }

  // ── Volgende-knop: alleen actief als huidige stap een keuze heeft ────────

  function updateNextButton() {
    const btn = document.getElementById('btnNext');
    const stepValid = {
      1: () => selectedProfile !== null,
      2: () => selectedBvo !== null,
      3: () => selectedCrp !== null,
    };
    const check = stepValid[currentStep];
    btn.disabled = check ? !check() : false;
  }

  // ── Stap tonen ────────────────────────────────────────────────────────────

  function showStep(n) {
    document.querySelectorAll('.step').forEach((el, i) => {
      el.classList.toggle('active', i + 1 === n);
    });

    const isDone  = n === TOTAL_STEPS + 1;
    const isFirst = n === 1;

    document.getElementById('btnBack').style.display =
      isFirst ? 'none' : 'inline-block';

    document.getElementById('btnNext').textContent = isDone
      ? 'Sluiten'
      : n === TOTAL_STEPS
        ? 'Opslaan & klaar'
        : 'Volgende →';

    document.getElementById('stepIndicator').textContent = isDone
      ? 'Klaar!'
      : `Stap ${n} van ${TOTAL_STEPS}`;

    const pct = Math.min(100, Math.round((n / (TOTAL_STEPS + 1)) * 100));
    document.getElementById('progressFill').style.width = pct + '%';

    // Herstel eerder gemaakte keuze zichtbaar in de kaarten
    if (n === 2 && selectedBvo) preselectCard('bvo', selectedBvo);
    if (n === 3 && selectedCrp) preselectCard('crp', selectedCrp);

    if (isDone) buildDoneList();

    updateNextButton();
  }

  function preselectCard(group, value) {
    document.querySelectorAll(`.choice-card[data-group="${group}"]`).forEach(c => {
      c.classList.toggle('selected', c.dataset.value === value);
    });
  }

  // ── Samenvatting op klaar-pagina ──────────────────────────────────────────

  function buildDoneList() {
    const profile = PROFILES.find(p => p.id === selectedProfile);
    const bvoLabel = selectedBvo === 'koerier' ? 'Koerier' : 'Geen koerier';
    const crpLabel = selectedCrp === 'poct'    ? 'POCT Connect' : 'Handmatig in O-veld';

    const items = [
      `Regio: <strong>${profile ? profile.name : '—'}</strong>`,
      `BVO: <strong>${bvoLabel}</strong>`,
      `CRP: <strong>${crpLabel}</strong>`,
    ];
    document.getElementById('doneList').innerHTML =
      items.map(i => `<li>${i}</li>`).join('');
  }

  // ── Opslaan ───────────────────────────────────────────────────────────────

  async function save() {
    const profile = PROFILES.find(p => p.id === selectedProfile) || PROFILES[0];
    await _api.storage.local.set({
      onboardingDone:     true,
      activeProfile:      profile.id,
      activeMenuFile:     profile.menuFile,
      bvoKoerier:         selectedBvo === 'koerier',
      crpPoct:            selectedCrp === 'poct',
      zdMenuCacheVersion: Date.now(), // forceert herlaad van menu-bestand in content script
    });
  }

  // ── Knop-handlers ─────────────────────────────────────────────────────────

  document.getElementById('btnNext').addEventListener('click', async () => {
    if (currentStep > TOTAL_STEPS) {
      window.close();
      return;
    }
    if (currentStep === TOTAL_STEPS) {
      await save();
      currentStep = TOTAL_STEPS + 1;
      showStep(currentStep);
      return;
    }
    currentStep++;
    showStep(currentStep);
  });

  document.getElementById('btnBack').addEventListener('click', () => {
    if (currentStep > 1) { currentStep--; showStep(currentStep); }
  });

  // ── Init ──────────────────────────────────────────────────────────────────

  buildProfileCards();
  setupChoiceCards('bvo', v => { selectedBvo = v; });
  setupChoiceCards('crp', v => { selectedCrp = v; });

  showStep(1);
  document.getElementById('btnNext').disabled = true;

})();