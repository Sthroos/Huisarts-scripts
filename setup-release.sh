#!/bin/bash

# Promedico ASP Helper - Setup Script
# Run once to configure your release environment

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Promedico ASP Helper Setup           ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if web-ext is installed
if ! command -v web-ext &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} web-ext not found. Installing..."
    npm install -g web-ext
    echo -e "${GREEN}✓${NC} web-ext installed"
else
    echo -e "${GREEN}✓${NC} web-ext is already installed"
fi

# Make release script executable
chmod +x release.sh
echo -e "${GREEN}✓${NC} release.sh is now executable"

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Get AMO API credentials:"
echo "   Visit: https://addons.mozilla.org/developers/addon/api/key/"
echo ""
echo "2. Set environment variables (add to ~/.bashrc or ~/.zshrc):"
echo "   export AMO_API_KEY='your-api-key-here'"
echo "   export AMO_API_SECRET='your-api-secret-here'"
echo ""
echo "3. Or create a .env file (DON'T commit this!):"
echo "   echo 'export AMO_API_KEY=\"your-key\"' > .env"
echo "   echo 'export AMO_API_SECRET=\"your-secret\"' >> .env"
echo "   echo '.env' >> .gitignore"
echo "   source .env"
echo ""
echo "4. Run your first release:"
echo "   ./release.sh 1.3.656 'Initial auto-update setup'"
echo ""
