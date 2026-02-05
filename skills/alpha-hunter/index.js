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

    // --- Fetch Twitter Sentiment ---
    try {
        const twitterResponse = await new Promise((resolve, reject) => {
            exec(`bird search "${twitterSearchQuery}" --json --auth-token "${process.env.BIRD_AUTH_TOKEN}" --ct0 "${process.env.BIRD_CT0}" -n 10`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Bird search exec error: ${error}`);
                    // Don't reject for bird errors, just log and continue without sentiment
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
        status = "UNDERVALUED";
        message = `Floor price is ${currentVsHistoricalDiff.toFixed(2)}% below its historical average. Potential buying opportunity!`;
        confidence = "MEDIUM";
    } else if (currentVsHistoricalDiff <= -thresholdPct) {
        status = "OVERVALUED";
        message = `Floor price is ${Math.abs(currentVsHistoricalDiff).toFixed(2)}% above its historical average. Caution advised.`;
        confidence = "MEDIUM";
    } else {
        // If not significantly different from historical, compare against current listed average
        const currentVsListedDiff = ((averageListedPriceSOL - floorPriceSOL) / averageListedPriceSOL) * 100;
        if (currentVsListedDiff >= thresholdPct) {
            status = "UNDERVALUED (vs. Listed)";
            message = `Floor price is ${currentVsListedDiff.toFixed(2)}% below the average listed price.`;
            confidence = "LOW";
        } else if (currentVsListedDiff <= -thresholdPct) {
            status = "OVERVALUED (vs. Listed)";
            message = `Floor price is ${Math.abs(currentVsListedDiff).toFixed(2)}% above the average listed price.`;
            confidence = "LOW";
        }
    }


    // --- Sentiment Analysis (Simple Keyword Match) ---
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
            confidence = confidence === "CRITICAL" ? "LOW" : "MEDIUM"; // If critical from price, sentiment can slightly mitigate
            message += ` Mildly positive sentiment on Twitter.`;
        } else if (netSentiment < -0.5) { // Strongly negative
            confidence = "CRITICAL";
            message += ` CRITICAL negative sentiment on Twitter (${(netSentiment * 100).toFixed(0)}% net negative).`;
        } else if (netSentiment < -0.2) { // Mildly negative
            confidence = confidence === "HIGH" ? "MEDIUM" : "LOW"; // If high from price, sentiment can slightly degrade
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

    // Setup BIRD_AUTH_TOKEN and BIRD_CT0 as environment variables for bird CLI to work
    // These should be passed to the agent's environment or read from a config file.
    // For local testing, ensure these are set in the environment before running.

    if (!collectionSymbol) {
        console.error("Error: collectionSymbol parameter is required.");
        process.exit(1);
    }

    if (!process.env.BIRD_AUTH_TOKEN || !process.env.BIRD_CT0) {
        // console.error("Error: BIRD_AUTH_TOKEN and BIRD_CT0 environment variables are required for Twitter sentiment analysis.");
        // console.error("Skipping Twitter sentiment analysis. Please set them in your environment or skill call.");
        // We can choose to exit here or just continue without sentiment. For hackathon, continue.
        // For cron, it's better to fail if sentiment is critical. For direct call, continue.
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