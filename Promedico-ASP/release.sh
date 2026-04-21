#!/bin/bash

# Promedico ASP Helper - Release Script
#
# Gebruik: ./release.sh <versie> [release notes]
# Voorbeeld: ./release.sh 1.9 "Dubbele sterren fix en Chrome CSP fixes"
#
# Wat dit script doet:
#   0. Sync met GitHub + versie bijwerken + bouwen
#   1. PARALLEL:
#      - Firefox unlisted signeren via AMO (duurt 30-90 seconden)
#      - Chrome/Edge ZIP maken + Edge API upload + Chrome API upload
#   2. Wachten tot alles klaar is
#   3. updates.json bijwerken + GitHub push
#
# Firefox LISTED doe je handmatig via https://addons.mozilla.org/developers/
# Upload dist/firefox.zip na elke release.
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
#   CHROME_PUBLISHER_ID    Chrome Web Store publisher ID
#   CHROME_EXTENSION_ID    Chrome extension ID

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

WARNINGS=()
WARNINGS_FILE=$(mktemp)  # gedeeld bestand voor waarschuwingen uit subshells

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    echo "$1" >> "$WARNINGS_FILE"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─── Edge: credentials valideren ─────────────────────────────────────────────
edge_check_credentials() {
    local PRODUCT_ID=$1 CLIENT_ID=$2 API_KEY=$3
    local BASE="https://api.addons.microsoftedge.microsoft.com"

    CHECK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: ApiKey $API_KEY" \
        -H "X-ClientID: $CLIENT_ID" \
        "$BASE/v1/products/$PRODUCT_ID/submissions/draft/package/operations/health-check" \
        2>/dev/null || echo "000")

    case "$CHECK_STATUS" in
        200|404)
            echo -e "  ${GREEN}✓${NC} Edge credentials geldig"; return 0 ;;
        401|403)
            echo -e "  ${RED}✗ Edge API key verlopen of ongeldig (HTTP $CHECK_STATUS)${NC}"
            echo -e "  1. https://partner.microsoft.com/dashboard/microsoftedge → Publish API"
            echo -e "  2. Create API credentials → kopieer nieuwe key naar .env als EDGE_API_KEY=..."
            return 1 ;;
        000) echo -e "  ${YELLOW}⚠${NC} Geen verbinding met Edge API"; return 1 ;;
        *)   echo -e "  ${YELLOW}⚠${NC} Onverwachte status $CHECK_STATUS — gaan toch door"; return 0 ;;
    esac
}

