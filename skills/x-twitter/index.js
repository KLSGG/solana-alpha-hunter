const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function tweet(message) {
    let credentials;
    try {
        const data = await fs.readFile('.x_credentials.json', 'utf8');
        credentials = JSON.parse(data);
    } catch (e) {
        return "ERROR: Missing X credentials.";
    }

    return new Promise((resolve) => {
        const escapedMessage = message.replace(/"/g, '\"');
        // Final fallback: Use the specific script we just wrote
        exec(`node skills/x-twitter/x_api_v2.js "${escapedMessage}"`, (err, stdout, stderr) => {
            const today = new Date().toISOString().split('T')[0];
            const logPath = path.join(process.cwd(), `memory/${today}.md`);
            fs.appendFile(logPath, `\n## [X-POST-ATTEMPT] @AiraAgent: ${message}\nResult: ${stdout || stderr}\n`);
            resolve(stdout || stderr);
        });
    });
}

if (require.main === module) {
    tweet(process.argv[2] || "Hello X!").then(console.log);
}
