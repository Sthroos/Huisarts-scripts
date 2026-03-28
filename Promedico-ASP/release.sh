#!/bin/bash

# Promedico ASP Helper - Release Script
# Bouwt en publiceert Firefox (AMO unlisted + GitHub) en Chrome/Edge extensies
#
# Gebruik: ./release.sh <versie> [release notes]
# Voorbeeld: ./release.sh 1.9 "Dubbele sterren fix en Chrome CSP fixes"
#
# Wat dit script doet:
#   0. Sync met GitHub
#   1. Versie bijwerken in beide manifests
#   2. Alle targets bouwen
#   3. Firefox unlisted signeren via AMO → Promedico-Helper-Scripts.xpi (voor GitHub)
#   4. updates.json bijwerken met nieuwe versie + hash
#   5. Chrome/Edge ZIP + Firefox-dev XPI maken
#   6. Edge ZIP uploaden en publiceren via Microsoft Add-ons API
#   7. Pushen naar GitHub
#
# NB: Firefox LISTED (AMO add-ons pagina) doe je handmatig via:
#     https://addons.mozilla.org/developers/
#     Upload daar dist/firefox/ als ZIP. AMO vereist licentie-info die je
#     niet via de CLI kunt meegeven — dat stel je eenmalig in op de AMO pagina.
#
# VEREISTE .env variabelen:
#   AMO_API_KEY        Firefox AMO API key
#   AMO_API_SECRET     Firefox AMO API secret
#   EDGE_CLIENT_ID     Microsoft Partner Center Client ID
#   EDGE_API_KEY       Microsoft Partner Center API key
#   EDGE_PRODUCT_ID    Microsoft Edge product ID (GUID)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

WARNINGS=()

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS+=("$1")
}

# ─── Hulpfunctie: Edge credentials valideren vóór de release start ───────────
# Doet een goedkoop GET naar de submissions endpoint — geeft alleen een HTTP status terug.
# 200/404 = credentials geldig   401/403 = verlopen of ongeldig
edge_check_credentials() {
    local PRODUCT_ID=$1
    local CLIENT_ID=$2
    local API_KEY=$3
    local BASE="https://api.addons.microsoftedge.microsoft.com"

    CHECK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: ApiKey $API_KEY" \
        -H "X-ClientID: $CLIENT_ID" \
        "$BASE/v1/products/$PRODUCT_ID/submissions/draft/package/operations/health-check" \
        2>/dev/null || echo "000")

    # 404 = endpoint bestaat niet maar auth werkte → credentials OK
    # 200 = onverwacht maar ook OK
    # 401/403 = verlopen of ongeldig
    # 000 = geen verbinding
    case "$CHECK_STATUS" in
        200|404)
            echo -e "  ${GREEN}✓${NC} Edge credentials geldig"
            return 0
            ;;
        401|403)
            echo -e "  ${RED}✗ Edge API key verlopen of ongeldig (HTTP $CHECK_STATUS)${NC}"
            echo ""
            echo -e "  ${YELLOW}Vernieuwen in 3 stappen:${NC}"
            echo -e "  1. Ga naar https://partner.microsoft.com/dashboard/microsoftedge"
            echo -e "  2. Klik op ${YELLOW}Publish API${NC} → ${YELLOW}Create API credentials${NC}"
            echo -e "  3. Kopieer de nieuwe API key naar .env als ${YELLOW}EDGE_API_KEY=...${NC}"
            echo ""
            return 1
            ;;
        000)
            echo -e "  ${YELLOW}⚠${NC} Geen verbinding met Edge API — check je internet"
            return 1
            ;;
        *)
            echo -e "  ${YELLOW}⚠${NC} Onverwachte HTTP status $CHECK_STATUS — gaan toch door"
            return 0
            ;;
    esac
}

