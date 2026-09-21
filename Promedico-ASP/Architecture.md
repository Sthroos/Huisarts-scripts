# Architectuur — Promedico ASP Helper

Dit document beschrijft de drie belangrijkste, niet-vanzelfsprekende
ontwerpkeuzes van deze extensie en waarom ze zo zijn gemaakt. Bedoeld voor
toekomstige maintainers.

## 1. Page-context injectie (`injectMode: 'main_world'`)

**Wat.** Scripts die met Promedico's eigen GWT-formulierstate moeten
interacteren (`soep-metingen.js`, `soep-sjablonen.js`, `inschrijven-medovd.js`)
draaien niet in de geïsoleerde content-script-wereld, maar worden als
`<script src="...">`-tag in de pagina zelf geïnjecteerd (`content.js` →
`injectAsScriptTag`).

**Waarom.** GWT houdt formulierstate bij in JS-objecten die alleen
bereikbaar zijn vanuit de page-context. Een content-script (isolated world)
kan wel de DOM lezen/schrijven, maar niet GWT's interne event-model
triggeren op de manier die Promedico verwacht (zie native-setter-trucs in
`medicatie-genoeg-voor.js` en `teleq-bel-ontvanger.js`).

**Consequentie.** Page-context scripts hebben geen directe toegang tot
`chrome.storage`/`chrome.runtime` — vandaar de storage-bridge (§2).

## 2. Storage-bridge via `postMessage`

**Wat.** `storage-bridge-client.js` (page-context) stuurt `storage.local.get/set/remove`
en `actie.bellen`-verzoeken via `window.postMessage` naar `content.js`
(isolated world), die de echte extensie-API aanroept en het resultaat
terugstuurt.

**Waarom.** Enige manier om page-context scripts toegang te geven tot
extensie-opslag zonder ze in de isolated world te draaien (zie §1).

**Bekend restrisico.** De listener in `content.js` filtert op
`event.data.source === 'promedico-page'`, een routeringstag, geen
authenticatie. Sinds de audit is er een `event.origin`-check bijgekomen; dat sluit
uit dat een andere origin berichten stuurt, maar niet dat kwaadaardige code
binnen dezelfde origin (promedico-asp.nl/zorgdomein.nl/zneller.nl) de bridge
misbruikt. Acceptabel restrisico zolang dat scenario een reeds gecompromitteerde
pagina vereist.

## 3. Dagelijkse runtime-ID-validatie i.p.v. hardcoded scripts uit

**Wat.** Bij de eerste meting/verrichting van de dag doet de extensie een
live POST naar Promedico's eigen zoek-endpoint om te controleren of de
hardcoded bepaling-/verrichting-IDs nog kloppen. Bij mismatch: veld/knop
grijs, geen schrijfactie, waarschuwing in `localStorage`.

**Waarom.** Was in het auditrapport geadviseerd als "schakel de
schrijfscripts standaard uit tot handmatige validatie per praktijk" —
Ik koos in plaats daarvan voor deze sterkere variant: detecteert
ook toekomstige Promedico-wijzigingen (niet alleen het huidige verschil
tussen praktijk-installaties), geeft directe visuele feedback, en blokkeert
het schrijven i.p.v. te vertrouwen op een vooraf-uitgeschakelde vlag.

**Consequentie voor nieuwe scripts.** Elk nieuw schrijfscript dat een
hardcoded Promedico-ID gebruikt, moet dit patroon overnemen (zie
`soep-metingen.js` en `verrichting-quick-buttons.js` als referentie).

## 4. In-memory / sessionStorage i.p.v. persistente opslag voor patiëntdata

**Wat.** Metingen leven alleen in een module-variabele (nooit opgeslagen).
Correspondentie-PDF's leven in `sessionStorage` van het Promedico-tabblad
met een TTL van 60 seconden en `clearAll()` bij workflow-voltooiing.
`chrome.storage.local` bevat nooit patiëntdata, alleen technische codes en
gebruikersvoorkeuren.

**Waarom.** `chrome.storage.local` is persistent en over tabbladen heen
gedeeld — een lek daar overleeft een tabsluiting. `sessionStorage` is
per-tab en verdwijnt bij sluiten; de TTL dekt het venster waarin de data
nog nodig is voor de actieve workflow.

**Consequentie voor nieuwe scripts.** Patiëntdata mag nooit in
`chrome.storage.local` terechtkomen, ook niet tijdelijk. Gebruik
module-variabelen (single-tab) of `sessionStorage` met expliciete TTL.
