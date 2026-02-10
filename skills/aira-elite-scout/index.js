// skills/aira-elite-scout/index.js
// Aira Commander Script for Hackathon Demo

const { sessions_spawn } = require('openclaw');

async function run(args) {
    const [project, target] = args;
    if (!project) return "Usage: aira-elite-scout <project_name> <ca_or_handle>";

    console.log(`🌸 Aira Commander initializing mission for ${project}...`);

    // 1. Spawn Sniper
    await sessions_spawn({
        agentId: 'main',
        label: `sniper_${project}`,
        task: `[SNIPER] Research ${project} (${target}). Extract roadmap, backers, and social sentiment.`
    });

    // 2. Spawn Sentinel
    await sessions_spawn({
        agentId: 'main',
        label: `sentinel_${project}`,
        task: `[SENTINEL] Audit ${target} on-chain. Check liquidity, supply locks, and dev wallet activity.`
    });

    return `Mission launched! Sniper and Sentinel are currently infiltrating ${project}. I will deliver the final verdict once they report back. (っò__ó)っ`;
}

module.exports = run;
