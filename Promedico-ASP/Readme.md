# Promedico ASP Helper

Browserextensie die Promedico ASP uitbreidt met handige automatiseringen voor huisartspraktijken. Beschikbaar voor Firefox, Chrome en Edge.

---

## Installatie voor eindgebruikers

### Firefox
1. Ga naar de [Firefox Extension Store](https://addons.mozilla.org/en-US/firefox/addon/promedico-asp-helper/)
2. Klik op **Voeg toe aan Firefox**

### Chrome
1. Ga naar de [Chrome Web Store](https://chromewebstore.google.com/detail/promedico-asp-helper/ahlcoanebdplegdafjdlohmaegkfjijf)
2. Klik op **Toevoegen aan Chrome**

### Edge
1. Ga naar [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/promedico-asp-helper/knhpdlkbbcnkdgifckaaboleenbiolgo)
2. Klik op **Ophalen**

> **Let op:** Na een update wordt de extensie automatisch bijgewerkt via de betreffende store.

---

## Scripts

De extensie bevat de volgende scripts, elk afzonderlijk aan/uit te zetten via de popup:

| Script | Omschrijving |
|--------|-------------|
| Agenda Menu Items | Snelkoppelingen in het agendamenu (Berichten, E-consult, Recept) |
| Auto-delete Berichten | Automatisch verwijderen van verwerkte spamberichten |
| Auto-check MEDOVD & Auto-download | Automatisch controleren en downloaden van MEDOVD dossiers |
| Brief Verwerker | Automatisch brieven verwerken in de berichtenbox |
| Contactsoort Quick Buttons | Snelknoppen voor contactsoort bij consulten |
| Correspondentie Upload | Drag & drop bestanden uploaden naar correspondentie |
| Verplaats en Verberg Delen | UI-aanpassingen voor de delenweergave |
| E-consult Template Responses | Vaste antwoordteksten voor e-consulten |
| Herhaalrecepten Verwerken | Automatisering van herhaalrecepten workflow |
| Inschrijven en MEDOVD Import | Favorieten menu + inschrijven/MEDOVD automatisering |
| Brief Verwerker | Extraheert automatisch SOEP-velden uit binnenkomende brieven (HAP, specialisten) |
| Initialen in S-veld | Plaatst automatisch je initialen in het S-veld bij het openen van een consult |
| Meetwaarden Highlights (2 regels) | Twee-regelweergave bij meetwaarden in ketenzorg |
| Copy Phone, Email, BSN, Address | Kopieerknopjes voor patientgegevens |
| LSP-instellingen | Snelle toegang tot LSP-instellingen |
| P veld herinneringen | Automatische herinnering popup bij teksten in het P-veld |
| Promedico Crash Recovery | Snel consultteksten terugplaatsen en invoeren na een crash |
| SOEP Measurements | Meetwaarden (gewicht, RR, pols, temp, etc.) invoeren vanuit SOEP |
| SOEP Sjablonen | Sjablonen voor SOEP-notities |
| Verrichting Quick Buttons | Snel verrichtingen toevoegen via knoppen op het declaratiescherm |
| Zneller Formulieren | Directe formulierenintegratie met Zneller.nl vanuit de P-regel |
| Zorgdomein Quick Menu | Snelmenu voor Zorgdomein verwijzingen |

---

## Mappenstructuur (voor ontwikkelaars)

```
Promedico-ASP/
├── shared/          # Gedeelde bestanden (config, popup, icons)
│   ├── config.js    # Scriptconfiguratie
│   ├── popup.html   # Popup UI
│   ├── popup.js     # Popup logica
│   └── icons/
├── firefox/         # Firefox MV2 specifiek
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   └── updates.json
├── chrome/          # Chrome/Edge MV3 specifiek
│   ├── manifest.json
│   ├── content.js
│   └── background.js
├── scripts/         # Alle userscripts (gedeeld voor beide browsers)
│   ├── *.js
│   └── *.json       # Metadata per script
├── dist/            # Gegenereerd door build.sh, niet committen
├── build.sh         # Bouwt Firefox en Chrome distributies
├── release.sh       # Versie bumpen, signing, store publishing
└── .env             # Credentials (nooit committen!)
```

---

## Ontwikkelomgeving opzetten

### Vereisten

```bash
npm install -g web-ext
```

### Lokaal testen

**Firefox:**
```bash
cd Promedico-ASP
./build.sh firefox-dev
# Installeer dist/firefox-dev.zip in Firefox Developer Edition
```

**Chrome/Edge:**
```bash
./build.sh chrome
# Laad dist/chrome/ als unpacked extensie via chrome://extensions
```

### Werken aan scripts

Scripts staan in `scripts/`. Na een wijziging: `./build.sh all` en herlaad de extensie.

Toevoegen aan `shared/config.js`:

```javascript
{
  id: 'mijnScript',
  name: 'Mijn Script',
  description: 'Wat het doet',
  enabled: true,
  scriptFile: 'scripts/mijn-script.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
}
```

---

## Release uitbrengen

### Vereisten

Maak een `.env` bestand aan in `Promedico-ASP/` (nooit committen):

```bash
# Firefox AMO
AMO_API_KEY=user:12345:678
AMO_API_SECRET=abcdef1234567890

# Microsoft Edge
EDGE_CLIENT_ID=...
EDGE_API_KEY=...
EDGE_PRODUCT_ID=8240d2b7-663e-4802-b204-f46d0b48ef23

# Chrome Web Store
CHROME_CLIENT_ID=...
CHROME_CLIENT_SECRET=...
CHROME_REFRESH_TOKEN=...
CHROME_PUBLISHER_ID=...
CHROME_EXTENSION_ID=ahlcoanebdplegdafjdlohmaegkfjijf
```

### Release uitvoeren

```bash
cd Promedico-ASP
./release.sh 1.9 "Beschrijving van de wijzigingen"
```

Dit doet automatisch (deels parallel):
1. Versienummer bijwerken in beide manifests
2. `./build.sh all` uitvoeren
3. Chrome/Edge ZIP publiceren via API
4. Firefox unlisted XPI signeren via AMO
5. `updates.json` bijwerken voor testpc auto-updates
6. Alles committen en pushen naar GitHub

### Na de release

**Firefox listed:** Upload `dist/firefox.zip` handmatig via [addons.mozilla.org/developers](https://addons.mozilla.org/nl/developers/).

**Chrome/Edge:** Worden automatisch gepubliceerd via de API.

---

## Bijdragen

```bash
cd ..
git add .
git commit -m "Beschrijving"
git push origin main
```
