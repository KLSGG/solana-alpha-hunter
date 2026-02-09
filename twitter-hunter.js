const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  // 1. Connect to existing Chrome (or launch new one with User Data)
  console.log('🚀 Launching Chrome to hunt for Alpha...');
  
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome', // Path to Chrome we installed
    headless: false, // Show UI so Boss can see!
    userDataDir: '/home/aira/.config/google-chrome', // Use Boss's profile (cookies)
    defaultViewport: null,
    timeout: 120000, // Increase launch timeout to 120s
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars', 
      '--disable-gpu', // FIX: Disable GPU acceleration on VPS
      '--disable-dev-shm-usage', // FIX: Avoid memory issues
      '--disable-extensions', // FIX: Disable extensions to speed up launch
      '--display=:1' // Show on VNC display
    ]
  });

  const page = await browser.newPage();
  
  // 2. Go to Twitter Home
  console.log('🌍 Navigating to X.com...');
  await page.goto('https://x.com/home', { waitUntil: 'networkidle2', timeout: 60000 });

  // 3. Scroll to load tweets
  console.log('📜 Scrolling feed...');
  for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await new Promise(r => setTimeout(r, 2000)); // Wait for tweets to load
  }

  // 4. Extract Tweets
  console.log('👀 Extracting data...');
  const tweets = await page.evaluate(() => {
      const articles = document.querySelectorAll('article');
      const results = [];
      
      articles.forEach(article => {
          try {
              const textElement = article.querySelector('[data-testid="tweetText"]');
              const text = textElement ? textElement.innerText : '';
              
              const userElement = article.querySelector('[data-testid="User-Name"]');
              const username = userElement ? userElement.innerText.split('\n')[1] : 'Unknown'; // Get @handle
              
              const timeElement = article.querySelector('time');
              const time = timeElement ? timeElement.getAttribute('datetime') : '';
              
              // Basic filtering inside browser context
              if (text && text.length > 20) {
                 results.push({ username, text, time });
              }
          } catch (e) {}
      });
      return results;
  });

  console.log(`✅ Found ${tweets.length} tweets!`);
  
  // 5. Save/Process
  fs.writeFileSync('twitter_feed.json', JSON.stringify(tweets, null, 2));

  // Keep browser open for a bit so Boss can see
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();

  // Print summary to console for OpenClaw to pick up
  console.log('--- SUMMARY ---');
  tweets.forEach((t, i) => {
      console.log(`[${i+1}] ${t.username}: ${t.text.substring(0, 50)}...`);
  });

})();