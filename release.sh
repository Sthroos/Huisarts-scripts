#!/bin/bash

# Promedico ASP Helper - Release Script (Fixed for existing add-on)
# Usage: ./release.sh 1.3.657 "Optional release notes"

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Auto-load .env if it exists
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} Loading credentials from .env"
    source .env
fi

# Check version argument
if [ -z "$1" ]; then
    echo -e "${RED}Error: Version number required${NC}"
    echo "Usage: ./release.sh <version> [release notes]"
    exit 1
fi

NEW_VERSION=$1
RELEASE_NOTES=${2:-"Release $NEW_VERSION"}

# Check AMO credentials
if [ -z "$AMO_API_KEY" ] || [ -z "$AMO_API_SECRET" ]; then
    echo -e "${RED}Error: AMO credentials not set${NC}"
    echo "Create .env file or export AMO_API_KEY and AMO_API_SECRET"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(grep -Po '"version":\s*"\K[^"]+' manifest.json)

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Promedico ASP Helper Release Tool    ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Current version: ${YELLOW}$CURRENT_VERSION${NC}"
echo -e "New version:     ${GREEN}$NEW_VERSION${NC}"
echo -e "Release notes:   $RELEASE_NOTES"
echo ""

# Confirmation
read -p "Continue with release? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Release cancelled"
    exit 1
fi

echo ""
echo -e "${GREEN}[1/6]${NC} Updating manifest.json version..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" manifest.json
else
    sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" manifest.json
fi
echo -e "${GREEN}✓${NC} manifest.json updated"

echo ""
echo -e "${GREEN}[2/6]${NC} Cleaning old builds..."
rm -rf web-ext-artifacts/
mkdir -p web-ext-artifacts/
echo -e "${GREEN}✓${NC} Clean complete"

echo ""
echo -e "${GREEN}[3/6]${NC} Signing with AMO (this may take 30-60 seconds)..."

# Sign EXACTLY as you did before (no --channel flag!)
web-ext sign \
    --api-key="$AMO_API_KEY" \
    --api-secret="$AMO_API_SECRET" \
    --channel=unlisted \
    --timeout=120000
    

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Signing failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Signing complete"

echo ""
echo -e "${GREEN}[4/6]${NC} Moving signed XPI..."
SIGNED_XPI=$(ls web-ext-artifacts/*.xpi 2>/dev/null | head -n 1)

if [ -z "$SIGNED_XPI" ]; then
    echo -e "${RED}✗ No signed XPI found in web-ext-artifacts/${NC}"
    ls -la web-ext-artifacts/
    exit 1
fi

cp "$SIGNED_XPI" Promedico-Helper-Scripts.xpi
echo -e "${GREEN}✓${NC} XPI: $(basename $SIGNED_XPI)"
echo -e "${GREEN}✓${NC} Copied to: Promedico-Helper-Scripts.xpi"

echo ""
echo -e "${GREEN}[5/6]${NC} Calculating SHA256 hash..."
if command -v sha256sum &> /dev/null; then
    HASH=$(sha256sum Promedico-Helper-Scripts.xpi | awk '{print $1}')
elif command -v shasum &> /dev/null; then
    HASH=$(shasum -a 256 Promedico-Helper-Scripts.xpi | awk '{print $1}')
else
    echo -e "${YELLOW}⚠${NC} SHA256 tool not found"
    HASH=""
fi

if [ -n "$HASH" ]; then
    echo -e "${GREEN}✓${NC} Hash: $HASH"
fi

echo ""
echo -e "${GREEN}[6/6]${NC} Creating/updating updates.json..."

cat > updates.json << EOF
{
  "addons": {
    "promedico-helper@degrotedokter": {
      "updates": [
        {
          "version": "$NEW_VERSION",
          "update_link": "https://github.com/Sthroos/Huisarts-scripts/raw/main/Promedico-ASP/Firefox/Promedico-Helper-Scripts.xpi"$([ -n "$HASH" ] && echo ",
          \"update_hash\": \"sha256:$HASH\"")
        }
      ]
    }
  }
}
EOF

echo -e "${GREEN}✓${NC} updates.json created"

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Files ready for commit!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "Changed files:"
echo "  - manifest.json (version: $NEW_VERSION)"
echo "  - Promedico-Helper-Scripts.xpi (signed)"
echo "  - updates.json (update manifest)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review: git diff manifest.json"
echo "  2. Commit: git add manifest.json Promedico-Helper-Scripts.xpi updates.json"
echo "  3. Commit: git commit -m 'Release v$NEW_VERSION'"
echo "  4. Push: git push origin main"
echo ""
echo "Or run this one-liner:"
echo -e "${GREEN}git add manifest.json Promedico-Helper-Scripts.xpi updates.json && git commit -m 'Release v$NEW_VERSION' && git push${NC}"
