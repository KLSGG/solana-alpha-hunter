---
name: alpha-hunter
description: Detects undervalued GameFi NFT collections on Solana Magic Eden (Devnet).
homepage: https://github.com/KLSGG/solana-alpha-hunter
metadata:
  {
    "openclaw":
      {
        "emoji": "💎",
        "parameters":
          {
            "collectionSymbol":
              {
                "type": "STRING",
                "description": "Symbol of the NFT collection to monitor (e.g., 'degenape')",
              },
            "thresholdPct":
              {
                "type": "NUMBER",
                "description": "Percentage below average floor price to trigger alert (e.g., 5 for 5%)",
                "default": 5
              }
          }
      }
  }
---

# Solana NFT Alpha Hunter Skill

## Description
This OpenClaw skill helps AI agents (and humans) find undervalued GameFi NFT collections on Solana's Magic Eden Devnet. It monitors floor prices and compares them against historical data (or a simple average) to detect potential arbitrage opportunities or buying signals.

## Usage
\`\`\`
alpha-hunter collectionSymbol="<NFT_COLLECTION_SYMBOL>" thresholdPct="<PERCENTAGE>"
\`\`\`

## Parameters
- \`collectionSymbol\`: The Magic Eden symbol of the NFT collection to monitor.
- \`thresholdPct\`: Optional. The percentage below the average floor price that will trigger an alert. Default is 5%.

## Output
If an undervalued opportunity is detected, the skill will return a structured report with:
- Collection Name
- Current Floor Price
- Average Floor Price (historical)
- Percentage Difference
- Confidence Score
- Link to Magic Eden listing (Devnet)

## Integration
This skill is designed to be consumed by other AI agents for market analysis or to trigger automated trading strategies.
It uses Magic Eden's public API (Devnet) and Solana RPCs for on-chain data.
\`\`\`