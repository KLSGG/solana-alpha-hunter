// skills/gamefi-twitter-sweep/index.js
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function runUltimateSweep() {
    console.log(`Starting Aira Ultimate Depth Sweep...`);

    const birdAuthToken = process.env.BIRD_AUTH_TOKEN;
    const birdCt0 = process.env.BIRD_CT0;
    const today = new Date().toISOString().split('T')[0];
    const memoryPath = path.join(process.cwd(), `memory/${today}.md`);

    if (!birdAuthToken || !birdCt0) {
        return "ERROR: Twitter credentials missing.";
    }

    const birdAuthFlags = `--auth-token "${birdAuthToken}" --ct0 "${birdCt0}"`;
    let seenContent = new Set();

    // 1. Load Today's History for Strict Deduplication
    try {
        const history = await fs.readFile(memoryPath, 'utf8');
        const twitterLinks = history.match(/https:\/\/twitter\.com\/\w+\/status\/\d+/g) || [];
        twitterLinks.forEach(link => seenContent.add(link.split('/').pop()));
    } catch (e) {}

    // 2. Fetch Blogwatcher RSS News
    let rssNews = [];
    try {
        await new Promise(r => exec('blogwatcher scan', r));
        const { stdout } = await new Promise(r => exec('blogwatcher articles --all', (err, s) => r({stdout: s})));
        if (stdout) {
            const lines = stdout.split('\n');
            let current = null;
            for (const line of lines) {
                if (line.includes('[new]')) {
                    if (current) rssNews.push(current);
                    current = { title: line.split('[new]')[1].trim(), url: '' };
                } else if (line.includes('URL:') && current) {
                    current.url = line.split('URL:')[1].trim();
                }
                if (rssNews.length >= 10) break;
            }
            if (current && rssNews.length < 10) rssNews.push(current);
        }
    } catch (e) {}

    // 3. Deep Twitter Scouting (Expanding Queries for 10-20 hits)
    const queries = [
        { name: "Ronin", query: `(Ronin OR @Ronin_Network OR @Jihoz_Axie) min_faves:20 since:${today}` },
        { name: "Immutable", query: `(Immutable OR @Immutable OR @ImmutableDaily) min_faves:20 since:${today}` },
        { name: "CROSS", query: `(CROSS OR @CROSS_gamechain) min_faves:10 since:${today}` },
        { name: "Solana", query: `(Solana OR @Solana) (AI Agent OR Gaming) min_faves:30 since:${today}` },
        { name: "General GameFi", query: `(GameFi OR Web3Gaming OR "Play to Airdrop") min_faves:50 lang:en since:${today}` }
    ];

    let allTweets = [];
    for (const q of queries) {
        const cmd = `bird ${birdAuthFlags} search "${q.query.replace(/"/g, '\\"')}" --json -n 40`;
        try {
            const { stdout } = await new Promise((resolve) => {
                exec(cmd, { timeout: 60000 }, (err, s) => resolve({stdout: s}));
            });
            if (stdout) allTweets.push(...JSON.parse(stdout));
        } catch (e) {}
    }

    // 4. Process & Score
    const finalNews = [];
    const uniqueIds = new Set();

    for (const tweet of allTweets) {
        if (seenContent.has(tweet.id) || uniqueIds.has(tweet.id)) continue;
        uniqueIds.add(tweet.id);

        finalNews.push({
            type: 'X',
            author: `@${tweet.author.username}`,
            content: tweet.text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').replace(/\s+/g, ' ').trim(),
            url: `https://twitter.com/${tweet.author.username}/status/${tweet.id}`,
            faves: tweet.likeCount || 0
        });
    }

    // Sort by engagement
    finalNews.sort((a, b) => b.faves - a.faves);

    // 5. Generate Clean Report
    const dateStr = new Date().toLocaleDateString('vi-VN');
    let report = `# 🦅 Aira Elite Intelligence Briefing - ${dateStr}\n\n`;
    
    report += `## 📰 I. GLOBAL NEWS RECAP (RSS/BLOGS)\n`;
    if (rssNews.length > 0) {
        rssNews.forEach((n, i) => report += `${i+1}. [${n.title}](${n.url})\n`);
    } else {
        report += `- Không có tin vĩ mô mới.\n`;
    }

    report += `\n## 🐦 II. SOCIAL PULSE (TWITTER ALPHA)\n`;
    const topX = finalNews.slice(0, 15);
    if (topX.length > 0) {
        topX.forEach((t, i) => {
            report += `${i+1}. **${t.author}**: ${t.content.substring(0, 200)}... [Nguồn](${t.url})\n`;
        });
    } else {
        report += `- Không tìm thấy tín hiệu mới đủ chất lượng.\n`;
    }

    report += `\n## 🎯 III. MASTER DIRECTIVE\n`;
    report += `- Hệ thống đã tổng hợp ${rssNews.length + topX.length} tin tức quan trọng nhất.\n`;
    report += `- Ưu tiên theo dõi các dự án có engagement cao trên hệ MegaETH và Ronin.\n`;

    console.log(report);
    process.exit(0);
}

runUltimateSweep();
