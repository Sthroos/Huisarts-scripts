// tarieven-bijwerken.js
// Werkt de Praktijk-tarieven in Onderhoud > Tarieven bij naar een nieuw jaar.
// Bron: tarieven/<jaar>.json (één bestand per jaar, meegeleverd met de extensie).
//
// Werkwijze: eerst een proefrun (alleen lezen), dan pas schrijven na bevestiging.
// CTG-rijen (landelijk, door Promedico beheerd) worden nooit aangeraakt; er worden
// alleen Praktijk-rijen toegevoegd of oude Praktijk-rijen afgesloten.
//
// Draait in de top-frame en bedient het klassieke onderhoudsscherm in
// #panelBackCompatibility-frame (Struts-pagina's, geen GWT).

(function () {
  'use strict';

  if (window !== window.top) return;

  const DEBUG = false;
  function dbg(...args)    { if (DEBUG) console.log('[Tarieven]', ...args); }
  function dbgErr(...args) { if (DEBUG) console.error('[Tarieven]', ...args); }

  // document.currentScript is alleen tijdens synchrone uitvoering beschikbaar.
  const SCRIPT_URL = document.currentScript && document.currentScript.src;
  if (!SCRIPT_URL) return;
  const TARIEVEN_BASE = new URL('../tarieven/', SCRIPT_URL);

  const FRAME_ID = 'panelBackCompatibility-frame';
  const NAV_TIMEOUT_MS = 15000;
  const POLL_MS = 150;
  const STAP_PAUZE_MS = 400;
  const STANDAARD_VERZEKERAAR = 'zk';

  const SEL = {
    lijstRij:        'tr.line, tr.lineOver',
    openCode:        'td[onclick^="openVerrichting"]',
    radioActief:     'input[name="hisakfield"][value="ak"]',
    radioInactief:   'input[name="hisakfield"][value="his"]',
    activeren:       '#Script_Activeren',
    deactiveren:     '#Script_Deactiveren',
    tariefToevoegen: '[id="Script_Tarief toevoegen"]',
    opslaan:         '#Script_Opslaan',
    sluiten:         '#Script_Sluiten',
    bedrag:          'input[name$=".ziekenfondsBedrag"]:not([type="hidden"])'
  };

  const LIJSTEN = [
    { id: 'inschrijf',   link: 'Inschrijftarieven', kop: 'Inschrijfgeld' },
    { id: 'verrichting', link: 'Verrichtingen',     kop: 'Verrichtingen' }
  ];

  let stopGevraagd = false;

  // ═══ Pure functies ═══════════════════════════════════════════════════════

  /** @param {string} s bijv. "119,10", "1.449,21" of "119.1" @returns {number|null} */
  function parseBedrag(s) {
    const t = (s || '').trim();
    if (!t) return null;
    // Punt als decimaalteken (zoals in Promedico's afdruk): "119.1"
    const n = /^\d+\.\d{1,2}$/.test(t) ? Number(t) : Number(t.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  /** @param {number} n @param {boolean} komma @returns {string} */
  function formatBedrag(n, komma) {
    const s = n.toFixed(2);
    return komma ? s.replace('.', ',') : s;
  }

  /** @param {string} s "dd-mm-jjjj" @returns {number|null} jjjjmmdd */
  function datumSleutel(s) {
    const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec((s || '').trim());
    return m ? Number(m[3] + m[2] + m[1]) : null;
  }

  function gelijkBedrag(a, b) {
    return a !== null && b !== null && Math.round(a * 100) === Math.round(b * 100);
  }

  /**
   * Bepaalt wat er met één code moet gebeuren.
   * @param {{bedrag:number, van:string}} doel
   * @param {Array<{index:number, tariefVoor:string, bedrag:number|null, van:string, tot:string}>} rijen
   * @returns {{actie:'overslaan'|'toevoegen'|'einddatum'|'conflict', reden:string, correcties:number[]}}
   */
  function planCode(doel, rijen) {
    const doelVan = datumSleutel(doel.van);
    const praktijk = rijen.filter(r => r.tariefVoor === 'Praktijk');
    const ctg = rijen.filter(r => r.tariefVoor === 'CTG');

    // Oude Praktijk-rijen die na de nieuwe ingangsdatum doorlopen, zouden de nieuwe
    // rij (of het CTG-tarief) overlappen.
    const correcties = praktijk
      .filter(r => {
        const van = datumSleutel(r.van);
        const tot = datumSleutel(r.tot);
        return van !== null && van < doelVan && (tot === null || tot > doelVan);
      })
      .map(r => r.index);

    const bestaand = praktijk.find(r => datumSleutel(r.van) === doelVan);
    if (bestaand) {
      if (gelijkBedrag(bestaand.bedrag, doel.bedrag)) {
        return { actie: correcties.length ? 'einddatum' : 'overslaan', reden: 'Praktijk-rij bestaat al', correcties };
      }
      return { actie: 'conflict', reden: `Praktijk-rij vanaf ${doel.van} staat op ${bestaand.bedrag}`, correcties: [] };
    }

    const ctgDoel = ctg.find(r => datumSleutel(r.van) === doelVan);
    if (ctgDoel && gelijkBedrag(ctgDoel.bedrag, doel.bedrag)) {
      return { actie: correcties.length ? 'einddatum' : 'overslaan', reden: 'CTG-tarief klopt al', correcties };
    }

    return { actie: 'toevoegen', reden: '', correcties };
  }

  /** Tarief voor één prestatie en verzekeraar, of null als die niet bijgewerkt wordt. */
  function doelBedrag(prestatie, verzekeraar, variabeleWaarden) {
    const t = prestatie.tarieven[verzekeraar];
    if (t === undefined) return null;
    if (typeof t === 'number') return t;
    const v = variabeleWaarden[prestatie.vektis];
    return typeof v === 'number' ? v : null;
  }

  // ═══ Jaarbestanden ═══════════════════════════════════════════════════════

  function valideerJaarbestand(d, jaar) {
    if (!d || d.jaar !== jaar || !datumSleutel(d.geldigVan) || !datumSleutel(d.geldigTot) ||
        !d.verzekeraars || !Array.isArray(d.prestaties)) {
      throw new Error(`tarieven/${jaar}.json heeft een ongeldige structuur`);
    }
    for (const p of d.prestaties) {
      if (!/^\d{4,5}$/.test(p.vektis) || !p.tarieven) {
        throw new Error(`tarieven/${jaar}.json: ongeldige prestatie ${p.vektis}`);
      }
    }
    return d;
  }

  /** Laadt de jaarbestanden voor dit en volgend jaar; een ontbrekend bestand is normaal. */
  async function laadJaarbestanden() {
    const huidig = new Date().getFullYear();
    const result = {};
    for (const jaar of [huidig, huidig + 1]) {
      let resp;
      try {
        resp = await fetch(new URL(`${jaar}.json`, TARIEVEN_BASE), { cache: 'no-store' });
      } catch {
        continue; // bestand niet meegeleverd
      }
      if (!resp.ok) continue;
      result[jaar] = valideerJaarbestand(await resp.json(), jaar);
    }
    return result;
  }

  async function leesVariabeleWaarden(jaar, verzekeraar) {
    const key = `tarievenVariabel_${jaar}_${verzekeraar}`;
    const r = await window.chrome.storage.local.get(key);
    return (r && r[key]) || {};
  }

  async function bewaarVariabeleWaarden(jaar, verzekeraar, waarden) {
    await window.chrome.storage.local.set({ [`tarievenVariabel_${jaar}_${verzekeraar}`]: waarden });
  }

  // ═══ Frame-toegang en navigatie ══════════════════════════════════════════

  function frameDoc() {
    const f = document.getElementById(FRAME_ID);
    const doc = f && f.contentDocument;
    if (!doc || !doc.body) throw new Error('Onderhoudsscherm (frame) niet gevonden');
    return doc;
  }

  function huidigeFrameDoc() {
    const f = document.getElementById(FRAME_ID);
    return (f && f.contentDocument && f.contentDocument.body) ? f.contentDocument : null;
  }

  function kopTekst(doc) {
    return (doc.body.innerText || '').slice(0, 400);
  }

  function isTarievenScherm(doc) {
    return kopTekst(doc).includes('Onderhoud - Tarieven');
  }

  const pauze = ms => new Promise(r => setTimeout(r, ms));

  function controleerStop() {
    if (stopGevraagd) throw new Error('Gestopt door gebruiker');
  }

  /** Wacht tot predicate(doc) waar is, of gooit na de timeout. */
  async function wachtOp(predicate, omschrijving) {
    const start = Date.now();
    while (Date.now() - start < NAV_TIMEOUT_MS) {
      const doc = huidigeFrameDoc();
      if (doc && doc.readyState === 'complete') {
        try { if (predicate(doc)) return doc; } catch { /* pagina half geladen */ }
      }
      await pauze(POLL_MS);
    }
    throw new Error(`Time-out bij wachten op: ${omschrijving}`);
  }

  /** Voert een actie uit die de frame laat navigeren en wacht op de nieuwe pagina. */
  async function navigeer(actie, predicate, omschrijving) {
    controleerStop();
    const oud = frameDoc();
    actie(oud);
    const doc = await wachtOp(d => d !== oud && predicate(d), omschrijving);
    await pauze(STAP_PAUZE_MS);
    return doc;
  }

  function zetWaarde(el, waarde) {
    const win = el.ownerDocument.defaultView;
    el.value = waarde;
    el.dispatchEvent(new win.Event('input', { bubbles: true }));
    el.dispatchEvent(new win.Event('change', { bubbles: true }));
  }

  function vereist(doc, selector, omschrijving) {
    const el = doc.querySelector(selector);
    if (!el) throw new Error(`${omschrijving} niet gevonden`);
    return el;
  }

  function opLijst(doc, lijst, actief) {
    const radio = doc.querySelector(actief ? SEL.radioActief : SEL.radioInactief);
    return kopTekst(doc).includes(`Tarieven: ${lijst.kop}`) && radio && radio.checked;
  }

  async function gaNaarLijst(lijst, actief) {
    let doc = frameDoc();
    if (!kopTekst(doc).includes(`Tarieven: ${lijst.kop}`)) {
      const link = [...doc.querySelectorAll('a')].find(a => a.innerText.trim() === lijst.link);
      if (!link) throw new Error(`Link "${lijst.link}" niet gevonden`);
      doc = await navigeer(() => link.click(), d => kopTekst(d).includes(`Tarieven: ${lijst.kop}`), lijst.link);
    }
    if (!opLijst(doc, lijst, actief)) {
      const radio = vereist(doc, actief ? SEL.radioActief : SEL.radioInactief, 'Keuze actief/niet actief');
      doc = await navigeer(() => radio.click(), d => opLijst(d, lijst, actief), `${lijst.link} ${actief ? 'actief' : 'niet actief'}`);
    }
    return doc;
  }

  /** Vektis-code van een lijstrij: de laatste cel met 4-5 cijfers (na Mnem, vóór Niveau). */
  function vektisVanRij(rij) {
    const cellen = [...rij.querySelectorAll('td')].map(td => td.textContent.trim());
    const codes = cellen.filter(t => /^\d{4,5}$/.test(t));
    return codes.length ? codes[codes.length - 1] : null;
  }

  function leesLijst(doc) {
    const codes = new Map();
    doc.querySelectorAll(SEL.lijstRij).forEach(rij => {
      const vektis = vektisVanRij(rij);
      if (!vektis) return;
      const oms = [...rij.querySelectorAll('td')].map(td => td.textContent.trim()).find(t => t.length > 6 && !/^\d+$/.test(t)) || '';
      codes.set(vektis, oms);
    });
    return codes;
  }

  function zoekRij(doc, vektis) {
    const rijen = [...doc.querySelectorAll(SEL.lijstRij)].filter(r => vektisVanRij(r) === vektis);
    if (rijen.length !== 1) throw new Error(`Code ${vektis}: ${rijen.length} rijen gevonden in de lijst`);
    return rijen[0];
  }

  function isDetailScherm(doc) {
    return !!doc.querySelector(SEL.tariefToevoegen) && !!doc.querySelector(SEL.sluiten);
  }

  async function openCode(lijst, vektis) {
    const doc = await gaNaarLijst(lijst, true);
    const cel = zoekRij(doc, vektis).querySelector(SEL.openCode);
    if (!cel) throw new Error(`Code ${vektis}: niet aanklikbaar`);
    return navigeer(() => cel.click(), isDetailScherm, `detailscherm ${vektis}`);
  }

  function veld(doc, index, naam) {
    return doc.querySelector(`input[name="tarieven[${index}].${naam}"]:not([type="hidden"])`);
  }

  function leesTariefRijen(doc) {
    return [...doc.querySelectorAll(SEL.bedrag)].map(input => {
      const m = /tarieven\[(\d+)\]\./.exec(input.name);
      if (!m) return null;
      const index = Number(m[1]);
      const tr = input.closest('tr');
      const voor = tr && tr.querySelector('input.inputReadonly');
      return {
        index,
        tariefVoor: voor ? voor.value.trim() : '',
        bedragTekst: input.value,
        bedrag: parseBedrag(input.value),
        van: (veld(doc, index, 'geldigVan') || {}).value || '',
        tot: (veld(doc, index, 'geldigTot') || {}).value || ''
      };
    }).filter(Boolean);
  }

  async function sluitDetail() {
    const doc = frameDoc();
    const knop = vereist(doc, SEL.sluiten, 'Knop Sluiten');
    await navigeer(() => knop.click(), d => !isDetailScherm(d) && isTarievenScherm(d), 'terug naar lijst');
  }

  async function zetActief(lijst, codes, actief) {
    const doc = await gaNaarLijst(lijst, !actief);
    for (const vektis of codes) {
      const vink = zoekRij(doc, vektis).querySelector('input[type="checkbox"]');
      if (!vink) throw new Error(`Code ${vektis}: geen selectievakje`);
      if (!vink.checked) vink.click();
    }
    const knop = vereist(doc, actief ? SEL.activeren : SEL.deactiveren, actief ? 'Knop Activeren' : 'Knop Deactiveren');
    await navigeer(() => knop.click(), isTarievenScherm, actief ? 'activeren' : 'deactiveren');
  }

  // ═══ Proefrun (alleen lezen) ═════════════════════════════════════════════

  /**
   * Leest de lijsten en de detailschermen van alle relevante actieve codes.
   * @returns {Promise<object>} plan
   */
  async function maakPlan(jaarData, verzekeraar, variabeleWaarden, log) {
    const status = {}; // vektis -> { lijst, actief, omschrijving }
    for (const lijst of LIJSTEN) {
      for (const actief of [true, false]) {
        log(`Lijst lezen: ${lijst.link} (${actief ? 'actief' : 'niet actief'})`);
        const codes = leesLijst(await gaNaarLijst(lijst, actief));
        codes.forEach((omschrijving, vektis) => {
          if (!status[vektis] || actief) status[vektis] = { lijst, actief, omschrijving };
        });
      }
    }

    const inJson = new Set(jaarData.prestaties.map(p => p.vektis));
    const plan = { regels: [], inactief: [], nietGevonden: [], overigActief: [] };

    for (const p of jaarData.prestaties) {
      const bedrag = doelBedrag(p, verzekeraar, variabeleWaarden);
      if (bedrag === null) continue;
      const s = status[p.vektis];
      if (!s) { plan.nietGevonden.push(p); continue; }
      if (!s.actief) {
        const vervangtActief = (p.vervangt || []).some(c => status[c] && status[c].actief);
        plan.inactief.push({ prestatie: p, lijst: s.lijst, bedrag, standaardAan: vervangtActief });
        continue;
      }
      controleerStop();
      log(`Code ${p.vektis} lezen`);
      const doc = await openCode(s.lijst, p.vektis);
      const rijen = leesTariefRijen(doc);
      await sluitDetail();
      plan.regels.push({
        prestatie: p, lijst: s.lijst, bedrag, rijen,
        ...planCode({ bedrag, van: jaarData.geldigVan }, rijen)
      });
    }

    Object.entries(status)
      .filter(([vektis, s]) => s.actief && !inJson.has(vektis))
      .forEach(([vektis, s]) => plan.overigActief.push({ vektis, lijst: s.lijst, omschrijving: s.omschrijving }));

    return plan;
  }

  // ═══ Uitvoeren (schrijven) ═══════════════════════════════════════════════

  async function voerCodeUit(lijst, vektis, bedrag, jaarData, log) {
    let doc = await openCode(lijst, vektis);
    const rijen = leesTariefRijen(doc);
    const besluit = planCode({ bedrag, van: jaarData.geldigVan }, rijen);

    if (besluit.actie === 'overslaan' || besluit.actie === 'conflict') {
      log(`${vektis}: ${besluit.actie} (${besluit.reden})`);
      await sluitDetail();
      return besluit.actie;
    }

    for (const index of besluit.correcties) {
      const tot = veld(doc, index, 'geldigTot');
      if (!tot) throw new Error(`${vektis}: einddatumveld rij ${index} niet gevonden`);
      zetWaarde(tot, jaarData.geldigVan);
    }

    if (besluit.actie === 'toevoegen') {
      // Bedragnotatie overnemen van het scherm; zonder bestaande rijen punt-notatie.
      const komma = rijen.some(r => r.bedragTekst.includes(','));
      const bekend = new Set(rijen.map(r => r.index));
      const knop = vereist(doc, SEL.tariefToevoegen, 'Knop Tarief toevoegen');
      knop.click();
      doc = await wachtOp(d => leesTariefRijen(d).some(r => !bekend.has(r.index)), `nieuwe tariefrij ${vektis}`);
      await pauze(STAP_PAUZE_MS);
      const nieuw = leesTariefRijen(doc).filter(r => !bekend.has(r.index));
      if (nieuw.length !== 1 || nieuw[0].tariefVoor !== 'Praktijk' || nieuw[0].bedragTekst.trim()) {
        throw new Error(`${vektis}: nieuwe rij niet zoals verwacht (geen lege Praktijk-rij)`);
      }
      const i = nieuw[0].index;
      zetWaarde(vereist(doc, `input[name="tarieven[${i}].ziekenfondsBedrag"]:not([type="hidden"])`, 'Bedragveld'), formatBedrag(bedrag, komma));
      zetWaarde(vereist(doc, `input[name="tarieven[${i}].geldigVan"]:not([type="hidden"])`, 'Veld geldig vanaf'), jaarData.geldigVan);
      zetWaarde(vereist(doc, `input[name="tarieven[${i}].geldigTot"]:not([type="hidden"])`, 'Veld geldig tot'), jaarData.geldigTot);
    }

    const opslaan = vereist(doc, SEL.opslaan, 'Knop Opslaan');
    doc = await navigeer(() => opslaan.click(), isDetailScherm, `opslaan ${vektis}`);

    // Controle na opslaan: het scherm moet nu de doelsituatie tonen.
    const na = planCode({ bedrag, van: jaarData.geldigVan }, leesTariefRijen(doc));
    if (na.actie !== 'overslaan') {
      throw new Error(`${vektis}: na opslaan niet correct (${na.actie} ${na.reden}). Controleer dit scherm.`);
    }
    await sluitDetail();
    log(`${vektis}: ${besluit.actie === 'toevoegen' ? 'toegevoegd' : 'einddatum gecorrigeerd'}`);
    return besluit.actie;
  }

  async function voerPlanUit(plan, keuzes, jaarData, log) {
    const teDoen = plan.regels
      .filter(r => r.actie === 'toevoegen' || r.actie === 'einddatum')
      .map(r => ({ lijst: r.lijst, vektis: r.prestatie.vektis, bedrag: r.bedrag }));

    for (const lijst of LIJSTEN) {
      const activeren = plan.inactief.filter(r => r.lijst === lijst && keuzes.activeren.has(r.prestatie.vektis));
      if (activeren.length) {
        log(`Activeren in ${lijst.link}: ${activeren.map(r => r.prestatie.vektis).join(', ')}`);
        await zetActief(lijst, activeren.map(r => r.prestatie.vektis), true);
        activeren.forEach(r => teDoen.push({ lijst, vektis: r.prestatie.vektis, bedrag: r.bedrag }));
      }
    }

    const telling = { toevoegen: 0, einddatum: 0, overslaan: 0, conflict: 0 };
    for (const t of teDoen) {
      controleerStop();
      telling[await voerCodeUit(t.lijst, t.vektis, t.bedrag, jaarData, log)]++;
    }

    for (const lijst of LIJSTEN) {
      const uit = plan.overigActief.filter(r => r.lijst === lijst && keuzes.deactiveren.has(r.vektis)).map(r => r.vektis);
      if (uit.length) {
        log(`Deactiveren in ${lijst.link}: ${uit.join(', ')}`);
        await zetActief(lijst, uit, false);
      }
    }
    return telling;
  }

  // ═══ Interface ═══════════════════════════════════════════════════════════

  const STIJL = `
    #ph-tar-knop { position:fixed; right:20px; bottom:20px; z-index:2147483646; background:#1D58CB; color:#fff;
      border:none; border-radius:6px; padding:10px 16px; font:600 14px system-ui,sans-serif; cursor:pointer;
      box-shadow:0 3px 12px rgba(0,0,0,.25); }
    #ph-tar-overlay { position:fixed; inset:0; z-index:2147483647; background:rgba(0,0,0,.5); display:flex;
      align-items:center; justify-content:center; font:14px system-ui,sans-serif; color:#1f2937; }
    #ph-tar-paneel { background:#fff; border-radius:8px; width:min(900px,94vw); max-height:90vh; display:flex;
      flex-direction:column; box-shadow:0 6px 24px rgba(0,0,0,.35); }
    #ph-tar-paneel header { padding:14px 20px; border-bottom:1px solid #e5e7eb; font-weight:600; font-size:16px; }
    #ph-tar-inhoud { padding:14px 20px; overflow:auto; flex:1; }
    #ph-tar-paneel footer { padding:12px 20px; border-top:1px solid #e5e7eb; display:flex; gap:8px; justify-content:flex-end; }
    #ph-tar-paneel button { padding:7px 14px; border-radius:5px; border:1px solid #cbd5e1; background:#f8fafc; cursor:pointer; font:inherit; }
    #ph-tar-paneel button.primair { background:#1D58CB; color:#fff; border-color:#1D58CB; }
    #ph-tar-paneel table { border-collapse:collapse; width:100%; margin:6px 0 14px; }
    #ph-tar-paneel th, #ph-tar-paneel td { text-align:left; padding:4px 6px; border-bottom:1px solid #f1f5f9; vertical-align:top; }
    #ph-tar-paneel h4 { margin:14px 0 4px; }
    #ph-tar-paneel .nb { color:#6b7280; font-size:12px; }
    #ph-tar-log { font:12px ui-monospace,monospace; background:#f8fafc; border:1px solid #e5e7eb; padding:8px;
      max-height:220px; overflow:auto; white-space:pre-wrap; }
    #ph-tar-paneel input[type=number] { width:90px; }
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

  const euro = n => '€ ' + n.toFixed(2).replace('.', ',');

  function maakPaneel() {
    const inhoud = el('div', { id: 'ph-tar-inhoud' });
    const voet = el('footer');
    const overlay = el('div', { id: 'ph-tar-overlay' },
      el('div', { id: 'ph-tar-paneel' }, el('header', {}, 'Tarieven bijwerken'), inhoud, voet));
    document.body.append(overlay);
    return {
      zet(inhoudNodes, knoppen) {
        inhoud.replaceChildren(...inhoudNodes);
        voet.replaceChildren(...knoppen);
      },
      sluit() { overlay.remove(); }
    };
  }

  function maakLog(container) {
    const box = el('div', { id: 'ph-tar-log' });
    container.push(box);
    return msg => { box.textContent += msg + '\n'; box.scrollTop = box.scrollHeight; dbg(msg); };
  }

  async function start() {
    stopGevraagd = false;
    const paneel = maakPaneel();
    try {
      const jaren = await laadJaarbestanden();
      const beschikbaar = Object.keys(jaren).map(Number).sort();
      if (!beschikbaar.length) throw new Error('Geen tarievenbestand voor dit of volgend jaar meegeleverd');
      toonInstellingen(paneel, jaren, beschikbaar);
    } catch (e) {
      toonFout(paneel, e);
    }
  }

  function toonFout(paneel, e) {
    dbgErr(e);
    paneel.zet([el('p', {}, 'Fout: ' + e.message)], [el('button', { onclick: () => paneel.sluit() }, 'Sluiten')]);
  }

  function toonInstellingen(paneel, jaren, beschikbaar) {
    const huidig = new Date().getFullYear();
    const jaarKeuze = el('select', {}, beschikbaar.map(j =>
      el('option', { value: j }, `${j === huidig ? 'Huidig jaar' : 'Komend jaar'} (${j})`)));
    jaarKeuze.value = String(beschikbaar[beschikbaar.length - 1]);
    const verzKeuze = el('select');
    const variabelBlok = el('div');

    async function verversVariabel() {
      const data = jaren[Number(jaarKeuze.value)];
      const verz = verzKeuze.value;
      const opgeslagen = await leesVariabeleWaarden(data.jaar, verz);
      const variabel = data.prestaties.filter(p => p.tarieven[verz] && typeof p.tarieven[verz] === 'object');
      variabelBlok.replaceChildren(
        el('h4', {}, 'Tarieven die per praktijk verschillen'),
        el('p', { class: 'nb' }, 'Leeg laten = deze code niet bijwerken. Waarden worden per jaar en verzekeraar onthouden.'),
        el('table', {}, variabel.map(p => {
          const t = p.tarieven[verz];
          const inp = el('input', { type: 'number', step: '0.01', min: '0', 'data-vektis': p.vektis });
          if (t.max !== undefined) inp.max = String(t.max);
          if (typeof opgeslagen[p.vektis] === 'number') inp.value = String(opgeslagen[p.vektis]);
          return el('tr', {}, el('td', {}, p.vektis), el('td', {}, p.omschrijving, el('div', { class: 'nb' }, t.hint)), el('td', {}, inp));
        })));
    }

    function verversVerzekeraars() {
      const data = jaren[Number(jaarKeuze.value)];
      verzKeuze.replaceChildren(...Object.entries(data.verzekeraars).map(([id, naam]) => el('option', { value: id }, naam)));
      verzKeuze.value = data.verzekeraars[STANDAARD_VERZEKERAAR] ? STANDAARD_VERZEKERAAR : Object.keys(data.verzekeraars)[0];
      return verversVariabel();
    }

    jaarKeuze.addEventListener('change', verversVerzekeraars);
    verzKeuze.addEventListener('change', verversVariabel);

    async function naarProefrun() {
      const data = jaren[Number(jaarKeuze.value)];
      const verz = verzKeuze.value;
      const waarden = {};
      for (const inp of variabelBlok.querySelectorAll('input[data-vektis]')) {
        if (inp.value === '') continue;
        const n = Number(inp.value);
        const max = inp.max === '' ? Infinity : Number(inp.max);
        if (!Number.isFinite(n) || n < 0 || n > max) {
          inp.focus();
          throw new Error(`Ongeldig bedrag voor ${inp.dataset.vektis}`);
        }
        waarden[inp.dataset.vektis] = Math.round(n * 100) / 100;
      }
      await bewaarVariabeleWaarden(data.jaar, verz, waarden);
      await proefrun(paneel, data, verz, waarden);
    }

    paneel.zet([
      el('p', {}, 'Jaar: ', jaarKeuze, '   Verzekeraar: ', verzKeuze),
      el('p', { class: 'nb' }, 'Bronnen: ' + jaren[Number(jaarKeuze.value)].bronnen.join(' · ')),
      variabelBlok
    ], [
      el('button', { onclick: () => paneel.sluit() }, 'Annuleren'),
      el('button', { class: 'primair', onclick: () => naarProefrun().catch(e => toonFout(paneel, e)) }, 'Proefrun (alleen lezen)')
    ]);
    verversVerzekeraars().catch(e => toonFout(paneel, e));
  }

  async function proefrun(paneel, data, verz, waarden) {
    const nodes = [el('p', {}, `Proefrun ${data.jaar} — ${data.verzekeraars[verz]}. Er wordt niets opgeslagen.`)];
    const log = maakLog(nodes);
    paneel.zet(nodes, [el('button', { onclick: () => { stopGevraagd = true; } }, 'Stop')]);
    const plan = await maakPlan(data, verz, waarden, log);
    toonPlan(paneel, plan, data);
  }

  function toonPlan(paneel, plan, data) {
    const label = { toevoegen: 'Toevoegen', einddatum: 'Einddatum corrigeren', overslaan: 'Al goed', conflict: 'Conflict — handmatig' };
    const actieRegels = plan.regels.filter(r => r.actie !== 'overslaan');
    const activeren = new Set(plan.inactief.filter(r => r.standaardAan).map(r => r.prestatie.vektis));
    const deactiveren = new Set();

    const vinkje = (set, code, aan) => {
      const v = el('input', { type: 'checkbox' });
      v.checked = aan;
      v.addEventListener('change', () => { if (v.checked) set.add(code); else set.delete(code); });
      return v;
    };

    const huidig = r => r.rijen.filter(x => x.tariefVoor === 'Praktijk' || x.tariefVoor === 'CTG')
      .map(x => `${x.tariefVoor} ${x.bedragTekst} (${x.van}–${x.tot || '…'})`).join('\n') || '—';

    const nodes = [
      el('p', {}, `${actieRegels.length} van ${plan.regels.length} actieve codes vragen een wijziging. ` +
        `Nieuwe rijen: ${data.geldigVan} t/m ${data.geldigTot}.`),
      el('h4', {}, 'Wijzigingen'),
      el('table', {},
        el('tr', {}, el('th', {}, 'Code'), el('th', {}, 'Omschrijving'), el('th', {}, 'Huidig'), el('th', {}, 'Nieuw'), el('th', {}, 'Actie')),
        actieRegels.map(r => el('tr', {},
          el('td', {}, r.prestatie.vektis), el('td', {}, r.prestatie.omschrijving),
          el('td', { style: 'white-space:pre' }, huidig(r)), el('td', {}, euro(r.bedrag)),
          el('td', {}, label[r.actie], r.reden ? el('div', { class: 'nb' }, r.reden) : '')))),
      el('p', { class: 'nb' }, `${plan.regels.length - actieRegels.length} codes zijn al goed en worden overgeslagen.`)
    ];

    if (plan.inactief.length) {
      nodes.push(el('h4', {}, 'Niet actief in Promedico — activeren en bijwerken?'),
        el('table', {}, plan.inactief.map(r => el('tr', {},
          el('td', {}, vinkje(activeren, r.prestatie.vektis, r.standaardAan)),
          el('td', {}, r.prestatie.vektis), el('td', {}, r.prestatie.omschrijving,
            r.prestatie.vervangt ? el('div', { class: 'nb' }, 'Vervangt ' + r.prestatie.vervangt.join(', ')) : ''),
          el('td', {}, euro(r.bedrag))))));
    }
    if (plan.overigActief.length) {
      nodes.push(el('h4', {}, 'Actief in Promedico, niet in de tarievenlijst — deactiveren?'),
        el('p', { class: 'nb' }, 'Standaard uit. Alleen aanvinken als de praktijk deze code zeker niet meer declareert.'),
        el('table', {}, plan.overigActief.map(r => el('tr', {},
          el('td', {}, vinkje(deactiveren, r.vektis, false)), el('td', {}, r.vektis), el('td', {}, r.omschrijving)))));
    }
    if (plan.nietGevonden.length) {
      nodes.push(el('h4', {}, 'Niet gevonden in Promedico'),
        el('p', { class: 'nb' }, plan.nietGevonden.map(p => `${p.vektis} ${p.omschrijving}`).join(' · ')));
    }
    if (data.opmerkingen && data.opmerkingen.length) {
      nodes.push(el('h4', {}, 'Opmerkingen bij dit tarievenbestand'), el('p', { class: 'nb' }, data.opmerkingen.join(' ')));
    }

    paneel.zet(nodes, [
      el('button', { onclick: () => paneel.sluit() }, 'Sluiten zonder opslaan'),
      el('button', { class: 'primair', onclick: () => uitvoeren(paneel, plan, { activeren, deactiveren }, data) }, 'Wijzigingen opslaan')
    ]);
  }

  async function uitvoeren(paneel, plan, keuzes, data) {
    stopGevraagd = false;
    const nodes = [el('p', {}, 'Bezig met opslaan. Laat dit tabblad open en klik niet in Promedico.')];
    const log = maakLog(nodes);
    paneel.zet(nodes, [el('button', { onclick: () => { stopGevraagd = true; } }, 'Stop na huidige code')]);
    try {
      const t = await voerPlanUit(plan, keuzes, data, log);
      log(`Klaar. Toegevoegd: ${t.toevoegen}, einddatum gecorrigeerd: ${t.einddatum}, overgeslagen: ${t.overslaan}, conflict: ${t.conflict}.`);
    } catch (e) {
      log('Gestopt: ' + e.message);
    }
    paneel.zet(nodes, [el('button', { onclick: () => paneel.sluit() }, 'Sluiten')]);
  }

  // ═══ Knop tonen op het tarievenscherm ════════════════════════════════════

  function init() {
    document.head.append(el('style', {}, STIJL));
    const knop = el('button', { id: 'ph-tar-knop', onclick: start }, 'Tarieven bijwerken');
    // De frame navigeert los van de top-pagina; een lichte poll is betrouwbaarder
    // dan een observer op wisselende frame-documenten.
    setInterval(() => {
      const doc = huidigeFrameDoc();
      const tonen = !!doc && isTarievenScherm(doc) && !document.getElementById('ph-tar-overlay');
      if (tonen && !knop.isConnected) document.body.append(knop);
      if (!tonen && knop.isConnected) knop.remove();
    }, 1500);
  }

  init();
})();
