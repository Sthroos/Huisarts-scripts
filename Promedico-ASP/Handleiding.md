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
9. [Initialen in S-veld](#9-initialen-in-s-veld)
10. [Inschrijven en MEDOVD Import](#10-inschrijven-en-medovd-import)
11. [Meetwaarden Highlights (2 regels)](#11-meetwaarden-highlights-2-regels)
12. [Copy Phone, Email, BSN, Address](#12-copy-phone-email-bsn-address)
13. [LSP-instellingen](#13-lsp-instellingen)
14. [P veld herinneringen](#14-p-veld-herinneringen)
15. [Promedico Crash Recovery](#15-promedico-crash-recovery)
16. [SOEP Measurements](#16-soep-measurements)
17. [SOEP Sjablonen](#17-soep-sjablonen)
18. [Verrichting Quick Buttons](#18-verrichting-quick-buttons)
19. [Zneller Formulieren](#19-zneller-formulieren)
20. [Zorgdomein Quick Menu](#20-zorgdomein-quick-menu)

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

> **Let op:** Controleer of de spam-criteria overeenkomen met jouw praktijksituatie. De script verwijdert alle berichten die aan de bovenstaande criteria voldoen.

---

## 3. Auto-check MEDOVD & Auto-download

**Waar te vinden:** Werkt automatisch op de pagina voor uitschrijving/dossieroverdracht

**Wat het doet:**
Dit script doet twee dingen automatisch zodra de betreffende pagina wordt geopend:

**A. Checkbox automatisch aanvinken:**
Het veld *"Verhuisbericht patiënt"* wordt automatisch aangevinkt als dit nog niet het geval is. Dit voorkomt dat je vergeet dit vakje aan te kruisen bij het uitschrijven van een patiënt.

**B. Automatisch downloaden:**
Als er downloadlinks aanwezig zijn op de pagina (MEDOVD-bestand, correspondentie-ZIP of patiëntdossier-PDF), worden deze automatisch gedownload. De bestandsnamen worden opgebouwd als:

- `[patiëntnummer]_[datum]_MEDOVD.xml`
- `[patiëntnummer]_[datum]_Correspondentie.zip`
- `[patiëntnummer]_[datum]_Patientdossier.pdf`

Meerdere bestanden worden met een seconde tussenpauze na elkaar gedownload om de browser niet te overbelasten.

---

## 4. Contactsoort Quick Buttons

**Waar te vinden:** Verschijnt automatisch in het **Journaal**-formulier, op de regel met *Contactsoort* en *Contactdatum*.

**Wat het doet:**
Voegt vier gekleurde snelknoppen toe waarmee je de contactsoort met één klik instelt, zonder de dropdown te hoeven openen:

| Knop | Kleur | Contactsoort |
|------|-------|--------------|
| **E** | Blauw | EC - electronisch consult |
| **C** | Groen | C - consult |
| **T** | Oranje | T - telefonisch contact |
| **V** | Rood | V - visite |

**Hoe het werkt:**
- Klik op de gewenste knop → de dropdown wordt automatisch ingesteld op de juiste waarde

---

## 5. Correspondentie Upload

**Waar te vinden:** Werkt op de **Correspondentie**-pagina van een patiënt (Medisch Dossier → Correspondentie).

**Wat het doet:**
Maakt het mogelijk om een document te uploaden naar de correspondentie via **drag & drop** — sleep een bestand vanuit Windows Verkenner (of een andere file browser) direct naar het Promedico-scherm.

**Hoe het werkt:**
1. Open de Correspondentie-pagina van een patiënt
2. Sleep een bestand (bijv. een PDF of brief) vanuit Verkenner naar het browservenster
3. Er verschijnt een blauwe stippelrand als de drop-zone actief is
4. Het bestand wordt automatisch verwerkt:
   - De upload-wizard wordt automatisch geopend
   - Het bestand wordt in het uploadformulier geplaatst
   - De *Verder*-knop wordt automatisch geklikt
   - Op de beschrijvingspagina wordt het veld **Omschrijving** automatisch gevuld met de bestandsnaam (zonder extensie)
5. Controleer de omschrijving, vul de afzender in en klik zelf op Opslaan

> **Let op:** Slechts één bestand tegelijk; bij meerdere bestanden tegelijk verschijnt een waarschuwing.

---

## 6. Verplaats en Verberg Delen

**Waar te vinden:** Werkt automatisch op het **Journaal/SOEP**-formulier, in het gedeelte met de sectie *Delen*.

**Wat het doet:**
Standaard staat de sectie *Delen* (voor gedeelde contacten) prominent in het formulier. Dit script:

1. **Verplaatst** de sectie *Delen* zodat die ná de sectie *Episode* staat in plaats van er tussenin
2. **Klapt de sectie in** — de inhoud is standaard verborgen
3. Maakt de sectie **klikbaar**: klik op de *Delen*-koptekst om de inhoud in of uit te klappen (met een ▼-pijltje als indicator)

**Waarom handig:**
De *Delen*-sectie is zelden relevant bij normale consulten en stond visueel in de weg. Met dit script staat hij uit het zicht maar is hij nog steeds bereikbaar wanneer nodig.

---

## 7. E-consult Template Responses

**Waar te vinden:** Op de **E-consult**-pagina (Journaal/E-consult), naast het *Reactie(P)*-veld. Er verschijnt een blauwe knop **📝 Sjablonen**.

**Wat het doet:**
Voegt een knop toe waarmee je kant-en-klare antwoordingteksten kunt invoegen in het reactieveld van een e-consult. Je naam (zoals ingelogd in Promedico) wordt automatisch als ondertekening toegevoegd.

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

**Hoe het werkt:**
1. Open een e-consult dat beantwoord moet worden
2. Klik op de **📝 Sjablonen**-knop naast het reactieveld
3. Kies het gewenste sjabloon uit het dropdown-menu
4. De tekst wordt ingevoegd in het Reactie-veld, aangevuld met jouw naam
5. Pas de tekst eventueel handmatig aan en sla op

---

## 8. Herhaalrecepten Verwerken

**Waar te vinden:** Op de **Werklijst → Recept**-pagina (receptaanvragen). Er verschijnt een blauwe knop **⚡ Alles automatisch verwerken** naast de koptekst *Te beoordelen recept aanvragen*.

**Wat het doet:**
Verwerkt alle openstaande herhaalrecepten automatisch één voor één, zonder dat je voor elk recept handmatig door de twee stappen hoeft te klikken.

**Hoe het werkt:**
1. Ga naar Werklijst → Recept
2. Klik op **⚡ Alles automatisch verwerken**
3. Het script doorloopt elk recept automatisch:
   - Stap 1: klikt op *Verwerken* in de werklijst
   - Stap 2: wacht tot het herhalingsoverzicht geladen is
   - Stap 3: klikt op de *Verwerken*-knop in het herhalingsoverzicht
   - Keert terug naar de werklijst en herhaalt dit voor het volgende recept
4. Onderin het scherm verschijnt een statusbalk die bijhoudt hoeveel recepten verwerkt zijn
5. Als alle recepten klaar zijn: *"Klaar! X recept(en) verwerkt"*

> **Let op:** Het script verwerkt recepten zonder beoordeling. Gebruik dit alleen als je de recepten al hebt bekeken en ze allemaal goedgekeurd wil verwerken.
> **Let op:** Dit script staat standaard uit, hij werkt nog niet.

---

## 9. Initialen in S-veld

**Waar te vinden:** Werkt automatisch in het **S-veld** (Subjectief) van het SOEP-formulier tijdens een consult.

**Wat het doet:**
Plaatst automatisch je initialen vooraan in het S-veld zodra een consult wordt geopend. De initialen worden afgeleid van de naam waarmee je bent ingelogd in Promedico.

**Voorbeelden:**
- Sebastiaan Roos → `SR: `
- Eline Westerbeek van Eerten → `EWE: ` (tussenvoegsel *van* wordt overgeslagen)

**Hoe het werkt:**
- Als het S-veld **leeg** is: de initialen worden vooraan geplaatst, je kunt direct verder typen
- Als het S-veld **al tekst bevat**: de initialen worden op een nieuwe regel achteraan toegevoegd
- Als de initialen er al in staan: het script doet niets (geen dubbele toevoeging)

> **Let op:** Het script leest de ingelogde gebruikersnaam automatisch uit Promedico via de "Aangemeld als"-tekst in de bovenbalk. Tussenvoegels (van, de, den, der, het, 't, op, ten, etc.) worden automatisch genegeerd bij het berekenen van de initialen.

---

## 10. Inschrijven en MEDOVD Import

Dit script bevat meerdere functies:

### 10a. Extra menu-items (Patiënt-menu)

**Waar te vinden:** Hoofdmenu → **Patiënt**-submenu.

Voegt twee extra items toe aan het Patiënt-menu:

- **MEDOVD import** — opent direct het scherm voor het importeren van een MEDOVD-dossier
- **Nieuwe patiënt** — opent direct het inschrijfformulier voor een nieuwe patiënt

### 10b. Favorieten-menu

**Waar te vinden:** Helemaal links in de navigatiebalk, als eerste menu-item: **★ Favorieten**.

**Wat het doet:**
Voegt een aanpasbaar favorietenmenu toe aan de navigatiebalk, zodat je de menu-items die je het meest gebruikt met één klik bereikt.

**Standaard favorieten:**
Medisch Dossier (Zoeken, Overzicht, Uitslagen, Medicatie, Correspondentie), Patiëntgegevens, Assistenten Intake, Agenda (Berichten, E-consult, Recept), MEDOVD import, Nieuwe patiënt.

**Favorieten aanpassen:**
1. Open het Favorieten-menu
2. Klik op **✎ Bewerken** onderaan het menu
3. In het bewerkvenster kun je:
   - Items **verslepen** om de volgorde aan te passen (sleep aan het ⠿-icoontje)
   - Items **verwijderen** via het ✕-icoon
   - Nieuwe items **toevoegen** via de dropdown onderaan
4. Klik **Opslaan** om de wijzigingen op te slaan

**Ster-icoontjes:**
In alle andere menu's verschijnt een ★-sterretje naast elk menu-item als je erover hovert. Klik op het sterretje om een item direct toe te voegen aan of te verwijderen uit je favorieten. Een oranje ster = al een favoriet.

### 10c. Menu openen met hover

Het hoofdmenu opent nu automatisch als je met de muis over de menuknop beweegt (in plaats van klikken). Het menu sluit automatisch na ±0,6 seconden als de muis het menu verlaat.

### 10d. MEDOVD Import drag & drop

**Waar te vinden:** Op de **MEDOVD Import**-pagina (Patiënt → MEDOVD import).

**Wat het doet:**
Maakt het mogelijk om een EDI-bestand én een ZIP-bestand tegelijk in te slepen naar de MEDOVD-importpagina. Sleep beide bestanden tegelijk op het scherm — het script plaatst ze automatisch in de juiste invoervelden en klikt op *Bestand inlezen*.

Er verschijnt een groene stippelrand als de drop-zone actief is. Verwacht formaat: één `.edi`-bestand en één `.zip`-bestand.

### 10e. Patiëntformulier automatisch invullen

**Waar te vinden:** Op de pagina **Patiëntgegevens bewerken**. Er verschijnt een knop **Informatie vullen** naast de *Terug*-knop.

**Wat het doet:**
Vult het inschrijfformulier automatisch in op basis van geplakte tekst (bijv. uit een inschrijfverzoek per e-mail of een standaardformat).

**Hoe het werkt:**
1. Klik op **Informatie vullen**
2. Plak de patiëntgegevens in het tekstveld dat verschijnt
3. Het script herkent velden als Achternaam, Voorletters, Voornamen, Tussenvoegsel, Meisjesnaam, Naam volgorde, Geboortedatum, Geboorteplaats, Geslacht, BSN, Telefoonnummer, E-mail, Beroep, Type ID bewijs, ID bewijs nummer
4. Ingevulde velden: het script meldt hoeveel velden zijn gevuld

> **Let op:** Het script is nu geconfigureerd om bij het veld *Huisarts* automatisch te zoeken naar ***"E.A. Westerbeek"*** — dit is de naam van de huisarts waarvoor dit script oorspronkelijk gebouwd is. Pas dit aan in de code als jouw naam anders is. ***

---

## 11. Meetwaarden Highlights (2 regels)

**Waar te vinden:** Werkt automatisch op pagina's met meetwaarden als je klikt op **onderzoek uitvoeren** in het consultscherm.

**Wat het doet:**
Markeert bepaalde meetwaarden in **rood en vetgedrukt** die verplicht zijn voor ketenzorg, en breidt de tekst uit met een toelichting. Dit helpt om bij het invullen van een ketenzorg-consult niets te vergeten.

**Gemarkeerde meetwaarden (altijd):**
- Systolische bloeddruk *(Vereist voor ketenzorg)*
- Diastolische bloeddruk *(Vereist voor ketenzorg)*
- Lichaamsbeweging vlgs norm gezond bewegn *(Vereist voor ketenzorg)*
- Roken (inclusief vapen) *(Vereist voor ketenzorg)*
- Aantal ernstige longaanvallen in 12 mnd *(Vereist voor ketenzorg)*
- Inhalatietechniek *(Vereist voor ketenzorg — met herinnering over CCQ of MRC)*

**Gemarkeerd alleen bij patiënten van 75 jaar of ouder:**
- Aanwijzingen kwetsbaarheid (ouderenzorg) — inclusief herinnering om ICPC A49.01 of A05 in de episodelijst te zetten als de patiënt kwetsbaar is

---

## 12. Copy Phone, Email, BSN, Address

**Waar te vinden:** Verschijnt automatisch in de **patiëntbalk** bovenaan het scherm, naast de betreffende gegevens.

**Wat het doet:**
Voegt kleine **📋-kopieerknopjes** toe naast telefoonnummer, e-mailadres, BSN, adres en geboortedatum in de patiëntbalk. Klik op een knopje om de waarde naar het klembord te kopiëren — het knopje verandert even in ✓ ter bevestiging.

**Toegevoegde kopieerknopjes:**

| Gegevens | Waar |
|----------|------|
| Geboortedatum | Naast de datum in de patiëntinfo |
| Telefoonnummer(s) | Naast elk telefoonnummer (ook mobiel) |
| E-mailadres | Naast het e-mailicoontje |
| BSN | Naast het BSN-nummer |
| Adres | Onderaan het adresblok |

---

## 13. LSP-instellingen

**Waar te vinden:** Werkt op de **patiëntbalk** bovenaan het scherm, via de **Opt-in**-knop (de knop die LSP-toestemming regelt).

**Wat het doet:**
Automatiseert het registreren van LSP-toestemming (Landelijk Schakelpunt). Normaal zijn meerdere kliks en popup-dialogen nodig; dit script vereenvoudigt dat.

**Hoe het werkt:**

Bij een grijze Opt-in-knop (patiënt heeft nog geen LSP-instelling):

1. Klik op de **Opt-in**-knop in de patiëntbalk
2. **Als de patiënt niet voldoet aan de vereisten** (bijv. ontbrekende gegevens): het script sluit automatisch de popup en navigeert naar de patiëntgegevens-pagina zodat je de ontbrekende informatie kunt aanvullen
3. **Als de patiënt wel voldoet**: er verschijnt een duidelijke dialoog met drie knoppen:
   - **Ja** — registreert de patiënt als *akkoord* met LSP-deelname
   - **Nee** — registreert de patiënt als *niet akkoord*
   - **Annuleren** — sluit de dialoog zonder actie
4. Na klikken op Ja of Nee: het script selecteert automatisch de juiste radioknop, klikt op *Opslaan*, wacht op bevestiging, en sluit de popup

> **Let op:** Dit script werkt alleen bij grijze Opt-in-knoppen (nieuwe registraties). Bij reeds ingestelde toestemming (groene of rode knop) doet het script niets.

---

## 14. P veld herinneringen

**Waar te vinden:** Werkt automatisch in het **P-veld** (Plan) van het SOEP-formulier tijdens een consult.

**Wat het doet:**
Toont een gele pop-up herinnering als je bepaalde trefwoorden typt in het P-veld.

**Huidige trigger:**

| Trefwoord | Herinnering |
|-----------|-------------|
| `copd` | *"Hoort deze patient in ketenzorg?"* |

De herinnering verschijnt als een kleine gele balloon onder het P-veld en verdwijnt automatisch na 5 seconden. Je kunt er ook overheen bewegen om hem langer zichtbaar te houden.

> **Uitbreiden:** Wil je meer trefwoorden en herinneringen toevoegen, dan is dat eenvoudig in de broncode van dit script te doen.

---

## 15. Promedico Crash Recovery

**Waar te vinden:** Verschijnt als een rode knop **💥 Consult Invoeren Na Crash** rechtsbovenin het SOEP-formulier tijdens een consult.

**Wat het doet:**
Als Promedico crasht of niet bereikbaar is, maar je weet wel welke patient je voor je hebt, kun je met dit script de getypte SOEP-tekst alsnog snel invoeren.

**Hoe het werkt:**
1. Open het consult opnieuw na de crash
2. Klik op de rode knop **💥 Consult Invoeren Na Crash**
3. Er opent een popup met een groot tekstveld
4. Plak de SOEP-tekst in het veld. Ondersteunde formaten:
   - Met enters: `S:/ tekst` op aparte regels
   - Op één regel: `S: tekst O: tekst E: tekst P: tekst`
   - Scheidingstekens S, O, E en P gevolgd door `:`, `/` of `;`
5. Optioneel: voeg bovenaan **BSN:**, **Geboortedatum:** en **Naam:** toe — het script controleert dan of de gegevens overeenkomen met de open patiënt
6. Klik op **Invoegen** → de tekst wordt per veld in S, O, E en P geplaatst
7. Bij een BSN- of geboortedatum-mismatch vraagt het script om bevestiging

---

## 16. SOEP Measurements

**Waar te vinden:** Verschijnt automatisch als een inklapbaar paneel **📊 Metingen** bovenaan het SOEP-formulier, vlak boven de S-regel.

**Wat het doet:**
Voegt een meetwaardenpaneel toe aan het SOEP-formulier waarmee je metingen kunt invoeren die direct worden opgeslagen in het Promedico-meetsysteem. Tegelijkertijd worden de ingevoerde waarden automatisch als tekstregel aan het O-veld toegevoegd.

**Beschikbare meetvelden:**

| Veld | Eenheid | Geldig bereik |
|------|---------|---------------|
| Gewicht | kg | 0,5 – 500 |
| Lengte | cm | 20 – 250 |
| RR Systolisch | mmHg | 40 – 300 |
| RR Diastolisch | mmHg | 20 – 200 |
| Pols | /min | 20 – 300 |
| Saturatie | % | 50 – 100 |
| Temperatuur | °C | 30 – 45 |

**BMI** wordt automatisch berekend en weergegeven als gewicht én lengte zijn ingevuld.

**Hoe het werkt:**
1. Klik op het **📊 Metingen**-paneel om het open te klappen
2. Vul de gewenste waarden in; elk veld toont ✓ of ✗ bij validatie
3. Klik op **💾 Nu metingen opslaan** om direct op te slaan, *of*
4. Klik gewoon op **Opslaan** of **Verder** in het SOEP-formulier — het script onderschept dit en slaat eerst de metingen op
5. Na opslaan wordt het O-veld automatisch aangevuld met een samenvattingsregel

---

## 17. SOEP Sjablonen

**Waar te vinden:** Verschijnt als een groene knop **Sjablonen** naast het P-veld in het SOEP-formulier.

**Wat het doet:**
Voegt een dropdown-menu toe met veelgebruikte SOEP-tekstsjablonen die met één klik in de O-, E- en P-velden worden ingevoegd.

**Beschikbare sjablonen:**

| Sjabloon | Actie |
|----------|-------|
| **CRP aanvragen** | Kopieert het BSN naar klembord en opent POCTConnect |
| **BVO** | Vult O, E en P in voor uitstrijkje, stelt ICPC X49 in |
| **PMDD** | Vult P in met tekst over vervolgafspraak via Praat met de Dokter |
| **Pijn → Pcm** | Vult P in met paracetamol-advies |
| **Pijn → NSAID** | Vult P in met ibuprofen-advies inclusief contra-indicaties |
| **Pijn → Tramadol** | Vult P in met tramadol-tekst inclusief bijwerkingen |
| **ECG → Normaal** | Vult O in met normaal ECG-beschrijving |
| **ECG → Ischemie** | Vult O in met ECG-afwijking |
| **ECG → Ritme** | Vult O in met boezemfibrilleren-beschrijving |
| **ECG → Bundeltak** | Vult O in met LBTB-beschrijving |
| **UWI → Normale urine** | Vult O en P in: geen afwijkingen |
| **UWI → Urineweginfectie** | Vult O en P in met behandeladvies + ICPC U71 |
| **UWI → Op dip gezet** | Vult O en P in: dipslide ingezet |
| **UWI → Op kweek gestuurd** | Vult P in: urine naar kweek gestuurd |

---

## 18. Verrichting Quick Buttons

**Waar te vinden:** Verschijnt automatisch boven de sectie *Verrichtingen horende bij dit contact* in het **declaratiescherm** van een consult.

**Wat het doet:**
Voegt een rij snelknoppen toe waarmee je veelgebruikte verrichtingen met één klik kunt toevoegen.

**Twee typen knoppen:**

**Contacttype-knoppen** (groen/blauw/paars) — vervangen het huidige contacttype:

| Code | Omschrijving |
|------|-------------|
| C | Consult regulier 5–20 min |
| C2 | Consult regulier 20 min en langer |
| CP | Consult passant 5–20 min |
| C2P | Consult passant 20 min en langer |
| V | Visite regulier korter dan 20 min |
| V2 | Visite regulier 20 min en langer |
| VITK | Intensieve zorg overdag |

**Handeling-knoppen** (oranje/bruin) — worden gestapeld op het bestaande contacttype:

| Code | Omschrijving |
|------|-------------|
| CRP | Materiaalkosten CRP-sneltest |
| MMSE | Cognitieve functietest (MMSE) |
| DIP | Materiaalkosten dipslides |
| STI | Materiaalkosten vloeibaar stikstof |
| CHI | Chirurgie |
| INJ | Therapeutische injectie (Cyriax) |
| ECG | ECG-diagnostiek |

> **Let op:** Het vervangen van het contacttype is vooralsnog niet 100% betrouwbaar — let altijd op wat je doet.

---

## 19. Zneller Formulieren

**Waar te vinden:** Werkt automatisch in het **P-veld** van het SOEP-formulier.

**Wat het doet:**
Herkent medicijnen die een ZN-formulier vereisen en toont een herinnering met een directe link naar het juiste formulier op zneller.nl. Patiëntgegevens worden automatisch ingevuld.

**Triggers:**

| Trefwoord in P-veld | Formulier |
|---------------------|-----------|
| `liraglutide` of `saxenda` | Liraglutide-formulier |
| `naltrexon` of `bupropion` | Naltrexon/Bupropion-formulier |
| `exenatide`, `dulaglutide` of `semaglutide` | GLP-1 agonist formulier |

---

## 20. Zorgdomein Quick Menu

**Waar te vinden:** Verschijnt als een extra knop **Zorgdomein** in de actiebalk van het **Journaal/consult**-scherm.

**Wat het doet:**
Voegt een uitgebreid menu toe waarmee je direct vanuit Promedico naar een specifieke ZorgDomein-verwijzingspagina kunt navigeren.

**Beschikbare categorieën:**
Diagnostiek, Paramedische zorg, Meedenkadvies/Verwijzen (alle specialismen), Aanvullende zorg, Geestelijke gezondheidszorg, Jeugdzorg, Verpleging en verzorging, Verblijf en wonen, SCEN arts aanvragen, Hulpmiddelen.

> **Let op:** De ZorgDomein-links zijn momenteel geconfigureerd voor Saltro en Meander ziekenhuis. Pas de URL's in de broncode aan voor jouw eigen ZorgDomein-contracten.

---

## Technische informatie

### Configuratie-aandachtspunten (***aan te passen per praktijk***)

- **Script 10e (Patiëntformulier invullen):** De naam *"E.A. Westerbeek"* hardcoded als huisarts-selectie — aanpassen naar jouw naam
- **Script 20 (Zorgdomein):** De ZorgDomein-URL's zijn nu nog gekoppeld aan specifieke aanbieders — controleer of de URL's overeenkomen met jouw regio

### Aan/uitzetten van scripts

Klik op het extensie-icoon (rechtsbovenin de browser) om de popup te openen. Elk script heeft een eigen schakelaar. Wijzigingen gaan direct in.
