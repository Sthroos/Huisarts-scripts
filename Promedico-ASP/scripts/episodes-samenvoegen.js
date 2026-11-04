// episodes-samenvoegen.js
// Voegt episodes met dezelfde ICPC-code samen in het dossier van de geopende patiënt.
//
// Werkwijze:
//   1. Het episodeoverzicht lezen en groeperen op ICPC-code (≥2 episodes).
//      Groepen met een "ALGEMEEN JOURNAAL"-episode worden overgeslagen.
//   2. Doel per groep: de episode met de meest recente datum (zichtbaar in het overzicht).
//   3. Na één bevestiging per groep: episodes aanvinken, doel kiezen, samenvoegen.
//
// Patiëntgegevens blijven in module-variabelen (zie Architecture.md §4).

(function () {
  'use strict';

  if (window !== window.top) return;

  const DEBUG = false;
  function dbg(...args)    { if (DEBUG) console.log('[EpiSamenvoegen]', ...args); }
  function dbgErr(...args) { if (DEBUG) console.error('[EpiSamenvoegen]', ...args); }

  const TIMEOUT_MS = 10000;
  const POLL_MS = 150;
  const STAP_PAUZE_MS = 300;

  // Kolomindexen in het episodeoverzicht (Promedico-structuur).
  const KOLOM_ICPC = 4;
  const KOLOM_DATUM = 5;
  const UITSLUITEN = 'ALGEMEEN JOURNAAL';

  const SEL = {
    rij:          'tr[episodeid]',
    doelKiezen:   '#btnSelectTargetEpisode',
    samenvoegen:  '#btnEpisodenSamenvoegen'
  };

  let stopGevraagd = false;

  // ═══ Pure functies ═══════════════════════════════════════════════════════

  /** @param {string} s "dd-mm-jjjj" @returns {number} jjjjmmdd, 0 als onleesbaar */
  function datumSleutel(s) {
    const m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec((s || '').trim());
    return m ? Number(m[3] + m[2].padStart(2, '0') + m[1].padStart(2, '0')) : 0;
  }

  /**
   * @param {Array<{id:string, icpc:string, omschrijving:string, datum:string}>} episodes
   * @returns {Array<{icpc:string, episodes:object[], doelId:string}>}
   */
  function groepeer(episodes) {
    const perIcpc = new Map();
    for (const e of episodes) {
      if (!e.icpc) continue;
      if (!perIcpc.has(e.icpc)) perIcpc.set(e.icpc, []);
      perIcpc.get(e.icpc).push(e);
    }
    return [...perIcpc.entries()]
      .filter(([, lijst]) => lijst.length >= 2)
      .filter(([, lijst]) => !lijst.some(e => e.omschrijving.toUpperCase().includes(UITSLUITEN)))
      .map(([icpc, lijst]) => {
        const doel = lijst.reduce((a, b) => (datumSleutel(b.datum) > datumSleutel(a.datum) ? b : a));
        return { icpc, episodes: lijst, doelId: doel.id };
      });
  }

  // ═══ DOM-hulpfuncties ════════════════════════════════════════════════════

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
    return zoekAlle('button.gwt-Button, button, input[type="button"]')
      .find(b => zichtbaar(b) && (b.textContent || b.value || '').trim() === 'Ja') || null;
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

  function klik(el) {
    const win = el.ownerDocument.defaultView;
    const r = el.getBoundingClientRect();
    const opt = { bubbles: true, cancelable: true, view: win, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    el.dispatchEvent(new win.PointerEvent('pointerdown', opt));
    el.dispatchEvent(new win.MouseEvent('mousedown', opt));
    el.dispatchEvent(new win.PointerEvent('pointerup', opt));
    el.dispatchEvent(new win.MouseEvent('mouseup', opt));
    el.dispatchEvent(new win.MouseEvent('click', opt));
  }

  // ═══ Episodeoverzicht ════════════════════════════════════════════════════

  function leesEpisodes() {
    return zoekAlle(SEL.rij).filter(zichtbaar).map(rij => {
      const cellen = rij.querySelectorAll('td');
      return {
        id: rij.getAttribute('episodeid'),
        icpc: (cellen[KOLOM_ICPC] && cellen[KOLOM_ICPC].textContent.trim()) || '',
        omschrijving: rij.getAttribute('episode_omschrijving') || '',
        datum: (cellen[KOLOM_DATUM] && cellen[KOLOM_DATUM].textContent.trim()) || ''
      };
    }).filter(e => e.id);
  }

  function opOverzicht() {
    return zichtbaar(zoek(SEL.doelKiezen)) && zoekAlle(SEL.rij).some(zichtbaar);
  }

  function rijVan(id) {
    return zoekAlle(`${SEL.rij}[episodeid="${CSS.escape(id)}"]`).find(zichtbaar) || null;
  }

  /**
   * Voegt één groep samen. Controleert vooraf dat alle episodes nog in het overzicht staan.
   * @returns {Promise<'samengevoegd'|'gewijzigd'>}
   */
  async function voegGroepSamen(groep) {
    controleerStop();
    const rijen = groep.episodes.map(e => rijVan(e.id));
    if (rijen.some(r => !r)) return 'gewijzigd';

    for (const rij of rijen) {
      const vink = rij.querySelector('input[type="checkbox"]');
      if (!vink) throw new Error(`ICPC ${groep.icpc}: geen selectievakje`);
      if (!vink.checked) klik(vink);
      await pauze(STAP_PAUZE_MS);
    }
    if (rijen.some(r => !r.querySelector('input[type="checkbox"]').checked)) {
      throw new Error(`ICPC ${groep.icpc}: aanvinken mislukt`);
    }

    klik(zoek(SEL.doelKiezen));
    // In de doelkeuze heeft elke episode een radioknop; kies het vooraf getoonde doel.
    const radio = await wachtOp(() => {
      const r = rijVan(groep.doelId);
      const knop = r && r.querySelector('input[type="radio"]');
      return zichtbaar(knop) ? knop : null;
    }, `doelkeuze ICPC ${groep.icpc}`);
    klik(radio);
    await pauze(STAP_PAUZE_MS);
    if (!radio.checked) throw new Error(`ICPC ${groep.icpc}: doelepisode kiezen mislukt`);

    const knop = await wachtOp(() => { const k = zoek(SEL.samenvoegen); return zichtbaar(k) ? k : null; }, 'knop Samenvoegen');
    klik(knop);
    klik(await wachtOp(jaKnop, 'bevestigingsvraag'));

    // Klaar als we terug zijn in het overzicht en de samengevoegde episodes weg zijn.
    const weg = groep.episodes.filter(e => e.id !== groep.doelId).map(e => e.id);
    await wachtOp(() => opOverzicht() && weg.every(id => !rijVan(id)), `afronden ICPC ${groep.icpc}`);
    await pauze(STAP_PAUZE_MS);
    return 'samengevoegd';
  }

  // ═══ Interface ═══════════════════════════════════════════════════════════

  const STIJL = `
    #ph-epi-knop { position:fixed; right:20px; bottom:20px; z-index:2147483646; background:#1D58CB; color:#fff;
      border:none; border-radius:6px; padding:10px 16px; font:600 14px system-ui,sans-serif; cursor:pointer;
      box-shadow:0 3px 12px rgba(0,0,0,.25); }
    #ph-epi-overlay { position:fixed; inset:0; z-index:2147483647; background:rgba(0,0,0,.5); display:flex;
      align-items:center; justify-content:center; font:14px system-ui,sans-serif; color:#1f2937; }
    #ph-epi-paneel { background:#fff; border-radius:8px; width:min(760px,94vw); max-height:88vh; display:flex;
      flex-direction:column; box-shadow:0 6px 24px rgba(0,0,0,.35); }
    #ph-epi-paneel header { padding:14px 20px; border-bottom:1px solid #e5e7eb; font-weight:600; font-size:16px; }
    #ph-epi-inhoud { padding:14px 20px; overflow:auto; flex:1; }
    #ph-epi-paneel footer { padding:12px 20px; border-top:1px solid #e5e7eb; display:flex; gap:8px; justify-content:flex-end; }
    #ph-epi-paneel button { padding:7px 14px; border-radius:5px; border:1px solid #cbd5e1; background:#f8fafc; cursor:pointer; font:inherit; }
    #ph-epi-paneel button.primair { background:#1D58CB; color:#fff; border-color:#1D58CB; }
    #ph-epi-paneel ul { margin:4px 0 10px 18px; padding:0; }
    #ph-epi-paneel .doel { font-weight:600; }
    #ph-epi-paneel .nb { color:#6b7280; font-size:12px; }
    #ph-epi-log { font:12px ui-monospace,monospace; background:#f8fafc; border:1px solid #e5e7eb; padding:8px;
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
    const inhoud = el('div', { id: 'ph-epi-inhoud' });
    const voet = el('footer');
    const overlay = el('div', { id: 'ph-epi-overlay' },
      el('div', { id: 'ph-epi-paneel' }, el('header', {}, 'Episodes samenvoegen (zelfde ICPC)'), inhoud, voet));
    document.body.append(overlay);
    return {
      zet(nodes, knoppen) { inhoud.replaceChildren(...nodes); voet.replaceChildren(...knoppen); },
      sluit() { overlay.remove(); }
    };
  }

  function start() {
    stopGevraagd = false;
    const paneel = maakPaneel();
    const groepen = groepeer(leesEpisodes());
    if (!groepen.length) {
      paneel.zet([el('p', {}, 'Geen episodes met dezelfde ICPC-code gevonden.')],
        [el('button', { onclick: () => paneel.sluit() }, 'Sluiten')]);
      return;
    }
    paneel.zet([
      el('p', {}, `${groepen.length} groep(en). Per groep blijft de vetgedrukte episode (meest recente datum) over; ` +
        'de andere worden erin samengevoegd.'),
      el('p', { class: 'nb' }, `Groepen met "${UITSLUITEN}" worden overgeslagen. Samenvoegen is in Promedico niet terug te draaien.`),
      ...groepen.map(g => el('div', {}, el('strong', {}, g.icpc),
        el('ul', {}, g.episodes.map(e => el('li', e.id === g.doelId ? { class: 'doel' } : {},
          `${e.omschrijving || '(geen omschrijving)'} — ${e.datum || 'geen datum'}${e.id === g.doelId ? '  ← doel' : ''}`)))))
    ], [
      el('button', { onclick: () => paneel.sluit() }, 'Annuleren'),
      el('button', { class: 'primair', onclick: () => verwerk(paneel, groepen) }, 'Alles samenvoegen')
    ]);
  }

  async function verwerk(paneel, groepen) {
    stopGevraagd = false;
    const nodes = [el('p', {}, 'Bezig. Klik niet in Promedico tot dit klaar is.')];
    const box = el('div', { id: 'ph-epi-log' });
    nodes.push(box);
    const log = msg => { box.textContent += msg + '\n'; box.scrollTop = box.scrollHeight; dbg(msg); };
    paneel.zet(nodes, [el('button', { onclick: () => { stopGevraagd = true; } }, 'Stop na huidige groep')]);
    let samengevoegd = 0, gewijzigd = 0;
    try {
      for (const groep of groepen) {
        const r = await voegGroepSamen(groep);
        log(`${groep.icpc}: ${r === 'samengevoegd' ? 'samengevoegd' : 'overgeslagen (overzicht gewijzigd)'}`);
        if (r === 'samengevoegd') samengevoegd++; else gewijzigd++;
      }
      log(`Klaar. Samengevoegd: ${samengevoegd}, overgeslagen: ${gewijzigd}.`);
    } catch (e) {
      dbgErr(e);
      log('Gestopt: ' + e.message);
    }
    paneel.zet(nodes, [el('button', { onclick: () => paneel.sluit() }, 'Sluiten')]);
  }

  // ═══ Knop tonen op het episodeoverzicht ══════════════════════════════════

  function init() {
    document.head.append(el('style', {}, STIJL));
    const knop = el('button', { id: 'ph-epi-knop', onclick: start }, 'Episodes samenvoegen');
    setInterval(() => {
      const tonen = opOverzicht() && !document.getElementById('ph-epi-overlay');
      if (tonen && !knop.isConnected) document.body.append(knop);
      if (!tonen && knop.isConnected) knop.remove();
    }, 1500);
  }

  init();
})();
