// skills/gamefi-twitter-sweep/index.js
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function runTwitterSweep() {
    console.log(`Starting GameFi Twitter Sweep (Enhanced 2026 - On-chain Update)...`);

    // --- Read Bird Cookies from Environment Variables ---
    let birdAuthToken = process.env.BIRD_AUTH_TOKEN;
    let birdCt0 = process.env.BIRD_CT0;

    if (!birdAuthToken || !birdCt0) {
        return "ERROR: BIRD_AUTH_TOKEN or BIRD_CT0 environment variables are missing. Please provide them in the cron job message.";
    }

    const birdAuthFlags = `--auth-token "${birdAuthToken}" --ct0 "${birdCt0}"`;

    let allTweets = [];
    const tweetSources = [];

    // --- Helper: On-chain Checker (DexScreener API) ---
    async function getOnChainData(ca) {
        const cmd = `curl -s "https://api.dexscreener.com/latest/dex/tokens/${ca}"`;
        try {
            const { stdout } = await new Promise((resolve, reject) => {
                exec(cmd, { timeout: 10000 }, (error, stdout) => {
                    if (error) return reject(error);
                    resolve({ stdout });
                });
            });
            const data = JSON.parse(stdout);
            if (data.pairs && data.pairs.length > 0) {
                // Get the pair with highest liquidity (usually the main one)
                const solPairs = data.pairs.filter(p => p.chainId === 'solana');
                const bestPair = solPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || data.pairs[0];
                
                return {
                    symbol: bestPair.baseToken.symbol,
                    price: bestPair.priceUsd,
                    liquidity: bestPair.liquidity?.usd || 0,
                    volume24h: bestPair.volume?.h24 || 0,
                    url: bestPair.url
                };
            }
        } catch (e) {
            console.error(`[ON-CHAIN] Error checking CA ${ca}: ${e.message}`);
        }
        return null;
    }

    // --- 1. Sweeping Commands ---
    const queries = [
        { name: "Alpha & Airdrop", query: `(GameFi OR Web3Gaming) (airdrop OR incentivized OR "daily check-in" OR "node sale" OR faucet OR "claimable" OR "snapshot") min_faves:5 lang:en since:2026-02-05 -is:retweet` },
        { name: "Solana & AI Agent", query: `(Solana OR @Solana) (AI Agent OR "Agentic Game" OR "Autonomous Agent" OR @Colosseum) (launch OR mint OR whitepaper) min_faves:10 lang:en since:2026-02-05` },
        { name: "Ecosystem & Trending", query: `(Ronin OR Sui OR Abstract OR Monad) (GameFi OR Web3Gaming) min_faves:15 lang:en since:2026-02-05` }
    ];

    for (const q of queries) {
        const cmd = `bird search "${q.query}" --json ${birdAuthFlags} -n 20`;
        try {
            const { stdout } = await new Promise((resolve, reject) => {
                exec(cmd, { timeout: 30000 }, (error, stdout) => {
                    if (error) return reject(error);
                    resolve({ stdout });
                });
            });
            const newTweets = JSON.parse(stdout);
            allTweets.push(...newTweets);
        } catch (e) {
            console.error(`[TWITTER SWEEP] Error running bird search for "${q.name}": ${e.message}`);
        }
    }

    const homeCmd = `bird home --json ${birdAuthFlags} -n 20`;
    try {
        const { stdout } = await new Promise((resolve, reject) => {
            exec(homeCmd, { timeout: 30000 }, (error, stdout) => {
                if (error) return reject(error);
                resolve({ stdout });
            });
        });
        allTweets.push(...JSON.parse(stdout));
    } catch (e) {
        console.error(`[TWITTER SWEEP] Error running bird home: ${e.message}`);
    }

    // --- 2. Bộ Lọc & Phân Tích ---
    const alphaAlerts = [];
    const gamefiNewsInsights = [];
    const uniqueTweetIds = new Set();

    console.log(`Analyzing ${allTweets.length} tweets...`);

    for (const tweet of allTweets) {
        if (uniqueTweetIds.has(tweet.id)) continue;
        uniqueTweetIds.add(tweet.id);

        let type = "💡 NEWS";
        let category = "NEWS";
        let trustScore = 0;
        const lowerText = tweet.text.toLowerCase();
        const author = tweet.author;
        
        // 1. TRUST SCORING
        if (author.verified) trustScore += 20;
        if (author.public_metrics) {
            const followers = author.public_metrics.followers_count;
            if (followers > 50000) trustScore += 30;
            else if (followers > 5000) trustScore += 15;
        }

        // 2. ON-CHAIN SCAN (NEW FEATURE)
        const solAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
        const foundAddresses = tweet.text.match(solAddressRegex);
        let onChainData = null;

        if (foundAddresses) {
            console.log(`[ON-CHAIN] Found potential CAs in tweet: ${foundAddresses.join(', ')}`);
            // Check the first valid-looking address
            for (const addr of foundAddresses) {
                onChainData = await getOnChainData(addr);
                if (onChainData) {
                    onChainData.address = addr;
                    break; 
                }
            }
        }

        // 3. CLASSIFICATION
        const urgentAlphaKeywords = ["minting now", "limited spots", "snapshot in", "claim in", "fcfs"];
        if (lowerText.includes("send sol") || lowerText.includes("whatsapp")) {
            category = "SCAM";
        } else if (urgentAlphaKeywords.some(kw => lowerText.includes(kw)) || onChainData) {
            category = "ALPHA";
            type = onChainData ? "💎 TOKEN ALPHA" : "🔥 URGENT ALPHA";
        }

        if (category === "SCAM" || trustScore < 10) continue;

        let verdict = trustScore >= 50 ? "High Trust" : "Potential";
        const tweetLink = `https://twitter.com/${tweet.author.username}/status/${tweet.id}`;
        
        let takeaway = tweet.text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').replace(/\s+/g, ' ').trim();
        if (takeaway.length > 150) takeaway = takeaway.substring(0, 150) + '...';

        // Integrate On-Chain data into takeaway
        if (onChainData) {
            const liq = (onChainData.liquidity / 1000).toFixed(1) + "k";
            const vol = (onChainData.volume24h / 1000).toFixed(1) + "k";
            takeaway = `[${onChainData.symbol}] Price: $${onChainData.price} | Liq: $${liq} | Vol: $${vol} | CA: ${onChainData.address.substring(0,6)}... - ${takeaway}`;
            verdict = onChainData.liquidity > 50000 ? "🔥 Liquid/Safe" : "⚠️ Low Liquidity";
        }

        const reportObject = {
            headline: `${type} (@${tweet.author.username})`,
            content: takeaway,
            verdict: verdict,
            url: tweetLink
        };

        if (category === "ALPHA") alphaAlerts.push(reportObject);
        else gamefiNewsInsights.push(reportObject);
    }

    // --- 3. REPORTING ---
    const scanTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
    let finalReport = `📰 **ON-CHAIN ALPHA SCAN:** (Scan Time: ${scanTime})\n\n`;

    if (alphaAlerts.length > 0) {
        finalReport += `🔥 **GEMS & TOKEN ALPHA:**\n`;
        alphaAlerts.forEach(item => {
            finalReport += `- [${item.headline}](${item.url}) - ${item.content} (${item.verdict})\n`;
        });
        finalReport += `\n`;
    }

    if (gamefiNewsInsights.length > 0) {
        finalReport += `💡 **GAMEFI NEWS & TRENDS:**\n`;
        gamefiNewsInsights.slice(0, 5).forEach(item => {
            finalReport += `- [${item.headline}](${item.url}) - ${item.content}\n`;
        });
    }

    if (alphaAlerts.length === 0 && gamefiNewsInsights.length === 0) {
        console.log("NO_REPLY");
    } else {
        console.log(finalReport);
    }
    process.exit(0);
}

(async () => {
    try {
        await runTwitterSweep();
    } catch (e) {
        console.error(`Skill execution failed: ${e.message}`);
        process.exit(1);
    }
})();