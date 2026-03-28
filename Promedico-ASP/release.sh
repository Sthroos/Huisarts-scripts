#!/bin/bash

# Promedico ASP Helper - Release Script
# Bouwt en publiceert Firefox (AMO unlisted + GitHub), Edge en Chrome extensies
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
#   7. Chrome ZIP uploaden en publiceren via Chrome Web Store API
#   8. Pushen naar GitHub
#
# NB: Firefox LISTED doe je handmatig via https://addons.mozilla.org/developers/
#     AMO vereist licentie-info die je niet via de CLI kunt meegeven.
#
# VEREISTE .env variabelen:
#   AMO_API_KEY            Firefox AMO API key
#   AMO_API_SECRET         Firefox AMO API secret
#   EDGE_CLIENT_ID         Microsoft Partner Center Client ID
#   EDGE_API_KEY           Microsoft Partner Center API key (verloopt na ~90 dagen)
#   EDGE_PRODUCT_ID        Microsoft Edge product ID (GUID)
#   CHROME_CLIENT_ID       Google OAuth2 Client ID
#   CHROME_CLIENT_SECRET   Google OAuth2 Client Secret
#   CHROME_REFRESH_TOKEN   Google OAuth2 Refresh token (verloopt niet)
#   CHROME_PUBLISHER_ID    Chrome Web Store publisher ID (bijv. 0rdckfck2gwk)
#   CHROME_EXTENSION_ID    Chrome extension ID (bijv. knhpdlkbbcnkdgifckaaboleenbiolgo)

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

# ─── Hulpfunctie: Edge credentials valideren ─────────────────────────────────
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

    case "$CHECK_STATUS" in
        200|404)
            echo -e "  ${GREEN}✓${NC} Edge credentials geldig"
            return 0 ;;
        401|403)
            echo -e "  ${RED}✗ Edge API key verlopen of ongeldig (HTTP $CHECK_STATUS)${NC}"
            echo ""
            echo -e "  ${YELLOW}Vernieuwen in 3 stappen:${NC}"
            echo -e "  1. Ga naar https://partner.microsoft.com/dashboard/microsoftedge"
            echo -e "  2. Klik ${YELLOW}Publish API${NC} → ${YELLOW}Create API credentials${NC}"
            echo -e "  3. Zet de nieuwe key in .env als ${YELLOW}EDGE_API_KEY=...${NC}"
            echo ""
            return 1 ;;
        000)
            echo -e "  ${YELLOW}⚠${NC} Geen verbinding met Edge API"
            return 1 ;;
        *)
            echo -e "  ${YELLOW}⚠${NC} Onverwachte status $CHECK_STATUS — gaan toch door"
            return 0 ;;
    esac
}