# ─── Hulpfunctie: Edge API aanroepen met retry-poll ──────────────────────────
# Geeft de operationID terug uit de Location header
edge_api_upload() {
    local ZIP=$1
    local PRODUCT_ID=$2
    local CLIENT_ID=$3
    local API_KEY=$4
    local BASE="https://api.addons.microsoftedge.microsoft.com"

    echo -e "  Uploaden naar Edge Add-ons API..."
    UPLOAD_RESPONSE=$(curl -s -i \
        -H "Authorization: ApiKey $API_KEY" \
        -H "X-ClientID: $CLIENT_ID" \
        -H "Content-Type: application/zip" \
        -X POST \
        -T "$ZIP" \
        "$BASE/v1/products/$PRODUCT_ID/submissions/draft/package")

    HTTP_STATUS=$(echo "$UPLOAD_RESPONSE" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
    OPERATION_ID=$(echo "$UPLOAD_RESPONSE" | grep -i "^Location:" | awk '{print $2}' | tr -d '\r')

    if [ "$HTTP_STATUS" != "202" ]; then
        echo -e "${RED}✗ Upload mislukt (HTTP $HTTP_STATUS)${NC}"
        echo "$UPLOAD_RESPONSE" | tail -20
        return 1
    fi
    echo -e "  ${GREEN}✓${NC} Upload geaccepteerd (operationID: $OPERATION_ID)"

    # Poll upload status
    echo -e "  Wachten op verwerking..."
    local ATTEMPTS=0
    while [ $ATTEMPTS -lt 20 ]; do
        sleep 5
        STATUS_RESPONSE=$(curl -s \
            -H "Authorization: ApiKey $API_KEY" \
            -H "X-ClientID: $CLIENT_ID" \
            "$BASE/v1/products/$PRODUCT_ID/submissions/draft/package/operations/$OPERATION_ID")
        STATUS=$(echo "$STATUS_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "")

        if [ "$STATUS" = "Succeeded" ]; then
            echo -e "  ${GREEN}✓${NC} Pakket verwerkt"
            break
        elif [ "$STATUS" = "Failed" ]; then
            echo -e "${RED}✗ Pakketverwerking mislukt${NC}"
            echo "$STATUS_RESPONSE"
            return 1
        fi
        ATTEMPTS=$((ATTEMPTS + 1))
        echo -e "  ⏳ Status: ${STATUS:-InProgress} (poging $ATTEMPTS/20)..."
    done

    if [ $ATTEMPTS -ge 20 ]; then
        warn "Edge upload polling timeout — controleer handmatig in Partner Center"
        return 1
    fi

    # Publiceren
    echo -e "  Publiceren bij Edge Add-ons..."
    PUBLISH_RESPONSE=$(curl -s -i \
        -H "Authorization: ApiKey $API_KEY" \
        -H "X-ClientID: $CLIENT_ID" \
        -H "Content-Type: application/json" \
        -X POST \
        -d "{\"notes\":\"Release $NEW_VERSION - $RELEASE_NOTES\"}" \
        "$BASE/v1/products/$PRODUCT_ID/submissions")

    PUB_STATUS=$(echo "$PUBLISH_RESPONSE" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
    PUB_OPERATION=$(echo "$PUBLISH_RESPONSE" | grep -i "^Location:" | awk '{print $2}' | tr -d '\r')

    if [ "$PUB_STATUS" != "202" ]; then
        echo -e "${RED}✗ Publiceren mislukt (HTTP $PUB_STATUS)${NC}"
        echo "$PUBLISH_RESPONSE" | tail -20
        return 1
    fi
    echo -e "  ${GREEN}✓${NC} Publiceren gestart (operationID: $PUB_OPERATION)"

    # Poll publish status
    echo -e "  Wachten op publicatiestatus..."
    ATTEMPTS=0
    while [ $ATTEMPTS -lt 20 ]; do
        sleep 5
        PUB_STATUS_RESPONSE=$(curl -s \
            -H "Authorization: ApiKey $API_KEY" \
            -H "X-ClientID: $CLIENT_ID" \
            "$BASE/v1/products/$PRODUCT_ID/submissions/operations/$PUB_OPERATION")
        PUB_STATUS_VAL=$(echo "$PUB_STATUS_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "")

        if [ "$PUB_STATUS_VAL" = "Succeeded" ]; then
            echo -e "  ${GREEN}✓${NC} Gepubliceerd bij Microsoft Edge Add-ons"
            return 0
        elif [ "$PUB_STATUS_VAL" = "Failed" ]; then
            echo -e "${RED}✗ Publiceren mislukt${NC}"
            echo "$PUB_STATUS_RESPONSE"
            return 1
        fi
        ATTEMPTS=$((ATTEMPTS + 1))
        echo -e "  ⏳ Status: ${PUB_STATUS_VAL:-InProgress} (poging $ATTEMPTS/20)..."
    done

    warn "Edge publish polling timeout — extensie staat mogelijk in review bij Microsoft"
    return 0   # niet fataal, Microsoft reviewt soms asynchroon
}

# ─── Credentials laden ───────────────────────────────────────────────────────
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} Credentials geladen uit .env"
    source .env
fi

if [ -z "$1" ]; then
    echo -e "${RED}Fout: versienummer vereist${NC}"
    echo "Gebruik: ./release.sh <versie> [release notes]"
    exit 1
fi

NEW_VERSION=$1
RELEASE_NOTES=${2:-"Release $NEW_VERSION"}
CURRENT_VERSION=$(grep -Po '"version":\s*"\K[^"]+' firefox/manifest.json)

# AMO credentials check
if [ -z "$AMO_API_KEY" ] || [ -z "$AMO_API_SECRET" ]; then
    echo -e "${RED}Error: AMO credentials niet gevonden (AMO_API_KEY / AMO_API_SECRET)${NC}"
    exit 1
fi

# Edge credentials check (niet fataal — we gaan door maar waarschuwen)
EDGE_OK=true
if [ -z "$EDGE_CLIENT_ID" ] || [ -z "$EDGE_API_KEY" ] || [ -z "$EDGE_PRODUCT_ID" ]; then
    warn "Edge credentials niet gevonden — Edge publishing wordt overgeslagen"
    warn "Voeg EDGE_CLIENT_ID, EDGE_API_KEY en EDGE_PRODUCT_ID toe aan .env"
    EDGE_OK=false
else
    echo -e "Edge credentials controleren..."
    if ! edge_check_credentials "$EDGE_PRODUCT_ID" "$EDGE_CLIENT_ID" "$EDGE_API_KEY"; then
        warn "Edge credentials ongeldig — Edge publishing wordt overgeslagen"
        warn "Vernieuw de API key via Partner Center en pas .env aan (zie instructies hierboven)"
        EDGE_OK=false
    fi
fi

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Promedico ASP Helper Release Tool     ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Vorige versie:   ${YELLOW}$CURRENT_VERSION${NC}"
echo -e "Nieuwe versie:   ${GREEN}$NEW_VERSION${NC}"
echo -e "Release notes:   $RELEASE_NOTES"
echo ""
echo -e "Dit script doet:"
echo -e "  ${GREEN}Firefox unlisted${NC}  → GitHub distributie (met update_url + auto-updates)"
echo -e "  ${GREEN}Chrome/Edge ZIP${NC}   → Edge: automatisch via API  |  Chrome: handmatig"
echo -e "  ${BLUE}Firefox listed${NC}    → handmatig op addons.mozilla.org"
echo ""

read -p "Doorgaan met release? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Release geannuleerd"
    exit 1
fi

# ─── Stap 0: Git sync ────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[0/7]${NC} Synchroniseren met GitHub..."
REPO_ROOT="$(cd .. && pwd)"
cd "$REPO_ROOT"
git stash
git pull origin main --rebase
git stash pop 2>/dev/null || true
cd "$OLDPWD"
echo -e "${GREEN}✓${NC} Gesynchroniseerd"

# ─── Stap 1: Versie bijwerken ────────────────────────────────────────────────
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

# ─── Stap 3: Firefox unlisted signeren ───────────────────────────────────────
echo ""
echo -e "${GREEN}[3/7]${NC} Firefox signeren via AMO — unlisted (30-60 seconden)..."

rm -rf web-ext-artifacts/
mkdir -p web-ext-artifacts/

SIGNING_OK=false
web-ext sign \
    --source-dir=dist/firefox-unlisted \
    --artifacts-dir=web-ext-artifacts/ \
    --api-key="$AMO_API_KEY" \
    --api-secret="$AMO_API_SECRET" \
    --channel=unlisted \
    && SIGNING_OK=true || true

UNLISTED_XPI=$(ls web-ext-artifacts/*.xpi 2>/dev/null | head -n 1)

if [ "$SIGNING_OK" = true ] && [ -n "$UNLISTED_XPI" ]; then
    echo -e "${GREEN}✓${NC} Signing klaar: $(basename $UNLISTED_XPI)"
else
    warn "Firefox signing mislukt — GitHub XPI en updates.json worden NIET bijgewerkt"
    UNLISTED_XPI=""
fi

# ─── Stap 4: XPI verwerken + hash + updates.json ─────────────────────────────
echo ""
echo -e "${GREEN}[4/7]${NC} XPI verwerken en updates.json bijwerken..."

if [ -n "$UNLISTED_XPI" ]; then
    cp "$UNLISTED_XPI" Promedico-Helper-Scripts.xpi
    echo -e "${GREEN}✓${NC} GitHub XPI: Promedico-Helper-Scripts.xpi"

    if command -v sha256sum &> /dev/null; then
        HASH=$(sha256sum Promedico-Helper-Scripts.xpi | awk '{print $1}')
    elif command -v shasum &> /dev/null; then
        HASH=$(shasum -a 256 Promedico-Helper-Scripts.xpi | awk '{print $1}')
    else
        warn "SHA256 tool niet gevonden — update_hash weggelaten"
        HASH=""
    fi
    [ -n "$HASH" ] && echo -e "${GREEN}✓${NC} Hash: $HASH"

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
else
    echo -e "${YELLOW}⚠${NC} Overgeslagen — geen gesigneerde XPI"
fi

# ─── Stap 5: Chrome/Edge ZIP + Firefox-dev XPI ───────────────────────────────
echo ""
echo -e "${GREEN}[5/7]${NC} Chrome/Edge ZIP + Firefox-dev XPI maken..."

(cd dist/chrome && zip -r "$OLDPWD/Promedico-Helper-Chrome.zip" . -x "*.DS_Store" > /dev/null)
echo -e "${GREEN}✓${NC} Chrome/Edge ZIP: Promedico-Helper-Chrome.zip"

(cd dist/firefox-dev && zip -r "$OLDPWD/Promedico-Helper-Firefox-dev.xpi" . -x "*.DS_Store" > /dev/null)
echo -e "${GREEN}✓${NC} Firefox-dev XPI: Promedico-Helper-Firefox-dev.xpi"

# ─── Stap 6: Edge publishing via API ─────────────────────────────────────────
echo ""
echo -e "${GREEN}[6/7]${NC} Microsoft Edge Add-ons publiceren..."

EDGE_PUBLISHED=false
if [ "$EDGE_OK" = true ]; then
    if edge_api_upload \
        "Promedico-Helper-Chrome.zip" \
        "$EDGE_PRODUCT_ID" \
        "$EDGE_CLIENT_ID" \
        "$EDGE_API_KEY"; then
        EDGE_PUBLISHED=true
    else
        warn "Edge publishing mislukt — upload handmatig op partner.microsoft.com"
    fi
else
    echo -e "${YELLOW}⚠${NC} Overgeslagen — geen Edge credentials"
fi

# ─── Stap 7: GitHub push ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[7/7]${NC} Pushen naar GitHub..."

SCRIPT_DIR="$(pwd)"
REL_DIR="$(basename $SCRIPT_DIR)"
cd "$REPO_ROOT"

# Zorg dat gegenereerde bestanden niet in git belanden
GITIGNORE="$REL_DIR/.gitignore"
for IGNORE_ENTRY in "dist/" "web-ext-artifacts/" "*.xpi" "*.zip" ".env"; do
    if [ ! -f "$GITIGNORE" ] || ! grep -qxF "$IGNORE_ENTRY" "$GITIGNORE" 2>/dev/null; then
        echo "$IGNORE_ENTRY" >> "$GITIGNORE"
        echo -e "${GREEN}✓${NC} Toegevoegd aan .gitignore: $IGNORE_ENTRY"
    fi
done

# Als dist/ al getrackt wordt, verwijder uit git index
if git ls-files --error-unmatch "$REL_DIR/dist/" &>/dev/null 2>&1; then
    git rm -r --cached "$REL_DIR/dist/" > /dev/null 2>&1 || true
    echo -e "${GREEN}✓${NC} dist/ uit git index verwijderd"
fi

git add "$REL_DIR/"
git commit -m "Release v$NEW_VERSION - $RELEASE_NOTES" || {
    warn "Niets te committen — mogelijk geen wijzigingen"
}
git push origin main && echo -e "${GREEN}✓${NC} Gepusht naar GitHub" || {
    warn "Push mislukt — controleer je GitHub rechten"
}

cd "$SCRIPT_DIR"

# ─── Eindrapport ─────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Release $NEW_VERSION afgerond${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ -n "$UNLISTED_XPI" ]; then
    echo -e "${GREEN}Firefox unlisted:${NC}  Promedico-Helper-Scripts.xpi gepusht naar GitHub"
    echo -e "                   → auto-updates via updates.json"
else
    echo -e "${RED}Firefox unlisted:${NC}  NIET gesigneerd — doe handmatig en push opnieuw"
fi

echo ""
echo -e "${BLUE}Firefox listed:${NC}    upload dist/firefox/ handmatig als ZIP:"
echo "               https://addons.mozilla.org/developers/"

echo ""
if [ "$EDGE_PUBLISHED" = true ]; then
    echo -e "${GREEN}Edge Add-ons:${NC}      Gepubliceerd via API ✓"
    echo "               Staat mogelijk nog in review bij Microsoft"
else
    echo -e "${YELLOW}Edge Add-ons:${NC}      Niet automatisch gepubliceerd — upload handmatig:"
    echo "               https://partner.microsoft.com/dashboard/microsoftedge"
    echo "               Upload: Promedico-Helper-Chrome.zip"
fi

echo ""
echo -e "${YELLOW}Chrome Web Store:${NC}  handmatig uploaden:"
echo "               https://chrome.google.com/webstore/devconsole"
echo "               Upload: Promedico-Helper-Chrome.zip"

echo ""
echo -e "${YELLOW}Firefox-dev:${NC}       Promedico-Helper-Firefox-dev.xpi ← sleep naar Firefox Developer"

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}══ Waarschuwingen ══════════════════════════════════════${NC}"
    for W in "${WARNINGS[@]}"; do
        echo -e "${YELLOW}⚠${NC} $W"
    done
fi

echo ""
