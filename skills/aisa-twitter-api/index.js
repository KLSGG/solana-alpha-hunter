const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runAisaTwitter(command, params = {}) {
    let apiKey;
    try {
        const config = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw/aisa.json'), 'utf8'));
        apiKey = config.AISA_API_KEY;
    } catch (e) {
        return "ERROR: AISA API Key not found.";
    }

    const env = { ...process.env, AISA_API_KEY: apiKey };
    const scriptPath = path.join(__dirname, 'scripts/twitter_client.py');
    
    // Construct command line arguments from params
    let args = '';
    for (const [key, value] of Object.entries(params)) {
        args += ` --${key} "${value}"`;
    }

    return new Promise((resolve) => {
        exec(`python3 ${scriptPath} ${command} ${args}`, { env }, (err, stdout, stderr) => {
            if (err) resolve(`ERROR: ${stderr || err.message}`);
            else resolve(stdout);
        });
    });
}

if (require.main === module) {
    const cmd = process.argv[2];
    const rest = process.argv.slice(3);
    // Basic mapping for CLI testing
    runAisaTwitter(cmd, {}).then(console.log);
}

module.exports = runAisaTwitter;
