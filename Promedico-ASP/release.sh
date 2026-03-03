#!/bin/bash

# Promedico ASP Helper - Release Script
# Bouwt en publiceert Firefox (AMO) en Chrome/Edge (ZIP) extensies
#
# Gebruik: ./release.sh <versie> [release notes]
# Voorbeeld: ./release.sh 1.9 "Dubbele sterren fix en Chrome CSP fixes"

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Auto-load .env als die bestaat
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} Credentials geladen uit .env"
    source .env
fi

# Versie argument verplicht
if [ -z "$1" ]; then
    echo -e "${RED}Fout: versienummer vereist${NC}"
    echo "Gebruik: ./release.sh <versie> [release notes]"
    exit 1
fi

NEW_VERSION=$1
RELEASE_NOTES=${2:-"Release $NEW_VERSION"}

# Lees huidige versie uit firefox manifest (is leidend)
CURRENT_VERSION=$(grep -Po '"version":\s*"\K[^"]+' firefox/manifest.json)

# AMO credentials check
if [ -z "$AMO_API_KEY" ] || [ -z "$AMO_API_SECRET" ]; then
    echo -e "${RED}Error: AMO credentials niet gevonden${NC}"
    echo "Maak een .env aan met AMO_API_KEY en AMO_API_SECRET"
    echo "Of: export AMO_API_KEY=... && export AMO_API_SECRET=..."
    exit 1
fi

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Promedico ASP Helper Release Tool    ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Vorige versie:   ${YELLOW}$CURRENT_VERSION${NC}"
echo -e "Nieuwe versie:   ${GREEN}$NEW_VERSION${NC}"
echo -e "Release notes:   $RELEASE_NOTES"
echo ""

read -p "Doorgaan met release? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Release geannuleerd"
    exit 1
fi

# ─── Git: sync met remote vóór we iets wijzigen ──────────────────────────────
echo ""
echo -e "${GREEN}[0/7]${NC} Synchroniseren met GitHub..."
REPO_ROOT="$(cd .. && pwd)"
cd "$REPO_ROOT"
git stash
git pull origin main --rebase
git stash pop 2>/dev/null || true
cd "$OLDPWD"
echo -e "${GREEN}✓${NC} Gesynchroniseerd"

# ─── Stap 1: Versie updaten in beide manifests ────────────────────────────────
echo ""
echo -e "${GREEN}[1/7]${NC} Versie bijwerken in manifests..."

update_version() {
    local FILE=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" "$FILE"
    else
        sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" "$FILE"
    fi
}

update_version firefox/manifest.json
update_version chrome/manifest.json
echo -e "${GREEN}✓${NC} Versie $NEW_VERSION ingesteld in beide manifests"

# ─── Stap 2: Build ───────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[2/7]${NC} Bouwen..."
./build.sh all
echo -e "${GREEN}✓${NC} Build klaar"

# ─── Stap 3: Schoon artifacts ────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[3/7]${NC} Firefox signing voorbereiden..."
rm -rf web-ext-artifacts/
mkdir -p web-ext-artifacts/
echo -e "${GREEN}✓${NC} Schoon"

# ─── Stap 4: Firefox signeren via AMO ────────────────────────────────────────
echo ""
echo -e "${GREEN}[4/7]${NC} Firefox signeren via AMO (30-60 seconden)..."

web-ext sign \
    --source-dir=dist/firefox \
    --artifacts-dir=web-ext-artifacts \
    --api-key="$AMO_API_KEY" \
    --api-secret="$AMO_API_SECRET" \
    --channel=unlisted

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Signing mislukt${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Signing klaar"

# ─── Stap 5: XPI verplaatsen + hash + updates.json ───────────────────────────
echo ""
echo -e "${GREEN}[5/7]${NC} XPI verwerken..."

SIGNED_XPI=$(ls web-ext-artifacts/*.xpi 2>/dev/null | head -n 1)

if [ -z "$SIGNED_XPI" ]; then
    echo -e "${RED}✗ Geen gesigneerde XPI gevonden in web-ext-artifacts/${NC}"
    ls -la web-ext-artifacts/
    exit 1
fi

cp "$SIGNED_XPI" Promedico-Helper-Scripts.xpi
echo -e "${GREEN}✓${NC} XPI: $(basename $SIGNED_XPI)"
echo -e "${GREEN}✓${NC} Gekopieerd naar: Promedico-Helper-Scripts.xpi"

# SHA256 hash berekenen
if command -v sha256sum &> /dev/null; then
    HASH=$(sha256sum Promedico-Helper-Scripts.xpi | awk '{print $1}')
elif command -v shasum &> /dev/null; then
    HASH=$(shasum -a 256 Promedico-Helper-Scripts.xpi | awk '{print $1}')
else
    echo -e "${YELLOW}⚠${NC} SHA256 tool niet gevonden"
    HASH=""
fi

if [ -n "$HASH" ]; then
    echo -e "${GREEN}✓${NC} Hash: $HASH"
fi

# updates.json bijwerken in de firefox/ bronmap (wordt gecommit)
cat > firefox/updates.json << EOF
{
  "addons": {
    "promedico-helper@degrotedokter": {
      "updates": [
        {
          "version": "$NEW_VERSION",
          "update_link": "https://github.com/Sthroos/Huisarts-scripts/raw/main/Promedico-ASP/Promedico-Helper-Scripts.xpi"$([ -n "$HASH" ] && echo ",
          \"update_hash\": \"sha256:$HASH\"")
        }
      ]
    }
  }
}
EOF
echo -e "${GREEN}✓${NC} updates.json bijgewerkt"

# ─── Stap 6: Chrome/Edge ZIP + Firefox-dev XPI ───────────────────────────────
echo ""
echo -e "${GREEN}[6/7]${NC} Chrome/Edge ZIP + Firefox-dev XPI maken..."

(cd dist/chrome && zip -r "$OLDPWD/Promedico-Helper-Chrome.zip" . -x "*.DS_Store" > /dev/null)
echo -e "${GREEN}✓${NC} Chrome/Edge ZIP: Promedico-Helper-Chrome.zip"

(cd dist/firefox-dev && zip -r "$OLDPWD/Promedico-Helper-Firefox-dev.xpi" . -x "*.DS_Store" > /dev/null)
echo -e "${GREEN}✓${NC} Firefox-dev XPI: Promedico-Helper-Firefox-dev.xpi  ← sleep naar Firefox Developer"

# ─── Stap 7: GitHub push ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[7/7]${NC} Pushen naar GitHub..."

# Terug naar repo root voor git commando's
SCRIPT_DIR="$(pwd)"
REL_DIR="$(basename $SCRIPT_DIR)"
cd "$REPO_ROOT"

# Voeg alles toe in Promedico-ASP/ — .gitignore filtert dist/, .env, web-ext-artifacts/ eruit
git add "$REL_DIR/"
git commit -m "Release v$NEW_VERSION - $RELEASE_NOTES"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Gepusht naar GitHub"
else
    echo -e "${RED}✗${NC} Push mislukt"
    exit 1
fi

cd "$SCRIPT_DIR"

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Release $NEW_VERSION klaar!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "Firefox XPI:  Promedico-Helper-Scripts.xpi  (al gepusht naar GitHub)"
echo "Chrome/Edge:  Promedico-Helper-Chrome.zip   → handmatig uploaden bij:"
echo "              Chrome Web Store: https://chrome.google.com/webstore/devconsole"
echo "              Edge Add-ons:     https://partner.microsoft.com/dashboard"
