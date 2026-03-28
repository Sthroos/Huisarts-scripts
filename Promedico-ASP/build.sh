#!/bin/bash

# Promedico ASP Helper - Build Script
#
# GEBRUIK:
#   ./build.sh                  # bouwt alle targets (firefox, firefox-dev, chrome)
#   ./build.sh firefox          # release build voor AMO (zonder update_url)
#   ./build.sh firefox-dev      # debug build voor lokaal testen via ZIP
#   ./build.sh chrome           # Chrome/Edge build
#   ./build.sh all              # zelfde als geen argument
#
# MAPPENSTRUCTUUR:
#   shared/         → gedeelde bestanden (config, popup, icons, scripts)
#   firefox/        → Firefox-specifiek (manifest MV2, content.js, background.js)
#   chrome/         → Chrome-specifiek (manifest MV3, content.js, background.js)
#   scripts/        → alle userscripts (gedeeld)
#
# OUTPUT:
#   dist/firefox/       → upload handmatig naar AMO (listed)
#   dist/firefox-dev/   → lokaal testen in Firefox Developer Edition
#   dist/firefox-dev.zip → sleep dit naar Firefox Developer Edition
#   dist/chrome/        → input voor release.sh (Edge + Chrome Web Store)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

TARGET=${1:-"all"}
BUILD_DIR="dist"

VALID_TARGETS=("all" "firefox" "firefox-dev" "chrome")
if [[ ! " ${VALID_TARGETS[@]} " =~ " $TARGET " ]]; then
    echo -e "${RED}Onbekend target: $TARGET${NC}"
    echo "Gebruik: ./build.sh [all|firefox|firefox-dev|chrome]"
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

# ─── TARGET: firefox (listed — voor AMO) ──────────────────────────────────────
# Geen update_url — AMO regelt updates zelf voor listed extensies
build_firefox() {
    echo -e "${GREEN}► firefox${NC}  (listed — voor AMO)"
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
    echo -e "  ${GREEN}✓${NC} $OUT/"
}

# ─── TARGET: firefox-dev (debug build, voor lokaal testen) ────────────────────
# - Naam krijgt [DEV] zodat je hem herkent naast de store-versie
# - Andere extension ID zodat beide naast elkaar kunnen draaien
# - Geen update_url (niet gesigneerd, dus niet nodig)
build_firefox_dev() {
    echo -e "${BLUE}► firefox-dev${NC}  (debug — voor lokaal testen)"
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
    echo -e "  ${GREEN}✓${NC} $ZIP  ← sleep dit naar Firefox Developer Edition"
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
    firefox)     build_firefox ;;
    firefox-dev) build_firefox_dev ;;
    chrome)      build_chrome ;;
    all)
        build_firefox
        build_firefox_dev
        build_chrome
        ;;
esac

echo ""
echo -e "${GREEN}✓ Build klaar!${NC}"
echo ""
[[ "$TARGET" == "all" || "$TARGET" == "firefox"     ]] && echo -e "  ${GREEN}Firefox (listed):${NC}  $BUILD_DIR/firefox/        → upload naar addons.mozilla.org" || true
[[ "$TARGET" == "all" || "$TARGET" == "firefox-dev" ]] && echo -e "  ${BLUE}Firefox (dev):${NC}     $BUILD_DIR/firefox-dev/    + $BUILD_DIR/firefox-dev.zip" || true
[[ "$TARGET" == "all" || "$TARGET" == "chrome"      ]] && echo -e "  ${GREEN}Chrome/Edge:${NC}       $BUILD_DIR/chrome/" || true
echo ""
exit 0
