#!/bin/bash

# Promedico ASP Helper - Release Script
#
# Gebruik: ./release.sh <versie> [release notes]
# Voorbeeld: ./release.sh 1.9 "Dubbele sterren fix en Chrome CSP fixes"
#
# Wat dit script doet:
#   0. Sync met GitHub
#   1. Versie bijwerken in beide manifests
#   2. Alle targets bouwen
#   3. Firefox unlisted signeren via AMO → XPI + updates.json voor testpc
#   4. Chrome/Edge ZIP + Firefox-dev ZIP maken
#   5. Edge publiceren via API
#   6. Chrome Web Store publiceren via API
#   7. Pushen naar GitHub
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

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS+=("$1")
}

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
            echo -e "  ${GREEN}✓${NC} Edge credentials geldig"
            return 0 ;;
        401|403)
            echo -e "  ${RED}✗ Edge API key verlopen of ongeldig (HTTP $CHECK_STATUS)${NC}"
            echo -e "  ${YELLOW}Vernieuwen:${NC}"
            echo -e "  1. https://partner.microsoft.com/dashboard/microsoftedge → Publish API"
            echo -e "  2. Create API credentials → kopieer nieuwe key naar .env als EDGE_API_KEY=..."
            return 1 ;;
        000)
            echo -e "  ${YELLOW}⚠${NC} Geen verbinding met Edge API"
            return 1 ;;
        *)
            echo -e "  ${YELLOW}⚠${NC} Onverwachte status $CHECK_STATUS — gaan toch door"
            return 0 ;;
    esac
}

# ─── Edge: uploaden + publiceren ─────────────────────────────────────────────
# Returncodes: 0=gepubliceerd, 1=fout, 2=InProgressSubmission (draft bijgewerkt)
edge_api_upload() {
    local ZIP=$1 PRODUCT_ID=$2 CLIENT_ID=$3 API_KEY=$4
    local BASE="https://api.addons.microsoftedge.microsoft.com"

    echo -e "  Uploaden..."
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
        STATUS=$(curl -s \
            -H "Authorization: ApiKey $API_KEY" \
            -H "X-ClientID: $CLIENT_ID" \
            "$BASE/v1/products/$PRODUCT_ID/submissions/draft/package/operations/$OPERATION_ID" \
            | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
        [ "$STATUS" = "Succeeded" ] && { echo -e "  ${GREEN}✓${NC} Pakket verwerkt"; break; }
        [ "$STATUS" = "Failed"    ] && { echo -e "  ${RED}✗ Pakketverwerking mislukt${NC}"; return 1; }
        ATTEMPTS=$((ATTEMPTS+1))
        echo -e "  ⏳ Status: ${STATUS:-InProgress} (poging $ATTEMPTS/20)..."
    done
    [ $ATTEMPTS -ge 20 ] && { warn "Edge upload polling timeout"; return 1; }

    echo -e "  Publiceren..."
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
        PUB_RESPONSE=$(curl -s \
            -H "Authorization: ApiKey $API_KEY" \
            -H "X-ClientID: $CLIENT_ID" \
            "$BASE/v1/products/$PRODUCT_ID/submissions/operations/$PUB_OPERATION")
        PUB_STATUS_VAL=$(echo "$PUB_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
        ERROR_CODE=$(echo "$PUB_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('errorCode',''))" 2>/dev/null || echo "")

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
                    echo -e "  ${YELLOW}⚠${NC} Geen wijzigingen gedetecteerd."
                    return 1 ;;
                ModuleStateUnPublishable|SubmissionValidationError)
                    echo -e "  ${RED}✗ Validatiefouten (errorCode: $ERROR_CODE)${NC}"
                    echo "$PUB_RESPONSE" | python3 -c "import json,sys; [print('  ',e) for e in (json.load(sys.stdin).get('errors') or [])]" 2>/dev/null
                    return 1 ;;
                *)
                    echo -e "  ${RED}✗ Publiceren mislukt (errorCode: ${ERROR_CODE:-onbekend})${NC}"
                    echo "$PUB_RESPONSE"
                    return 1 ;;
            esac
        fi
        ATTEMPTS=$((ATTEMPTS+1))
        echo -e "  ⏳ Status: ${PUB_STATUS_VAL:-InProgress} (poging $ATTEMPTS/20)..."
    done

    warn "Edge publish polling timeout — extensie staat mogelijk in review bij Microsoft"
    return 0
}