# ─── Edge: uploaden + publiceren ─────────────────────────────────────────────
edge_api_upload() {
    local ZIP=$1 PRODUCT_ID=$2 CLIENT_ID=$3 API_KEY=$4
    local BASE="https://api.addons.microsoftedge.microsoft.com"

    echo -e "  [Edge] Uploaden..."
    UPLOAD_RESPONSE=$(curl -s -i \
        -H "Authorization: ApiKey $API_KEY" \
        -H "X-ClientID: $CLIENT_ID" \
        -H "Content-Type: application/zip" \
        -X POST -T "$ZIP" \
        "$BASE/v1/products/$PRODUCT_ID/submissions/draft/package")

    HTTP_STATUS=$(echo "$UPLOAD_RESPONSE" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
    OPERATION_ID=$(echo "$UPLOAD_RESPONSE" | grep -i "^Location:" | awk '{print $2}' | tr -d '\r')

    if [ "$HTTP_STATUS" != "202" ]; then
        echo -e "  ${RED}[Edge] Upload mislukt (HTTP $HTTP_STATUS)${NC}"
        echo "$UPLOAD_RESPONSE" | tail -5
        return 1
    fi
    echo -e "  ${GREEN}[Edge]${NC} Upload geaccepteerd"

    local ATTEMPTS=0
    while [ $ATTEMPTS -lt 20 ]; do
        sleep 5
        STATUS=$(curl -s \
            -H "Authorization: ApiKey $API_KEY" \
            -H "X-ClientID: $CLIENT_ID" \
            "$BASE/v1/products/$PRODUCT_ID/submissions/draft/package/operations/$OPERATION_ID" \
            | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
        [ "$STATUS" = "Succeeded" ] && { echo -e "  ${GREEN}[Edge]${NC} Pakket verwerkt"; break; }
        [ "$STATUS" = "Failed"    ] && { echo -e "  ${RED}[Edge] Pakketverwerking mislukt${NC}"; return 1; }
        ATTEMPTS=$((ATTEMPTS+1))
        echo -e "  [Edge] ⏳ ${STATUS:-InProgress} (poging $ATTEMPTS/20)..."
    done
    [ $ATTEMPTS -ge 20 ] && { echo "Edge upload polling timeout" >> "$WARNINGS_FILE"; return 1; }

    echo -e "  [Edge] Publiceren..."
    PUBLISH_RESPONSE=$(curl -s -i \
        -H "Authorization: ApiKey $API_KEY" \
        -H "X-ClientID: $CLIENT_ID" \
        -H "Content-Type: application/json" \
        -X POST -d "{\"notes\":\"Release $NEW_VERSION - $RELEASE_NOTES\"}" \
        "$BASE/v1/products/$PRODUCT_ID/submissions")

    PUB_HTTP=$(echo "$PUBLISH_RESPONSE" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
    PUB_OP=$(echo "$PUBLISH_RESPONSE" | grep -i "^Location:" | awk '{print $2}' | tr -d '\r')

    if [ "$PUB_HTTP" != "202" ]; then
        echo -e "  ${RED}[Edge] Publiceren mislukt (HTTP $PUB_HTTP)${NC}"
        echo "$PUBLISH_RESPONSE" | tail -5
        return 1
    fi
    echo -e "  ${GREEN}[Edge]${NC} Publiceren gestart"

    ATTEMPTS=0
    while [ $ATTEMPTS -lt 20 ]; do
        sleep 5
        PUB_RESPONSE=$(curl -s \
            -H "Authorization: ApiKey $API_KEY" \
            -H "X-ClientID: $CLIENT_ID" \
            "$BASE/v1/products/$PRODUCT_ID/submissions/operations/$PUB_OP")
        PUB_VAL=$(echo "$PUB_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
        ERR=$(echo "$PUB_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('errorCode',''))" 2>/dev/null || echo "")

        if [ "$PUB_VAL" = "Succeeded" ]; then
            echo -e "  ${GREEN}[Edge]${NC} Gepubliceerd ✓"
            return 0
        elif [ "$PUB_VAL" = "Failed" ]; then
            case "$ERR" in
                InProgressSubmission)
                    echo -e "  ${YELLOW}[Edge]${NC} Submission al in review — draft bijgewerkt ✓"
                    return 2 ;;
                NoModulesUpdated)
                    echo -e "  ${YELLOW}[Edge]${NC} Geen wijzigingen gedetecteerd"
                    return 1 ;;
                *)
                    echo -e "  ${RED}[Edge] Mislukt (errorCode: ${ERR:-onbekend})${NC}"
                    echo "$PUB_RESPONSE"
                    return 1 ;;
            esac
        fi
        ATTEMPTS=$((ATTEMPTS+1))
        echo -e "  [Edge] ⏳ ${PUB_VAL:-InProgress} (poging $ATTEMPTS/20)..."
    done
    echo "Edge publish polling timeout" >> "$WARNINGS_FILE"
    return 0
}

# ─── Chrome: access token ophalen ────────────────────────────────────────────
chrome_get_token() {
    curl -s -X POST "https://oauth2.googleapis.com/token" \
        -d "client_id=$1" -d "client_secret=$2" \
        -d "refresh_token=$3" -d "grant_type=refresh_token" \
    | python3 -c "import json,sys; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo ""
}

# ─── Chrome: credentials valideren ───────────────────────────────────────────
chrome_check_credentials() {
    local CLIENT_ID=$1 CLIENT_SECRET=$2 REFRESH_TOKEN=$3 PUBLISHER_ID=$4 EXTENSION_ID=$5

    echo -e "  Access token ophalen..."
    ACCESS_TOKEN=$(chrome_get_token "$CLIENT_ID" "$CLIENT_SECRET" "$REFRESH_TOKEN")

    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "  ${RED}✗ Kon geen access token ophalen${NC}"
        echo -e "  Vernieuw de refresh token via https://developers.google.com/oauthplayground"
        return 1
    fi

    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "https://chromewebstore.googleapis.com/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:fetchStatus")

    case "$STATUS_CODE" in
        200) echo -e "  ${GREEN}✓${NC} Chrome credentials geldig"; CHROME_ACCESS_TOKEN="$ACCESS_TOKEN"; return 0 ;;
        401|403) echo -e "  ${RED}✗ Chrome credentials ongeldig (HTTP $STATUS_CODE)${NC}"; return 1 ;;
        404) echo -e "  ${RED}✗ Publisher/Extension ID niet gevonden (HTTP 404)${NC}"; return 1 ;;
        *) echo -e "  ${YELLOW}⚠${NC} Status $STATUS_CODE — gaan toch door"; CHROME_ACCESS_TOKEN="$ACCESS_TOKEN"; return 0 ;;
    esac
}