# ─── Hulpfunctie: Edge uploaden + publiceren ─────────────────────────────────
# Returncodes: 0=gepubliceerd, 1=fout, 2=InProgressSubmission (draft OK)
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
        -X POST -T "$ZIP" \
        "$BASE/v1/products/$PRODUCT_ID/submissions/draft/package")

    HTTP_STATUS=$(echo "$UPLOAD_RESPONSE" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
    OPERATION_ID=$(echo "$UPLOAD_RESPONSE" | grep -i "^Location:" | awk '{print $2}' | tr -d '\r')

    if [ "$HTTP_STATUS" != "202" ]; then
        echo -e "  ${RED}✗ Upload mislukt (HTTP $HTTP_STATUS)${NC}"
        echo "$UPLOAD_RESPONSE" | tail -10
        return 1
    fi
    echo -e "  ${GREEN}✓${NC} Upload geaccepteerd"

    echo -e "  Wachten op verwerking..."
    local ATTEMPTS=0
    while [ $ATTEMPTS -lt 20 ]; do
        sleep 5
        STATUS_RESPONSE=$(curl -s \
            -H "Authorization: ApiKey $API_KEY" \
            -H "X-ClientID: $CLIENT_ID" \
            "$BASE/v1/products/$PRODUCT_ID/submissions/draft/package/operations/$OPERATION_ID")
        STATUS=$(echo "$STATUS_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "")
        [ "$STATUS" = "Succeeded" ] && { echo -e "  ${GREEN}✓${NC} Pakket verwerkt"; break; }
        [ "$STATUS" = "Failed" ] && { echo -e "  ${RED}✗ Pakketverwerking mislukt${NC}"; echo "$STATUS_RESPONSE"; return 1; }
        ATTEMPTS=$((ATTEMPTS + 1))
        echo -e "  ⏳ Status: ${STATUS:-InProgress} (poging $ATTEMPTS/20)..."
    done
    [ $ATTEMPTS -ge 20 ] && { warn "Edge upload polling timeout"; return 1; }

    echo -e "  Publiceren bij Edge Add-ons..."
    PUBLISH_RESPONSE=$(curl -s -i \
        -H "Authorization: ApiKey $API_KEY" \
        -H "X-ClientID: $CLIENT_ID" \
        -H "Content-Type: application/json" \
        -X POST -d "{\"notes\":\"Release $NEW_VERSION - $RELEASE_NOTES\"}" \
        "$BASE/v1/products/$PRODUCT_ID/submissions")

    PUB_STATUS=$(echo "$PUBLISH_RESPONSE" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
    PUB_OPERATION=$(echo "$PUBLISH_RESPONSE" | grep -i "^Location:" | awk '{print $2}' | tr -d '\r')

    if [ "$PUB_STATUS" != "202" ]; then
        echo -e "  ${RED}✗ Publiceren mislukt (HTTP $PUB_STATUS)${NC}"
        echo "$PUBLISH_RESPONSE" | tail -10
        return 1
    fi
    echo -e "  ${GREEN}✓${NC} Publiceren gestart"

    echo -e "  Wachten op publicatiestatus..."
    ATTEMPTS=0
    while [ $ATTEMPTS -lt 20 ]; do
        sleep 5
        PUB_STATUS_RESPONSE=$(curl -s \
            -H "Authorization: ApiKey $API_KEY" \
            -H "X-ClientID: $CLIENT_ID" \
            "$BASE/v1/products/$PRODUCT_ID/submissions/operations/$PUB_OPERATION")
        PUB_STATUS_VAL=$(echo "$PUB_STATUS_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "")
        ERROR_CODE=$(echo "$PUB_STATUS_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('errorCode',''))" 2>/dev/null || echo "")

        if [ "$PUB_STATUS_VAL" = "Succeeded" ]; then
            echo -e "  ${GREEN}✓${NC} Gepubliceerd bij Microsoft Edge Add-ons"
            return 0
        elif [ "$PUB_STATUS_VAL" = "Failed" ]; then
            case "$ERROR_CODE" in
                InProgressSubmission)
                    echo -e "  ${YELLOW}⚠${NC} Er loopt al een submission bij Microsoft (in review)."
                    echo -e "  ${GREEN}✓${NC} Draft is wél bijgewerkt met de nieuwe versie."
                    echo -e "  Publiceer handmatig via Partner Center zodra de review klaar is."
                    return 2 ;;
                NoModulesUpdated)
                    echo -e "  ${YELLOW}⚠${NC} Geen wijzigingen gedetecteerd in het pakket."
                    return 1 ;;
                ModuleStateUnPublishable|SubmissionValidationError)
                    echo -e "  ${RED}✗ Validatiefouten (errorCode: $ERROR_CODE)${NC}"
                    echo "$PUB_STATUS_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); [print('  ',e) for e in (d.get('errors') or [])]" 2>/dev/null
                    return 1 ;;
                *)
                    echo -e "  ${RED}✗ Publiceren mislukt (errorCode: ${ERROR_CODE:-onbekend})${NC}"
                    echo "$PUB_STATUS_RESPONSE"
                    return 1 ;;
            esac
        fi
        ATTEMPTS=$((ATTEMPTS + 1))
        echo -e "  ⏳ Status: ${PUB_STATUS_VAL:-InProgress} (poging $ATTEMPTS/20)..."
    done

    warn "Edge publish polling timeout — extensie staat mogelijk in review bij Microsoft"
    return 0
}

