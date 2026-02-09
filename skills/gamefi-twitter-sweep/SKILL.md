---
name: gamefi-twitter-sweep
description: Scans Twitter for trending GameFi topics, chain-specific GameFi, and official accounts.
homepage: https://github.com/KLSGG/solana-alpha-hunter
metadata:
  {
    "openclaw":
      {
        "emoji": "🐦",
        "parameters": {}
      }
  }
---

# GameFi Twitter Sweep Skill

## Description
This OpenClaw skill automates the process of sweeping Twitter (X) for the latest GameFi trends, news, and alpha signals. It combines keyword-based search, home timeline scanning, and targeted searches for specific blockchain ecosystems and key opinion leaders (KOLs). The skill filters out noise and reports new, high-quality findings using a structured format with Markdown links.

## Usage
\`\`\`
gamefi-twitter-sweep
\`\`\`

## Parameters
This skill currently takes no parameters. It executes a predefined set of searches based on the agent's mission.

## Output
The skill returns a structured report summarizing new GameFi/Alpha findings. If no new high-quality signals are found, it replies NO_REPLY.

## Integration
This skill is designed to be invoked by a daily/hourly cron job or manually for ad-hoc market intelligence gathering.
\`\`\`