// medicatie-samenvoegen.js
// Voegt dubbele medicatie samen in het dossier van de geopende patiënt.
//
// Werkwijze:
//   1. Alle pagina's van het medicatieoverzicht (filter "Alles") lezen.
//   2. Mogelijke dubbelen groeperen op het eerste woord van de productnaam.
//   3. Overzicht tonen; na één bevestiging per groep Promedico's eigen
//      samenvoegscherm openen en alle kandidaten die Promedico daar toont samenvoegen.
// Welke regels werkelijk samengaan, bepaalt Promedico in dat samenvoegscherm.
//
// Patiëntgegevens blijven in module-variabelen (zie Architecture.md §4).

(function () {
  'use strict';

  if (window !== window.top) return;

  const DEBUG = false;
  function dbg(...args)    { if (DEBUG) console.log('[MedSamenvoegen]', ...args); }
  function dbgErr(...args) { if (DEBUG) console.error('[MedSamenvoegen]', ...args); }

  const TIMEOUT_MS = 10000;
  const POLL_MS = 150;
  const STAP_PAUZE_MS = 300;
  const MAX_PAGINAS = 50;

  const SEL = {
    datumFilter:      '#receptenOverzichtView-comboMedicatieDateFilter',
    pagingEerste:     '#receptenOverzichtView-pagingToolBar-Button-0',
    pagingVolgende:   '#receptenOverzichtView-pagingToolBar-Button-2',
    pagingTekst:      '[id^="receptenOverzichtView-pagingToolBar"] .gwt-HTML',
    rij:              'tr[__gwt_row]',
    productNaam:      'div[id^="receptenOverzichtView-grid-receptProductNaam"]',
    inzienSamenvoegen:'#MD-MedicatieInzien-lbSamenvoegenMedicatie',
    inzienTerug:      '#MD-MedicatieInzien-btnTerug',
    // Let op: "Samenvogen" is de spelling van Promedico zelf.
    alleKandidaten:   '#MedicatieSamenvogen-grid-checkAll input',
    samenvoegenKnop:  '#MedicatieSamenvoegen-btnSamenvoegen',
    samenvoegenTerug: '#MedicatieSamenvoegen-btnTerug'
  };

  let stopGevraagd = false;

  // ═══ Pure functies ═══════════════════════════════════════════════════════

  /**
   * Groepeert productnamen op het eerste woord; alleen groepen met ≥2 regels.
   * @param {string[]} namen
   * @returns {Array<{sleutel:string, namen:string[]}>}
   */
  function groepeer(namen) {
    const groepen = new Map();
    for (const naam of namen) {
      const sleutel = naam.split(/\s+/)[0].toLowerCase();
      if (!sleutel) continue;
      if (!groepen.has(sleutel)) groepen.set(sleutel, []);
      groepen.get(sleutel).push(naam);
    }
    return [...groepen.entries()]
      .filter(([, n]) => n.length >= 2)
      .map(([sleutel, n]) => ({ sleutel, namen: n }));
  }

  // ═══ DOM-hulpfuncties ════════════════════════════════════════════════════

  /** Alle same-origin documenten: top plus (geneste) frames. */
  function alleDocumenten() {
    const docs = [];
    const bezoek = doc => {
      docs.push(doc);
      doc.querySelectorAll('iframe, frame').forEach(f => {
        try { if (f.contentDocument && f.contentDocument.body) bezoek(f.contentDocument); } catch { /* cross-origin */ }
      });
    };
    bezoek(document);
    return docs;
  }

  function zoek(selector) {
    for (const doc of alleDocumenten()) {
      const el = doc.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function zoekAlle(selector) {
    return alleDocumenten().flatMap(doc => [...doc.querySelectorAll(selector)]);
  }

  function zichtbaar(el) {
    return !!el && el.getClientRects().length > 0;
  }

  function jaKnop() {
    return zoekAlle('button.gwt-Button').find(b => zichtbaar(b) && b.textContent.trim() === 'Ja') || null;
  }

  const pauze = ms => new Promise(r => setTimeout(r, ms));

  function controleerStop() {
    if (stopGevraagd) throw new Error('Gestopt door gebruiker');
  }

  async function wachtOp(fn, omschrijving) {
    const start = Date.now();
    while (Date.now() - start < TIMEOUT_MS) {
      const r = fn();
      if (r) return r;
      await pauze(POLL_MS);
    }
    throw new Error(`Time-out bij wachten op: ${omschrijving}`);
  }

  /** GWT reageert op de volledige pointer/mouse-reeks, niet op click() alleen. */
  function gwtKlik(el) {
    const win = el.ownerDocument.defaultView;
    const r = el.getBoundingClientRect();
    const opt = { bubbles: true, cancelable: true, view: win, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    el.dispatchEvent(new win.PointerEvent('pointerdown', opt));
    el.dispatchEvent(new win.MouseEvent('mousedown', opt));
    el.dispatchEvent(new win.PointerEvent('pointerup', opt));
    el.dispatchEvent(new win.MouseEvent('mouseup', opt));
    el.dispatchEvent(new win.MouseEvent('click', opt));
  }

  async function klikEnWacht(el, fn, omschrijving) {
    controleerStop();
    gwtKlik(el);
    const r = await wachtOp(fn, omschrijving);
    await pauze(STAP_PAUZE_MS);
    return r;
  }

  // ═══ Medicatieoverzicht ══════════════════════════════════════════════════

  function opOverzicht() {
    return zichtbaar(zoek(SEL.datumFilter));
  }

  function pagingTekst() {
    const el = zoek(SEL.pagingTekst);
    return el ? el.textContent.trim() : '';
  }

  function productNamenOpPagina() {
    return zoekAlle(SEL.rij)
      .map(r => r.querySelector(SEL.productNaam))
      .filter(Boolean)
      .map(d => d.textContent.trim())
      .filter(Boolean);
  }

  async function zetFilterAlles() {
    const select = zoek(SEL.datumFilter);
    if (!select) throw new Error('Medicatieoverzicht niet gevonden');
    const optie = [...select.options].find(o => o.text.trim() === 'Alles');
    if (!optie) throw new Error('Filteroptie "Alles" niet gevonden');
    if (select.value === optie.value) return;
    const voor = pagingTekst();
    select.value = optie.value;
    select.dispatchEvent(new select.ownerDocument.defaultView.Event('change', { bubbles: true }));
    await wachtOp(() => pagingTekst() !== voor || productNamenOpPagina().length > 0, 'filter "Alles"');
    await pauze(STAP_PAUZE_MS);
  }

  async function naarEerstePagina() {
    const knop = zoek(SEL.pagingEerste);
    if (!knop || knop.disabled || knop.getAttribute('aria-disabled') === 'true') return;
    const voor = pagingTekst();
    gwtKlik(knop);
    // Op pagina 1 verandert er niets; dat is geen fout.
    const start = Date.now();
    while (Date.now() - start < 2000 && pagingTekst() === voor) await pauze(POLL_MS);
    await pauze(STAP_PAUZE_MS);
  }

  /** @returns {Promise<boolean>} true als er een volgende pagina geladen is */
  async function volgendePagina() {
    const knop = zoek(SEL.pagingVolgende);
    if (!knop || knop.disabled || knop.getAttribute('aria-disabled') === 'true') return false;
    const voor = pagingTekst();
    gwtKlik(knop);
    const start = Date.now();
    while (Date.now() - start < 3000) {
      if (pagingTekst() !== voor) { await pauze(STAP_PAUZE_MS); return true; }
      await pauze(POLL_MS);
    }
    return false;
  }

  async function leesAlleProductNamen() {
    await naarEerstePagina();
    const namen = [];
    for (let i = 0; i < MAX_PAGINAS; i++) {
      controleerStop();
      namen.push(...productNamenOpPagina());
      if (!await volgendePagina()) break;
    }
    await naarEerstePagina();
    return namen;
  }

  /** Zoekt de regel met precies deze productnaam over alle pagina's en opent die. */
  async function openMedicatie(naam) {
    await naarEerstePagina();
    for (let i = 0; i < MAX_PAGINAS; i++) {
      controleerStop();
      const div = zoekAlle(SEL.productNaam).find(d => d.textContent.trim() === naam);
      if (div) {
        await klikEnWacht(div, () => zichtbaar(zoek(SEL.inzienTerug)), `medicatie "${naam}" openen`);
        return true;
      }
      if (!await volgendePagina()) break;
    }
    return false;
  }

  async function terugNaarOverzicht() {
    const terugSv = zoek(SEL.samenvoegenTerug);
    if (zichtbaar(terugSv)) await klikEnWacht(terugSv, () => zichtbaar(zoek(SEL.inzienTerug)), 'terug naar medicatie inzien');
    const terug = zoek(SEL.inzienTerug);
    if (zichtbaar(terug)) await klikEnWacht(terug, opOverzicht, 'terug naar medicatieoverzicht');
  }

  /**
   * Probeert één medicatieregel samen te voegen via Promedico's samenvoegscherm.
   * @returns {Promise<'samengevoegd'|'geen-kandidaten'|'niet-gevonden'>}
   */
  async function voegSamen(naam) {
    if (!await openMedicatie(naam)) return 'niet-gevonden';

    const link = zoek(SEL.inzienSamenvoegen);
    if (!zichtbaar(link)) { await terugNaarOverzicht(); return 'geen-kandidaten'; }

    await klikEnWacht(link, () => zichtbaar(zoek(SEL.samenvoegenTerug)), 'samenvoegscherm');
    const geenResultaten = zoekAlle('.gwt-HTML').some(e => zichtbaar(e) && e.textContent.trim().startsWith('Er zijn geen resultaten'));
    const alles = zoek(SEL.alleKandidaten);
    if (geenResultaten || !alles) { await terugNaarOverzicht(); return 'geen-kandidaten'; }

    if (!alles.checked) gwtKlik(alles);
    await pauze(STAP_PAUZE_MS);
    const knop = zoek(SEL.samenvoegenKnop);
    if (!knop || knop.disabled || knop.classList.contains('gwt-Button-disabled')) {
      await terugNaarOverzicht();
      return 'geen-kandidaten';
    }

    await klikEnWacht(knop, jaKnop, 'bevestigingsvraag');
    await klikEnWacht(jaKnop(), () => !jaKnop() && !zichtbaar(zoek(SEL.samenvoegenKnop)), 'samenvoegen afgerond');
    await terugNaarOverzicht();
    return 'samengevoegd';
  }

  // ═══ Interface ═══════════════════════════════════════════════════════════

  const STIJL = `
    #ph-med-knop { position:fixed; right:20px; bottom:20px; z-index:2147483646; background:#1D58CB; color:#fff;
      border:none; border-radius:6px; padding:10px 16px; font:600 14px system-ui,sans-serif; cursor:pointer;
      box-shadow:0 3px 12px rgba(0,0,0,.25); }
    #ph-med-overlay { position:fixed; inset:0; z-index:2147483647; background:rgba(0,0,0,.5); display:flex;
      align-items:center; justify-content:center; font:14px system-ui,sans-serif; color:#1f2937; }
    #ph-med-paneel { background:#fff; border-radius:8px; width:min(720px,94vw); max-height:88vh; display:flex;
      flex-direction:column; box-shadow:0 6px 24px rgba(0,0,0,.35); }
    #ph-med-paneel header { padding:14px 20px; border-bottom:1px solid #e5e7eb; font-weight:600; font-size:16px; }
    #ph-med-inhoud { padding:14px 20px; overflow:auto; flex:1; }
    #ph-med-paneel footer { padding:12px 20px; border-top:1px solid #e5e7eb; display:flex; gap:8px; justify-content:flex-end; }
    #ph-med-paneel button { padding:7px 14px; border-radius:5px; border:1px solid #cbd5e1; background:#f8fafc; cursor:pointer; font:inherit; }
    #ph-med-paneel button.primair { background:#1D58CB; color:#fff; border-color:#1D58CB; }
    #ph-med-paneel ul { margin:4px 0 10px 18px; padding:0; }
    #ph-med-paneel .nb { color:#6b7280; font-size:12px; }
    #ph-med-log { font:12px ui-monospace,monospace; background:#f8fafc; border:1px solid #e5e7eb; padding:8px;
      max-height:240px; overflow:auto; white-space:pre-wrap; }
  `;

  function el(tag, attrs = {}, ...kinderen) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    });
    kinderen.flat().forEach(k => e.append(k instanceof Node ? k : document.createTextNode(String(k))));
    return e;
  }

  function maakPaneel() {
    const inhoud = el('div', { id: 'ph-med-inhoud' });
    const voet = el('footer');
    const overlay = el('div', { id: 'ph-med-overlay' },
      el('div', { id: 'ph-med-paneel' }, el('header', {}, 'Dubbele medicatie samenvoegen'), inhoud, voet));
    document.body.append(overlay);
    return {
      zet(nodes, knoppen) { inhoud.replaceChildren(...nodes); voet.replaceChildren(...knoppen); },
      sluit() { overlay.remove(); }
    };
  }

  function maakLog(nodes) {
    const box = el('div', { id: 'ph-med-log' });
    nodes.push(box);
    return msg => { box.textContent += msg + '\n'; box.scrollTop = box.scrollHeight; dbg(msg); };
  }

  async function start() {
    stopGevraagd = false;
    const paneel = maakPaneel();
    const nodes = [el('p', {}, 'Medicatieoverzicht lezen (filter "Alles", alle pagina\'s)…')];
    paneel.zet(nodes, [el('button', { onclick: () => { stopGevraagd = true; } }, 'Stop')]);
    try {
      await zetFilterAlles();
      const groepen = groepeer(await leesAlleProductNamen());
      toonOverzicht(paneel, groepen);
    } catch (e) {
      dbgErr(e);
      paneel.zet([el('p', {}, 'Fout: ' + e.message)], [el('button', { onclick: () => paneel.sluit() }, 'Sluiten')]);
    }
  }

  function toonOverzicht(paneel, groepen) {
    if (!groepen.length) {
      paneel.zet([el('p', {}, 'Geen mogelijke dubbele medicatie gevonden.')],
        [el('button', { onclick: () => paneel.sluit() }, 'Sluiten')]);
      return;
    }
    paneel.zet([
      el('p', {}, `${groepen.length} groep(en) met mogelijk dubbele medicatie. Per groep opent het script ` +
        'Promedico\'s samenvoegscherm en voegt alle kandidaten samen die Promedico daar toont.'),
      el('p', { class: 'nb' }, 'Samenvoegen is in Promedico niet terug te draaien.'),
      ...groepen.map(g => el('div', {}, el('strong', {}, g.sleutel), el('ul', {}, g.namen.map(n => el('li', {}, n)))))
    ], [
      el('button', { onclick: () => paneel.sluit() }, 'Annuleren'),
      el('button', { class: 'primair', onclick: () => verwerk(paneel, groepen) }, 'Alles samenvoegen')
    ]);
  }

  async function verwerk(paneel, groepen) {
    stopGevraagd = false;
    const nodes = [el('p', {}, 'Bezig. Klik niet in Promedico tot dit klaar is.')];
    const log = maakLog(nodes);
    paneel.zet(nodes, [el('button', { onclick: () => { stopGevraagd = true; } }, 'Stop na huidige groep')]);
    let samengevoegd = 0, overgeslagen = 0;
    try {
      for (const groep of groepen) {
        controleerStop();
        let gelukt = false;
        // Promedico toont in het samenvoegscherm de kandidaten vanuit de geopende
        // regel; probeer de regels van de groep tot er één samenvoegt.
        for (const naam of new Set(groep.namen)) {
          const r = await voegSamen(naam);
          log(`${naam}: ${r}`);
          if (r === 'samengevoegd') { gelukt = true; break; }
        }
        if (gelukt) samengevoegd++; else overgeslagen++;
      }
      log(`Klaar. Samengevoegd: ${samengevoegd} groep(en), geen kandidaten: ${overgeslagen}.`);
    } catch (e) {
      log('Gestopt: ' + e.message);
    }
    paneel.zet(nodes, [el('button', { onclick: () => paneel.sluit() }, 'Sluiten')]);
  }

  // ═══ Knop tonen op het medicatieoverzicht ════════════════════════════════

  function init() {
    document.head.append(el('style', {}, STIJL));
    const knop = el('button', { id: 'ph-med-knop', onclick: start }, 'Dubbele medicatie samenvoegen');
    setInterval(() => {
      const tonen = opOverzicht() && !document.getElementById('ph-med-overlay');
      if (tonen && !knop.isConnected) document.body.append(knop);
      if (!tonen && knop.isConnected) knop.remove();
    }, 1500);
  }

  init();
})();
