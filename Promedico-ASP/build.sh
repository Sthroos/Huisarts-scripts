#!/bin/bash

# Promedico ASP Helper - Build Script
#
# GEBRUIK:
#   ./build.sh                        # bouwt alle targets (firefox, firefox-dev, chrome)
#   ./build.sh firefox                # stabiele Firefox build (voor release)
#   ./build.sh firefox-dev            # debug Firefox build (voor lokaal testen via zip)
#   ./build.sh chrome                 # Chrome/Edge build (voor release + unpacked testen)
#   ./build.sh all                    # zelfde als geen argument
#
# MAPPENSTRUCTUUR:
#   shared/         → gedeelde bestanden (config, popup, loader, icons, scripts)
#   firefox/        → Firefox-specifiek (manifest MV2, content.js, background.js, updates.json)
#   chrome/         → Chrome-specifiek (manifest MV3, content.js, background.js, shim.js)
#   scripts/        → alle userscripts (gedeeld)
#
# OUTPUT:
#   dist/firefox/       → input voor release.sh (AMO signing)
#   dist/firefox-dev/   → voor lokaal testen in Firefox Developer
#   dist/firefox-dev.zip → kant-en-klaar voor installatie
#   dist/chrome/        → unpacked laden in Chrome/Edge, of input voor release.sh

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
echo -e "${YELLOW}║  Promedico ASP Helper Build Tool      ║${NC}"
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
    cp shared/loader.js   "$OUT/"
    cp shared/icons/*     "$OUT/icons/"
    cp scripts/*.js       "$OUT/scripts/"
    cp scripts/*.json     "$OUT/scripts/"
}

# ─── Hulpfunctie: kopieer browser-specifieke bestanden ────────────────────────
copy_browser_files() {
    local BROWSER_DIR=$1   # map met browser-specifieke bronbestanden
    local OUT=$2           # output-map

    cp "$BROWSER_DIR/manifest.json"  "$OUT/"
    cp "$BROWSER_DIR/background.js"  "$OUT/"
    cp "$BROWSER_DIR/content.js"     "$OUT/"

    # Optionele bestanden
    [ -f "$BROWSER_DIR/shim.js" ]                  && cp "$BROWSER_DIR/shim.js"                  "$OUT/" || true
    [ -f "$BROWSER_DIR/storage-bridge-client.js" ] && cp "$BROWSER_DIR/storage-bridge-client.js" "$OUT/" || true
    [ -f "$BROWSER_DIR/updates.json" ]             && cp "$BROWSER_DIR/updates.json"             "$OUT/" || true
}

# ─── TARGET: firefox (stabiel, voor AMO release) ──────────────────────────────
build_firefox() {
    echo -e "${GREEN}► firefox${NC}  (stabiel — voor release)"
    local OUT="$BUILD_DIR/firefox"
    copy_shared "$OUT"
    copy_browser_files "firefox" "$OUT"
    echo -e "  ${GREEN}✓${NC} $OUT/"
}

# ─── TARGET: firefox-dev (debug build, voor lokaal testen) ────────────────────
build_firefox_dev() {
    echo -e "${BLUE}► firefox-dev${NC}  (debug — voor lokaal testen)"
    local OUT="$BUILD_DIR/firefox-dev"
    copy_shared "$OUT"
    copy_browser_files "firefox" "$OUT"

    # Pas manifest aan voor debug:
    # - Verwijder update_url (anders zeurt Firefox over niet-gesigneerde extensie)
    # - Voeg DEV toe aan naam zodat je hem herkent
    # - Andere extension ID zodat hij naast de stabiele versie kan draaien
    python3 - "$OUT/manifest.json" << 'PYEOF'
import json, sys
path = sys.argv[1]
m = json.load(open(path))
m['name'] = m['name'] + ' [DEV]'
m['browser_specific_settings']['gecko']['id'] = 'promedico-helper-dev@degrotedokter'
del m['browser_specific_settings']['gecko']['update_url']
json.dump(m, open(path, 'w'), indent=2, ensure_ascii=False)
PYEOF

    # Maak direct een ZIP klaar voor installatie
    local ZIP="$BUILD_DIR/firefox-dev.zip"
    rm -f "$ZIP"
    (cd "$OUT" && zip -r "$OLDPWD/$ZIP" . -x "*.DS_Store" > /dev/null)
    echo -e "  ${GREEN}✓${NC} $OUT/"
    echo -e "  ${GREEN}✓${NC} $ZIP  ← installeer dit in Firefox Developer"
}

# ─── TARGET: chrome ────────────────────────────────────────────────────────────
build_chrome() {
    echo -e "${GREEN}► chrome${NC}  (stabiel — voor release + unpacked testen)"
    local OUT="$BUILD_DIR/chrome"
    copy_shared "$OUT"
    copy_browser_files "chrome" "$OUT"
    echo -e "  ${GREEN}✓${NC} $OUT/"
}

# ─── Build uitvoeren ──────────────────────────────────────────────────────────
mkdir -p "$BUILD_DIR"

case "$TARGET" in
    firefox)
        build_firefox ;;
    firefox-dev)
        build_firefox_dev ;;
    chrome)
        build_chrome ;;
    all)
        build_firefox
        build_firefox_dev
        build_chrome
        ;;
esac

echo ""
echo -e "${GREEN}✓ Build klaar!${NC}"
echo ""

# Overzicht
[[ "$TARGET" == "all" || "$TARGET" == "firefox"     ]] && echo -e "  ${GREEN}Firefox stabiel:${NC}  $BUILD_DIR/firefox/" || true
[[ "$TARGET" == "all" || "$TARGET" == "firefox-dev" ]] && echo -e "  ${BLUE}Firefox debug:${NC}    $BUILD_DIR/firefox-dev/   +   $BUILD_DIR/firefox-dev.zip" || true
[[ "$TARGET" == "all" || "$TARGET" == "chrome"      ]] && echo -e "  ${GREEN}Chrome/Edge:${NC}      $BUILD_DIR/chrome/" || true
echo ""
exit 0