# ─── Hulpfunctie: Chrome access token ophalen via refresh token ───────────────
chrome_get_token() {
    local CLIENT_ID=$1
    local CLIENT_SECRET=$2
    local REFRESH_TOKEN=$3

    TOKEN_RESPONSE=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
        -d "client_id=$CLIENT_ID" \
        -d "client_secret=$CLIENT_SECRET" \
        -d "refresh_token=$REFRESH_TOKEN" \
        -d "grant_type=refresh_token")

    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null || echo "")

    if [ -z "$ACCESS_TOKEN" ]; then
        echo ""  # leeg = mislukt
        return 1
    fi
    echo "$ACCESS_TOKEN"
}

# ─── Hulpfunctie: Chrome credentials valideren ───────────────────────────────
chrome_check_credentials() {
    local CLIENT_ID=$1
    local CLIENT_SECRET=$2
    local REFRESH_TOKEN=$3
    local PUBLISHER_ID=$4
    local EXTENSION_ID=$5

    echo -e "  Access token ophalen..."
    ACCESS_TOKEN=$(chrome_get_token "$CLIENT_ID" "$CLIENT_SECRET" "$REFRESH_TOKEN")

    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "  ${RED}✗ Kon geen access token ophalen — refresh token ongeldig?${NC}"
        echo ""
        echo -e "  ${YELLOW}Refresh token vernieuwen:${NC}"
        echo -e "  1. Ga naar https://developers.google.com/oauthplayground"
        echo -e "  2. Tandwiel ⚙ → 'Use your own OAuth credentials'"
        echo -e "  3. Vul CHROME_CLIENT_ID en CHROME_CLIENT_SECRET in"
        echo -e "  4. Scope: ${YELLOW}https://www.googleapis.com/auth/chromewebstore${NC}"
        echo -e "  5. Authorize APIs → Exchange authorization code for tokens"
        echo -e "  6. Kopieer nieuwe refresh token naar .env als ${YELLOW}CHROME_REFRESH_TOKEN=...${NC}"
        echo ""
        return 1
    fi

    # Snel fetchStatus aanroepen als echte check
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "https://chromewebstore.googleapis.com/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:fetchStatus")

    case "$STATUS_CODE" in
        200)
            echo -e "  ${GREEN}✓${NC} Chrome credentials geldig"
            # Sla token op voor hergebruik in chrome_api_upload
            CHROME_ACCESS_TOKEN="$ACCESS_TOKEN"
            return 0 ;;
        401|403)
            echo -e "  ${RED}✗ Chrome credentials ongeldig (HTTP $STATUS_CODE)${NC}"
            echo -e "  Controleer CHROME_CLIENT_ID, CHROME_CLIENT_SECRET en CHROME_REFRESH_TOKEN in .env"
            return 1 ;;
        404)
            echo -e "  ${RED}✗ Publisher ID of Extension ID niet gevonden (HTTP 404)${NC}"
            echo -e "  Controleer CHROME_PUBLISHER_ID en CHROME_EXTENSION_ID in .env"
            return 1 ;;
        *)
            echo -e "  ${YELLOW}⚠${NC} Onverwachte status $STATUS_CODE — gaan toch door"
            CHROME_ACCESS_TOKEN="$ACCESS_TOKEN"
            return 0 ;;
    esac
}

