#!/bin/bash
# Deploy SimpleVault to Sepolia and Base Sepolia

set -e

# Load env
source .env.local

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  echo "Error: DEPLOYER_PRIVATE_KEY not set in .env.local"
  exit 1
fi

echo "🚀 Deploying SimpleVault..."

# Deploy to Sepolia
echo ""
echo "📍 Deploying to Sepolia..."
SEPOLIA_RESULT=$(forge create contracts/SimpleVault.sol:SimpleVault \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/demo \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --json)

SEPOLIA_ADDRESS=$(echo $SEPOLIA_RESULT | jq -r '.deployedTo')
echo "✅ Sepolia: $SEPOLIA_ADDRESS"

# Deploy to Base Sepolia
echo ""
echo "📍 Deploying to Base Sepolia..."
BASE_RESULT=$(forge create contracts/SimpleVault.sol:SimpleVault \
  --rpc-url https://sepolia.base.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --json)

BASE_ADDRESS=$(echo $BASE_RESULT | jq -r '.deployedTo')
echo "✅ Base Sepolia: $BASE_ADDRESS"

echo ""
echo "=========================================="
echo "🎉 Deployment Complete!"
echo "=========================================="
echo "Sepolia:      $SEPOLIA_ADDRESS"
echo "Base Sepolia: $BASE_ADDRESS"
echo ""
echo "Update these in:"
echo "  - indexer/config.yaml"
echo "  - src/config/contracts.ts"
