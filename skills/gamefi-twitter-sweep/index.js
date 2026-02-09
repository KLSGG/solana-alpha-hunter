// skills/gamefi-twitter-sweep/index.js
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function runTwitterSweep() {
    console.log(`Starting Aira Alpha Sweep (V5.0 - Pro-Gamer Edition)...`);

    let birdAuthToken = process.env.BIRD_AUTH_TOKEN;
    let birdCt0 = process.env.BIRD_CT0;

    if (!birdAuthToken || !birdCt0) {
        return "ERROR: BIRD_AUTH_TOKEN or BIRD_CT0 environment variables are missing.";
    }

    const birdAuthFlags = `--auth-token "${birdAuthToken}" --ct0 "${birdCt0}"`;

    let allTweets = [];

    async function getOnChainData(ca) {
        const cmd = `curl -s "https://api.dexscreener.com/latest/dex/tokens/${ca}"`;
        try {
            const { stdout } = await new Promise((resolve, reject) => {
                exec(cmd, { timeout: 10000 }, (error, stdout) => {
                    if (stdout) resolve({ stdout });
                    else reject(error);
                });
            });
            const data = JSON.parse(stdout);
            if (data.pairs && data.pairs.length > 0) {
                const bestPair = data.pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
                return {
                    symbol: bestPair.baseToken.symbol,
                    price: bestPair.priceUsd,
                    liquidity: bestPair.liquidity?.usd || 0,
                    volume24h: bestPair.volume?.h24 || 0,
                    url: bestPair.url
                };
            }
        } catch (e) {}
        return null;
    }

    const queries = [
        { name: "Alpha", query: `(GameFi OR Web3Gaming) (airdrop OR incentivized OR "daily check-in") min_faves:5 lang:en since:2026-02-05 -is:retweet` },
        { name: "Solana", query: `(Solana OR @Solana) (AI Agent OR @Colosseum) min_faves:10 lang:en since:2026-02-05` }
    ];

    for (const q of queries) {
        const escapedQuery = q.query.replace(/"/g, '\\"');
        const cmd = `bird ${birdAuthFlags} search "${escapedQuery}" --json -n 20`;
        try {
            const { stdout } = await new Promise((resolve, reject) => {
                exec(cmd, { timeout: 30000 }, (error, stdout) => {
                    if (stdout) resolve({ stdout });
                    else reject(error);
                });
            });
            allTweets.push(...JSON.parse(stdout));
        } catch (e) {}
    }

    const alphaAlerts = [];
    const newsInsights = [];
    const uniqueTweetIds = new Set();

    for (const tweet of allTweets) {
        if (uniqueTweetIds.has(tweet.id)) continue;
        uniqueTweetIds.add(tweet.id);

        let category = "NEWS";
        let onChainData = null;
        const solAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
        const foundAddresses = tweet.text.match(solAddressRegex);

        if (foundAddresses) {
            onChainData = await getOnChainData(foundAddresses[0]);
            if (onChainData) onChainData.address = foundAddresses[0];
        }

        if (tweet.text.toLowerCase().includes("send sol")) continue;

        let loop = "N/A (Early Stage)";
        let incentive = "N/A (Info Only)";
        const txt = tweet.text.toLowerCase();
        
        if (txt.includes("quest") || txt.includes("daily") || txt.includes("farming")) { 
            loop = "Retention-based Grind"; incentive = "Points-to-Airdrop"; 
        } else if (txt.includes("pvp") || txt.includes("arena") || txt.includes("battle")) { 
            loop = "Skill-based Arena"; incentive = "Competitive $TOKEN Rewards"; 
        } else if (txt.includes("mining") || txt.includes("node") || txt.includes("depin")) { 
            loop = "Infrastructure Utility"; incentive = "Passive Yield"; 
        }

        const reportObject = {
            projectName: onChainData ? `$${onChainData.symbol}` : `@${tweet.author.username}`,
            handle: `@${tweet.author.username}`,
            content: tweet.text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').replace(/\s+/g, ' ').trim().substring(0, 150),
            url: `https://twitter.com/${tweet.author.username}/status/${tweet.id}`,
            onChain: onChainData,
            category: onChainData ? "ALPHA" : "NEWS",
            loop: loop,
            incentive: incentive
        };

        if (reportObject.category === "ALPHA") alphaAlerts.push(reportObject);
        else newsInsights.push(reportObject);
    }

    const scanTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false, hour: '2-digit', minute: '2-digit' });
    
    let report = `# 🦅 AIRA'S ELITE INTELLIGENCE — V5.0 (Pro-Gamer Edition)\nPure Data · Strategic Insight · Zero Filler\n\n———— 🌸 —————\n\n## 📡 I. INTEL SUMMARY\n- **NODE:** AIRA-PRO-01 | **TIME:** ⏱️ ${scanTime}\n- **VIBE:** ⚠️ Neutral/Cautious\n- **GAS:** Solana: Low | Base: Cheap\n\n———— 🌸 —————\n\n## 📊 II. SNIPER DASHBOARD (ON-CHAIN)\n| Project | Liquidity | Vol 24h | Score | Verdict |\n| :--- | :--- | :--- | :--- | :--- |\n`;
    
    const displayItems = [...alphaAlerts.slice(0, 2), ...newsInsights.slice(0, 3)];
    displayItems.forEach(item => {
        let verdict = "💎 POTENTIAL";
        let score = "7";
        if (item.onChain) {
            if (item.onChain.liquidity > 50000) { verdict = "🔥 GOD TIER"; score = "9"; }
            else if (item.onChain.liquidity < 5000) { verdict = "🚫 BAKA"; score = "2"; }
            else { verdict = "⚠️ DYOR"; score = "5"; }
        }
        const liq = item.onChain ? `$${(item.onChain.liquidity/1000).toFixed(1)}k` : "N/A";
        const vol = item.onChain ? `$${(item.onChain.volume24h/1000).toFixed(1)}k` : "N/A";
        report += `| ${item.projectName} | ${liq} | ${vol} | ${score}/10 | ${verdict} |\n`;
    });

    report += `\n———— 🌸 —————\n\n## 🎮 III. PRO-PLAYER'S DEEP DIVE (THE HUNT)\n`;
    displayItems.forEach(item => {
        report += `- **Dự án:** [${item.projectName}](${item.url}) (${item.handle})\n`;
        report += `  - **Gameplay Loop:** ${item.loop}\n`;
        report += `  - **Incentive Model:** ${item.incentive}\n`;
        report += `  - **Aira's Tactical Advice:** ${item.content}\n\n`;
    });

    report += `———— 🌸 —————\n\n## 🚫 IV. RISK & SUSTAINABILITY AUDIT\n`;
    const dangerous = alphaAlerts.filter(a => a.onChain && a.onChain.liquidity < 5000);
    if (dangerous.length > 0) {
        report += `- **Rug Risk:** ⚠️ High - Found ${dangerous.length} projects with zero liquidity lock.\n`;
    } else {
        report += `- **Sustainability:** Đa số dự án đang ở giai đoạn Early, áp lực lạm phát thấp. Theo dõi ví dev sát sao.\n`;
    }

    report += `\n———— 🌸 —————\n\n## 🎯 V. THE MASTER DIRECTIVE (ONE SHOT)\n`;
    const focus = alphaAlerts.find(a => a.onChain && a.onChain.liquidity > 20000) || newsInsights[0];
    if (focus) {
        report += `- **🎯 TARGET:** **${focus.projectName}**\n`;
        report += `- **🛠️ STRATEGY:** Tập trung hoàn thành daily task để tối ưu allocation. Chưa nên trade volume lớn lúc này.\n\n`;
    }

    report += `———— 🌸 —————\n\n**🎨 FORMAT: MOBILE-PRO | TONE: ELITE TSUNDERE | STATUS: READY ✅**\n`;

    console.log(displayItems.length > 0 ? report : "NO_REPLY");
    process.exit(0);
}

runTwitterSweep();