# ─── Chrome: uploaden + publiceren ───────────────────────────────────────────
chrome_api_upload() {
    local ZIP=$1 PUBLISHER_ID=$2 EXTENSION_ID=$3 ACCESS_TOKEN=$4
    local BASE="https://chromewebstore.googleapis.com"

    echo -e "  [Chrome] Status controleren..."
    UPLOAD_STATE=$(curl -s \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$BASE/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:fetchStatus" \
        | python3 -c "import json,sys; print(json.load(sys.stdin).get('itemState',{}).get('uploadState',''))" 2>/dev/null || echo "")

    if [ "$UPLOAD_STATE" = "UPLOAD_IN_PROGRESS" ]; then
        echo -e "  ${YELLOW}[Chrome]${NC} Lopende submission annuleren..."
        CANCEL=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $ACCESS_TOKEN" -X POST \
            "$BASE/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:cancelSubmission")
        [ "$CANCEL" = "200" ] || [ "$CANCEL" = "204" ] \
            && { echo -e "  ${GREEN}[Chrome]${NC} Geannuleerd"; sleep 3; } \
            || echo -e "  ${YELLOW}[Chrome]${NC} Annuleren mislukt (HTTP $CANCEL) — toch doorgaan"
    fi

    echo -e "  [Chrome] Uploaden..."
    UPLOAD_RESPONSE=$(curl -s \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -X POST -T "$ZIP" \
        "$BASE/upload/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:upload")

    if echo "$UPLOAD_RESPONSE" | grep -qi '"error"'; then
        MSG=$(echo "$UPLOAD_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('error',{}).get('message','onbekend'))" 2>/dev/null || echo "onbekend")
        echo -e "  ${RED}[Chrome] Upload mislukt: $MSG${NC}"
        return 1
    fi
    echo -e "  ${GREEN}[Chrome]${NC} Upload geslaagd"

    echo -e "  [Chrome] Publiceren..."
    PUBLISH_RESPONSE=$(curl -s \
        -H "Authorization: Bearer $ACCESS_TOKEN" -X POST \
        "$BASE/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:publish")

    if echo "$PUBLISH_RESPONSE" | grep -qi '"error"'; then
        echo -e "  ${RED}[Chrome] Publiceren mislukt${NC}"
        echo "$PUBLISH_RESPONSE"
        return 1
    fi
    echo -e "  ${GREEN}[Chrome]${NC} Gepubliceerd ✓ (staat in review bij Google)"
    return 0
}

# ─── Credentials laden ───────────────────────────────────────────────────────
if [ -f "$SCRIPT_DIR/.env" ]; then
    echo -e "${GREEN}✓${NC} Credentials geladen uit .env"
    source "$SCRIPT_DIR/.env"
fi

if [ -z "$1" ]; then
    echo -e "${RED}Fout: versienummer vereist${NC}"
    echo "Gebruik: ./release.sh <versie> [release notes]"
    exit 1
fi

NEW_VERSION=$1
RELEASE_NOTES=${2:-"Release $NEW_VERSION"}
CURRENT_VERSION=$(grep -Po '"version":\s*"\K[^"]+' "$SCRIPT_DIR/firefox/manifest.json")
CHROME_ACCESS_TOKEN=""

# AMO credentials
AMO_OK=true
if [ -z "$AMO_API_KEY" ] || [ -z "$AMO_API_SECRET" ]; then
    echo -e "${YELLOW}⚠${NC} AMO credentials niet gevonden — Firefox unlisted signing overgeslagen"
    echo "AMO credentials niet gevonden" >> "$WARNINGS_FILE"
    AMO_OK=false
fi

# Edge credentials
EDGE_OK=true
if [ -z "$EDGE_CLIENT_ID" ] || [ -z "$EDGE_API_KEY" ] || [ -z "$EDGE_PRODUCT_ID" ]; then
    echo -e "${YELLOW}⚠${NC} Edge credentials niet gevonden — Edge publishing overgeslagen"
    echo "Edge credentials niet gevonden" >> "$WARNINGS_FILE"
    EDGE_OK=false
else
    echo -e "Edge credentials controleren..."
    edge_check_credentials "$EDGE_PRODUCT_ID" "$EDGE_CLIENT_ID" "$EDGE_API_KEY" || {
        echo "Edge credentials ongeldig" >> "$WARNINGS_FILE"
        EDGE_OK=false
    }
fi

# Chrome credentials
CHROME_OK=true
if [ -z "$CHROME_CLIENT_ID" ] || [ -z "$CHROME_CLIENT_SECRET" ] || [ -z "$CHROME_REFRESH_TOKEN" ] \
   || [ -z "$CHROME_PUBLISHER_ID" ] || [ -z "$CHROME_EXTENSION_ID" ]; then
    echo -e "${YELLOW}⚠${NC} Chrome credentials niet gevonden — Chrome publishing overgeslagen"
    echo "Chrome credentials niet gevonden" >> "$WARNINGS_FILE"
    CHROME_OK=false
else
    echo -e "Chrome credentials controleren..."
    chrome_check_credentials \
        "$CHROME_CLIENT_ID" "$CHROME_CLIENT_SECRET" "$CHROME_REFRESH_TOKEN" \
        "$CHROME_PUBLISHER_ID" "$CHROME_EXTENSION_ID" || {
        echo "Chrome credentials ongeldig" >> "$WARNINGS_FILE"
        CHROME_OK=false
    }
fi

echo ""
echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Promedico ASP Helper Release Tool     ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Vorige versie:   ${YELLOW}$CURRENT_VERSION${NC}"
echo -e "Nieuwe versie:   ${GREEN}$NEW_VERSION${NC}"
echo -e "Release notes:   $RELEASE_NOTES"
echo ""
echo -e "Dit script doet:"
if [ "$AMO_OK" = true ]; then
    echo -e "  ${GREEN}Firefox unlisted${NC}  → AMO signing + updates.json (testpc auto-updates)"
else
    echo -e "  ${YELLOW}Firefox unlisted${NC}  → OVERGESLAGEN — AMO credentials ontbreken"
fi
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
echo -e "  ${BLUE}Firefox listed${NC}    → handmatig uploaden op addons.mozilla.org"
echo -e "                    Upload: ${BLUE}dist/firefox.zip${NC}"
echo ""

read -p "Doorgaan met release? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Release geannuleerd"
    rm -f "$WARNINGS_FILE"
    exit 1
fi

cd "$SCRIPT_DIR"

# ─── Stap 0: Git sync ────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[0/4]${NC} Synchroniseren met GitHub..."
REPO_ROOT="$(cd .. && pwd)"
cd "$REPO_ROOT"
git stash
git pull origin main --rebase
git stash pop 2>/dev/null || true
cd "$SCRIPT_DIR"
echo -e "${GREEN}✓${NC} Gesynchroniseerd"

# ─── Stap 1: Versie bijwerken + bouwen ───────────────────────────────────────
echo ""
echo -e "${GREEN}[1/4]${NC} Versie bijwerken en bouwen..."

update_version() {
    local FILE=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" "$FILE"
    else
        sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" "$FILE"
    fi
}

update_version "$SCRIPT_DIR/firefox/manifest.json"
update_version "$SCRIPT_DIR/chrome/manifest.json"
echo -e "${GREEN}✓${NC} Versie $NEW_VERSION ingesteld"

"$SCRIPT_DIR/build.sh" all "$NEW_VERSION"
echo -e "${GREEN}✓${NC} Build klaar"

# ─── Stap 2: Chrome/Edge ZIP + publishing (parallel) ─────────────────────────
echo ""
echo -e "${GREEN}[2/4]${NC} Chrome/Edge ZIP maken en publiceren..."
echo ""

EDGE_RESULT_FILE=$(mktemp)
CHROME_RESULT_FILE=$(mktemp)
AMO_RESULT_FILE=$(mktemp)

# ── Subshell: Chrome/Edge ZIP maken + Edge + Chrome parallel ──────────────────
(
    (cd "$SCRIPT_DIR/dist/chrome" && zip -r "$SCRIPT_DIR/Promedico-Helper-Chrome.zip" . -x "*.DS_Store" > /dev/null)
    echo -e "  ${GREEN}[Chrome/Edge]${NC} ZIP klaar"

    # Edge en Chrome parallel
    EDGE_CODE=99
    CHROME_CODE=99

    (
        if [ "$EDGE_OK" = true ]; then
            edge_api_upload \
                "$SCRIPT_DIR/Promedico-Helper-Chrome.zip" \
                "$EDGE_PRODUCT_ID" "$EDGE_CLIENT_ID" "$EDGE_API_KEY" || true
            echo $? > "$EDGE_RESULT_FILE"
        else
            echo 99 > "$EDGE_RESULT_FILE"
        fi
    ) &
    PID_EDGE=$!

    (
        if [ "$CHROME_OK" = true ]; then
            FRESH_TOKEN=$(chrome_get_token "$CHROME_CLIENT_ID" "$CHROME_CLIENT_SECRET" "$CHROME_REFRESH_TOKEN")
            if [ -z "$FRESH_TOKEN" ]; then
                echo -e "  ${YELLOW}[Chrome]${NC} Kon geen access token ophalen"
                echo 1 > "$CHROME_RESULT_FILE"
            else
                chrome_api_upload \
                    "$SCRIPT_DIR/Promedico-Helper-Chrome.zip" \
                    "$CHROME_PUBLISHER_ID" "$CHROME_EXTENSION_ID" "$FRESH_TOKEN" || true
                echo $? > "$CHROME_RESULT_FILE"
            fi
        else
            echo 99 > "$CHROME_RESULT_FILE"
        fi
    ) &
    PID_CHROME=$!

    wait $PID_EDGE
    wait $PID_CHROME
) 

EDGE_CODE=$(cat "$EDGE_RESULT_FILE" 2>/dev/null || echo "1")
CHROME_CODE=$(cat "$CHROME_RESULT_FILE" 2>/dev/null || echo "1")
rm -f "$EDGE_RESULT_FILE" "$CHROME_RESULT_FILE"

echo -e "${GREEN}✓${NC} Chrome/Edge klaar"

# ─── Stap 2b: Firefox unlisted signeren via AMO ───────────────────────────────
echo ""
echo -e "${GREEN}[2b/4]${NC} Firefox unlisted signeren via AMO (30-90 seconden)..."

if [ "$AMO_OK" = true ]; then
    rm -rf "$SCRIPT_DIR/web-ext-artifacts/"
    mkdir -p "$SCRIPT_DIR/web-ext-artifacts/"

    web-ext sign \
        --source-dir="$SCRIPT_DIR/dist/firefox-unlisted" \
        --artifacts-dir="$SCRIPT_DIR/web-ext-artifacts/" \
        --api-key="$AMO_API_KEY" \
        --api-secret="$AMO_API_SECRET" \
        --channel=unlisted \
        && echo "OK" > "$AMO_RESULT_FILE" \
        || echo "FAIL" > "$AMO_RESULT_FILE"
else
    echo "SKIP" > "$AMO_RESULT_FILE"
fi

AMO_RESULT=$(cat "$AMO_RESULT_FILE" 2>/dev/null || echo "FAIL")
rm -f "$AMO_RESULT_FILE"

# ─── Stap 3: XPI verwerken + updates.json ────────────────────────────────────
echo ""
echo -e "${GREEN}[3/4]${NC} XPI verwerken en updates.json bijwerken..."

UNLISTED_XPI=""
if [ "$AMO_RESULT" = "OK" ]; then
    UNLISTED_XPI=$(ls "$SCRIPT_DIR/web-ext-artifacts/"*.xpi 2>/dev/null | head -n 1)
fi

if [ -n "$UNLISTED_XPI" ]; then
    cp "$UNLISTED_XPI" "$SCRIPT_DIR/Promedico-Helper-Dev.xpi"
    echo -e "${GREEN}✓${NC} Dev XPI: Promedico-Helper-Dev.xpi"

    if command -v sha256sum &> /dev/null; then
        HASH=$(sha256sum "$SCRIPT_DIR/Promedico-Helper-Dev.xpi" | awk '{print $1}')
    elif command -v shasum &> /dev/null; then
        HASH=$(shasum -a 256 "$SCRIPT_DIR/Promedico-Helper-Dev.xpi" | awk '{print $1}')
    else
        HASH=""
        echo "SHA256 tool niet gevonden — update_hash weggelaten" >> "$WARNINGS_FILE"
    fi
    [ -n "$HASH" ] && echo -e "${GREEN}✓${NC} Hash: $HASH"

    cat > "$SCRIPT_DIR/firefox/updates.json" << EOF
{
  "addons": {
    "promedico-helper-dev@degrotedokter": {
      "updates": [
        {
          "version": "$NEW_VERSION",
          "update_link": "https://github.com/Sthroos/Huisarts-scripts/raw/main/Promedico-ASP/Promedico-Helper-Dev.xpi"$([ -n "$HASH" ] && echo ",
          \"update_hash\": \"sha256:$HASH\"")
        }
      ]
    }
  }
}
EOF
    echo -e "${GREEN}✓${NC} updates.json bijgewerkt"
else
    if [ "$AMO_RESULT" != "SKIP" ]; then
        echo "Firefox unlisted signing mislukt — testpc krijgt geen auto-update" >> "$WARNINGS_FILE"
    fi
    echo -e "${YELLOW}⚠${NC} Geen gesigneerde XPI — updates.json niet bijgewerkt"
fi

echo -e "${GREEN}✓${NC} Firefox listed ZIP: dist/firefox.zip  ← upload op addons.mozilla.org"
echo -e "${GREEN}✓${NC} Firefox dev ZIP:    dist/firefox-dev.zip  ← sleep naar Firefox Developer"

# ─── Stap 4: GitHub push ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[4/4]${NC} Pushen naar GitHub..."

REL_DIR="$(basename $SCRIPT_DIR)"
cd "$REPO_ROOT"

GITIGNORE="$REL_DIR/.gitignore"
for IGNORE_ENTRY in "dist/" "web-ext-artifacts/" "*.zip" ".env"; do
    if [ ! -f "$GITIGNORE" ] || ! grep -qxF "$IGNORE_ENTRY" "$GITIGNORE" 2>/dev/null; then
        echo "$IGNORE_ENTRY" >> "$GITIGNORE"
        echo -e "${GREEN}✓${NC} Toegevoegd aan .gitignore: $IGNORE_ENTRY"
    fi
done

# XPI's wél op GitHub (voor auto-updates)
if grep -qxF "*.xpi" "$GITIGNORE" 2>/dev/null; then
    grep -v "^\*\.xpi$" "$GITIGNORE" > "$GITIGNORE.tmp" && mv "$GITIGNORE.tmp" "$GITIGNORE"
    echo -e "${GREEN}✓${NC} *.xpi uit .gitignore verwijderd"
fi

if git ls-files --error-unmatch "$REL_DIR/dist/" &>/dev/null 2>&1; then
    git rm -r --cached "$REL_DIR/dist/" > /dev/null 2>&1 || true
    echo -e "${GREEN}✓${NC} dist/ uit git index verwijderd"
fi

git add "$REL_DIR/"
git commit -m "Release v$NEW_VERSION - $RELEASE_NOTES" || true
git push origin main && echo -e "${GREEN}✓${NC} Gepusht naar GitHub" || {
    echo "Push mislukt — controleer je GitHub rechten" >> "$WARNINGS_FILE"
}

cd "$SCRIPT_DIR"

# ─── Eindrapport ─────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Release $NEW_VERSION afgerond${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ -n "$UNLISTED_XPI" ]; then
    echo -e "${GREEN}Firefox unlisted:${NC}  Promedico-Helper-Dev.xpi gepusht → testpc auto-update"
elif [ "$AMO_OK" = true ]; then
    echo -e "${RED}Firefox unlisted:${NC}  Signing mislukt — geen auto-update voor testpc"
else
    echo -e "${YELLOW}Firefox unlisted:${NC}  Overgeslagen (geen AMO credentials)"
fi

echo ""
echo -e "${BLUE}Firefox listed:${NC}    Upload handmatig:"
echo "               https://addons.mozilla.org/developers/"
echo "               Upload: dist/firefox.zip"

echo ""
case "$EDGE_CODE" in
    0)  echo -e "${GREEN}Edge Add-ons:${NC}      Gepubliceerd ✓ (staat in review bij Microsoft)" ;;
    2)  echo -e "${YELLOW}Edge Add-ons:${NC}      Draft bijgewerkt ✓ — publiceer handmatig na review:"
        echo "               https://partner.microsoft.com/dashboard/microsoftedge" ;;
    99) echo -e "${YELLOW}Edge Add-ons:${NC}      Overgeslagen (geen credentials)" ;;
    *)  echo -e "${YELLOW}Edge Add-ons:${NC}      Mislukt — upload handmatig:"
        echo "               https://partner.microsoft.com/dashboard/microsoftedge"
        echo "               Upload: Promedico-Helper-Chrome.zip" ;;
esac

echo ""
case "$CHROME_CODE" in
    0)  echo -e "${GREEN}Chrome Web Store:${NC}  Gepubliceerd ✓ (staat in review bij Google)" ;;
    99) echo -e "${YELLOW}Chrome Web Store:${NC}  Overgeslagen (geen credentials)" ;;
    *)  echo -e "${YELLOW}Chrome Web Store:${NC}  Mislukt — upload handmatig:"
        echo "               https://chrome.google.com/webstore/devconsole"
        echo "               Upload: Promedico-Helper-Chrome.zip" ;;
esac

echo ""
echo -e "${YELLOW}Firefox dev:${NC}       dist/firefox-dev.zip ← sleep naar Firefox Developer Edition"

# Lees en toon alle waarschuwingen
FINAL_WARNINGS=$(cat "$WARNINGS_FILE" 2>/dev/null)
rm -f "$WARNINGS_FILE"
if [ -n "$FINAL_WARNINGS" ]; then
    echo ""
    echo -e "${YELLOW}══ Waarschuwingen ══════════════════════════════════════${NC}"
    while IFS= read -r W; do
        echo -e "${YELLOW}⚠${NC} $W"
    done <<< "$FINAL_WARNINGS"
fi

echo ""
