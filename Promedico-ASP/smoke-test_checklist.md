# Smoke-test checklist — vóór elke release

Uit te voeren tegen een test-Promedico-omgeving, per
release, vóór het triggeren van de CI-release-workflow. Vink af, noteer
afwijkingen onderaan.

## agendaMenu — Agenda Menu Items
- [ ] Berichten/E-consult/Recept-item verschijnt in het agenda-menu
- [ ] Klik opent het juiste scherm

## autoDelete — Auto-delete Berichten
- [ ] Spam-bericht wordt automatisch verwijderd
- [ ] Niet-spam-bericht blijft staan

## autoCheckMedovd — Auto-check MEDOVD & Auto-download
- [ ] MEDOVD-check triggert op uitschrijfpagina
- [ ] Download start correct

## briefVerwerker — Verwerk brieven
- [ ] Preview-balk toont geëxtraheerde SOEP/ICPC-velden
- [ ] "Annuleren" doet geen schrijfactie
- [ ] "Voer in" schrijft de juiste velden

## consultCopy — Consult kopiëren
- [ ] Consult wordt gekopieerd met juiste inhoud
- [ ] Datum/tijd van kopie klopt

## contactsoortButtons — Contactsoort Quick Buttons
- [ ] Knoppen verschijnen bij nieuw contact
- [ ] Klik zet juiste contactsoort

## correspondentieUpload — Correspondentie Upload
- [ ] Drag & drop uploadt bestand
- [ ] sessionStorage wordt geleegd na voltooien workflow

## delenWeghalen — Verplaats en Verberg Delen
- [ ] "Delen"-blok correct verborgen in deelcontact

## econsultTemplates — E-consult Template Responses
- [ ] Sjabloon-knop vult juiste tekst in

## herhaalRecepten — Herhaalrecepten Verwerken
- [ ] Start-knop verschijnt op werklijst
- [ ] Eén recept wordt correct verwerkt (test met 1, niet de hele lijst)
- [ ] Terugkeer naar werklijst werkt na verwerking

## initialenSVeld — Initialen in S-veld
- [ ] Initialen verschijnen automatisch bij openen consult

## inschrijvenMedovd — Inschrijven en MEDOVD Import
- [ ] Huisarts-selectie (voorletters/achternaam) uit instellingen werkt
- [ ] Import voltooit zonder fouten

## medicatieGenoegVoor — Medicatie "Genoeg voor"
- [ ] Leeg veld wordt gevuld met 30 dagen
- [ ] Al-ingevuld veld wordt niet overschreven

## meetwaardenHighlights — Meetwaarden Highlights
- [ ] Highlight verschijnt bij afwijkende meetwaarde

## copyButtons — Copy Phone/Email/BSN/Address
- [ ] Kopieerknop verschijnt bij elk veldtype
- [ ] BSN-knop verschijnt alleen bij geldige elfproef

## lspInstellingen — LSP-instellingen
- [ ] Redirect naar verificatiepagina toont de tooltip-melding
- [ ] LSP aan/uit werkt na verificatie

## pVeldherinnering — P-veld herinneringen
- [ ] COPD-trefwoord triggert herinnering-popup

## promedicoCrash — Snel consulten invoeren
- [ ] (staat default uit — alleen testen als je 'm bewust aanzet)

## soepMeasurements — SOEP Measurements
- [ ] Dagelijkse ID-validatie draait bij eerste meting van de dag
- [ ] **Lengte in cm ingevoerd → als meters opgeslagen in Promedico** (cm/m-fix)
- [ ] Mismatch-scenario: veld grijst uit met waarschuwing (test evt. met tijdelijk fout ID)

## soepSjablonen — SOEP Sjablonen
- [ ] Sjabloon vult juiste SOEP-velden

## teleqBellen — Bellen via TeleQ
- [ ] 📞-knop verschijnt bij telefoonnummer
- [ ] Klik opent/hergebruikt TeleQ-tab en vult nummer correct in
- [ ] SSO-redirect tijdens het proces hervat correct (nummer niet kwijt)

## verrichtingQuickButtons — Verrichting Quick Buttons
- [ ] Dagelijkse ID-validatie op verrichting-IDs werkt

## znellerFormulieren — ZN formulieren via Zneller.nl
- [ ] Formulier vult correct in vanuit P-tekst
- [ ] Werkt zowel vanaf promedico-asp.nl als zneller.nl

## zorgdomeinQuickMenu — Zorgdomein Quick Menu
- [ ] Menu verschijnt met juiste regio-instellingen
- [ ] Verwijzing opent juiste Zorgdomein-formulier

---

## Algemeen (elke release)
- [ ] `manifest.json` versienummer klopt (chrome/firefox consistent)
- [ ] Extensie laadt zonder console-errors bij page load (DEBUG=true tijdelijk aan om te checken)
- [ ] Master-toggle uit → alle scripts inactief
- [ ] Onboarding-wizard doorlopen op schone install

## Afwijkingen gevonden tijdens deze test-ronde
_(vul in, of verwijder deze sectie als alles slaagt)_
