# Promedico ASP Helper

Browserextensie die Promedico ASP uitbreidt met handige automatiseringen voor huisartspraktijken. Beschikbaar voor Firefox en Chrome/Edge.

---

## Installatie voor eindgebruikers

### Firefox
1. Download `Promedico-Helper-Scripts.xpi` uit deze repository
2. Open Firefox → `about:addons` → tandwiel-icoon → **Installeer add-on uit bestand**
3. Selecteer het gedownloade `.xpi` bestand

### Chrome / Edge
De extensie is nog niet gepubliceerd in de Chrome Web Store. Installeer handmatig als unpacked extensie:

1. Download en unzip `Promedico-Helper-Chrome.zip` uit deze repository
2. Ga naar `chrome://extensions` (of `edge://extensions`)
3. Zet **Ontwikkelaarsmodus** aan (rechtsboven)
4. Klik **Uitgepakte extensie laden**
5. Selecteer de uitgepakte map

> **Let op:** Bij Chrome/Edge moet je dit herhalen na elke update. Een eigen update-systeem is in ontwikkeling.

---

## Scripts

De extensie bevat de volgende scripts, elk afzonderlijk aan/uit te zetten via de popup:

| Script | Omschrijving |
|--------|-------------|
| Agenda Menu Items | Snelkoppelingen in het agendamenu |
| Auto-delete Berichten | Automatisch verwijderen van verwerkte berichten |
| Auto-check MEDOVD & Auto-download | Automatisch controleren en downloaden van MEDOVD dossiers |
| Contactsoort Quick Buttons | Snelknoppen voor contactsoort bij consulten |
| Correspondentie Upload | Drag & drop bestanden uploaden naar correspondentie |
| Verplaats en Verberg Delen | UI-aanpassingen voor de delenweergave |
| E-consult Template Responses | Vaste antwoordteksten voor e-consulten |
| Herhaalrecepten Verwerken | Automatisering van herhaalrecepten workflow |
| Inschrijven en MEDOVD Import | Favorieten menu + inschrijven/MEDOVD automatisering |
| Meetwaarden Highlights | Twee-regelweergave bij meetwaarden |
| Copy Phone, Email, BSN, Address | Kopieerknopjes voor patiëntgegevens |
| LSP-instellingen | Snelle toegang tot LSP-instellingen |
| P veld herinneringen | Herinneringen in het P-veld |
| Snel consulten invoeren | Versneld consulten invoeren |
| SOEP Measurements | Meetwaarden invoeren vanuit SOEP |
| SOEP Sjablonen | Sjablonen voor SOEP-notities |
| ZN formulieren via Zneller.nl | Directe formulierenintegratie met Zneller |
| Zorgdomein Quick Menu | Snelmenu voor Zorgdomein verwijzingen |

---

## Mappenstructuur (voor ontwikkelaars)

```
Promedico-ASP/
├── shared/          # Gedeelde bestanden (config, popup, loader, icons)
│   ├── config.js    # Scriptconfiguratie en GitHub-updater instellingen
│   ├── popup.html   # Popup UI
│   ├── popup.js     # Popup logica
│   ├── loader.js    # Gedeelde loader
│   └── icons/
├── firefox/         # Firefox MV2 specifiek
│   ├── manifest.json
│   ├── content.js   # Inline shim (toegestaan in MV2)
│   ├── background.js
│   └── updates.json
├── chrome/          # Chrome/Edge MV3 specifiek
│   ├── manifest.json
│   ├── content.js   # Shim via apart bestand (CSP vereiste)
│   ├── background.js
│   └── shim.js      # Page-context shim voor cross-browser compatibiliteit
├── scripts/         # Alle userscripts (gedeeld voor beide browsers)
│   ├── *.js
│   └── *.json       # Metadata per script (naam, ID, URL-patronen)
├── dist/            # Gegenereerd door build.sh, niet committen
├── build.sh         # Bouwt Firefox en Chrome distributies
├── release.sh       # Versie bumpen, AMO signing, GitHub push
└── .env             # AMO credentials (niet committen!)
```

---

## Ontwikkelomgeving opzetten

### Vereisten

```bash
# Node.js (voor web-ext)
# Installeer web-ext globaal
npm install -g web-ext
```

### Lokaal testen

**Firefox:**
```bash
cd Promedico-ASP
./build.sh firefox-dev
# Installeer dist/firefox-dev.zip in Firefox Developer Edition:
# about:debugging → Tandwiel icon → Tijdelijke extensie laden → dist/firefox-dev.zip
```

**Chrome/Edge:**
```bash
./build.sh chrome
# Laad dist/chrome/ als unpacked extensie:
# chrome://extensions → Ontwikkelaarsmodus aan → Uitgepakte extensie laden → dist/chrome/
```

### Werken aan scripts

Scripts staan in `scripts/`. Elk script heeft een bijbehorend `.json` bestand met metadata:

```json
{
  "id": "mijnScript",
  "name": "Mijn Script",
  "description": "Wat het doet",
  "enabled": true,
  "scriptFile": "scripts/mijn-script.js",
  "urlPatterns": ["https://www.promedico-asp.nl/promedico/*"]
}
```

Na een wijziging: `./build.sh all` en herlaad de extensie in de browser.

---

## Release uitbrengen

### Vereisten

Maak een `.env` bestand aan in `Promedico-ASP/` (wordt nooit gecommit):

```bash
AMO_API_KEY=user:12345:678
AMO_API_SECRET=abcdef1234567890abcdef1234567890
```

AMO credentials zijn te vinden op [addons.mozilla.org/developers](https://addons.mozilla.org/nl/developers/) → API-sleutels.

### Release uitvoeren

```bash
cd Promedico-ASP
./release.sh 1.9 "Beschrijving van de wijzigingen"
```

Dit doet automatisch:
1. Versienummer bijwerken in beide manifests
2. `./build.sh all` uitvoeren
3. Firefox XPI signeren via AMO (`web-ext sign`)
4. `updates.json` bijwerken met nieuwe versie en SHA256 hash
5. `Promedico-Helper-Chrome.zip` aanmaken
6. Alles committen en pushen naar GitHub

### Na de release

**Firefox:** Wordt automatisch aangeboden aan bestaande gebruikers via de `update_url` in het manifest.

**Chrome/Edge:** `Promedico-Helper-Chrome.zip` handmatig uploaden:
- Chrome Web Store: [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
- Edge Add-ons: [partner.microsoft.com/dashboard](https://partner.microsoft.com/dashboard)

---

## Bijdragen

Wijzigingen in gedeelde bestanden (`shared/`, `scripts/`) werken automatisch voor beide browsers. Browser-specifieke fixes gaan in `firefox/` of `chrome/`.

```bash
# Wijziging maken
# Testen met ./build.sh all
# Dan committen vanuit Huisarts-scripts/ (repo root):
cd ..
git add .
git commit -m "Beschrijving"
git push origin main
```
