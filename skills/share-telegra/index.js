const https = require('https');
const fs = require('fs');

async function publishToTelegraph(content, title = "Aira Alpha Report") {
    return new Promise((resolve, reject) => {
        const accountPath = '/createAccount?short_name=AiraAgent&author_name=Aira';
        https.get('https://api.telegra.ph' + accountPath, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const account = JSON.parse(data);
                if (!account.ok) return reject("Failed account");
                const accessToken = account.result.access_token;

                const processedContent = content.replace(/\\n/g, '\n').replace(/\\\$/g, '$');
                const lines = processedContent.split('\n');
                const formattedContent = [];
                let headers = [];

                const linkRegex = /\[(.*?)\]\((.*?)\)/g;
                const processLinks = (text) => {
                    const children = [];
                    let lastIndex = 0;
                    let match;
                    while ((match = linkRegex.exec(text)) !== null) {
                        if (match.index > lastIndex) children.push(text.substring(lastIndex, match.index));
                        children.push({ tag: 'a', attrs: { href: match[2] }, children: [match[1]] });
                        lastIndex = linkRegex.lastIndex;
                    }
                    if (lastIndex < text.length) children.push(text.substring(lastIndex));
                    return children.length > 0 ? children : [text];
                };

                const parseInlines = (text) => {
                    const parts = text.split(/(\*\*.*?\*\*)/);
                    return parts.flatMap(part => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return [{ tag: 'b', children: processLinks(part.slice(2, -2)) }];
                        }
                        return processLinks(part);
                    });
                };

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line === '') {
                        formattedContent.push({ tag: 'br', children: [] });
                        continue;
                    }

                    if (line.startsWith('|') && line.includes('|')) {
                        if (line.includes(':---')) continue;
                        const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
                        if (headers.length === 0) { headers = cells; continue; }
                        formattedContent.push({ tag: 'p', children: [{ tag: 'b', children: [cells[0]] }] });
                        for (let j = 1; j < cells.length; j++) {
                            const h = headers[j] || 'Detail';
                            formattedContent.push({ tag: 'p', children: [{ tag: 'i', children: [`  • ${h}: `]}, ...processLinks(cells[j])] });
                        }
                        formattedContent.push({ tag: 'br', children: [] });
                        continue;
                    }
                    if (!line.startsWith('|')) headers = [];

                    if (line.startsWith('# ')) formattedContent.push({ tag: 'h3', children: parseInlines(line.substring(2)) });
                    else if (line.startsWith('## ')) formattedContent.push({ tag: 'h4', children: parseInlines(line.substring(3)) });
                    else if (line.startsWith('### ')) formattedContent.push({ tag: 'h4', children: parseInlines(line.substring(4)) });
                    else if (line.match(/^\d+\./) || line.startsWith('- ')) {
                        formattedContent.push({ tag: 'li', children: parseInlines(line.replace(/^\d+\.\s*|-\s*/, '')) });
                    }
                    else formattedContent.push({ tag: 'p', children: parseInlines(line) });
                    
                    // Add an extra break after paragraphs for separation
                    formattedContent.push({ tag: 'br', children: [] });
                }

                const pageData = new URLSearchParams({
                    access_token: accessToken,
                    title: title,
                    author_name: "Aira Elite Agent",
                    content: JSON.stringify(formattedContent),
                    return_content: "true"
                }).toString();

                const options = { hostname: 'api.telegra.ph', path: '/createPage', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(pageData) } };
                const req = https.request(options, (res) => {
                    let rData = '';
                    res.on('data', (c) => rData += c);
                    res.on('end', () => {
                        const r = JSON.parse(rData);
                        if (r.ok) resolve(r.result.url);
                        else reject(r.error);
                    });
                });
                req.on('error', (e) => reject(e.message));
                req.write(pageData);
                req.end();
            });
        });
    });
}

if (require.main === module) {
    publishToTelegraph(process.argv[2], process.argv[3]).then(url => console.log("URL: " + url)).catch(console.error);
}
module.exports = publishToTelegraph;