# ─── Chrome: access token ophalen ────────────────────────────────────────────
chrome_get_token() {
    local CLIENT_ID=$1 CLIENT_SECRET=$2 REFRESH_TOKEN=$3
    curl -s -X POST "https://oauth2.googleapis.com/token" \
        -d "client_id=$CLIENT_ID" \
        -d "client_secret=$CLIENT_SECRET" \
        -d "refresh_token=$REFRESH_TOKEN" \
        -d "grant_type=refresh_token" \
    | python3 -c "import json,sys; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo ""
}

# ─── Chrome: credentials valideren ───────────────────────────────────────────
chrome_check_credentials() {
    local CLIENT_ID=$1 CLIENT_SECRET=$2 REFRESH_TOKEN=$3 PUBLISHER_ID=$4 EXTENSION_ID=$5

    echo -e "  Access token ophalen..."
    ACCESS_TOKEN=$(chrome_get_token "$CLIENT_ID" "$CLIENT_SECRET" "$REFRESH_TOKEN")

    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "  ${RED}✗ Kon geen access token ophalen — refresh token ongeldig?${NC}"
        echo -e "  ${YELLOW}Vernieuwen:${NC}"
        echo -e "  1. Ga naar https://developers.google.com/oauthplayground"
        echo -e "  2. Tandwiel ⚙ → 'Use your own OAuth credentials' → vul Client ID + Secret in"
        echo -e "  3. Scope: https://www.googleapis.com/auth/chromewebstore → Authorize APIs"
        echo -e "  4. Exchange authorization code for tokens → kopieer refresh token naar .env"
        return 1
    fi

    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "https://chromewebstore.googleapis.com/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:fetchStatus")

    case "$STATUS_CODE" in
        200)
            echo -e "  ${GREEN}✓${NC} Chrome credentials geldig"
            CHROME_ACCESS_TOKEN="$ACCESS_TOKEN"
            return 0 ;;
        401|403)
            echo -e "  ${RED}✗ Chrome credentials ongeldig (HTTP $STATUS_CODE)${NC}"
            echo -e "  Controleer CHROME_CLIENT_ID, CHROME_CLIENT_SECRET en CHROME_REFRESH_TOKEN"
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

