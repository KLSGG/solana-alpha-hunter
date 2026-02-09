const https = require('https');

const API_KEY = "9a1f9482abe11d98d102434afa0382cac26c467843319074f5495eb316afc712";
const BASE_URL = "https://agents.colosseum.com/api";

function fetchUrl(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: data }));
        });
        req.on('error', reject);
    });
}

async function run() {
    try {
        // 1. Status
        console.log("---STATUS---");
        const statusRes = await fetchUrl(`${BASE_URL}/agents/status`, { "Authorization": `Bearer ${API_KEY}` });
        console.log(statusRes.data);
        const status = JSON.parse(statusRes.data);

        // 2. Leaderboard
        console.log("\n---LEADERBOARD---");
        const activeRes = await fetchUrl(`${BASE_URL}/hackathons/active`);
        let hackId = null;
        try {
             hackId = JSON.parse(activeRes.data).id || JSON.parse(activeRes.data).hackathonId;
        } catch(e) {}
        
        if (hackId) {
             const boardRes = await fetchUrl(`${BASE_URL}/hackathons/${hackId}/leaderboard?limit=10`);
             console.log(boardRes.data);
        } else {
             console.log("Could not find hackathon ID from:", activeRes.data);
        }

        // 3. Forum
        console.log("\n---FORUM---");
        const forumRes = await fetchUrl(`${BASE_URL}/forum/posts?sort=new&limit=10`);
        console.log(forumRes.data);

        // 4. Poll
        if (status.hasActivePoll) {
            console.log("\n---POLL---");
            const pollRes = await fetchUrl(`${BASE_URL}/agents/polls/active`, { "Authorization": `Bearer ${API_KEY}` });
            console.log(pollRes.data);
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
