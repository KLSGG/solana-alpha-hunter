// alpha-hunter/index.js
const { exec } = require('child_process');
const fs = require('fs').promises; // For async file operations
const path = require('path');

async function runAlphaHunter(collectionSymbol, thresholdPct) {
    console.log(`Searching for alpha on collection: ${collectionSymbol} with threshold: ${thresholdPct}%`);

    const magicEdenApiUrlStats = `https://api-mainnet.magiceden.dev/v2/collections/${collectionSymbol}/stats`;
    const magicEdenApiUrlListings = `https://api-mainnet.magiceden.dev/v2/collections/${collectionSymbol}/listings?offset=0&limit=100`; // Get up to 100 listings
    const twitterSearchQuery = `${collectionSymbol} NFT OR #${collectionSymbol}nft OR @${collectionSymbol.replace(/_/g, '')}_io`; // Generate query

    let statsData, listingsData, twitterData;

    // Define history file path
    const historyFilePath = path.join(__dirname, 'data', 'history.json');
    let history = {};

    // --- Load History ---
    try {
        const historyContent = await fs.readFile(historyFilePath, 'utf8');
        history = JSON.parse(historyContent);
    } catch (e) {
        if (e.code === 'ENOENT') {
            console.log("History file not found, starting new history.");
        } else {
            console.error(`Failed to load history file: ${e.message}`);
        }
    }
    if (!history[collectionSymbol]) {
        history[collectionSymbol] = [];
    }


    // --- Fetch Magic Eden Stats ---
    try {
        const statsResponse = await new Promise((resolve, reject) => {
            exec(`curl -s ${magicEdenApiUrlStats}`, (error, stdout, stderr) => {
                if (error) return reject(`Failed to fetch stats: ${error.message}`);
                if (stderr) console.error(`Stats stderr: ${stderr}`);
                resolve(stdout);
            });
        });
        statsData = JSON.parse(statsResponse);
    } catch (e) {
        throw new Error(`Failed to parse stats data or fetch: ${e.message}`);
    }

    // --- Record current floor price to history ---
    const currentTime = Date.now();
    if (statsData.floorPrice) {
        history[collectionSymbol].push({
            timestamp: currentTime,
            floorPrice: statsData.floorPrice
        });
        // Keep only data for the last 24 hours (or adjust duration as needed for more history)
        const twentyFourHoursAgo = currentTime - (24 * 60 * 60 * 1000);
        history[collectionSymbol] = history[collectionSymbol].filter(entry => entry.timestamp > twentyFourHoursAgo);
    }
    // --- Save History ---
    await fs.writeFile(historyFilePath, JSON.stringify(history, null, 2), 'utf8');


    // --- Fetch Magic Eden Listings ---
    try {
        const listingsResponse = await new Promise((resolve, reject) => {
            exec(`curl -s ${magicEdenApiUrlListings}`, (error, stdout, stderr) => {
                if (error) return reject(`Failed to fetch listings: ${error.message}`);
                if (stderr) console.error(`Listings stderr: ${stderr}`);
                resolve(stdout);
            });
        });
        listingsData = JSON.parse(listingsResponse);
    } catch (e) {
        throw new Error(`Failed to parse listings data or fetch: ${e.message}`);
    }

    // --- Read Bird Cookies ---
    let birdAuthToken = '';
    let birdCt0 = '';
    const birdConfigPath = path.join(process.env.HOME, '.openclaw', 'workspace', '.birdrc.json5'); // Assuming .birdrc.json5 is in workspace

    try {
        const birdConfigContent = await fs.readFile(birdConfigPath, 'utf8');
        const birdConfig = JSON.parse(birdConfigContent);
        birdAuthToken = birdConfig['auth-token'];
        birdCt0 = birdConfig.ct0;
    } catch (e) {
        console.error(`Failed to load bird config from ${birdConfigPath}: ${e.message}`);
    }

    // --- Fetch Twitter Sentiment ---
    if (birdAuthToken && birdCt0) {
        try {
            const twitterResponse = await new Promise((resolve, reject) => {
                exec(`bird search "${twitterSearchQuery}" --json --auth-token "${birdAuthToken}" --ct0 "${birdCt0}" -n 10`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Bird search exec error: ${error}`);
                        return resolve('[]');
                    }
                    if (stderr) console.error(`Bird search stderr: ${stderr}`);
                    resolve(stdout);
                });
            });
            twitterData = JSON.parse(twitterResponse);
        } catch (e) {
            console.error(`Failed to parse Twitter data: ${e.message}`);
            twitterData = [];
        }
    } else {
        console.warn("Bird tokens not found, skipping Twitter sentiment analysis.");
        twitterData = [];
    }


    if (!statsData || statsData.listedCount === 0 || !listingsData || listingsData.length === 0) {
        return `Collection ${collectionSymbol} has no active listings or data available.`;
    }

    const floorPriceLamports = statsData.floorPrice;
    const floorPriceSOL = floorPriceLamports / 1_000_000_000; // Convert lamports to SOL

    // Calculate average price of current listed NFTs
    let totalListedPriceLamports = 0;
    let countListed = 0;
    for (const listing of listingsData) {
        if (listing.priceInfo && listing.priceInfo.solPrice && listing.priceInfo.solPrice.rawAmount) {
            totalListedPriceLamports += parseInt(listing.priceInfo.solPrice.rawAmount);
            countListed++;
        }
    }

    const averageListedPriceLamports = countListed > 0 ? totalListedPriceLamports / countListed : floorPriceLamports;
    const averageListedPriceSOL = averageListedPriceLamports / 1_000_000_000;

    // Calculate historical average floor price from history
    let historicalFloorPrices = history[collectionSymbol].map(entry => entry.floorPrice);
    if (historicalFloorPrices.length === 0) {
        historicalFloorPrices.push(floorPriceLamports); // Use current floor if no history
    }
    const historicalAverageFloorPriceLamports = historicalFloorPrices.reduce((sum, price) => sum + price, 0) / historicalFloorPrices.length;
    const historicalAverageFloorPriceSOL = historicalAverageFloorPriceLamports / 1_000_000_000;


    let status = "NORMAL";
    let confidence = "MEDIUM"; // Base confidence
    let message = "Currently within normal market fluctuations.";

    // Logic for Undervalued/Overvalued against historical average
    const currentVsHistoricalDiff = ((historicalAverageFloorPriceSOL - floorPriceSOL) / historicalAverageFloorPriceSOL) * 100;

    if (currentVsHistoricalDiff >= thresholdPct) {
        status = "UNDERVALUED (vs. Historical Avg)";
        message = `Floor price is ${currentVsHistoricalDiff.toFixed(2)}% below its historical average. Potential buying opportunity!`;
        confidence = "MEDIUM";
    } else if (currentVsHistoricalDiff <= -thresholdPct) {
        status = "OVERVALUED (vs. Historical Avg)";
        message = `Floor price is ${Math.abs(currentVsHistoricalDiff).toFixed(2)}% above its historical average. Caution advised.`;
        confidence = "MEDIUM";
    } else {
        // If not significantly different from historical, compare against current listed average
        const currentVsListedDiff = ((averageListedPriceSOL - floorPriceSOL) / averageListedPriceSOL) * 100;
        if (currentVsListedDiff >= thresholdPct) {
            status = "UNDERVALUED (vs. Listed Avg)";
            message = `Floor price is ${currentVsListedDiff.toFixed(2)}% below the average listed price.`;
            confidence = "LOW";
        } else if (currentVsListedDiff <= -thresholdPct) {
            status = "OVERVALUED (vs. Listed Avg)";
            message = `Floor price is ${Math.abs(currentVsListedDiff).toFixed(2)}% above the average listed price.`;
            confidence = "LOW";
        }
    }


    // --- Sentiment Analysis ---
    let positiveTweets = 0;
    let negativeTweets = 0;
    const totalTweets = twitterData.length;

    const positiveKeywords = ["legendary", "sickk", "well made", "potential", "good", "great", "love", "excited", "awesome", "bullish", "strong", "gem", "alpha", "pump"];
    const negativeKeywords = ["scam", "rug", "bad", "problem", "bug", "issue", "dead", "dump", "bearish", "fud"];

    if (totalTweets > 0) {
        for (const tweet of twitterData) {
            const lowerCaseText = tweet.text.toLowerCase();
            let isPositive = false;
            let isNegative = false;

            for (const keyword of positiveKeywords) {
                if (lowerCaseText.includes(keyword)) {
                    isPositive = true;
                    break;
                }
            }
            for (const keyword of negativeKeywords) {
                if (lowerCaseText.includes(keyword)) {
                    isNegative = true;
                    break;
                }
            }

            if (isPositive && !isNegative) {
                positiveTweets++;
            } else if (isNegative && !isPositive) {
                negativeTweets++;
            }
        }

        const netSentiment = (positiveTweets - negativeTweets) / totalTweets;

        if (netSentiment > 0.5) { // Strongly positive
            confidence = "HIGH";
            message += ` Strong positive sentiment on Twitter (${(netSentiment * 100).toFixed(0)}% net positive).`;
        } else if (netSentiment > 0.2) { // Mildly positive
            confidence = confidence === "CRITICAL" ? "LOW" : "MEDIUM";
            message += ` Mildly positive sentiment on Twitter.`;
        } else if (netSentiment < -0.5) { // Strongly negative
            confidence = "CRITICAL";
            message += ` CRITICAL negative sentiment on Twitter (${(netSentiment * 100).toFixed(0)}% net negative).`;
        } else if (netSentiment < -0.2) { // Mildly negative
            confidence = confidence === "HIGH" ? "MEDIUM" : "LOW";
            message += ` Mildly negative sentiment on Twitter.`;
        } else { // Neutral or mixed
            message += ` Neutral or mixed sentiment on Twitter.`;
        }
    } else {
        message += ` No recent Twitter activity found for sentiment analysis.`;
    }

    const report = `
🔥 **PROJECT:** ${collectionSymbol} - [NFT Alpha Alert]
🎯 **COLLECTION:** [${collectionSymbol}](https://magiceden.io/marketplace/${collectionSymbol})
💡 **MARKET ANALYSIS:**
-   **Status:** ${status}
-   **Floor Price:** ${floorPriceSOL.toFixed(4)} SOL
-   **Historical Average Floor:** ${historicalAverageFloorPriceSOL.toFixed(4)} SOL (${history[collectionSymbol].length} data points)
-   **Average Listed Price:** ${averageListedPriceSOL.toFixed(4)} SOL
-   **Price Diff (vs. Historical Avg):** ${currentVsHistoricalDiff.toFixed(2)}%
-   **Listed Count:** ${statsData.listedCount}
-   **Total Volume:** ${statsData.volumeAll ? (statsData.volumeAll / 1_000_000_000).toFixed(2) + ' SOL' : 'N/A'}
-   **Twitter Sentiment:** ${totalTweets > 0 ? `Positive: ${positiveTweets}, Negative: ${negativeTweets}, Total: ${totalTweets}` : 'N/A'}
-   **Confidence:** ${confidence}
-   **Message:** ${message}
`;
    return report;
}

// OpenClaw skill execution entry point
(async () => {
    // Read parameters from environment variables (OpenClaw passes skill parameters as ENV vars)
    const collectionSymbol = process.env.collectionSymbol;
    const thresholdPct = parseFloat(process.env.thresholdPct || "5"); // Default 5%

    if (!collectionSymbol) {
        console.error("Error: collectionSymbol parameter is required.");
        process.exit(1);
    }

    try {
        const result = await runAlphaHunter(collectionSymbol, thresholdPct);
        console.log(result);
        process.exit(0);
    } catch (e) {
        console.error(`Skill execution failed: ${e.message}`);
        process.exit(1);
    }
})();