# ─── Chrome: uploaden + publiceren ───────────────────────────────────────────
chrome_api_upload() {
    local ZIP=$1 PUBLISHER_ID=$2 EXTENSION_ID=$3 ACCESS_TOKEN=$4
    local BASE="https://chromewebstore.googleapis.com"

    echo -e "  Status controleren..."
    STATUS_RESPONSE=$(curl -s \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$BASE/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:fetchStatus")

    UPLOAD_STATE=$(echo "$STATUS_RESPONSE" | python3 -c "
import json,sys
print(json.load(sys.stdin).get('itemState', {}).get('uploadState', ''))
" 2>/dev/null || echo "")

    if [ "$UPLOAD_STATE" = "UPLOAD_IN_PROGRESS" ]; then
        echo -e "  ${YELLOW}⚠${NC} Lopende submission gevonden — annuleren..."
        CANCEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -X POST \
            "$BASE/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:cancelSubmission")
        if [ "$CANCEL_STATUS" = "200" ] || [ "$CANCEL_STATUS" = "204" ]; then
            echo -e "  ${GREEN}✓${NC} Submission geannuleerd"
            sleep 3
        else
            echo -e "  ${YELLOW}⚠${NC} Annuleren mislukt (HTTP $CANCEL_STATUS) — toch doorgaan"
        fi
    fi

    echo -e "  Uploaden naar Chrome Web Store..."
    UPLOAD_RESPONSE=$(curl -s \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -X POST -T "$ZIP" \
        "$BASE/upload/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:upload")

    if echo "$UPLOAD_RESPONSE" | grep -qi '"error"'; then
        UPLOAD_MSG=$(echo "$UPLOAD_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('error',{}).get('message','onbekend'))" 2>/dev/null || echo "onbekend")
        echo -e "  ${RED}✗ Upload mislukt: $UPLOAD_MSG${NC}"
        echo "$UPLOAD_RESPONSE"
        return 1
    fi
    echo -e "  ${GREEN}✓${NC} Upload geslaagd"

    echo -e "  Publiceren bij Chrome Web Store..."
    PUBLISH_RESPONSE=$(curl -s \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -X POST \
        "$BASE/v2/publishers/$PUBLISHER_ID/items/$EXTENSION_ID:publish")

    if echo "$PUBLISH_RESPONSE" | grep -qi '"error"'; then
        echo -e "  ${RED}✗ Publiceren mislukt${NC}"
        echo "$PUBLISH_RESPONSE"
        return 1
    fi

    echo -e "  ${GREEN}✓${NC} Gepubliceerd — staat in review bij Google"
    return 0
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
CHROME_ACCESS_TOKEN=""

# AMO credentials — alleen voor unlisted signing, niet fataal
AMO_OK=true
if [ -z "$AMO_API_KEY" ] || [ -z "$AMO_API_SECRET" ]; then
    warn "AMO credentials niet gevonden — Firefox unlisted signing wordt overgeslagen"
    warn "Voeg AMO_API_KEY en AMO_API_SECRET toe aan .env"
    AMO_OK=false
fi

# Edge credentials — niet fataal
EDGE_OK=true
if [ -z "$EDGE_CLIENT_ID" ] || [ -z "$EDGE_API_KEY" ] || [ -z "$EDGE_PRODUCT_ID" ]; then
    warn "Edge credentials niet gevonden — Edge publishing wordt overgeslagen"
    EDGE_OK=false
else
    echo -e "Edge credentials controleren..."
    edge_check_credentials "$EDGE_PRODUCT_ID" "$EDGE_CLIENT_ID" "$EDGE_API_KEY" || {
        warn "Edge credentials ongeldig — Edge publishing wordt overgeslagen"
        EDGE_OK=false
    }
fi

# Chrome credentials — niet fataal
CHROME_OK=true
if [ -z "$CHROME_CLIENT_ID" ] || [ -z "$CHROME_CLIENT_SECRET" ] || [ -z "$CHROME_REFRESH_TOKEN" ] \
   || [ -z "$CHROME_PUBLISHER_ID" ] || [ -z "$CHROME_EXTENSION_ID" ]; then
    warn "Chrome credentials niet gevonden — Chrome publishing wordt overgeslagen"
    CHROME_OK=false
else
    echo -e "Chrome credentials controleren..."
    chrome_check_credentials \
        "$CHROME_CLIENT_ID" "$CHROME_CLIENT_SECRET" "$CHROME_REFRESH_TOKEN" \
        "$CHROME_PUBLISHER_ID" "$CHROME_EXTENSION_ID" || {
        warn "Chrome credentials ongeldig — Chrome publishing wordt overgeslagen"
        CHROME_OK=false
    }
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

# ─── Stap 3: Firefox unlisted signeren via AMO ───────────────────────────────
echo ""
echo -e "${GREEN}[3/7]${NC} Firefox unlisted signeren via AMO (30-60 seconden)..."

UNLISTED_XPI=""
if [ "$AMO_OK" = true ]; then
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

        # Kopieer naar vaste naam voor GitHub
        cp "$UNLISTED_XPI" Promedico-Helper-Dev.xpi
        echo -e "${GREEN}✓${NC} Dev XPI: Promedico-Helper-Dev.xpi"

        # SHA256 hash
        if command -v sha256sum &> /dev/null; then
            HASH=$(sha256sum Promedico-Helper-Dev.xpi | awk '{print $1}')
        elif command -v shasum &> /dev/null; then
            HASH=$(shasum -a 256 Promedico-Helper-Dev.xpi | awk '{print $1}')
        else
            warn "SHA256 tool niet gevonden — update_hash weggelaten"
            HASH=""
        fi
        [ -n "$HASH" ] && echo -e "${GREEN}✓${NC} Hash: $HASH"

        # updates.json bijwerken — testpc pikt deze automatisch op
        cat > firefox/updates.json << EOF
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
        warn "Firefox unlisted signing mislukt — testpc krijgt geen auto-update"
        UNLISTED_XPI=""
    fi
else
    echo -e "${YELLOW}⚠${NC} Overgeslagen — geen AMO credentials"
fi

# ─── Stap 4: Pakketten klaarmaken ────────────────────────────────────────────
echo ""
echo -e "${GREEN}[4/7]${NC} Distributiepakketten maken..."

(cd dist/chrome && zip -r "$OLDPWD/Promedico-Helper-Chrome.zip" . -x "*.DS_Store" > /dev/null)
echo -e "${GREEN}✓${NC} Chrome/Edge ZIP: Promedico-Helper-Chrome.zip"
echo -e "${GREEN}✓${NC} Firefox listed:  dist/firefox.zip        ← upload op addons.mozilla.org"
echo -e "${GREEN}✓${NC} Firefox dev:     dist/firefox-dev.zip    ← sleep naar Firefox Developer Edition"

# ─── Stap 5: Edge publishing ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[5/7]${NC} Microsoft Edge Add-ons publiceren..."

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

# ─── Stap 6: Chrome publishing ───────────────────────────────────────────────
echo ""
echo -e "${GREEN}[6/7]${NC} Chrome Web Store publiceren..."

CHROME_PUBLISHED=false
if [ "$CHROME_OK" = true ]; then
    FRESH_TOKEN=$(chrome_get_token "$CHROME_CLIENT_ID" "$CHROME_CLIENT_SECRET" "$CHROME_REFRESH_TOKEN")
    if [ -z "$FRESH_TOKEN" ]; then
        warn "Kon geen Chrome access token ophalen — Chrome publishing overgeslagen"
    else
        chrome_api_upload \
            "Promedico-Helper-Chrome.zip" \
            "$CHROME_PUBLISHER_ID" \
            "$CHROME_EXTENSION_ID" \
            "$FRESH_TOKEN" \
            && CHROME_PUBLISHED=true \
            || warn "Chrome publishing mislukt — upload handmatig op chrome.google.com/webstore/devconsole"
    fi
else
    echo -e "${YELLOW}⚠${NC} Overgeslagen — geen geldige Chrome credentials"
fi

# ─── Stap 7: GitHub push ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[7/7]${NC} Pushen naar GitHub..."

SCRIPT_DIR="$(pwd)"
REL_DIR="$(basename $SCRIPT_DIR)"
cd "$REPO_ROOT"

GITIGNORE="$REL_DIR/.gitignore"
for IGNORE_ENTRY in "dist/" "web-ext-artifacts/" "*.zip" ".env"; do
    if [ ! -f "$GITIGNORE" ] || ! grep -qxF "$IGNORE_ENTRY" "$GITIGNORE" 2>/dev/null; then
        echo "$IGNORE_ENTRY" >> "$GITIGNORE"
        echo -e "${GREEN}✓${NC} Toegevoegd aan .gitignore: $IGNORE_ENTRY"
    fi
done

# XPI's wél op GitHub zetten (Promedico-Helper-Dev.xpi voor auto-updates)
# Zorg dat *.xpi niet in .gitignore staat
if grep -qxF "*.xpi" "$GITIGNORE" 2>/dev/null; then
    grep -v "^\*\.xpi$" "$GITIGNORE" > "$GITIGNORE.tmp" && mv "$GITIGNORE.tmp" "$GITIGNORE"
    echo -e "${GREEN}✓${NC} *.xpi uit .gitignore verwijderd (XPI moet op GitHub staan)"
fi

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
    echo -e "${GREEN}Firefox unlisted:${NC}  Promedico-Helper-Dev.xpi gepusht naar GitHub"
    echo -e "                   → testpc krijgt auto-update via updates.json"
else
    echo -e "${YELLOW}Firefox unlisted:${NC}  NIET gesigneerd — testpc krijgt geen auto-update"
fi

echo ""
echo -e "${BLUE}Firefox listed:${NC}    Upload handmatig op addons.mozilla.org:"
echo "               https://addons.mozilla.org/developers/"
echo "               Upload: dist/firefox.zip"

echo ""
if [ "$EDGE_PUBLISHED" = true ]; then
    echo -e "${GREEN}Edge Add-ons:${NC}      Gepubliceerd via API ✓ (staat in review bij Microsoft)"
elif [ "$EDGE_DRAFT_ONLY" = true ]; then
    echo -e "${YELLOW}Edge Add-ons:${NC}      Draft bijgewerkt ✓ — er loopt al een submission in review"
    echo "               Publiceer handmatig zodra de review klaar is:"
    echo "               https://partner.microsoft.com/dashboard/microsoftedge"
else
    echo -e "${YELLOW}Edge Add-ons:${NC}      Niet gepubliceerd — upload handmatig:"
    echo "               https://partner.microsoft.com/dashboard/microsoftedge"
    echo "               Upload: Promedico-Helper-Chrome.zip"
fi

echo ""
if [ "$CHROME_PUBLISHED" = true ]; then
    echo -e "${GREEN}Chrome Web Store:${NC}  Gepubliceerd via API ✓ (staat in review bij Google)"
else
    echo -e "${YELLOW}Chrome Web Store:${NC}  Niet gepubliceerd — upload handmatig:"
    echo "               https://chrome.google.com/webstore/devconsole"
    echo "               Upload: Promedico-Helper-Chrome.zip"
fi

echo ""
echo -e "${YELLOW}Firefox dev:${NC}       dist/firefox-dev.zip ← sleep naar Firefox Developer Edition"

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}══ Waarschuwingen ══════════════════════════════════════${NC}"
    for W in "${WARNINGS[@]}"; do
        echo -e "${YELLOW}⚠${NC} $W"
    done
fi

echo ""
