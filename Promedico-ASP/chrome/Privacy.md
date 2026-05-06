# Privacyverklaring — Promedico ASP Helper
# Privacy Policy — Promedico ASP Helper

*Laatst bijgewerkt / Last updated: mei 2026*

---

> 🇳🇱 **Nederlands** — secties 1–10  
> 🇬🇧 **English** — sections 11–20

---

---

# 🇳🇱 Nederlands

---

## 1. Over deze extensie

Promedico ASP Helper is een browser-extensie voor Google Chrome, Microsoft Edge en Mozilla Firefox, ontwikkeld door een huisarts om het werken in Promedico-ASP te versnellen en te automatiseren. De extensie bestaat uit een reeks losse scripts die actief zijn op de Promedico-ASP omgeving en een beperkt aantal gekoppelde platforms.

---

## 2. Beschikbare versies en distributiekanalen

De extensie is beschikbaar via de volgende kanalen:

| Kanaal | Doelgroep | Update-mechanisme |
|---|---|---|
| Chrome Web Store | Alle Chrome-gebruikers | Automatisch via Google |
| Microsoft Edge Add-ons | Alle Edge-gebruikers | Automatisch via Microsoft |
| Firefox Add-ons (AMO, listed) | Alle Firefox-gebruikers | Automatisch via Mozilla |
| **Firefox DEV-XPI (GitHub)** | Testcomputers | Automatisch via `updates.json` op GitHub |
| GitHub broncode | Ontwikkelaars | Handmatig |

