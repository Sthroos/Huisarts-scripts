# Promedico ASP Helper — Gebruikershandleiding

Deze handleiding beschrijft alle scripts van de Promedico ASP Helper extensie. Elk script kan afzonderlijk worden in- of uitgeschakeld via de popup van de extensie (klik op het extensie-icoon in de adresbalk).

---

## Inhoudsopgave

1. [Agenda Menu Items](#1-agenda-menu-items)
2. [Auto-delete Berichten](#2-auto-delete-berichten)
3. [Auto-check MEDOVD & Auto-download](#3-auto-check-medovd--auto-download)
4. [Brieven Verwerken](#4-brieven-verwerken)
5. [Consult Kopiëren](#5-consult-kopiëren)
6. [Contactsoort Quick Buttons](#6-contactsoort-quick-buttons)
7. [Correspondentie Upload](#7-correspondentie-upload)
8. [Verplaats en Verberg Delen](#8-verplaats-en-verberg-delen)
9. [E-consult Template Responses](#9-e-consult-template-responses)
10. [Herhaalrecepten Verwerken](#10-herhaalrecepten-verwerken)
11. [Initialen in S-veld](#11-initialen-in-s-veld)
12. [Inschrijven en MEDOVD Import](#12-inschrijven-en-medovd-import)
13. [Meetwaarden Highlights (2 regels)](#13-meetwaarden-highlights-2-regels)
14. [Copy Phone, Email, BSN, Address](#14-copy-phone-email-bsn-address)
15. [LSP-instellingen](#15-lsp-instellingen)
16. [P veld herinneringen](#16-p-veld-herinneringen)
17. [Snel Consulten Invoeren](#17-snel-consulten-invoeren)
18. [SOEP Measurements](#18-soep-measurements)
19. [SOEP Sjablonen](#19-soep-sjablonen)
20. [Verrichting Quick Buttons](#20-verrichting-quick-buttons)
21. [Zneller Formulieren](#21-zneller-formulieren)
22. [Zorgdomein Quick Menu](#22-zorgdomein-quick-menu)

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

## 4. Brieven Verwerken

**Waar te vinden:** Op de **brieven-verwerkingspagina** (Werklijst → Berichten → Verwerken). Er verschijnt een blauwe knop **📋 Brief verwerker** naast de *Afdrukken*-knop, en een blauwe preview-balk bovenaan het formulier.

**Wat het doet:**
Extraheert automatisch de relevante inhoud uit binnenkomende brieven (HAP-waarneming, specialistenbrieven, paramedische verslagen) en plaatst die kant-en-klaar in de juiste SOEP-velden van het verwerkingsformulier.

**Ondersteunde brieftypen:**

| Brieftype | Omschrijving |
|-----------|-------------|
| **HAP-waarneming** (Medvry31) | Vrije brief met (S)/(O)/(E)/(P)-structuur — herkent de SOEP-opbouw automatisch |
| **Specialistenbrief** (Medspe31) | Brieven van ziekenhuizen, kinderarts etc. — extraheert Conclusie → S, Beleid → P, Beloop → O |
| **Vrijgevestigd specialist** (Medvri10) | Diëtist, podotherapeut, fysiotherapeut etc. — extraheert per beroepsgroep |
| **Korte specialistenbrief** (Medspe10) | Teleconsult, kortere notities — extraheert Conclusie en Beleid |

**Hoe het werkt:**
1. Open een brief via Werklijst → Berichten → klik op *Verwerken*
2. De brief verwerker analyseert de brief automatisch en toont een **preview-balk** met de geëxtraheerde velden (max. 120 tekens per veld ter controle)
3. Controleer of de extractie klopt
4. Klik **✓ Invullen** — de velden Onderwerp, S, O, E, ICPC en P worden ingevuld
5. Klik op **✕ Sluiten** als je de extractie niet wilt gebruiken
6. De knop **📋 Brief verwerker** bovenaan blijft beschikbaar om de preview opnieuw te tonen

> **Let op:** De extractie is een automatische schatting op basis van tekstpatronen. Controleer altijd de ingevulde velden voordat je de brief afrondt.

---

## 5. Consult Kopiëren

**Waar te vinden:** Verschijnt automatisch als een blauwe knop **📋 Kopieer** rechtsboven bij de tabel *Laatste journaalregels* (op de patiëntoverzichtspagina) en bij *Journaalregels* (in de episodeweergave).

**Wat het doet:**
Maakt het mogelijk om één of meerdere consulten uit het journaal te selecteren en als opgemaakte tekst naar het klembord te kopiëren — handig voor overdrachten, second opinions of samenvatten in brieven.

**Hoe het werkt:**
1. Klik op **📋 Kopieer** — de knop wordt oranje en er verschijnen checkboxen links van elk consult
2. Het eerste (meest recente) consult is standaard aangevinkt
3. Vink de gewenste consulten aan of uit
4. Klik nogmaals op **✂️ Kopieer selectie** — de geselecteerde consulten worden als tekst naar het klembord gekopieerd
5. De tekst bevat per consult: type, datum, episodenaam, en alle SOEP-regels

---

## 6. Contactsoort Quick Buttons

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

## 7. Correspondentie Upload

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

## 8. Verplaats en Verberg Delen

**Waar te vinden:** Werkt automatisch op het **Journaal/SOEP**-formulier, in het gedeelte met de sectie *Delen*.

**Wat het doet:**
Standaard staat de sectie *Delen* (voor gedeelde contacten) prominent in het formulier. Dit script:

1. **Verplaatst** de sectie *Delen* zodat die ná de sectie *Episode* staat in plaats van er tussenin
2. **Klapt de sectie in** — de inhoud is standaard verborgen
3. Maakt de sectie **klikbaar**: klik op de *Delen*-koptekst om de inhoud in of uit te klappen (met een ▼-pijltje als indicator)

**Waarom handig:**
De *Delen*-sectie is zelden relevant bij normale consulten en stond visueel in de weg. Met dit script staat hij uit het zicht maar is hij nog steeds bereikbaar wanneer nodig.

---

## 9. E-consult Template Responses

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

## 10. Herhaalrecepten Verwerken

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

> **Let op:** Het script verwerkt recepten zonder tussenkomst. Gebruik dit alleen als je de recepten al hebt bekeken en ze allemaal wil verwerken.
> **Let op:** Als het veld *Genoeg voor (dagen)* leeg is na het openen van het doseerformulier, vult het script automatisch **30 dagen** in.

---

## 11. Initialen in S-veld

**Waar te vinden:** Werkt automatisch bij het openen van een nieuw consult in het **SOEP-formulier**.

**Wat het doet:**
Plaatst automatisch je initialen (afgeleid van de ingelogde gebruikersnaam) bovenaan het S-veld zodra een consult geopend wordt. Zo is altijd zichtbaar wie de aantekening heeft gemaakt.

**Hoe het werkt:**
- De initialen worden berekend uit de naam van de ingelogde gebruiker (tussenvoegsels zoals "van", "de", "den" worden overgeslagen)
- Het script wacht tot de waarde van het S-veld stabiel is (om te voorkomen dat het script vóór een eventueel eerder ingevulde waarde schrijft)
- Als de initialen al aanwezig zijn in het veld (bijv. bij heropen van een consult), worden ze niet opnieuw toegevoegd
- De cursor wordt na het invoegen aan het einde van het veld geplaatst

**Voorbeeld:** Ingelogd als "S.T. Roos" → initialen `SR:` worden vooraan het S-veld geplaatst.

---

## 12. Inschrijven en MEDOVD Import

Dit script bevat meerdere functies:

### 9a. Extra menu-items (Patiënt-menu)

**Waar te vinden:** Hoofdmenu → **Patiënt**-submenu.

Voegt twee extra items toe aan het Patiënt-menu:

- **MEDOVD import** — opent direct het scherm voor het importeren van een MEDOVD-dossier
- **Nieuwe patiënt** — opent direct het inschrijfformulier voor een nieuwe patiënt

### 9b. Favorieten-menu

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

### 9c. Menu openen met hover

Het hoofdmenu opent nu automatisch als je met de muis over de menuknop beweegt (in plaats van klikken). Het menu sluit automatisch na ±0,6 seconden als de muis het menu verlaat.

### 9d. MEDOVD Import drag & drop

**Waar te vinden:** Op de **MEDOVD Import**-pagina (Patiënt → MEDOVD import).

**Wat het doet:**
Maakt het mogelijk om een EDI-bestand én een ZIP-bestand tegelijk in te slepen naar de MEDOVD-importpagina. Sleep beide bestanden tegelijk op het scherm — het script plaatst ze automatisch in de juiste invoervelden en klikt op *Bestand inlezen*.

Er verschijnt een groene stippelrand als de drop-zone actief is. Verwacht formaat: één `.edi`-bestand en één `.zip`-bestand.

### 9e. Patiëntformulier automatisch invullen

**Waar te vinden:** Op de pagina **Patiëntgegevens bewerken**. Er verschijnt een knop **Informatie vullen** naast de *Terug*-knop.

**Wat het doet:**
Vult het inschrijfformulier automatisch in op basis van geplakte tekst (bijv. uit een inschrijfverzoek per e-mail of een standaardformat).

**Hoe het werkt:**
1. Klik op **Informatie vullen**
2. Plak de patiëntgegevens in het tekstveld dat verschijnt
3. Het script herkent velden als Achternaam, Voorletters, Voornamen, Tussenvoegsel, Meisjesnaam, Naam volgorde, Geboortedatum, Geboorteplaats, Geslacht, BSN, Telefoonnummer, E-mail, Beroep, Type ID bewijs, ID bewijs nummer
4. Ingevulde velden: het script meldt hoeveel velden zijn gevuld

> **Let op:** Het script is nu geconfigureerd om bij het veld *Huisarts* automatisch te zoeken naar de naam van de ingelogde gebruiker. Als dit niet correct werkt, kan de naam in de broncode worden aangepast. In een toekomstige versie wordt dit via de onboarding instelbaar.

---

## 13. Meetwaarden Highlights (2 regels)

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

## 14. Copy Phone, Email, BSN, Address

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

## 15. LSP-instellingen

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

## 16. P veld herinneringen

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

## 17. Snel Consulten Invoeren

**Waar te vinden:** Verschijnt als een rode knop **💥 Consult Invoeren Na Crash** rechtsbovenin het SOEP-formulier tijdens een consult.

**Wat het doet:**
Als Promedico crasht of niet bereikbaar is, maar je weet wel welke patient je voor je hebt, kun je met dit script de getypte SOEP-tekst alsnog snel invoeren. Natuurlijk wel als je die teksten aan het einde van je spreekuur ergens hebt opgeslagen (bijv. gekopieerd naar Kladblok of een ander programma).

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

## 18. SOEP Measurements

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
| Glucose | mmol/L | 1 – 40 |

**BMI** wordt automatisch berekend en weergegeven als gewicht én lengte zijn ingevuld. De kleur geeft de categorie aan: groen (normaal), oranje (overgewicht), rood (ondergewicht of obesitas).

Bij **glucose** kun je via een checkbox aangeven of de meting nuchter of niet-nuchter is — dit bepaalt welk bepaling-ID naar Promedico wordt gestuurd.

**Hoe het werkt:**
1. Klik op het **📊 Metingen**-paneel om het open te klappen
2. Vul de gewenste waarden in; elk veld toont ✓ of ✗ bij validatie
3. Klik op **💾 Nu metingen opslaan** om direct op te slaan, *of*
4. Klik gewoon op **Opslaan** of **Verder** in het SOEP-formulier — het script onderschept dit en slaat eerst de metingen op voordat het formulier wordt ingediend
5. Na opslaan wordt het O-veld automatisch aangevuld met een samenvattingsregel, bijv.: `75 kg, 178 cm, BMI 23,7, RR 125/80, pols 72, sat 98%`

**Valideer IDs — 🔍 knop:**
Promedico gebruikt interne bepaling-IDs om metingen op te slaan. Deze IDs kunnen na een Promedico-update wijzigen. Met de knop **🔍 Valideer IDs** in het meetpaneel wordt automatisch gecontroleerd of alle IDs nog correct zijn. Als een ID niet meer klopt, wordt het bijbehorende veld grijs en uitgeschakeld totdat het probleem is opgelost. De validatie loopt ook dagelijks automatisch op de achtergrond.

---

## 19. SOEP Sjablonen

**Waar te vinden:** Verschijnt als een groene knop **Sjablonen** naast het P-veld in het SOEP-formulier.

**Wat het doet:**
Voegt een dropdown-menu toe met veelgebruikte SOEP-tekstsjablonen die met één klik in de O-, E- en P-velden worden ingevoegd. Sommige sjablonen hebben een submenu.

**Beschikbare sjablonen:**

| Sjabloon | Actie |
|----------|-------|
| **CRP aanvragen** | Kopieert het BSN van de patiënt naar het klembord en opent **POCTConnect** (poctconnect.nl) in een nieuw tabblad voor het aanmaken van een CRP-sneltestorder |
| **BVO** | Vult O, E en P in voor een bevolkingsonderzoek uitstrijkje (cervixcytologie), stelt ICPC X49 in en opent de Medische Logistiek website voor koerier aanvragen |
| **PMDD** | Vult het P-veld in met een tekst over een vervolgafspraak via *Praat met de Dokter* |
| **Pijn → Pcm** | Vult P in met paracetamol-advies |
| **Pijn → NSAID** | Vult P in met ibuprofen-advies inclusief contra-indicaties |
| **Pijn → Tramadol** | Vult P in met tramadol-tekst inclusief bijwerkingen |
| **ECG → Normaal** | Vult O in met standaard normaal ECG-beschrijving |
| **ECG → Ischemie** | Vult O in met ECG-afwijking (ST-segmentafwijkingen) |
| **ECG → Ritme** | Vult O in met boezemfibrilleren-beschrijving |
| **ECG → Bundeltak** | Vult O in met LBTB-beschrijving |
| **UWI → Normale urine** | Vult O en P in: geen afwijkingen, geen UWI |
| **UWI → Urineweginfectie** | Vult O en P in met behandeladvies + ICPC U71 instellen |
| **UWI → Op dip gezet** | Vult O en P in: dipslide ingezet |
| **UWI → Op kweek gestuurd** | Vult P in: urine naar kweek gestuurd |

**Hoe het werkt:**
1. Klik op de **Sjablonen**-knop naast het P-veld
2. Kies een sjabloon of hover over een sjabloon met submenu voor de opties
3. De tekst wordt ingevoegd in de betreffende velden (bestaande tekst blijft staan, nieuwe tekst wordt op een nieuwe regel toegevoegd)
4. Bij UWI met ICPC: de ICPC-code wordt automatisch ingesteld en de zoekpopup wordt geopend en automatisch bevestigd

---

## 20. Verrichting Quick Buttons

**Waar te vinden:** Verschijnt automatisch boven de sectie *Verrichtingen horende bij dit contact* in het **declaratiescherm** van een consult.

**Wat het doet:**
Voegt een rij snelknoppen toe waarmee je veelgebruikte verrichtingen met één klik kunt toevoegen aan het declaratiescherm.

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

> **Let op:** Contacttype-knoppen verwijderen eerst het bestaande niet-handeling contacttype voordat het nieuwe type wordt toegevoegd. Handeling-knoppen worden altijd opgestapeld.
> **Let op:** Het vervangen van het contacttype door een volgende is vooralsnog niet 100% betrouwbaar, let dus altijd op wat je doet.

**Eigen declaratiecodes — ⚙ knop:**
Naast de vaste knoppen is er een derde rij voor **eigen codes** (cyaan/blauw). Via de **⚙**-knop rechts in de knoppenbalk open je een instellingenvenster waar je uit alle beschikbare declaratiecodes in jouw Promedico-installatie kunt kiezen. Aangevinkte codes verschijnen als snelknop in de eigen rij. Codes die later uit Promedico worden verwijderd worden automatisch grijs weergegeven. Eigen codes worden altijd opgestapeld (net als handeling-knoppen).

---

## 21. Zneller Formulieren

**Waar te vinden:** Werkt automatisch in het **P-veld** van het SOEP-formulier. Als een triggertrefwoord wordt herkend, verschijnt een gele pop-up balloon.

**Wat het doet:**
Herkent medicijnen die een ZN-formulier vereisen en toont een herinnering met een directe link naar het juiste formulier op zneller.nl. Als je op de link klikt, opent zneller.nl in een nieuw tabblad en worden de **naam, geboortedatum, adres, postcode en woonplaats** van de patiënt automatisch ingevuld in het formulier.

**Triggers en bijbehorende formulieren:**

| Trefwoord in P-veld | Formulier |
|---------------------|-----------|
| `liraglutide` of `saxenda` | Liraglutide-formulier |
| `naltrexon` of `bupropion` | Naltrexon/Bupropion-formulier |
| `exenatide`, `dulaglutide` of `semaglutide` | GLP-1 agonist formulier (met twee opties: met of zonder insuline) |

**Hoe het werkt:**
1. Typ een van de bovenstaande medicijnnamen in het P-veld
2. Een gele balloon verschijnt met de melding *"Vergeet ZN formulier niet!"* en een klikbare link
3. Klik op de link → zneller.nl opent in een nieuw tabblad
4. De patiëntgegevens worden automatisch ingevuld in het zneller-formulier
5. Controleer de indicatie-sectie (wordt automatisch geopend) en vul het formulier verder in

---

## 22. Zorgdomein Quick Menu

**Waar te vinden:** Verschijnt als een extra knop **Zorgdomein** in de actiebalk van het **Journaal/consult**-scherm, naast de bestaande *Verwijzen*-knop.

**Wat het doet:**
Voegt een uitgebreid menu toe waarmee je direct vanuit Promedico naar een specifieke ZorgDomein-verwijzingspagina kunt navigeren, zonder eerst handmatig het specialisme in te typen.

**Hoe het werkt:**
1. Open een contact/journaal van een patiënt
2. Klik op de **Zorgdomein**-knop in de actiebalk
3. Er verschijnt een menu met hoofdcategorieën; hover over een categorie om het submenu te zien
4. Klik op het gewenste specialisme of onderzoek
5. Het script:
   - Klikt automatisch op *Verwijzen* in Promedico
   - Vult het specialisme-veld in
   - Klikt op *Via ZorgDomein*
   - Navigeert automatisch naar de juiste pagina op zorgdomein.nl

**Beschikbare categorieën en selectie van subcategorieën:**

- **Diagnostiek:** Lab (incl. pathologie, trombosedienst), Röntgen, Echo, Functieonderzoek, Endoscopie, Nucleaire Geneeskunde
- **Paramedische zorg:** Diëtetiek, Ergotherapie, Fysiotherapie, Logopedie, Podotherapie, Verloskunde, en meer
- **Meedenkadvies / Verwijzen:** Alle medische specialismen (Cardiologie, Dermatologie, Gynaecologie, Interne geneeskunde (meerdere subspecialisaties), KNO, Longziekten, Neurologie, Orthopedie, Urologie, en tientallen anderen)
- **Aanvullende zorg:** Leefstijlcoaching, Overgangsconsulent, Pedicure
- **Geestelijke gezondheidszorg:** ADHD, Angst, Autisme, Dementie, Eetproblemen, Persoonlijkheidsproblemen, Stemmingsklachten, Verslaving, en meer
- **Jeugdzorg:** Cognitieve ontwikkeling, Opvoedingsproblemen, Verwaarlozing/mishandeling
- **Verpleging en verzorging:** Complexe gezondheidsproblemen, Palliatieve zorg, Specialistische verpleging
- **Verblijf en wonen:** Kortdurend verblijf, Langdurend verblijf, Dagbehandeling
- **⚕ SCEN arts aanvragen** — directe link naar het SCEN-formulier op ZorgDomein
- **Hulpmiddelen:** Diabetesmaterialen, Compressiematerialen, Mobiliteit, Orthesen, Respiratoire hulpmiddelen, en meer

> **Instelling:** Welke zorginstellingen in het menu verschijnen stel je in via de **onboarding** (zie hieronder). Het menu werkt voor alle regio's in Nederland — je kiest zelf met welke ziekenhuizen en laboratoria jouw praktijk samenwerkt.

---

## Technische informatie

### Onboarding

Bij de eerste installatie (of via de extensie-popup → *Instellingen opnieuw doorlopen*) verschijnt een onboarding-wizard met 3 stappen:

**Stap 1 — Zorginstellingen:** Vink de ziekenhuizen, laboratoria en andere zorginstellingen aan waarmee jouw praktijk samenwerkt. Deze verschijnen vervolgens in het Zorgdomein snelmenu onder de juiste categorie (Diagnostiek, Meedenkadvies, etc.). Je kunt filteren op type instelling en zoeken op naam. Instellingen van een andere pc importeren kan via de importknop.

**Stap 2 — BVO uitstrijkje:** Kies hoe het uitstrijkje bij jullie wordt verwerkt: via een koerier die ophaalt, of een andere werkwijze. Dit bepaalt de tekst die het BVO-sjabloon in het P-veld plaatst.

**Stap 3 — CRP sneltest:** Kies hoe een CRP wordt aangevraagd: via POCTConnect (digitale aanvraag, opent poctconnect.nl met automatisch gekopieerd BSN) of handmatige invoer (plaatst een invulregel in het O-veld).

Na de onboarding zijn alle relevante scripts direct correct geconfigureerd voor jouw praktijk.

### Aan/uitzetten van scripts

Klik op het extensie-icoon (rechtsbovenin de browser) om de popup te openen. Elk script heeft een eigen schakelaar. Wijzigingen gaan direct in.
