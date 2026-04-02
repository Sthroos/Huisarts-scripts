# Promedico ASP Helper — Gebruikershandleiding

Deze handleiding beschrijft alle scripts van de Promedico ASP Helper extensie. Elk script kan afzonderlijk worden in- of uitgeschakeld via de popup van de extensie (klik op het extensie-icoon in de adresbalk).

---

## Inhoudsopgave

1. [Agenda Menu Items](#1-agenda-menu-items)
2. [Auto-delete Berichten](#2-auto-delete-berichten)
3. [Auto-check MEDOVD & Auto-download](#3-auto-check-medovd--auto-download)
4. [Contactsoort Quick Buttons](#4-contactsoort-quick-buttons)
5. [Correspondentie Upload](#5-correspondentie-upload)
6. [Verplaats en Verberg Delen](#6-verplaats-en-verberg-delen)
7. [E-consult Template Responses](#7-e-consult-template-responses)
8. [Herhaalrecepten Verwerken](#8-herhaalrecepten-verwerken)
9. [Brief Verwerker](#9-brief-verwerker)
10. [Initialen in S-veld](#10-initialen-in-s-veld)
11. [Inschrijven en MEDOVD Import](#11-inschrijven-en-medovd-import)
12. [Meetwaarden Highlights (2 regels)](#12-meetwaarden-highlights-2-regels)
13. [Copy Phone, Email, BSN, Address](#13-copy-phone-email-bsn-address)
14. [LSP-instellingen](#14-lsp-instellingen)
15. [P veld herinneringen](#15-p-veld-herinneringen)
16. [Promedico Crash Recovery](#16-promedico-crash-recovery)
17. [SOEP Measurements](#17-soep-measurements)
18. [SOEP Sjablonen](#18-soep-sjablonen)
19. [Verrichting Quick Buttons](#19-verrichting-quick-buttons)
20. [Zneller Formulieren](#20-zneller-formulieren)
21. [Zorgdomein Quick Menu](#21-zorgdomein-quick-menu)

---

## 1. Agenda Menu Items

**Waar te vinden:** Hoofdmenu bovenaan Promedico, onder het kopje **Agenda**.

**Wat het doet:**
Dit script voegt drie extra snelkoppelingen toe aan het Agenda-submenu in de navigatiebalk:

- **Berichten** — opent direct de berichtenlijst (***vergelijkbaar met klikken op Werklijst → Berichten***)
- **E-consult** — opent direct het e-consult overzicht
- **Recept** — opent direct de receptaanvragen

**Waarom is dit handig:**
Normaal moet je eerst op *Werklijst* klikken en dan doornavigeren. Met dit script staan Berichten, E-consult en Recept direct als losse items in het Agenda-menu, zodat je ze met één klik bereikt.

---

## 2. Auto-delete Berichten

**Waar te vinden:** De knop **🗑️ Auto-delete spam** verschijnt automatisch in de knoppenbalk op de **Berichten**-pagina (Werklijst → Berichten).

**Wat het doet:**
Zoekt automatisch naar berichten die als spam worden beschouwd en verwijdert ze na één klik. De volgende berichttypen worden als spam herkend:

- **ZorgMail FileTransfer** berichten met het type *Vrije tekst*
- **Mutatiebericht** berichten

**Hoe het werkt:**
1. Navigeer naar Werklijst → Berichten
2. Klik op de rode knop **🗑️ Auto-delete spam** die in de knoppenbalk is verschenen
3. Alle berichten van de bovenstaande typen worden automatisch aangevinkt
4. Promedico toont zijn eigen bevestigingsdialoog — klik op OK om te verwijderen
5. Als er geen spam gevonden wordt, verschijnt een melding *"Geen spam berichten gevonden."*

> **Let op:** Controleer of de spam-criteria overeenkomen met jouw praktijksituatie. Het script verwijdert alle berichten die aan de bovenstaande criteria voldoen.

---

## 3. Auto-check MEDOVD & Auto-download

**Waar te vinden:** Werkt automatisch op de pagina voor uitschrijving/dossieroverdracht.

**Wat het doet:**
Dit script doet twee dingen automatisch zodra de betreffende pagina wordt geopend:

**A. Checkbox automatisch aanvinken:**
Het veld *"Verhuisbericht patiënt"* wordt automatisch aangevinkt als dit nog niet het geval is.

**B. Automatisch downloaden:**
Als er downloadlinks aanwezig zijn op de pagina (MEDOVD-bestand, correspondentie-ZIP of patiëntdossier-PDF), worden deze automatisch gedownload. De bestandsnamen worden opgebouwd als:

- `[patiëntnummer]_[datum]_MEDOVD.xml`
- `[patiëntnummer]_[datum]_Correspondentie.zip`
- `[patiëntnummer]_[datum]_Patientdossier.pdf`

Meerdere bestanden worden met een seconde tussenpauze na elkaar gedownload.

---

## 4. Contactsoort Quick Buttons

**Waar te vinden:** Verschijnt automatisch in het **Journaal**-formulier, op de regel met *Contactsoort* en *Contactdatum*.

**Wat het doet:**
Voegt vier gekleurde snelknoppen toe waarmee je de contactsoort met één klik instelt:

| Knop | Kleur | Contactsoort |
|------|-------|--------------|
| **E** | Blauw | EC - electronisch consult |
| **C** | Groen | C - consult |
| **T** | Oranje | T - telefonisch contact |
| **V** | Rood | V - visite |

---

## 5. Correspondentie Upload

**Waar te vinden:** Werkt op de **Correspondentie**-pagina van een patiënt (Medisch Dossier → Correspondentie).

**Wat het doet:**
Maakt het mogelijk om een document te uploaden via **drag & drop** — sleep een bestand vanuit Windows Verkenner direct naar het Promedico-scherm.

**Hoe het werkt:**
1. Open de Correspondentie-pagina van een patiënt
2. Sleep een bestand naar het browservenster
3. De upload-wizard wordt automatisch geopend, het bestand geplaatst, en de *Verder*-knop geklikt
4. Het veld **Omschrijving** wordt automatisch gevuld met de bestandsnaam (zonder extensie)
5. Controleer de omschrijving, vul de afzender in en klik zelf op Opslaan

> **Let op:** Slechts één bestand tegelijk.

---

## 6. Verplaats en Verberg Delen

**Waar te vinden:** Werkt automatisch op het **Journaal/SOEP**-formulier.

**Wat het doet:**
1. **Verplaatst** de sectie *Delen* zodat die ná de sectie *Episode* staat
2. **Klapt de sectie in** — de inhoud is standaard verborgen
3. Maakt de sectie **klikbaar** om in of uit te klappen (met een ▼-pijltje)

---

## 7. E-consult Template Responses

**Waar te vinden:** Op de **E-consult**-pagina, naast het *Reactie(P)*-veld. Er verschijnt een blauwe knop **📝 Sjablonen**.

**Wat het doet:**
Voegt kant-en-klare antwoordteksten in het reactieveld van een e-consult. Je naam wordt automatisch als ondertekening toegevoegd.

**Beschikbare sjablonen:**

| Sjabloon | Inhoud |
|----------|--------|
| Bloedprikken afspraak | Uitleg over bloedprikaanmelding |
| Recept herhaalmedicatie | Bevestiging receptverwerking, klaar binnen 2 werkdagen |
| Verwijzing aangevraagd | Bevestiging verwijzingsaanvraag |
| Uitslagen zijn binnen | Geen bijzonderheden, vragen welkom |
| Afspraak maken | Uitnodiging voor consult |
| Onvoldoende informatie | Verzoek om aanvullende informatie |
| --- Eigen tekst --- | Leeg veld voor volledig eigen tekst |

---

## 8. Herhaalrecepten Verwerken

**Waar te vinden:** Op de **Werklijst → Recept**-pagina. Er verschijnt een blauwe knop **⚡ Alles automatisch verwerken**.

**Wat het doet:**
Verwerkt alle openstaande herhaalrecepten automatisch één voor één.

> **Let op:** Het script verwerkt recepten zonder beoordeling. Gebruik dit alleen als je de recepten al hebt bekeken.
> **Let op:** Dit script staat standaard uit, hij werkt nog niet.

---

## 9. Brief Verwerker

**Waar te vinden:** Werkt automatisch op de **Berichten verwerkingspagina** (Werklijst → Berichten → bericht verwerken).

**Wat het doet:**
Extraheert automatisch de relevante SOEP-velden uit binnenkomende brieven en vult deze in op de verwerkingspagina van Promedico. Dit elimineert het handmatig kopiëren en plakken van tekst uit brieven naar de juiste velden.

**Ondersteunde brieftypen:**

| Brieftype | Omschrijving |
|-----------|-------------|
| **HAP-waarneming** (medvry31) | Vrije brief met (S)/(O)/(E)/(P)-structuur |
| **Specialistenbrief** (medspe31) | Ziekenhuisbrieven, bijv. kinderarts, internist |
| **Diëtist/podotherapeut** (medvry10/medspe10) | Paramedische brieven |
| **Vrije specialistenbrief** | Brieven zonder vaste SOEP-structuur — volledige tekst als toelichting |

**Hoe het werkt:**
1. Open een bericht via Werklijst → Berichten en klik op *Verwerken*
2. Het script detecteert automatisch het brieftype en extraheert de inhoud
3. Een preview-venster verschijnt met de gevonden velden (Onderwerp, S, O, E, ICPC, P)
4. Controleer de preview en klik op **Invoegen** om de velden automatisch in te vullen
5. De ICPC-code wordt karakter voor karakter ingetypt zodat de GWT-omschrijving-lookup correct triggert
6. Klik daarna zelf op *Opslaan* om de verwerking af te ronden

**Extra functies:**
- Bij een **bekende patiënt** (geen modal) start het script automatisch zonder tussenkomst
- De *Terug*-knop wordt automatisch herkend om de observer correct op te ruimen bij annuleren

> **Let op:** Het script werkt op de verwerkingspagina, niet op de berichtenlijst zelf. Zorg dat je op de juiste pagina bent (verwerkingspagina met de velden Onderwerp, S, O, E, P) voordat je op Invoegen klikt.

---

## 10. Initialen in S-veld

**Waar te vinden:** Werkt automatisch in het **S-veld** (Subjectief) van het SOEP-formulier.

**Wat het doet:**
Plaatst automatisch de initialen van de ingelogde gebruiker in het S-veld zodra het formulier geladen is. De initialen worden berekend uit de volledige naam zoals Promedico die toont bij *"Aangemeld als ..."*. Tussenvoegsels zoals *van*, *de*, *den* worden overgeslagen.

**Voorbeelden:**

| Naam | Initialen | Resultaat in S-veld |
|------|-----------|---------------------|
| Sebastiaan Roos | SR | `SR: ` |
| Eline Westerbeek van Eerten | EWE | `EWE: ` |

**Gedrag:**
- S-veld **leeg**: initialen worden vooraan geplaatst
- S-veld heeft al **tekst**: initialen worden op een nieuwe regel achteraan toegevoegd
- Initialen al aanwezig: niets wordt toegevoegd

---

## 11. Inschrijven en MEDOVD Import

Dit script bevat meerdere functies:

### 11a. Extra menu-items (Patiënt-menu)

Voegt twee items toe aan het Patiënt-menu: **MEDOVD import** en **Nieuwe patiënt**.

### 11b. Favorieten-menu

Voegt een aanpasbaar **★ Favorieten**-menu toe aan de navigatiebalk. Aanpassen via **✎ Bewerken** onderaan het menu. In andere menu's verschijnt een ★-sterretje om items toe te voegen.

### 11c. Menu openen met hover

Het hoofdmenu opent automatisch bij hoveren en sluit na ±0,6 seconden.

### 11d. MEDOVD Import drag & drop

Sleep een `.edi`-bestand én een `.zip`-bestand tegelijk naar de MEDOVD-importpagina — het script plaatst ze in de juiste velden en klikt op *Bestand inlezen*.

### 11e. Patiëntformulier automatisch invullen

Knop **Informatie vullen** op de patiëntgegevens-pagina. Vult het formulier automatisch in op basis van geplakte tekst.

> **Let op:** De naam *"E.A. Westerbeek"* is hardcoded als huisarts-selectie — aanpassen naar jouw naam.

---

## 12. Meetwaarden Highlights (2 regels)

**Waar te vinden:** Werkt automatisch op pagina's met meetwaarden bij **onderzoek uitvoeren**.

**Wat het doet:**
Markeert verplichte ketenzorg-meetwaarden in **rood en vetgedrukt**:

- Systolische en diastolische bloeddruk
- Lichaamsbeweging vlgs norm gezond bewegn
- Roken (inclusief vapen)
- Aantal ernstige longaanvallen in 12 mnd
- Inhalatietechniek

Bij patiënten van 75 jaar of ouder ook: Aanwijzingen kwetsbaarheid (ouderenzorg).

---

## 13. Copy Phone, Email, BSN, Address

**Waar te vinden:** In de **patiëntbalk** bovenaan het scherm.

**Wat het doet:**
Voegt **📋-kopieerknopjes** toe naast geboortedatum, telefoonnummer(s), e-mailadres, BSN en adres. Klik om de waarde naar het klembord te kopiëren — het knopje verandert even in ✓.

---

## 14. LSP-instellingen

**Waar te vinden:** Via de **Opt-in**-knop in de patiëntbalk.

**Wat het doet:**
Automatiseert LSP-toestemming via een dialoog met drie knoppen: **Ja**, **Nee** en **Annuleren**. Werkt alleen bij grijze Opt-in-knoppen (nieuwe registraties).

---

## 15. P veld herinneringen

**Waar te vinden:** Werkt automatisch in het **P-veld** van het SOEP-formulier.

**Wat het doet:**
Toont een gele pop-up herinnering bij bepaalde trefwoorden:

| Trefwoord | Herinnering |
|-----------|-------------|
| `copd` | *"Hoort deze patient in ketenzorg?"* |

---

## 16. Promedico Crash Recovery

**Waar te vinden:** Rode knop **💥 Consult Invoeren Na Crash** rechtsbovenin het SOEP-formulier.

**Wat het doet:**
Plak eerder getypte SOEP-tekst in het popup-veld en klik **Invoegen** — het script verdeelt de tekst automatisch over S, O, E en P.

---

## 17. SOEP Measurements

**Waar te vinden:** Inklapbaar paneel **📊 Metingen** bovenaan het SOEP-formulier.

**Wat het doet:**
Meetwaardenpaneel voor gewicht, lengte, RR, pols, saturatie en temperatuur. BMI wordt automatisch berekend. Na opslaan wordt het O-veld aangevuld met een samenvattingsregel.

---

## 18. SOEP Sjablonen

**Waar te vinden:** Groene knop **Sjablonen** naast het P-veld.

**Beschikbare sjablonen:**

| Sjabloon | Actie |
|----------|-------|
| **CRP aanvragen** | Kopieert BSN + opent POCTConnect |
| **BVO** | Vult O/E/P in voor uitstrijkje + ICPC X49 + Medische Logistiek |
| **PMDD** | Vult P in met vervolgafspraak-tekst |
| **Pijn → Pcm / NSAID / Tramadol** | Vult P in met pijnadvies |
| **ECG → Normaal / Ischemie / Ritme / Bundeltak** | Vult O in met ECG-beschrijving |
| **UWI → Normaal / Infectie / Dip / Kweek** | Vult O en P in + eventueel ICPC U71 |

---

## 19. Verrichting Quick Buttons

**Waar te vinden:** Boven de sectie *Verrichtingen* in het **declaratiescherm**.

**Contacttype-knoppen** (vervangen huidig type): C, C2, CP, C2P, V, V2, VITK

**Handeling-knoppen** (stapelen): CRP, MMSE, DIP, STI, CHI, INJ, ECG

> **Let op:** Het vervangen van het contacttype is vooralsnog niet 100% betrouwbaar.

---

## 20. Zneller Formulieren

**Waar te vinden:** Werkt automatisch in het **P-veld** van het SOEP-formulier.

**Triggers:**

| Trefwoord | Formulier |
|-----------|-----------|
| `liraglutide` of `saxenda` | Liraglutide-formulier |
| `naltrexon` of `bupropion` | Naltrexon/Bupropion-formulier |
| `exenatide`, `dulaglutide` of `semaglutide` | GLP-1 agonist formulier |

Klik op de link in de balloon → zneller.nl opent met patiëntgegevens automatisch ingevuld.

---

## 21. Zorgdomein Quick Menu

**Waar te vinden:** Knop **Zorgdomein** in de actiebalk van het Journaal/consult-scherm.

**Wat het doet:**
Navigeert direct naar een specifieke ZorgDomein-verwijzingspagina. Beschikbare categorieën: Diagnostiek, Paramedische zorg, Meedenkadvies/Verwijzen (alle specialismen), Aanvullende zorg, GGZ, Jeugdzorg, Verpleging, Verblijf, SCEN, Hulpmiddelen.

> **Let op:** De ZorgDomein-URL's zijn geconfigureerd voor Saltro en Meander ziekenhuis — aanpassen voor jouw regio.

---

## Technische informatie

### Configuratie-aandachtspunten (***aan te passen per praktijk***)

- **Script 11e:** De naam *"E.A. Westerbeek"* is hardcoded als huisarts-selectie
- **Script 20:** ZorgDomein-URL's zijn gekoppeld aan specifieke aanbieders

### Aan/uitzetten van scripts

Klik op het extensie-icoon rechtsbovenin de browser. Elk script heeft een eigen schakelaar. Wijzigingen gaan direct in.
