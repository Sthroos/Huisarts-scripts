// onboarding.js

(function () {
  var _api = typeof browser !== 'undefined' ? browser : chrome;

  var TOTAL_STEPS = 3;
  var currentStep = 1;

  var selectedInstellingen = []; // array van instelling-IDs
  var selectedBvo = null;
  var selectedCrp = null;

  // ── Toast ─────────────────────────────────────────────────────────────────

  function showToast(message, type) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.className = 'toast'; }, 3000);
  }

  // ── Export ────────────────────────────────────────────────────────────────

  async function exportSettings() {
    var settings = await _api.storage.local.get();
    var json = JSON.stringify(settings, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'promedico-helper-instellingen.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Instellingen geexporteerd', 'success');
  }

  // ── Import ────────────────────────────────────────────────────────────────

  function triggerImport() {
    document.getElementById('importFileInput').click();
  }

  async function handleImportFile(file) {
    if (!file) return;
    try {
      var text = await file.text();
      var settings = JSON.parse(text);
      if (typeof settings !== 'object' || Array.isArray(settings)) throw new Error('Ongeldig formaat');
      await _api.storage.local.set(settings);
      showImportSuccess();
    } catch (e) {
      showToast('Importeren mislukt: controleer het bestand', 'error');
    }
  }

  function showImportSuccess() {
    var html = '';
    html += '<div class="card-header">';
    html += '<h1>Promedico ASP Helper</h1>';
    html += '<p>Instellingen importeren</p>';
    html += '<div class="progress-bar"><div class="progress-fill" style="width:100%"></div></div>';
    html += '</div>';
    html += '<div style="padding:40px 32px;text-align:center;">';
    html += '<div style="font-size:52px;margin-bottom:16px;">&#9989;</div>';
    html += '<h2 style="font-size:18px;color:#1a1a1a;margin-bottom:10px;">Instellingen geimporteerd</h2>';
    html += '<p style="font-size:13px;color:#555;line-height:1.6;max-width:380px;margin:0 auto;">';
    html += 'Alle instellingen zijn opgeslagen.<br>';
    html += 'Herlaad Promedico ASP als dit tabblad open stond om de wijzigingen te activeren.';
    html += '</p>';
    html += '<button id="btnImportClose" style="margin-top:28px;padding:10px 28px;background:#1565c0;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;">Sluiten</button>';
    html += '</div>';
    document.querySelector('.card').innerHTML = html;
    document.getElementById('btnImportClose').addEventListener('click', function () {
      _api.tabs.getCurrent(function (tab) { _api.tabs.remove(tab.id); });
    });
  }

  // ── Stap 1: instelling-lijst bouwen ──────────────────────────────────────

  function getProvincieLijst() {
    var provincieset = {};
    ZORGDOMEIN_INSTELLINGEN.forEach(function (inst) {
      inst.provincie.split(',').forEach(function (p) {
        var pTrimmed = p.trim();
        if (pTrimmed) provincieset[pTrimmed] = true;
      });
    });
    return Object.keys(provincieset).sort();
  }

  function buildProvincieFilter() {
    var select = document.getElementById('provincieFilter');
    getProvincieLijst().forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      select.appendChild(opt);
    });
  }

  function buildInstellingList() {
    var zoek      = document.getElementById('instellingZoek').value.toLowerCase().trim();
    var typeFilter = document.getElementById('instellingFilter').value;
    var provFilter = document.getElementById('provincieFilter').value;
    var container  = document.getElementById('instellingList');

    var gefilterd = ZORGDOMEIN_INSTELLINGEN.filter(function (inst) {
      if (typeFilter && inst.type !== typeFilter) return false;
      if (provFilter && inst.provincie.indexOf(provFilter) === -1) return false;
      if (zoek && inst.naam.toLowerCase().indexOf(zoek) === -1) return false;
      return true;
    });

    // Groepeer op type
    var groepen = { ziekenhuis: [], laboratorium: [], overig: [] };
    gefilterd.forEach(function (inst) {
      if (groepen[inst.type]) groepen[inst.type].push(inst);
      else groepen.overig.push(inst);
    });

    var labelMap = { ziekenhuis: 'Ziekenhuizen', laboratorium: 'Laboratoria', overig: 'Overig' };
    var html = '';

    ['ziekenhuis', 'laboratorium', 'overig'].forEach(function (type) {
      var lijst = groepen[type];
      if (!lijst.length) return;
      html += '<div class="instelling-group-header">' + labelMap[type] + '</div>';
      lijst.forEach(function (inst) {
        var checked = selectedInstellingen.indexOf(inst.id) !== -1;
        html += '<label class="instelling-item' + (checked ? ' checked' : '') + '" data-id="' + inst.id + '">';
        html += '<input type="checkbox"' + (checked ? ' checked' : '') + ' data-id="' + inst.id + '">';
        html += '<span class="instelling-item-name">' + inst.naam + '</span>';
        html += '<span class="instelling-item-provincie">' + inst.provincie + '</span>';
        html += '</label>';
      });
    });

    if (!gefilterd.length) {
      html = '<div class="instelling-empty">Geen instellingen gevonden</div>';
    }

    container.innerHTML = html;

    // Vink-handlers
    container.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = cb.dataset.id;
        var label = cb.closest('.instelling-item');
        if (cb.checked) {
          if (selectedInstellingen.indexOf(id) === -1) selectedInstellingen.push(id);
          if (label) label.classList.add('checked');
        } else {
          selectedInstellingen = selectedInstellingen.filter(function (i) { return i !== id; });
          if (label) label.classList.remove('checked');
        }
        updateCount();
      });
    });

    updateCount();
  }

  function updateCount() {
    var el = document.getElementById('instellingCount');
    if (selectedInstellingen.length === 0) {
      el.innerHTML = 'Niets geselecteerd — het generieke Zorgdomein menu wordt gebruikt.';
    } else {
      el.innerHTML = '<strong>' + selectedInstellingen.length + '</strong> instelling' + (selectedInstellingen.length === 1 ? '' : 'en') + ' geselecteerd.';
    }
  }

  // ── Keuzekaarten (BVO / CRP) ──────────────────────────────────────────────

  function setupChoiceCards(group, onSelect) {
    document.querySelectorAll('.choice-card[data-group="' + group + '"]').forEach(function (card) {
      card.addEventListener('click', function () {
        document.querySelectorAll('.choice-card[data-group="' + group + '"]')
          .forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        onSelect(card.dataset.value);
        updateNextButton();
      });
    });
  }

  function preselectCard(group, value) {
    document.querySelectorAll('.choice-card[data-group="' + group + '"]').forEach(function (c) {
      c.classList.toggle('selected', c.dataset.value === value);
    });
  }

  // ── Volgende-knop ─────────────────────────────────────────────────────────

  function updateNextButton() {
    var btn = document.getElementById('btnNext');
    // Stap 1 (instellingen) altijd door te gaan — niets selecteren is ook geldig
    var stepValid = {
      1: function () { return true; },
      2: function () { return selectedBvo !== null; },
      3: function () { return selectedCrp !== null; },
    };
    var check = stepValid[currentStep];
    btn.disabled = check ? !check() : false;
  }

  // ── Stap tonen ────────────────────────────────────────────────────────────

  function showStep(n) {
    document.querySelectorAll('.step').forEach(function (el, i) {
      el.classList.toggle('active', i + 1 === n);
    });

    var isDone  = n === TOTAL_STEPS + 1;
    var isFirst = n === 1;

    document.getElementById('btnBack').style.display = isFirst ? 'none' : 'inline-block';

    document.getElementById('btnNext').textContent = isDone
      ? 'Sluiten'
      : n === TOTAL_STEPS ? 'Opslaan & klaar' : 'Volgende \u2192';

    document.getElementById('stepIndicator').textContent = isDone
      ? 'Klaar!'
      : 'Stap ' + n + ' van ' + TOTAL_STEPS;

    var pct = Math.min(100, Math.round((n / (TOTAL_STEPS + 1)) * 100));
    document.getElementById('progressFill').style.width = pct + '%';

    if (n === 2 && selectedBvo) preselectCard('bvo', selectedBvo);
    if (n === 3 && selectedCrp) preselectCard('crp', selectedCrp);
    if (isDone) buildDoneList();

    updateNextButton();
  }

  // ── Klaar-pagina ──────────────────────────────────────────────────────────

  function buildDoneList() {
    var bvoLabel = selectedBvo === 'koerier' ? 'Koerier' : 'Geen koerier';
    var crpLabel = selectedCrp === 'poct'    ? 'POCT Connect' : 'Handmatig in O-veld';
    var aantalLabel = selectedInstellingen.length === 0
      ? 'Geen (generiek Zorgdomein menu)'
      : selectedInstellingen.length + ' instelling' + (selectedInstellingen.length === 1 ? '' : 'en');

    var items = [
      'Zorginstellingen: <strong>' + aantalLabel + '</strong>',
      'BVO: <strong>' + bvoLabel + '</strong>',
      'CRP: <strong>' + crpLabel + '</strong>',
    ];
    document.getElementById('doneList').innerHTML =
      items.map(function (i) { return '<li>' + i + '</li>'; }).join('');
  }

  // ── Opslaan ───────────────────────────────────────────────────────────────

  async function save() {
    // Sla naast de IDs ook de volledige product-data op per geselecteerde instelling.
    // Dit is nodig omdat content scripts geen toegang hebben tot ZORGDOMEIN_INSTELLINGEN
    // als globale variabele (isolated world probleem).
    var instellingenData = {};
    selectedInstellingen.forEach(function(id) {
      var inst = ZORGDOMEIN_INSTELLINGEN.find(function(i) { return i.id === id; });
      if (inst) instellingenData[id] = { naam: inst.naam, producten: inst.producten };
    });

    await _api.storage.local.set({
      onboardingDone:            true,
      geselecteerdeInstellingen: selectedInstellingen,
      geselecteerdeInstellingenData: instellingenData,
      activeProfile:             'generiek',
      activeMenuFile:            'zorgdomein-menus/menu-generiek.js',
      bvoKoerier:                selectedBvo === 'koerier',
      crpPoct:                   selectedCrp === 'poct',
      zdMenuCacheVersion:        Date.now(),
    });
  }

  // ── Knop-handlers ─────────────────────────────────────────────────────────

  document.getElementById('btnNext').addEventListener('click', async function () {
    if (currentStep > TOTAL_STEPS) { window.close(); return; }
    if (currentStep === TOTAL_STEPS) {
      await save();
      currentStep = TOTAL_STEPS + 1;
      showStep(currentStep);
      return;
    }
    currentStep++;
    showStep(currentStep);
  });

  document.getElementById('btnBack').addEventListener('click', function () {
    if (currentStep > 1) { currentStep--; showStep(currentStep); }
  });

  document.getElementById('btnImport').addEventListener('click', triggerImport);
  document.getElementById('btnExport').addEventListener('click', exportSettings);

  document.getElementById('importFileInput').addEventListener('change', function () {
    handleImportFile(this.files[0]);
    this.value = '';
  });

  // Zoek + filter live
  document.getElementById('instellingZoek').addEventListener('input', buildInstellingList);
  document.getElementById('instellingFilter').addEventListener('change', buildInstellingList);
  document.getElementById('provincieFilter').addEventListener('change', buildInstellingList);

  // ── Init ──────────────────────────────────────────────────────────────────

  setupChoiceCards('bvo', function (v) { selectedBvo = v; });
  setupChoiceCards('crp', function (v) { selectedCrp = v; });

  buildProvincieFilter();
  buildInstellingList();

  showStep(1);
  updateNextButton();

})();
