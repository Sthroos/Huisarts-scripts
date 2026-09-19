(function() {
  'use strict';
  const _api = typeof browser !== 'undefined' ? browser : chrome;

  const PENDING_MAX_AGE_MS = 5 * 60 * 1000; // negeer verzoeken ouder dan 5 minuten

  function wachtOp(selector, timeoutMs) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const iv = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) { clearInterval(iv); resolve(el); return; }
        if (Date.now() - start > timeoutMs) { clearInterval(iv); reject(new Error(`Timeout: ${selector} niet gevonden`)); }
      }, 100);
    });
  }

  function zetNativeValue(el, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function vulNummerInEnBel(ruwNummer) {
    const nummer = ruwNummer.replace(/[^\d+]/g, '');
    try {
      let input = document.querySelector('#call-telephone-number');
      if (!input) {
        const belKnop = await wachtOp('[data-testid="task-action-call-out"]', 15000);
        belKnop.click();
        input = await wachtOp('#call-telephone-number', 5000);
      }

      zetNativeValue(input, nummer);

      const start = Date.now();
      let callButton;
      while (Date.now() - start < 3000) {
        callButton = document.querySelector('[data-testid="call-dialog-call-button"]');
        if (callButton && !callButton.disabled) break;
        await new Promise(r => setTimeout(r, 100));
      }

      if (!callButton) return { ok: false, error: 'Belknop in dialoog niet gevonden' };
      if (callButton.disabled) return { ok: false, error: 'Belknop bleef uitgeschakeld — nummer mogelijk ongeldig' };

      callButton.click();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  let bezig = false; // voorkomt overlappende verwerking tussen observer/onChanged/load-trigger
  let observer = null; // actief zolang een verzoek nog niet verwerkt kán worden (bv. inlogscherm)

  function stopWachten() {
    if (observer) { observer.disconnect(); observer = null; }
  }

  function startWachten() {
    if (observer) return;
    observer = new MutationObserver(() => verwerkOpenstaandVerzoek());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function verwerkOpenstaandVerzoek() {
    if (bezig) return;

    const instelling = await _api.storage.local.get('teleqBellenEnabled');
    if (instelling.teleqBellenEnabled === false) { stopWachten(); return; }

    const pending = await _api.storage.local.get(['teleqPendingNummer', 'teleqPendingSinds']);
    if (!pending.teleqPendingNummer) { stopWachten(); return; }

    if (Date.now() - (pending.teleqPendingSinds || 0) > PENDING_MAX_AGE_MS) {
      await _api.storage.local.remove(['teleqPendingNummer', 'teleqPendingSinds']);
      stopWachten();
      return;
    }

    // Nog niet klaar om te bellen (bv. inlog-/uitlogscherm): verzoek laten staan en
    // wachten op een DOM-wijziging (bv. na het inloggen) i.p.v. blind pollen op een timer.
    // Opruimen vóór dit punt is fout — een navigatie tijdens het wachten op de belknop
    // vernietigt deze scriptcontext, en dan is het verzoek al kwijt zonder ooit gebeld te zijn.
    const klaarOmTeBellen = document.querySelector('#call-telephone-number')
      || document.querySelector('[data-testid="task-action-call-out"]');
    if (!klaarOmTeBellen) {
      startWachten();
      return;
    }

    bezig = true;
    const nummer = pending.teleqPendingNummer;
    await _api.storage.local.remove(['teleqPendingNummer', 'teleqPendingSinds']);
    stopWachten();

    await vulNummerInEnBel(nummer);
    bezig = false;
  }

  verwerkOpenstaandVerzoek();

  _api.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.teleqPendingNummer) {
      verwerkOpenstaandVerzoek();
    }
  });
})();
