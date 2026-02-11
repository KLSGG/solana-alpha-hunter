const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

async function sendTweet(text) {
    let credentials;
    try {
        const data = fs.readFileSync('.x_credentials.json', 'utf8');
        credentials = JSON.parse(data);
    } catch (e) {
        console.error("ERROR: Missing .x_credentials.json");
        return;
    }

    const {
        X_CONSUMER_KEY,
        X_CONSUMER_SECRET,
        X_ACCESS_TOKEN,
        X_ACCESS_TOKEN_SECRET
    } = credentials;

    if (!X_CONSUMER_KEY || !X_CONSUMER_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) {
        console.error("ERROR: Incomplete credentials in .x_credentials.json");
        return;
    }

    const method = 'POST';
    const url = 'https://api.twitter.com/2/tweets';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(32).toString('hex');

    const oauthParams = {
        oauth_consumer_key: X_CONSUMER_KEY,
        oauth_nonce: nonce,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: timestamp,
        oauth_token: X_ACCESS_TOKEN,
        oauth_version: '1.0'
    };

    const signatureBaseString = [
        method,
        encodeURIComponent(url),
        Object.keys(oauthParams)
            .sort()
            .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
            .join('&')
    ].join('&');

    const signingKey = `${encodeURIComponent(X_CONSUMER_SECRET)}&${encodeURIComponent(X_ACCESS_TOKEN_SECRET)}`;
    const signature = crypto.createHmac('sha1', signingKey)
        .update(signatureBaseString)
        .digest('base64');

    oauthParams.oauth_signature = signature;

    const authHeader = 'OAuth ' + Object.keys(oauthParams)
        .sort()
        .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
        .join(', ');

    const postData = JSON.stringify({ text });

    const options = {
        method,
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 201) {
                    console.log('✓ Tweet posted successfully!');
                    console.log(data);
                    resolve(JSON.parse(data));
                } else {
                    console.error(`ERROR: Status ${res.statusCode}`);
                    console.error(data);
                    reject(data);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`ERROR: ${e.message}`);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

const tweetText = process.argv[2] || "Aira Elite Squad is now fully operational on X! 🌸 Hunting for GameFi gems and sharing real-time intelligence. Let's go! (っò__ó)っ #Web3Gaming #AIagent #Solana #MegaETH";
sendTweet(tweetText);
