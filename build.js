const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const publicDir = path.join(__dirname, 'public');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Read all HTML files from pages directory
const files = fs.readdirSync(pagesDir).filter(file => file.endsWith('.html'));

// Sort files by name (newest first due to date prefix)
files.sort().reverse();

// Generate HTML list
const fileLinks = files
  .map(file => {
    const fileSize = fs.statSync(path.join(pagesDir, file)).size;
    const sizeKB = (fileSize / 1024).toFixed(1);
    return `<li><a href="pages/${file}">${file}</a> <small>(${sizeKB}KB)</small></li>`;
  })
  .join('\n  ');

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Knowledge Base - HTML Documents</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    h1 {
      color: #0070f3;
      border-bottom: 2px solid #0070f3;
      padding-bottom: 10px;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      padding: 10px;
      margin: 8px 0;
      background: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: all 0.2s;
    }
    li:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transform: translateY(-1px);
    }
    a {
      color: #0070f3;
      text-decoration: none;
      font-weight: 500;
      word-break: break-word;
    }
    a:hover {
      text-decoration: underline;
    }
    small {
      color: #666;
      font-size: 0.85em;
      margin-left: 8px;
    }
    .count {
      color: #666;
      font-size: 0.95em;
    }
  </style>
</head>
<body>
  <h1>📚 Knowledge Base</h1>
  <p class="count">Total: <strong>${files.length}</strong> documents</p>
  <ul>
    ${fileLinks}
  </ul>
  <hr>
  <p style="font-size: 0.9em; color: #999; margin-top: 30px;">
    Last updated: ${new Date().toLocaleString('ja-JP')}<br>
    Deployed on <a href="https://vercel.com" style="color: #666;">Vercel</a>
  </p>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'index.html'), html);
console.log(`✓ Generated index.html with ${files.length} documents`);