# ─── Hulpfunctie: Chrome uploaden + publiceren ───────────────────────────────
# Returncodes: 0=gepubliceerd, 1=fout, 2=submission in review (geannuleerd + opnieuw)
chrome_api_upload() {
    local ZIP=$1
    local PUBLISHER_ID=$2
    local EXTENSION_ID=$3
    local ACCESS_TOKEN=$4
    local BASE="https://chromewebstore.googleapis.com"

    # Controleer of er een lopende submission is via fetchStatus
    echo -e "  Status controleren..."
    STATUS_RESPONSE=$(curl -s \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$BASE/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:fetchStatus")

    UPLOAD_STATE=$(echo "$STATUS_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
# uploadState zit in het itemState object
state = d.get('itemState', {})
print(state.get('uploadState', ''))
" 2>/dev/null || echo "")

    if [ "$UPLOAD_STATE" = "UPLOAD_IN_PROGRESS" ]; then
        echo -e "  ${YELLOW}⚠${NC} Er is een submission in review — wordt geannuleerd..."
        CANCEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -X POST \
            "$BASE/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:cancelSubmission")
        if [ "$CANCEL_STATUS" = "200" ] || [ "$CANCEL_STATUS" = "204" ]; then
            echo -e "  ${GREEN}✓${NC} Lopende submission geannuleerd"
            sleep 3  # even wachten voor de API bij is
        else
            echo -e "  ${YELLOW}⚠${NC} Annuleren mislukt (HTTP $CANCEL_STATUS) — toch doorgaan met upload"
        fi
    fi

    # Upload de nieuwe ZIP
    echo -e "  Uploaden naar Chrome Web Store..."
    UPLOAD_RESPONSE=$(curl -s \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -X POST -T "$ZIP" \
        "$BASE/upload/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:upload")

    UPLOAD_RESULT=$(echo "$UPLOAD_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d.get('uploadState', d.get('error', {}).get('message', 'UNKNOWN')))
" 2>/dev/null || echo "UNKNOWN")

    case "$UPLOAD_RESULT" in
        SUCCESS|UPLOAD_IN_PROGRESS)
            echo -e "  ${GREEN}✓${NC} Upload geslaagd" ;;
        NOT_AUTHORIZED)
            echo -e "  ${RED}✗ Geen toegang tot deze extensie${NC}"
            return 1 ;;
        INVALID_DEVELOPER_ACCOUNT)
            echo -e "  ${RED}✗ Ongeldig developer account${NC}"
            return 1 ;;
        *)
            # Controleer of het toch gelukt is ondanks een onverwachte waarde
            if echo "$UPLOAD_RESPONSE" | grep -qi "error"; then
                echo -e "  ${RED}✗ Upload mislukt: $UPLOAD_RESULT${NC}"
                echo "$UPLOAD_RESPONSE"
                return 1
            fi
            echo -e "  ${GREEN}✓${NC} Upload geslaagd (status: $UPLOAD_RESULT)" ;;
    esac

    # Publiceren
    echo -e "  Publiceren bij Chrome Web Store..."
    PUBLISH_RESPONSE=$(curl -s \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -X POST \
        "$BASE/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:publish")

    PUBLISH_STATE=$(echo "$PUBLISH_RESPONSE" | python3 -c "
import json,sys
d=json.load(sys.stdin)
# Kijk naar itemState.uploadState of naar een foutmelding
state = d.get('itemState', {})
print(state.get('uploadState', d.get('error', {}).get('message', 'UNKNOWN')))
" 2>/dev/null || echo "UNKNOWN")

    case "$PUBLISH_STATE" in
        UPLOAD_IN_PROGRESS|SUCCESS)
            echo -e "  ${GREEN}✓${NC} Gepubliceerd — staat in review bij Google"
            return 0 ;;
        *)
            if echo "$PUBLISH_RESPONSE" | grep -qi "error"; then
                echo -e "  ${RED}✗ Publiceren mislukt: $PUBLISH_STATE${NC}"
                echo "$PUBLISH_RESPONSE"
                return 1
            fi
            echo -e "  ${GREEN}✓${NC} Gepubliceerd (status: $PUBLISH_STATE)"
            return 0 ;;
    esac
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
CHROME_ACCESS_TOKEN=""  # wordt gevuld door chrome_check_credentials

# AMO credentials — fataal als ontbreekt
if [ -z "$AMO_API_KEY" ] || [ -z "$AMO_API_SECRET" ]; then
    echo -e "${RED}Error: AMO credentials niet gevonden (AMO_API_KEY / AMO_API_SECRET)${NC}"
    exit 1
fi

# Edge credentials — niet fataal
EDGE_OK=true
if [ -z "$EDGE_CLIENT_ID" ] || [ -z "$EDGE_API_KEY" ] || [ -z "$EDGE_PRODUCT_ID" ]; then
    warn "Edge credentials niet gevonden — Edge publishing wordt overgeslagen"
    warn "Voeg EDGE_CLIENT_ID, EDGE_API_KEY en EDGE_PRODUCT_ID toe aan .env"
    EDGE_OK=false
