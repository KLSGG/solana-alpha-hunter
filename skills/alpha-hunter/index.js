// alpha-hunter/index.js
const { exec } = require('child_process');

async function runAlphaHunter(collectionSymbol, thresholdPct) {
    console.log(`Searching for alpha on collection: ${collectionSymbol} with threshold: ${thresholdPct}%`);

    const magicEdenApiUrlStats = `https://api-mainnet.magiceden.dev/v2/collections/${collectionSymbol}/stats`;
    const magicEdenApiUrlListings = `https://api-mainnet.magiceden.dev/v2/collections/${collectionSymbol}/listings?offset=0&limit=100`; // Get up to 100 listings

    let statsData, listingsData;

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

    if (!statsData || statsData.listedCount === 0 || !listingsData || listingsData.length === 0) {
        return `Collection ${collectionSymbol} has no active listings or data available.`;
    }

    const floorPriceLamports = statsData.floorPrice;
    const floorPriceSOL = floorPriceLamports / 1_000_000_000; // Convert lamports to SOL

    // Calculate average price of listed NFTs (excluding floor itself for a fairer average if many at floor)
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

    let status = "NORMAL";
    let confidence = "LOW";
    let message = "Currently within normal market fluctuations.";

    const priceDiff = ((averageListedPriceSOL - floorPriceSOL) / averageListedPriceSOL) * 100;

    if (priceDiff >= thresholdPct) {
        status = "UNDERVALUED";
        confidence = "MEDIUM"; // Can be HIGH if we add more checks
        message = `Floor price is ${priceDiff.toFixed(2)}% below the average listed price. Potential buying opportunity!`;
    } else if (priceDiff <= -thresholdPct) {
        status = "OVERVALUED";
        confidence = "LOW";
        message = `Floor price is ${Math.abs(priceDiff).toFixed(2)}% above the average listed price. Caution advised.`;
    }

    const report = `
🔥 **PROJECT:** ${collectionSymbol} - [NFT Alpha Alert]
🎯 **COLLECTION:** [${collectionSymbol}](https://magiceden.io/marketplace/${collectionSymbol})
💡 **MARKET ANALYSIS:**
-   **Status:** ${status}
-   **Floor Price:** ${floorPriceSOL.toFixed(2)} SOL
-   **Average Listed Price:** ${averageListedPriceSOL.toFixed(2)} SOL
-   **Price Difference:** ${priceDiff.toFixed(2)}%
-   **Listed Count:** ${statsData.listedCount}
-   **Total Volume:** ${statsData.volumeAll ? (statsData.volumeAll / 1_000_000_000).toFixed(2) + ' SOL' : 'N/A'}
-   **Confidence:** ${confidence}
-   **Message:** ${message}
`;
    return report;
}

// OpenClaw skill execution entry point
(async () => {
    const collectionSymbol = process.env.collectionSymbol;
    const thresholdPct = parseFloat(process.env.thresholdPct || "5");

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