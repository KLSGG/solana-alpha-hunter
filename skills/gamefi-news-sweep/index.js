// skills/gamefi-news-sweep/index.js
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function runNewsSweep() {
    console.log(`Starting GameFi News Sweep...`);

    const rssSources = [
        { name: "CoinTelegraph", feedUrl: "https://cointelegraph.com/rss" },
        { name: "CryptoSlate GameFi", feedUrl: "https://cryptoslate.com/feed" },
        { name: "Decrypt Gaming", feedUrl: "https://decrypt.co/feed" }
    ];

    // Abandon web_fetch for PlayToEarn and Blockworks for now due to unreliability/complexity.
    // Focus solely on RSS for this iteration as requested.

    let collectedArticles = [];
    let processingErrors = [];

    // --- 1. Process RSS feeds using blogwatcher ---
    try {
        // Ensure feeds are added to blogwatcher
        for (const source of rssSources) {
            await new Promise((resolve) => {
                exec(`blogwatcher add "${source.name}" "${source.feedUrl}"`, (error, stdout, stderr) => {
                    if (error) console.warn(`[BLOGWATCHER ADD] Could not add RSS feed ${source.name}: ${error.message}. Stderr: ${stderr}`);
                    resolve();
                });
            });
        }

        const { stdout: scanStdout, stderr: scanStderr, error: scanError } = await new Promise((resolve, reject) => {
            exec(`blogwatcher scan`, { timeout: 60000 }, (error, stdout, stderr) => {
                resolve({ stdout, stderr, error });
            });
        });
        if (scanError) processingErrors.push(`[BLOGWATCHER SCAN EXEC ERROR] ${scanError.message}`);
        if (scanStderr) console.error(`[BLOGWATCHER SCAN STDERR] ${scanStderr}`);
        console.log(`[BLOGWATCHER SCAN STDOUT] ${scanStdout}`);


        const { stdout: articlesStdout, stderr: articlesStderr, error: articlesError } = await new Promise((resolve, reject) => {
            exec(`blogwatcher articles --unread`, { timeout: 30000 }, (error, stdout, stderr) => { // Plain text output
                resolve({ stdout, stderr, error });
            });
        });
        if (articlesError) processingErrors.push(`[BLOGWATCHER ARTICLES EXEC ERROR] ${articlesError.message}`);
        if (articlesStderr) console.error(`[BLOGWATCHER ARTICLES STDERR] ${articlesStderr}`);
        console.log(`[BLOGWATCHER ARTICLES STDOUT (PLAIN TEXT)] ${articlesStdout.substring(0, 500)}...`);
        
        // Parse plain text output from blogwatcher articles
        const lines = articlesStdout.split('\n');
        let currentBlogName = '';
        let newArticlesFromBlogwatcher = [];

        for (const line of lines) {
            const blogMatch = line.match(/^\s*(\w[\w\s.-]*):\s*$/); // Matches blog name like "Decrypt Gaming:"
            if (blogMatch) {
                currentBlogName = blogMatch[1].trim();
            } else {
                const articleMatch = line.match(/^\s*-\s*\[(\d+)\]\s*\[(new)\]\s*(.+)\s*URL:\s*(\S+)\s*Published:\s*(\S+)/); // Matches "[ID] [new] Title URL: URL Published: Date"
                if (articleMatch && currentBlogName) {
                    const id = articleMatch[1];
                    const status = articleMatch[2];
                    const title = articleMatch[3].trim();
                    const url = articleMatch[4].trim();
                    const published = articleMatch[5].trim();
                    newArticlesFromBlogwatcher.push({ id, status, title, url, published, source: currentBlogName });
                }
            }
        }

        if (newArticlesFromBlogwatcher.length > 0) {
            // Limit to top 10 articles for detailed processing and summarization
            const articlesToProcess = newArticlesFromBlogwatcher.slice(0, 10);
            for (const article of articlesToProcess) {
                // Fetch full article content for summarization
                try {
                    const { stdout: fetchedArticleContent } = await new Promise((resolve, reject) => {
                        exec(`openclaw web_fetch url="${article.url}" extractMode="text"`, { timeout: 90000 }, (error, stdout) => {
                            if (error) return reject(`web_fetch error for article ${article.title}: ${error.message}`);
                            resolve({ stdout });
                        });
                    });
                    const parsedContent = JSON.parse(fetchedArticleContent); // web_fetch returns JSON
                    collectedArticles.push({
                        title: article.title,
                        url: article.url,
                        source: article.source,
                        published: article.published,
                        content: parsedContent.text // Full text content of the article
                    });
                } catch (e) {
                    processingErrors.push(`- ⚠️ Could not fetch full content for [${article.title}](${article.url}): ${e.message}`);
                }
            }
            // Mark all as read to avoid duplicates next time
            exec(`blogwatcher read-all`, (error) => {
                if (error) console.error(`[BLOGWATCHER READ-ALL ERROR] ${error.message}`);
            });
        }
    } catch (e) {
        console.error(`[BLOGWATCHER CATCH ERROR] ${e.message}`);
        processingErrors.push(`- ⚠️ Error with Blogwatcher operations: ${e.message}`);
    }


    if (collectedArticles.length === 0) {
        console.log("NO_REPLY");
        process.exit(0);
    }
    
    // Return collected articles for main agent to summarize
    console.log(JSON.stringify({articles: collectedArticles, errors: processingErrors}, null, 2));
    process.exit(0);
}

// OpenClaw skill execution entry point
(async () => {
    try {
        await runNewsSweep();
    } catch (e) {
        console.error(`Skill execution failed: ${e.message}`);
        process.exit(1);
    }
})();