else
    echo -e "Edge credentials controleren..."
    if ! edge_check_credentials "$EDGE_PRODUCT_ID" "$EDGE_CLIENT_ID" "$EDGE_API_KEY"; then
        warn "Edge credentials ongeldig — Edge publishing wordt overgeslagen"
        EDGE_OK=false
    fi
fi

# Chrome credentials — niet fataal
CHROME_OK=true
if [ -z "$CHROME_CLIENT_ID" ] || [ -z "$CHROME_CLIENT_SECRET" ] || [ -z "$CHROME_REFRESH_TOKEN" ] \
   || [ -z "$CHROME_PUBLISHER_ID" ] || [ -z "$CHROME_EXTENSION_ID" ]; then
    warn "Chrome credentials niet gevonden — Chrome publishing wordt overgeslagen"
    warn "Voeg CHROME_CLIENT_ID, CHROME_CLIENT_SECRET, CHROME_REFRESH_TOKEN, CHROME_PUBLISHER_ID en CHROME_EXTENSION_ID toe aan .env"
    CHROME_OK=false
else
    echo -e "Chrome credentials controleren..."
    if ! chrome_check_credentials \
        "$CHROME_CLIENT_ID" "$CHROME_CLIENT_SECRET" "$CHROME_REFRESH_TOKEN" \
        "$CHROME_PUBLISHER_ID" "$CHROME_EXTENSION_ID"; then
        warn "Chrome credentials ongeldig — Chrome publishing wordt overgeslagen"
        CHROME_OK=false
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
echo -e "  ${GREEN}Firefox unlisted${NC}  → GitHub (met update_url + auto-updates)"
if [ "$EDGE_OK" = true ]; then
    echo -e "  ${GREEN}Edge Add-ons${NC}      → automatisch via API"
else
    echo -e "  ${YELLOW}Edge Add-ons${NC}      → OVERGESLAGEN — credentials ontbreken/ongeldig"
fi
if [ "$CHROME_OK" = true ]; then
    echo -e "  ${GREEN}Chrome Web Store${NC}  → automatisch via API"
else
    echo -e "  ${YELLOW}Chrome Web Store${NC}  → OVERGESLAGEN — credentials ontbreken/ongeldig"
fi
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
echo -e "${GREEN}[0/8]${NC} Synchroniseren met GitHub..."
REPO_ROOT="$(cd .. && pwd)"
cd "$REPO_ROOT"
git stash
git pull origin main --rebase
git stash pop 2>/dev/null || true
cd "$OLDPWD"
echo -e "${GREEN}✓${NC} Gesynchroniseerd"

# ─── Stap 1: Versie bijwerken ────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[1/8]${NC} Versie bijwerken in manifests..."

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
echo -e "${GREEN}[2/8]${NC} Bouwen..."
./build.sh all
echo -e "${GREEN}✓${NC} Build klaar"

# ─── Stap 3: Firefox unlisted signeren ───────────────────────────────────────
echo ""
echo -e "${GREEN}[3/8]${NC} Firefox signeren via AMO — unlisted (30-60 seconden)..."

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
echo -e "${GREEN}[4/8]${NC} XPI verwerken en updates.json bijwerken..."

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
echo -e "${GREEN}[5/8]${NC} Chrome/Edge ZIP + Firefox-dev XPI maken..."

(cd dist/chrome && zip -r "$OLDPWD/Promedico-Helper-Chrome.zip" . -x "*.DS_Store" > /dev/null)
echo -e "${GREEN}✓${NC} Chrome/Edge ZIP: Promedico-Helper-Chrome.zip"

(cd dist/firefox-dev && zip -r "$OLDPWD/Promedico-Helper-Firefox-dev.xpi" . -x "*.DS_Store" > /dev/null)
echo -e "${GREEN}✓${NC} Firefox-dev XPI: Promedico-Helper-Firefox-dev.xpi"

# ─── Stap 6: Edge publishing ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[6/8]${NC} Microsoft Edge Add-ons publiceren..."

