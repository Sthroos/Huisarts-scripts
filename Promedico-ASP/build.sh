#!/bin/bash

# Promedico ASP Helper - Build Script
#
# GEBRUIK:
#   ./build.sh                    # bouwt alle targets
#   ./build.sh firefox            # listed build voor AMO (handmatig uploaden)
#   ./build.sh firefox-unlisted   # unlisted build voor testpc (AMO signing, auto-updates)
#   ./build.sh firefox-dev        # debug build voor lokaal slepen (ongezind)
#   ./build.sh chrome             # Chrome/Edge build
#   ./build.sh all                # zelfde als geen argument
#
# OUTPUT:
#   dist/firefox/           → zip en upload handmatig naar addons.mozilla.org (listed)
#   dist/firefox.zip        → kant-en-klaar voor AMO upload
#   dist/firefox-unlisted/  → input voor AMO signing (--channel=unlisted)
#   dist/firefox-dev/       → lokaal testen (ongezind)
#   dist/firefox-dev.zip    → sleep naar Firefox Developer Edition
#   dist/chrome/            → input voor release.sh (Edge + Chrome Web Store)
#
# FIREFOX VERSIES:
#   listed    → promedico-helper@degrotedokter       — officiële store versie
#   unlisted  → promedico-helper-dev@degrotedokter   — testpc, auto-updates via updates.json
#   dev       → promedico-helper-dev@degrotedokter   — lokaal, ongezind

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

TARGET=${1:-"all"}
BUILD_DIR="dist"

VALID_TARGETS=("all" "firefox" "firefox-unlisted" "firefox-dev" "chrome")
if [[ ! " ${VALID_TARGETS[@]} " =~ " $TARGET " ]]; then
    echo -e "${RED}Onbekend target: $TARGET${NC}"
    echo "Gebruik: ./build.sh [all|firefox|firefox-unlisted|firefox-dev|chrome]"
    exit 1
fi

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Promedico ASP Helper Build Tool       ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""

