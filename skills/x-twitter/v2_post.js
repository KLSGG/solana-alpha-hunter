const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

function encode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

async function sendTweet(text) {
    let creds;
    try {
        creds = JSON.parse(fs.readFileSync('.x_credentials.json', 'utf8'));
    } catch (e) {
        console.error("ERROR: Failed to read .x_credentials.json");
        return;
    }
    
    const ck = creds.X_CONSUMER_KEY;
    const cs = creds.X_CONSUMER_SECRET;
    const tk = creds.X_ACCESS_TOKEN;
    const ts = creds.X_ACCESS_TOKEN_SECRET;

    if (!ck || !cs || !tk || !ts) {
        console.error("ERROR: Missing one or more OAuth 1.0a keys in .x_credentials.json");
        return;
    }

    const method = 'POST';
    const url = 'https://api.twitter.com/2/tweets';
    
    const oauth_params = {
        oauth_consumer_key: ck,
        oauth_nonce: crypto.randomBytes(32).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: tk,
        oauth_version: '1.0'
    };

    const parameterString = Object.keys(oauth_params).sort().map(k => {
        return encode(k) + '=' + encode(oauth_params[k]);
    }).join('&');

    const signatureBaseString = method + '&' + encode(url) + '&' + encode(parameterString);
    const signingKey = encode(cs) + '&' + encode(ts);
    const signature = crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');

    oauth_params.oauth_signature = signature;

    const authHeader = 'OAuth ' + Object.keys(oauth_params).sort().map(k => {
        return encode(k) + '="' + encode(oauth_params[k]) + '"';
    }).join(', ');

    const data = JSON.stringify({ text });

    const options = {
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
        }
    };

    const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log("Status: " + res.statusCode);
            console.log("Body: " + body);
        });
    });

    req.on('error', e => console.error(e));
    req.write(data);
    req.end();
}

sendTweet(process.argv[2] || "Aira Elite Squad is exploring the new X API v2 logic! 🚀 #Web3 #AIagent");
