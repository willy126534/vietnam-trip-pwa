const fs = require('fs');
const https = require('https');

const WEBSITE_URL = 'https://willy126534.github.io/vietnam-trip-pwa/';
const APP_JSX_URL = 'https://willy126534.github.io/vietnam-trip-pwa/app.jsx';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GH_TOKEN = process.env.GH_TOKEN;
const REPO = 'willy126534/vietnam-trip-pwa';

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${GEMINI_API_KEY}`;
  const data = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }]
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let response = '';
      res.on('data', (chunk) => response += chunk);
      res.on('end', () => {
        const json = JSON.parse(response);
        if (json.error) reject(new Error(json.error.message));
        else resolve(json.candidates[0].content.parts[0].text);
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function pushToGithub(newContent, sha) {
  const url = `https://api.github.com/repos/${REPO}/contents/app.jsx`;
  const data = JSON.stringify({
    message: 'Self-Healing: Fixed broken app.jsx automatically',
    content: Buffer.from(newContent).toString('base64'),
    sha: sha
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Self-Healing-Bot',
        'Content-Length': data.length
      }
    }, (res) => {
      let response = '';
      res.on('data', (chunk) => response += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`GitHub push failed: ${response}`));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getFileSha() {
  const url = `https://api.github.com/repos/${REPO}/contents/app.jsx`;
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'User-Agent': 'Self-Healing-Bot'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        resolve(json.sha);
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Checking website status...');
  const appJsx = await fetchUrl(`${APP_JSX_URL}?t=${Date.now()}`);

  const isBroken = appJsx.startsWith('```jsx') || 
                   appJsx.startsWith('```javascript') || 
                   appJsx.startsWith('Here is') ||
                   appJsx.startsWith('Sure') ||
                   appJsx.length < 1000 ||
                   (appJsx.includes('```') && !appJsx.startsWith('import'));

  if (isBroken) {
    console.log('Website detected as broken! Initiating fix...');
    const prompt = `The following React code is broken (possibly contains markdown markers, conversational text, or is corrupted). Please fix it and return ONLY the raw React code. Do not include markdown markers.\n\nCODE:\n${appJsx}`;
    
    try {
      const fixedCode = await callGemini(prompt);
      
      let cleanedCode = fixedCode;
      const codeBlockRegex = /```(?:jsx|javascript)?\n?([\s\S]*?)\n?```/i;
      const match = fixedCode.match(codeBlockRegex);
      if (match && match[1]) {
        cleanedCode = match[1].trim();
      } else {
        cleanedCode = fixedCode.replace(/```jsx\n?/g, "").replace(/```javascript\n?/g, "").replace(/```\n?/g, "").trim();
      }
      
      const sha = await getFileSha();
      await pushToGithub(cleanedCode, sha);
      console.log('Fix applied and pushed to GitHub successfully!');
    } catch (err) {
      console.error('Failed to fix website:', err);
    }
  } else {
    console.log('Website is healthy.');
  }
}

run();