# ─── Hulpfunctie: kopieer gedeelde bestanden naar output-map ──────────────────
copy_shared() {
    local OUT=$1
    rm -rf "$OUT"
    mkdir -p "$OUT/scripts" "$OUT/icons"

    cp shared/config.js   "$OUT/"
    cp shared/popup.html  "$OUT/"
    cp shared/popup.js    "$OUT/"
    cp shared/icons/*     "$OUT/icons/"
    cp scripts/*.js       "$OUT/scripts/"
    cp scripts/*.json     "$OUT/scripts/"
}

# ─── Hulpfunctie: kopieer browser-specifieke bestanden ────────────────────────
copy_browser_files() {
    local BROWSER_DIR=$1
    local OUT=$2

    cp "$BROWSER_DIR/manifest.json"  "$OUT/"
    cp "$BROWSER_DIR/background.js"  "$OUT/"
    cp "$BROWSER_DIR/content.js"     "$OUT/"

    [ -f "$BROWSER_DIR/storage-bridge-client.js" ] && cp "$BROWSER_DIR/storage-bridge-client.js" "$OUT/" || true
}

# ─── TARGET: firefox (listed — handmatig uploaden op AMO) ─────────────────────
# Geen update_url — AMO regelt updates zelf voor listed extensies
# Extension ID: promedico-helper@degrotedokter
build_firefox() {
    echo -e "${GREEN}► firefox${NC}  (listed — handmatig uploaden op AMO)"
    local OUT="$BUILD_DIR/firefox"
    copy_shared "$OUT"
    copy_browser_files "firefox" "$OUT"
    python3 - "$OUT/manifest.json" << 'PYEOF'
import json, sys
path = sys.argv[1]
m = json.load(open(path))
m['browser_specific_settings']['gecko'].pop('update_url', None)
json.dump(m, open(path, 'w'), indent=2, ensure_ascii=False)
PYEOF
    local ZIP="$BUILD_DIR/firefox.zip"
    rm -f "$ZIP"
    (cd "$OUT" && zip -r "$OLDPWD/$ZIP" . -x "*.DS_Store" > /dev/null)
    echo -e "  ${GREEN}✓${NC} $OUT/"
    echo -e "  ${GREEN}✓${NC} $ZIP  ← upload op addons.mozilla.org"
}

# ─── TARGET: firefox-unlisted (voor testpc, AMO signing, auto-updates) ────────
# - Andere extension ID zodat hij naast de listed versie draait
# - update_url → updates.json op GitHub zodat testpc automatisch update
# - Naam krijgt [DEV] zodat je hem herkent
# Extension ID: promedico-helper-dev@degrotedokter
build_firefox_unlisted() {
    echo -e "${BLUE}► firefox-unlisted${NC}  (unlisted — voor testpc, met auto-updates)"
    local OUT="$BUILD_DIR/firefox-unlisted"
    copy_shared "$OUT"
    copy_browser_files "firefox" "$OUT"
    python3 - "$OUT/manifest.json" << 'PYEOF'
import json, sys
path = sys.argv[1]
m = json.load(open(path))
m['name'] = m['name'] + ' [DEV]'
m['browser_specific_settings']['gecko']['id'] = 'promedico-helper-dev@degrotedokter'
m['browser_specific_settings']['gecko']['update_url'] = \
    'https://raw.githubusercontent.com/Sthroos/Huisarts-scripts/main/Promedico-ASP/firefox/updates.json'
json.dump(m, open(path, 'w'), indent=2, ensure_ascii=False)
PYEOF
    echo -e "  ${GREEN}✓${NC} $OUT/  ← input voor AMO signing (release.sh)"
}

# ─── TARGET: firefox-dev (lokaal, ongezind) ───────────────────────────────────
# - Geen signing nodig, gewoon slepen naar Firefox Developer Edition
# - Zelfde DEV extension ID zodat hij de unlisted versie vervangt als die er al is
build_firefox_dev() {
    echo -e "${BLUE}► firefox-dev${NC}  (debug — lokaal slepen, ongezind)"
    local OUT="$BUILD_DIR/firefox-dev"
    copy_shared "$OUT"
    copy_browser_files "firefox" "$OUT"
    python3 - "$OUT/manifest.json" << 'PYEOF'
import json, sys
path = sys.argv[1]
m = json.load(open(path))
m['name'] = m['name'] + ' [DEV]'
m['browser_specific_settings']['gecko']['id'] = 'promedico-helper-dev@degrotedokter'
m['browser_specific_settings']['gecko'].pop('update_url', None)
json.dump(m, open(path, 'w'), indent=2, ensure_ascii=False)
PYEOF
    local ZIP="$BUILD_DIR/firefox-dev.zip"
    rm -f "$ZIP"
    (cd "$OUT" && zip -r "$OLDPWD/$ZIP" . -x "*.DS_Store" > /dev/null)
    echo -e "  ${GREEN}✓${NC} $OUT/"
    echo -e "  ${GREEN}✓${NC} $ZIP  ← sleep naar Firefox Developer Edition"
}

# ─── TARGET: chrome ────────────────────────────────────────────────────────────
build_chrome() {
    echo -e "${GREEN}► chrome${NC}  (stabiel — voor Chrome Web Store + Edge)"
    local OUT="$BUILD_DIR/chrome"
    copy_shared "$OUT"
    copy_browser_files "chrome" "$OUT"
    echo -e "  ${GREEN}✓${NC} $OUT/"
}

# ─── Build uitvoeren ──────────────────────────────────────────────────────────
mkdir -p "$BUILD_DIR"

case "$TARGET" in
    firefox)          build_firefox ;;
    firefox-unlisted) build_firefox_unlisted ;;
    firefox-dev)      build_firefox_dev ;;
    chrome)           build_chrome ;;
    all)
        build_firefox
        build_firefox_unlisted
        build_firefox_dev
        build_chrome
        ;;
esac

echo ""
echo -e "${GREEN}✓ Build klaar!${NC}"
echo ""
[[ "$TARGET" == "all" || "$TARGET" == "firefox"          ]] && echo -e "  ${GREEN}Firefox listed:${NC}    dist/firefox.zip          → upload op addons.mozilla.org" || true
[[ "$TARGET" == "all" || "$TARGET" == "firefox-unlisted" ]] && echo -e "  ${BLUE}Firefox unlisted:${NC}  dist/firefox-unlisted/    → release.sh signeert dit (AMO unlisted)" || true
[[ "$TARGET" == "all" || "$TARGET" == "firefox-dev"      ]] && echo -e "  ${BLUE}Firefox dev:${NC}       dist/firefox-dev.zip      → sleep naar Firefox Developer Edition" || true
[[ "$TARGET" == "all" || "$TARGET" == "chrome"           ]] && echo -e "  ${GREEN}Chrome/Edge:${NC}       dist/chrome/" || true
echo ""
exit 0
