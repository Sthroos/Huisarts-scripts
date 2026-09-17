// Promedico ASP Helper - Consult Kopieer Script

(function () {
  'use strict';

  // Vertaaltabel: consult-soort code → uitgeschreven naam
  const CONSULT_TYPES = {
    C:  'Consult',
    T:  'Telefonisch consult',
    V:  'Visite',
    E:  'E-consult',
    EC: 'E-consult',
    X:  'Administratieve verrichting',
    P:  'Postverwerking',
    CD: 'Consult (dubbel)',
    HR: 'Herhaalrecept',
    N:  'Notitie',
    O:  'Overdracht',
    Q:  'Kwaliteitsregistratie',
    TD: 'Telefonisch consult (dubbel)',
    VD: 'Visite (dubbel)',
  };

  // Datumpatroon dd-mm-yyyy
  const DATUM_RE = /^\d{2}-\d{2}-\d{4}$/;

  // ── Stijlen ───────────────────────────────────────────────────────────────────

  function injectStyle() {
    if (document.getElementById('pmh-copy-style')) return;
    const s = document.createElement('style');
    s.id = 'pmh-copy-style';
    s.textContent = `
      .pmh-copy-bar {
        position: absolute;
        right: 6px;
        top: 3px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 6px;
        pointer-events: none;
      }
      .pmh-copy-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 2px 10px;
        font-size: 12px;
        font-family: inherit;
        background: #0066cc;
        color: #fff;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        line-height: 1.6;
        transition: background 0.15s;
        pointer-events: all;
      }
      .pmh-copy-btn:hover { background: #0052a3; }
      .pmh-copy-btn.pmh-active { background: #cc6600; }
      .pmh-copy-btn.pmh-active:hover { background: #a35200; }
      .pmh-copy-confirm {
        font-size: 11px;
        color: #267d00;
        font-family: inherit;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
        white-space: nowrap;
        min-width: 80px;
        text-align: right;
      }
      .pmh-copy-confirm.pmh-show { opacity: 1; }

      /* Wrapper om de tabel heen */
      .pmh-table-wrap {
        position: relative;
        padding-left: 26px;
        box-sizing: border-box;
      }

      /* Overlay met checkboxen links van de tabel */
      .pmh-cb-overlay {
        position: absolute;
        left: 0;
        top: 0;
        width: 24px;
        pointer-events: none;
      }
      .pmh-cb-slot {
        position: absolute;
        left: 4px;
        width: 18px;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 2px;
        pointer-events: all;
        box-sizing: border-box;
      }
      .pmh-cb-slot input[type=checkbox] {
        width: 14px;
        height: 14px;
        cursor: pointer;
        accent-color: #0066cc;
        margin: 0;
        flex-shrink: 0;
      }

      /* Highlight geselecteerde consulten */
      .pmh-checked td { background: #eaf3ff !important; }
    `;
    document.head.appendChild(s);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function isDatum(str) {
    return DATUM_RE.test(str.trim());
  }

  function consultLabel(typeCode, episode, datum) {
    const key  = (typeCode || '').trim().toUpperCase();
    const type = CONSULT_TYPES[key] || typeCode.trim();
    const parts = [type];
    if (datum)   parts.push(datum);
    if (episode) parts.push(`[${episode}]`);
    return parts.join(' ');
  }

  function showConfirm(el, msg) {
    el.textContent = msg;
    el.classList.add('pmh-show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('pmh-show'), 2500);
  }

  function setHighlight(rows, on) {
    rows.forEach(r => r.classList.toggle('pmh-checked', on));
  }

  function findAnchorForHeader(headerEl) {
    let el = headerEl.parentElement;
    while (el && el !== document.body) {
      const pos = getComputedStyle(el).position;
      if (pos === 'relative' || pos === 'absolute') return el;
      el = el.parentElement;
    }
    return null;
  }

  // ── Parsing: Overzicht (Laatste journaalregels) ───────────────────────────────
  // Kolommen: [0]episode  [1]srt  [2]datum  [3]soepCode  [4]omschrijving
  //
  // Een consult-startrij heeft een datum (dd-mm-yyyy) in cel[2].
  // Vervolg-rijen hebben lege cel[2].

  function parseConsultsOverzicht(table) {
    const consulten = [];
    let current = null;

    for (const row of table.querySelectorAll('tbody tr')) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) continue;

      const episode = (cells[0] && cells[0].textContent.trim()) || '';
      const srt     = (cells[1] && cells[1].textContent.trim()) || '';
      const datum   = (cells[2] && cells[2].textContent.trim()) || '';
      const soep    = (cells[3] && cells[3].textContent.trim()) || '';
      const omschr  = (cells[4] && cells[4].textContent.trim()) || '';

      if (isDatum(datum)) {
        // Nieuwe consult-startrij: datum is gevuld
        current = { episode, type: srt, datum, lines: [], rows: [row] };
        consulten.push(current);
        if (soep) current.lines.push({ code: soep, text: omschr });
      } else if (current) {
        // Vervolg-rij: geen datum
        current.rows.push(row);
        if (soep) current.lines.push({ code: soep, text: omschr });
      }
    }

    return consulten;
  }

  // ── Parsing: Journaalregels scherm ────────────────────────────────────────────
  // Kolommen: [0]icpcInERegel  [1]srt  [2]datum  [3]soepCode  [4]omschrijving ...
  //
  // Zelfde logica: datum in cel[2] = startrij.

  function parseConsultsJournaalregels(table) {
    const consulten = [];
    let current = null;

    for (const row of table.querySelectorAll('tbody tr')) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) continue;

      const icpc   = (cells[0] && cells[0].textContent.trim()) || '';
      const srt    = (cells[1] && cells[1].textContent.trim()) || '';
      const datum  = (cells[2] && cells[2].textContent.trim()) || '';
      const soep   = (cells[3] && cells[3].textContent.trim()) || '';
      const omschr = (cells[4] && cells[4].textContent.trim()) || '';

      if (isDatum(datum)) {
        current = { episode: icpc, type: srt, datum, lines: [], rows: [row] };
        consulten.push(current);
        if (soep) current.lines.push({ code: soep, text: omschr });
      } else if (current) {
        current.rows.push(row);
        if (soep) current.lines.push({ code: soep, text: omschr });
      }
    }

    return consulten;
  }

  // ── Clipboard ─────────────────────────────────────────────────────────────────

  function buildClipboardText(consulten) {
    return consulten.map(consult => {
      const header = consultLabel(consult.type, consult.episode, consult.datum);
      const lines  = consult.lines.map(l => `${l.code}  ${l.text}`).join('\n');
      return header + '\n' + lines;
    }).join('\n\n');
  }

  function doCopy(text, confirmEl) {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showConfirm(confirmEl, '✓ Gekopieerd!');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showConfirm(confirmEl, '✓ Gekopieerd!'))
        .catch(fallback);
    } else {
      fallback();
    }
  }

  // ── Checkbox overlay ──────────────────────────────────────────────────────────
  // Absoluut gepositioneerd links van de tabel, buiten de tabel-DOM.
  // Positie bepaald door getBoundingClientRect van de eerste rij t.o.v. de wrapper.

  function buildCheckboxOverlay(tableWrapper, consulten) {
    tableWrapper.querySelectorAll('.pmh-cb-overlay').forEach(el => el.remove());

    const overlay = document.createElement('div');
    overlay.className = 'pmh-cb-overlay';
    tableWrapper.appendChild(overlay);

    // Stel de overlay hoogte gelijk aan de wrapper
    overlay.style.height = tableWrapper.offsetHeight + 'px';

    const checkboxData = [];

    const wrapRect = tableWrapper.getBoundingClientRect();

    consulten.forEach((consult, idx) => {
      const firstRow = consult.rows[0];
      const rowRect  = firstRow.getBoundingClientRect();

      const slot = document.createElement('div');
      slot.className = 'pmh-cb-slot';
      slot.style.top    = (rowRect.top - wrapRect.top + tableWrapper.scrollTop) + 'px';
      slot.style.height = (firstRow.offsetHeight || 20) + 'px';

      const cb = document.createElement('input');
      cb.type    = 'checkbox';
      cb.checked = idx === 0;
      slot.appendChild(cb);
      overlay.appendChild(slot);

      if (idx === 0) setHighlight(consult.rows, true);
      cb.addEventListener('change', () => setHighlight(consult.rows, cb.checked));

      checkboxData.push({ consult, cb });
    });

    return checkboxData;
  }

  // ── UI builder ────────────────────────────────────────────────────────────────

  function attachCopyButton(anchorEl, table, parseFunc) {
    anchorEl.querySelectorAll('.pmh-copy-bar').forEach(el => el.remove());

    const bar = document.createElement('span');
    bar.className = 'pmh-copy-bar';

    const btn = document.createElement('button');
    btn.className  = 'pmh-copy-btn';
    btn.textContent = '📋 Kopieer';

    const confirm = document.createElement('span');
    confirm.className = 'pmh-copy-confirm';

    bar.appendChild(confirm);
    bar.appendChild(btn);
    anchorEl.appendChild(bar);

    // Wikkel tabel in wrapper als dat nog niet gedaan is
    let tableWrapper = table.parentElement;
    if (!tableWrapper.classList.contains('pmh-table-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'pmh-table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
      tableWrapper = wrap;
    }

    let active        = false;
    let checkboxData  = [];

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (!active) {
        active = true;
        btn.classList.add('pmh-active');
        btn.textContent = '✂️ Kopieer selectie';

        const consulten = parseFunc(table);

        if (consulten.length === 0) {
          showConfirm(confirm, '⚠ Geen consulten gevonden');
          active = false;
          btn.classList.remove('pmh-active');
          btn.textContent = '📋 Kopieer';
          return;
        }

        checkboxData = buildCheckboxOverlay(tableWrapper, consulten);

      } else {
        const selected = checkboxData.filter(d => d.cb.checked).map(d => d.consult);
        if (selected.length === 0) {
          showConfirm(confirm, '⚠ Niets geselecteerd');
          return;
        }
        doCopy(buildClipboardText(selected), confirm);

        // Reset: verwijder overlay, highlights weg, knop terug naar blauw
        checkboxData.forEach(d => setHighlight(d.consult.rows, false));
        tableWrapper.querySelectorAll('.pmh-cb-overlay').forEach(el => el.remove());
        checkboxData = [];
        active = false;
        btn.classList.remove('pmh-active');
        btn.textContent = '📋 Kopieer';
      }
    });
  }

  // ── Detectie & init ───────────────────────────────────────────────────────────

  const known = new WeakSet();

  function trySetup(tableId, headerText, parseFunc) {
    const table = document.getElementById(tableId);
    if (!table) return;
    if (known.has(table)) return;
    known.add(table);

    // Zoek de header-tekst node
    let headerEl = null;
    for (const el of document.querySelectorAll('div, span, td, th')) {
      if (el.childElementCount === 0 && el.textContent.trim() === headerText) {
        headerEl = el;
        break;
      }
    }
    if (!headerEl) return;

    const anchor = findAnchorForHeader(headerEl);
    if (!anchor) return;

    attachCopyButton(anchor, table, parseFunc);
  }

  function init() {
    injectStyle();
    trySetup(
      'PanelLaatsteJournaalRegelsGrid-grid',
      'Laatste journaalregels',
      parseConsultsOverzicht
    );
    trySetup(
      'EpisodeJournaalRegelsOverzichtView-journaalTable',
      'Journaalregels',
      parseConsultsJournaalregels
    );
  }

  const observer = new MutationObserver(init);
  observer.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();