EDGE_PUBLISHED=false
EDGE_DRAFT_ONLY=false
if [ "$EDGE_OK" = true ]; then
    edge_api_upload \
        "Promedico-Helper-Chrome.zip" \
        "$EDGE_PRODUCT_ID" \
        "$EDGE_CLIENT_ID" \
        "$EDGE_API_KEY" || true
    EDGE_RESULT=$?
    case $EDGE_RESULT in
        0) EDGE_PUBLISHED=true ;;
        2) EDGE_DRAFT_ONLY=true ;;
        *) warn "Edge publishing mislukt — upload handmatig op partner.microsoft.com" ;;
    esac
else
    echo -e "${YELLOW}⚠${NC} Overgeslagen — geen geldige Edge credentials"
fi

# ─── Stap 7: Chrome publishing ───────────────────────────────────────────────
echo ""
echo -e "${GREEN}[7/8]${NC} Chrome Web Store publiceren..."

CHROME_PUBLISHED=false
if [ "$CHROME_OK" = true ]; then
    # Haal een vers access token op (het token van de check is max ~1 uur geldig,
    # maar na de Firefox signing kan die tijd verstreken zijn)
    FRESH_TOKEN=$(chrome_get_token "$CHROME_CLIENT_ID" "$CHROME_CLIENT_SECRET" "$CHROME_REFRESH_TOKEN")
    if [ -z "$FRESH_TOKEN" ]; then
        warn "Kon geen Chrome access token ophalen — Chrome publishing overgeslagen"
    else
        chrome_api_upload \
            "Promedico-Helper-Chrome.zip" \
            "$CHROME_PUBLISHER_ID" \
            "$CHROME_EXTENSION_ID" \
            "$FRESH_TOKEN" \
            && CHROME_PUBLISHED=true             || warn "Chrome publishing mislukt — upload handmatig op chrome.google.com/webstore/devconsole" || true
    fi
else
    echo -e "${YELLOW}⚠${NC} Overgeslagen — geen geldige Chrome credentials"
fi

# ─── Stap 8: GitHub push ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[8/8]${NC} Pushen naar GitHub..."

SCRIPT_DIR="$(pwd)"
REL_DIR="$(basename $SCRIPT_DIR)"
cd "$REPO_ROOT"

GITIGNORE="$REL_DIR/.gitignore"
for IGNORE_ENTRY in "dist/" "web-ext-artifacts/" "*.xpi" "*.zip" ".env"; do
    if [ ! -f "$GITIGNORE" ] || ! grep -qxF "$IGNORE_ENTRY" "$GITIGNORE" 2>/dev/null; then
        echo "$IGNORE_ENTRY" >> "$GITIGNORE"
        echo -e "${GREEN}✓${NC} Toegevoegd aan .gitignore: $IGNORE_ENTRY"
    fi
done

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
    echo -e "${GREEN}Edge Add-ons:${NC}      Gepubliceerd via API ✓ (staat in review bij Microsoft)"
elif [ "$EDGE_DRAFT_ONLY" = true ]; then
    echo -e "${YELLOW}Edge Add-ons:${NC}      Draft bijgewerkt ✓ — er loopt al een submission in review"
    echo "               Publiceer handmatig zodra de review klaar is:"
    echo "               https://partner.microsoft.com/dashboard/microsoftedge"
else
    echo -e "${YELLOW}Edge Add-ons:${NC}      Niet automatisch gepubliceerd — upload handmatig:"
    echo "               https://partner.microsoft.com/dashboard/microsoftedge"
    echo "               Upload: Promedico-Helper-Chrome.zip"
fi

echo ""
if [ "$CHROME_PUBLISHED" = true ]; then
    echo -e "${GREEN}Chrome Web Store:${NC}  Gepubliceerd via API ✓ (staat in review bij Google)"
else
    echo -e "${YELLOW}Chrome Web Store:${NC}  Niet automatisch gepubliceerd — upload handmatig:"
    echo "               https://chrome.google.com/webstore/devconsole"
    echo "               Upload: Promedico-Helper-Chrome.zip"
fi

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
