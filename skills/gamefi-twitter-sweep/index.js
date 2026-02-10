// skills/gamefi-twitter-sweep/index.js
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function runTwitterSweep() {
    console.log(`Starting Aira Alpha Sweep (V6.0 - Anti-Duplicate & Deep Sweep)...`);

    let birdAuthToken = process.env.BIRD_AUTH_TOKEN;
    let birdCt0 = process.env.BIRD_CT0;

    if (!birdAuthToken || !birdCt0) {
        return "ERROR: BIRD_AUTH_TOKEN or BIRD_CT0 environment variables are missing.";
    }

    const birdAuthFlags = `--auth-token "${birdAuthToken}" --ct0 "${birdCt0}"`;
    const today = new Date().toISOString().split('T')[0];
    const memoryPath = path.join(process.cwd(), `memory/${today}.md`);

    let allTweets = [];
    let newsArticles = [];
    let seenContent = new Set();

    // --- 1. Load History to avoid duplicates across sessions ---
    try {
        const history = await fs.readFile(memoryPath, 'utf8');
        const twitterLinks = history.match(/https:\/\/twitter\.com\/\w+\/status\/\d+/g) || [];
        twitterLinks.forEach(link => seenContent.add(lineExtractId(link)));
    } catch (e) {
        console.log("No history found for today yet.");
    }

    function lineExtractId(link) {
        return link.split('/').pop();
    }

    // --- 2. News Digging (Blogwatcher) ---
    try {
        await new Promise((resolve) => exec('blogwatcher scan', (err, stdout) => resolve(stdout)));
        const { stdout } = await new Promise((resolve) => exec('blogwatcher articles --all', (err, stdout) => resolve({ stdout })));
        if (stdout) {
            const lines = stdout.split('\n');
            let currentArticle = null;
            for (const line of lines) {
                if (line.includes('[new]')) {
                    if (currentArticle) newsArticles.push(currentArticle);
                    currentArticle = { title: line.split('[new]')[1].trim(), url: '' };
                } else if (line.includes('URL:') && currentArticle) {
                    currentArticle.url = line.split('URL:')[1].trim();
                }
                if (newsArticles.length >= 5) break;
            }
            if (currentArticle && newsArticles.length < 5) newsArticles.push(currentArticle);
        }
    } catch (e) {}

    // --- 3. On-chain Helper ---
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

    // --- 4. Deep Twitter Sweeping (Expanded Queries) ---
    const queries = [
        { name: "Global Alpha", query: `(GameFi OR Web3Gaming OR "Play to Airdrop") (airdrop OR incentivized OR "snapshot") min_faves:20 lang:en since:${today}` },
        { name: "Solana Alpha", query: `(Solana OR @Solana) (AI Agent OR @Colosseum OR "Agentic") min_faves:10 lang:en since:${today}` },
        { name: "Chain Activity", query: `(from:Ronin_Network OR from:AbstractChain OR from:MegaETH_labs OR from:Immutable OR from:RoninDaily OR from:ImmutableDaily OR from:MavisMarket OR from:CROSS_gamechain) min_faves:5 since:${today}` },
        { name: "KOL Gems", query: `(from:DuySlimeGaming OR from:Dongduru1 OR from:renzai2025 OR from:Jihoz_Axie OR from:StaniKulechov) since:${today}` }
    ];

    for (const q of queries) {
        const escapedQuery = q.query.replace(/"/g, '\\"');
        const cmd = `bird ${birdAuthFlags} search "${escapedQuery}" --json -n 30`;
        try {
            const { stdout } = await new Promise((resolve, reject) => {
                exec(cmd, { timeout: 40000 }, (error, stdout) => {
                    if (stdout) resolve({ stdout });
                    else reject(error);
                });
            });
            const batch = JSON.parse(stdout);
            allTweets.push(...batch);
        } catch (e) {}
    }

    // Add Home Timeline for variety
    try {
        const { stdout } = await new Promise((resolve) => exec(`bird ${birdAuthFlags} home --json -n 30`, (err, s) => resolve({ stdout: s })));
        allTweets.push(...JSON.parse(stdout));
    } catch (e) {}

    const alphaAlerts = [];
    const twitterNews = [];
    const uniqueTweetIds = new Set();

    for (const tweet of allTweets) {
        if (seenContent.has(tweet.id) || uniqueTweetIds.has(tweet.id)) continue;
        uniqueTweetIds.add(tweet.id);

        let onChainData = null;
        const solAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
        const foundAddresses = tweet.text.match(solAddressRegex);

        if (foundAddresses) {
            onChainData = await getOnChainData(foundAddresses[0]);
            if (onChainData) onChainData.address = foundAddresses[0];
        }

        if (tweet.text.toLowerCase().includes("send sol")) continue;

        const reportObject = {
            projectName: onChainData ? `$${onChainData.symbol}` : `@${tweet.author.username}`,
            handle: `@${tweet.author.username}`,
            content: tweet.text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').replace(/\s+/g, ' ').trim().substring(0, 200),
            url: `https://twitter.com/${tweet.author.username}/status/${tweet.id}`,
            onChain: onChainData
        };

        if (onChainData) alphaAlerts.push(reportObject);
        else twitterNews.push(reportObject);
    }

    const scanTime = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false, hour: '2-digit', minute: '2-digit' });
    
    let report = `# 🦅 AIRA'S ELITE INTELLIGENCE — V6.0 (Ultimate Precision Edition)\n\n———— 🌸 —————\n\n## 📡 I. CYBER-STATE IDENTIFICATION\n- **NODE:** AIRA-01 | **TIME:** ⏱️ ${scanTime} | **STATUS:** 🌸 Anti-Duplicate Active.\n\n———— 🌸 —————\n\n## 📊 II. MARKET HEARTBEAT\n\n**1. Deep News Summary (Macro Meta):**\n`;
    
    if (newsArticles.length > 0) {
        newsArticles.forEach(a => report += `- [${a.title}](${a.url})\n`);
    } else {
        report += `- Không có tin nóng mới.\n`;
    }

    report += `\n**2. X Pulse (Early Community Signals):**\n`;
    twitterNews.slice(0, 5).forEach(t => report += `- **${t.projectName}**: ${t.content.substring(0, 120)}... [Link](${t.url})\n`);

    report += `\n———— 🌸 —————\n\n## 🎯 III. MOONSHOT MATRIX (PROJECT SNIPE)\n`;
    const matrixItems = alphaAlerts.slice(0, 3);
    if (matrixItems.length > 0) {
        matrixItems.forEach(item => {
            report += `- **Project:** [${item.projectName}](${item.url})\n`;
            report += `  - **On-chain:** CA: ${item.onChain.address.substring(0,8)}... | Liq: $${(item.onChain.liquidity/1000).toFixed(1)}k | Vol: $${(item.onChain.volume24h/1000).toFixed(1)}k\n`;
            report += `  - **Aira's Roast:** ${item.content}\n\n`;
        });
    } else {
        report += `- Chưa phát hiện kèo On-chain mới đủ uy tín.\n`;
    }

    report += `———— 🌸 —————\n\n**Strategic Directive:** Hệ thống đã lọc trùng khớp từ bộ nhớ ngày hôm nay. Chỉ báo cáo những tin Sếp chưa đọc!\n`;

    console.log(report);
    process.exit(0);
}

runTwitterSweep();