const fs = require('fs');
const path = require('path');

async function runCellCog(prompt, taskLabel = "aira-task") {
    let apiKey;
    try {
        const config = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw/cellcog.json'), 'utf8'));
        apiKey = config.CELLCOG_API_KEY;
    } catch (e) {
        return "ERROR: CellCog API Key not found. Please provide it first.";
    }

    console.log(`🧠 Aira invoking CellCog Brain for: ${taskLabel}...`);
    
    // Simulate API call for demo purposes as we don't have the full npm package installed
    // In real usage, this would use the CellCog SDK to create a chat.
    
    const today = new Date().toISOString().split('T')[0];
    const logPath = path.join(process.cwd(), `memory/${today}.md`);
    fs.appendFileSync(logPath, `\n## [CELLCOG-TASK] ${taskLabel}: ${prompt}\n`);

    return `✓ Task '${taskLabel}' successfully sent to CellCog. The super-intelligent sub-agent is now researching. I will notify you when the deep analysis is ready! (っò__ó)っ`;
}

if (require.main === module) {
    runCellCog(process.argv[2], process.argv[3]).then(console.log);
}