> **Belangrijk — Firefox DEV-XPI:** Naast de drie officiële browserstores bestaat een sideload-versie voor testdoeleinden. Deze versie wordt automatisch bijgewerkt via een bestand (`updates.json`) dat rechtstreeks van GitHub wordt opgehaald, zonder reviewproces van een browserstore. Dit kanaal is uitsluitend bedoeld voor testomgevingen en mag niet worden gebruikt op werkstations waar actieve patiëntdossiers worden geraadpleegd. De broncode van alle versies is openbaar beschikbaar op [github.com/Sthroos/Huisarts-scripts](https://github.com/Sthroos/Huisarts-scripts).

---

## 3. Welke gegevens worden verwerkt

De extensie verwerkt gegevens die zichtbaar zijn in de Promedico-ASP interface terwijl de huisarts daarin werkt. Het gaat uitsluitend om gegevens die nodig zijn voor de directe werking van de scripts. Er worden geen gegevens verzameld voor analyse, statistieken of andere doeleinden.

### 3a. Patiëntgegevens — tijdelijk gelezen, niet opgeslagen

De volgende gegevens worden gelezen uit de Promedico-ASP interface maar niet bewaard:

- Naam, geboortedatum en adres van de actieve patiënt (Zneller-scripts, inschrijfformulier)
- BSN van de actieve patiënt (kopieerknop en CRP POCT-script: wordt naar het klembord gekopieerd)
- Patiëntnummer (bestandsnaam bij automatisch downloaden uitschrijfdossier)
- Inhoud van het SOEP-journaal (sjabloon- en tekst-scripts, consult-herstel)
- Meetwaarden die de huisarts invult in het metingen-paneel (worden direct naar Promedico opgeslagen, niet door de extensie bewaard)
- ICPC-codes en declaratiecodes (verrichtingknoppen en brief-verwerker)

### 3b. Patiëntgegevens — tijdelijk opgeslagen

De extensie slaat in een beperkt aantal gevallen patiëntgegevens tijdelijk op, uitsluitend om een workflow over meerdere stappen of schermen mogelijk te maken:

**Zneller-formulieren (`chrome.storage.local`):**  
Naam, geboortedatum en adres van de actieve patiënt worden tijdelijk opgeslagen wanneer de huisarts een Zneller-formulier opent vanuit Promedico. Deze gegevens worden automatisch gewist zodra het formulier succesvol is ingevuld, worden nooit langer dan 60 seconden bewaard, en worden ook gewist wanneer het Promedico-tabblad wordt gesloten. De gegevens verlaten het apparaat niet.

**Correspondentie-upload (`sessionStorage`):**  
Een PDF-bestand dat via drag-and-drop wordt geüpload, wordt tijdelijk opgeslagen in de `sessionStorage` van het actieve browsertabblad. Deze opslag is strikt per tabblad, wordt nooit naar schijf geschreven, verdwijnt automatisch bij het sluiten van het tabblad, en wordt ook gewist zodra de upload succesvol is voltooid of uiterlijk na 60 seconden.

### 3c. Gebruikersinstellingen — permanent opgeslagen

De volgende niet-patiëntgebonden gegevens worden permanent opgeslagen in `chrome.storage.local` (de beveiligde extensie-opslag van de browser):

- Welke scripts zijn in- of uitgeschakeld
- Geselecteerd regionaal profiel en bijbehorend Zorgdomein-menu
- Instellingen voor BVO-uitstrijkje (koerier of niet) en CRP-aanvraag (POCT of handmatig)
- Naam van de behandelend arts voor automatische selectie bij patiëntinschrijving (voorletters en achternaam, ingevuld door de gebruiker tijdens de installatie-wizard)

De volgende gegevens worden opgeslagen in de `localStorage` van `promedico-asp.nl` (geen patiëntgegevens):

- Gepinde eigen declaratiecodes en favoriete menu-items
- Tijdstempels en resultaten van de dagelijkse ID-validatie voor meetwaarden en verrichtingen (uitsluitend technische codes, geen patiëntdata)
- Tijdelijke ZorgDomein-doel-URL (wordt direct na gebruik gewist)

Deze instellingen bevatten geen patiëntgegevens en zijn uitsluitend bedoeld voor de werking van de extensie.

---

## 4. Wat de extensie niet doet

- De extensie verstuurt geen patiëntgegevens naar de ontwikkelaar, naar externe analysediensten of naar andere derde partijen buiten de bestaande zorgrelaties.
- De extensie heeft geen eigen backend, database of cloudopslag.
- De extensie bevat geen analytics, tracking of telemetrie.
- De extensie slaat geen patiëntgegevens permanent op.

---

## 5. Externe verbindingen

De extensie maakt uitsluitend de volgende externe verbindingen:

| Bestemming | Doel | Bevat patiëntdata? |
|---|---|---|
| `www.promedico-asp.nl` | Normale werking van Promedico-ASP. Meetwaarden worden opgeslagen via geauthenticeerde POST-verzoeken met de sessiecookie van de ingelogde huisarts. De extensie valideert ook dagelijks of bepaling-IDs en verrichting-IDs nog kloppen via GET- en POST-verzoeken zonder patiëntcontext. | Ja (meetwaarden opslaan) — uitsluitend binnen de bestaande zorgrelatie. Nee (ID-validatie). |
| `www.zorgdomein.nl` | Navigatie naar verwijzingsformulieren via het Zorgdomein-menu | Nee |
| `www.zneller.nl` | Voorinvullen van ZN-formulieren met patiëntgegevens op initiatief van de huisarts | Naam, geboortedatum, adres |
| `app.medischelogistiek.nl` | Openen van koerier-portaal na BVO-uitstrijkje (alleen als koerier-optie actief is) | Nee |
| `www.poctconnect.nl` | Openen van CRP POCT-portaal; BSN wordt naar klembord gekopieerd voor handmatige invoer door de gebruiker | Nee (BSN via klembord, niet via de verbinding zelf) |
| `github.com` | Ophalen van update-bestanden voor de DEV-XPI sideload-versie (alleen op testomgevingen) | Nee |

---

## 6. Rechtsgrond en verantwoordelijkheid

De extensie verwerkt bijzondere persoonsgegevens (gezondheidsgegevens) in de zin van artikel 9 AVG. De rechtsgrond voor verwerking is artikel 9 lid 2 sub h AVG (verwerking noodzakelijk voor het verlenen van gezondheidszorg) in combinatie met de beroepsgeheimhoudingsverplichting van de huisarts.

De **huisarts** is verwerkingsverantwoordelijke voor de verwerking van patiëntgegevens via de extensie. De extensie is een hulpmiddel dat handelt onder de instructie en verantwoordelijkheid van de huisarts. Onder artikel 7:454 BW (WGBO) is de huisarts verantwoordelijk voor de juistheid van hetgeen in het dossier wordt vastgelegd, ook wanneer daarvoor geautomatiseerde hulpmiddelen worden ingezet.

Aangesloten praktijken dienen de verwerking via deze extensie op te nemen in hun verwerkingsregister (artikel 30 AVG). Bij gebruik in regionaal verband (meerdere praktijken) is een Data Protection Impact Assessment (DPIA) vereist op grond van artikel 35 AVG.

---

## 7. Beveiliging

De extensie is zo ontworpen dat patiëntgegevens zo kort mogelijk worden bewaard:

- Tijdelijke opslag heeft een maximale levensduur van 60 seconden.
- `sessionStorage` wordt nooit naar schijf geschreven en verdwijnt bij het sluiten van het tabblad.
- Meetwaarden worden uitsluitend in-memory bijgehouden tijdens het invullen en direct naar Promedico gestuurd bij opslaan — ze worden niet door de extensie bewaard.
- Er vindt geen overdracht van patiëntgegevens aan de ontwikkelaar of analysediensten plaats.
- Scriptbestanden worden uitsluitend opgehaald via beveiligde HTTPS-verbindingen via de officiële browserstores.

---

## 8. Gevraagde browserpermissies

| Permissie | Waarvoor |
|---|---|
| `storage` | Opslaan van gebruikersinstellingen en tijdelijke werkdata |
| `tabs` | Openen van externe formulierpagina's en de installatie-wizard in een nieuw tabblad |
| `clipboardWrite` | Kopiëren van BSN naar klembord (kopieerknop en CRP POCT-script) |
| Toegang tot `promedico-asp.nl` | Uitvoeren van automatiseringsscripts in Promedico-ASP |
| Toegang tot `zorgdomein.nl` | Uitvoeren van het Zorgdomein-navigatiescript |
| Toegang tot `zneller.nl` | Voorinvullen van Zneller-formulieren |

---

## 9. Wijzigingen in deze verklaring

Bij materiële wijzigingen in de manier waarop de extensie gegevens verwerkt, wordt deze privacyverklaring bijgewerkt. De actuele versie is altijd beschikbaar in de GitHub-repository en via de browserstores.

---

## 10. Contact

Voor vragen over deze privacyverklaring of de verwerking van persoonsgegevens:

- GitHub: [github.com/Sthroos/Huisarts-scripts](https://github.com/Sthroos/Huisarts-scripts)
- Open een issue in de repository voor technische vragen

---

---

# 🇬🇧 English

---

## 11. About this extension

Promedico ASP Helper is a browser extension for Google Chrome, Microsoft Edge and Mozilla Firefox, developed by a general practitioner to speed up and automate workflows in Promedico-ASP, a medical practice management system used in the Netherlands. The extension consists of a collection of independent scripts that run within the Promedico-ASP environment and a limited number of connected platforms.

---

## 12. Available versions and distribution channels

The extension is available through the following channels:

| Channel | Audience | Update mechanism |
|---|---|---|
| Chrome Web Store | All Chrome users | Automatic via Google |
| Microsoft Edge Add-ons | All Edge users | Automatic via Microsoft |
| Firefox Add-ons (AMO, listed) | All Firefox users | Automatic via Mozilla |
| **Firefox DEV-XPI (GitHub)** | Test computers | Automatic via `updates.json` on GitHub |
| GitHub source code | Developers | Manual |

> **Important — Firefox DEV-XPI:** In addition to the three official browser stores, a sideloaded version exists for testing purposes. This version is automatically updated via a file (`updates.json`) fetched directly from GitHub, without any browser store review process. This channel is intended exclusively for test environments and must not be used on workstations where active patient records are accessed. The source code of all versions is publicly available at [github.com/Sthroos/Huisarts-scripts](https://github.com/Sthroos/Huisarts-scripts).

---

## 13. What data is processed

The extension processes data that is visible in the Promedico-ASP interface while the GP is working in it. Only data necessary for the direct operation of the scripts is used. No data is collected for analytics, statistics or any other purpose.

### 13a. Patient data — temporarily read, not stored

The following data is read from the Promedico-ASP interface but not retained:

- Name, date of birth and address of the active patient (Zneller scripts, patient registration form)
- BSN (citizen service number) of the active patient (copy button and CRP POCT script: copied to clipboard)
- Patient number (used as part of the filename when automatically downloading discharge records)
- Contents of the SOAP journal (template and text scripts, consult recovery)
- Measurement values entered by the GP in the measurements panel (saved directly to Promedico, not retained by the extension)
- ICPC codes and billing codes (procedure buttons and letter processor)

### 13b. Patient data — temporarily stored

In a limited number of cases the extension temporarily stores patient data, solely to enable a workflow that spans multiple steps or screens:

**Zneller forms (`chrome.storage.local`):**  
The name, date of birth and address of the active patient are temporarily stored when the GP opens a Zneller form from within Promedico. This data is automatically deleted as soon as the form has been successfully completed, is never retained for longer than 60 seconds, and is also deleted when the Promedico browser tab is closed. The data does not leave the device.

**Correspondence upload (`sessionStorage`):**  
A PDF file uploaded via drag-and-drop is temporarily stored in the `sessionStorage` of the active browser tab. This storage is strictly per-tab, is never written to disk, disappears automatically when the tab is closed, and is also deleted as soon as the upload is successfully completed or after 60 seconds at the latest.

### 13c. User settings — permanently stored

The following non-patient data is stored permanently in `chrome.storage.local` (the browser's secured extension storage):

- Which scripts are enabled or disabled
- Selected regional profile and associated Zorgdomein menu
- Settings for cervical smear workflow (courier or not) and CRP request (POCT or manual)
- Name of the treating GP for automatic selection in the patient registration form (initials and surname, entered by the user during the setup wizard)

The following data is stored in the `localStorage` of `promedico-asp.nl` (no patient data):

- Pinned custom billing codes and favourite menu items
- Timestamps and results of the daily ID validation for measurements and procedures (technical codes only, no patient data)
- Temporary Zorgdomein target URL (deleted immediately after use)

These settings contain no patient data and are used solely for the operation of the extension.

---

## 14. What the extension does not do

- The extension does not transmit patient data to the developer, to external analytics services, or to any third party outside the existing care relationships.
- The extension has no backend, database or cloud storage of its own.
- The extension contains no analytics, tracking or telemetry.
- The extension does not store patient data permanently.

---

## 15. External connections

The extension makes only the following external connections:

| Destination | Purpose | Contains patient data? |
|---|---|---|
| `www.promedico-asp.nl` | Normal Promedico-ASP operation. Measurement values are saved via authenticated POST requests using the GP's session cookie. The extension also validates daily whether measurement and procedure IDs are still correct via GET and POST requests that contain no patient context. | Yes (saving measurements) — exclusively within the existing care relationship. No (ID validation). |
| `www.zorgdomein.nl` | Navigation to referral forms via the Zorgdomein menu | No |
| `www.zneller.nl` | Pre-filling ZN forms with patient data at the GP's initiative | Name, date of birth, address |
| `app.medischelogistiek.nl` | Opening the courier portal after a cervical smear (only when the courier option is active) | No |
| `www.poctconnect.nl` | Opening the CRP POCT portal; BSN is copied to clipboard for manual entry by the user | No (BSN via clipboard, not via the connection itself) |
| `github.com` | Retrieving update files for the DEV-XPI sideload version (test environments only) | No |

---

## 16. Legal basis and responsibility

The extension processes special categories of personal data (health data) within the meaning of Article 9 GDPR. The legal basis for processing is Article 9(2)(h) GDPR (processing necessary for the provision of health care) in conjunction with the GP's professional duty of confidentiality.

The **GP** is the data controller for the processing of patient data via the extension. The extension is a tool that operates under the instruction and responsibility of the GP. Under Article 7:454 of the Dutch Civil Code (WGBO), the GP is responsible for the accuracy of what is recorded in the patient file, including when automated tools are used for that purpose.

Connected practices must include the processing via this extension in their records of processing activities (Article 30 GDPR). When used across multiple practices in a regional context, a Data Protection Impact Assessment (DPIA) is required under Article 35 GDPR.

---

## 17. Security

The extension is designed to retain patient data for as short a time as possible:

- Temporary storage has a maximum lifetime of 60 seconds.
- `sessionStorage` is never written to disk and disappears when the tab is closed.
- Measurement values are held in memory only during input and sent directly to Promedico on save — they are not retained by the extension.
- No patient data is transferred to the developer or to analytics services.
- Script files are retrieved exclusively over secure HTTPS connections via the official browser stores.

---

## 18. Browser permissions requested

| Permission | Purpose |
|---|---|
| `storage` | Saving user settings and temporary working data |
| `tabs` | Opening external form pages and the setup wizard in a new tab |
| `clipboardWrite` | Copying BSN to clipboard (copy button and CRP POCT script) |
| Access to `promedico-asp.nl` | Running automation scripts in Promedico-ASP |
| Access to `zorgdomein.nl` | Running the Zorgdomein navigation script |
| Access to `zneller.nl` | Pre-filling Zneller forms |

---

## 19. Changes to this policy

When material changes are made to the way the extension handles data, this privacy policy will be updated. The current version is always available in the GitHub repository and via the browser stores.

---

## 20. Contact

For questions about this privacy policy or the processing of personal data:

- GitHub: [github.com/Sthroos/Huisarts-scripts](https://github.com/Sthroos/Huisarts-scripts)
- Open an issue in the repository for technical questions
