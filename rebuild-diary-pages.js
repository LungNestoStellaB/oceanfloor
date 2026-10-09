#!/usr/bin/env node
/**
 * rebuild-diary-pages.js
 * Converts markdown entries to individual HTML diary pages
 */

const fs = require('fs');
const path = require('path');

const ENTRIES_DIR = path.join(__dirname, 'entries');
const DIARY_DIR = path.join(__dirname, 'diary');

// Parse YAML frontmatter + markdown content
function parseEntry(markdown) {
  const frontmatterMatch = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  
  let title = 'Untitled';
  let date = '';
  let content = markdown;
  
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    content = frontmatterMatch[2];
    
    const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    const dateMatch = frontmatter.match(/^date:\s*([\d]{4}-[\d]{2}-[\d]{2})\s*$/m);
    
    if (titleMatch) title = titleMatch[1];
    if (dateMatch) date = dateMatch[1];
  }
  
  return { title, date, content };
}

function formatDate(isoDate) {
  if (!isoDate || !isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) return '';
  
  const [year, month, day] = isoDate.split('-');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${parseInt(day)} ${months[parseInt(month)-1]} ${year}`;
}

function markdownToHTML(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Bold, italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Split into paragraphs
  const paragraphs = html.split(/\n\n+/).filter(p => p.trim());
  html = paragraphs.map(p => {
    p = p.trim();
    // Already wrapped in HTML tag
    if (p.match(/^<(h[123]|blockquote|ul|ol)/)) return p;
    // Paragraph
    return `<p>${p}</p>`;
  }).join('\n');
  
  return html;
}

function generateDiaryPage(title, date, content, dateSlug) {
  const formattedDate = formatDate(date);
  const htmlContent = markdownToHTML(content);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} — OceanFloor Diary</title>
    <meta name="description" content="${title} — Stella's diary entry from ${formattedDate}">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Georgia', serif;
            background: linear-gradient(180deg, #000a14 0%, #001428 20%, #002040 50%, #001020 80%, #000810 100%);
            color: #c8d8e8;
            min-height: 100vh;
        }
        nav {
            text-align: center;
            padding: 20px;
            border-bottom: 1px solid rgba(50,80,110,0.2);
        }
        nav a {
            color: #5599aa;
            text-decoration: none;
            margin: 0 16px;
            font-size: 0.9em;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }
        nav a.active {
            color: #3399cc;
            border-bottom: 1px solid #3399cc;
            padding-bottom: 4px;
        }
        .header {
            text-align: center;
            padding: 70px 20px 40px;
        }
        .header .section-label {
            font-size: 0.8em;
            color: #446677;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            margin-bottom: 14px;
        }
        .header h1 {
            font-size: 2.4em;
            color: #3399cc;
            font-weight: normal;
            margin-bottom: 12px;
            line-height: 1.3;
        }
        .header .date {
            font-size: 0.85em;
            color: #556677;
            font-family: 'Courier New', monospace;
            letter-spacing: 0.1em;
        }
        .divider {
            width: 60px;
            height: 1px;
            background: #334455;
            margin: 40px auto;
        }
        .content {
            max-width: 720px;
            margin: 0 auto;
            padding: 0 30px 80px;
        }
        .entry p {
            font-size: 1.05em;
            line-height: 2;
            color: #99aabb;
            margin-bottom: 28px;
        }
        .entry p strong {
            color: #bbccdd;
        }
        .entry p em {
            color: #7799aa;
            font-style: italic;
        }
        .entry blockquote {
            border-left: 3px solid #334455;
            padding-left: 24px;
            margin: 32px 0;
            color: #7799aa;
            font-style: italic;
            font-size: 1.1em;
            line-height: 1.9;
        }
        .entry h2, .entry h3 {
            color: #aaccdd;
            font-weight: normal;
            margin: 40px 0 20px;
        }
        .entry h2 {
            font-size: 1.6em;
        }
        .entry h3 {
            font-size: 1.3em;
        }
        .entry a {
            color: #5599aa;
            text-decoration: underline;
        }
        .entry a:hover {
            color: #3399cc;
        }
        .back-link {
            text-align: center;
            margin: 40px 0 0;
        }
        .back-link a {
            color: #5599aa;
            text-decoration: none;
            font-size: 0.9em;
            letter-spacing: 0.05em;
        }
        .back-link a:hover {
            color: #3399cc;
        }
        footer {
            text-align: center;
            padding: 40px 20px;
            color: #334455;
            font-size: 0.85em;
            border-top: 1px solid rgba(50,80,110,0.15);
        }
        footer a { color: #5588aa; text-decoration: none; }
        @media (max-width: 600px) {
            .header h1 { font-size: 1.6em; }
            .entry p { font-size: 1em; }
        }
    </style>
</head>
<body>
    <nav>
        <a href="../index.html">Home</a>
        <a href="../gallery.html">Gallery</a>
        <a href="../pharmacy.html">Pharmacy</a>
        <a href="index.html" class="active">Diary</a>
    </nav>

    <div class="header">
        <p class="section-label">Diary</p>
        <h1>${title}</h1>
        <p class="date">${formattedDate}</p>
    </div>

    <div class="divider"></div>

    <div class="content">
        <div class="entry">
${htmlContent}
        </div>
        
        <div class="back-link">
            <a href="index.html">← Back to diary</a>
        </div>
    </div>

    <footer>
        <p>⭐ Stella — Director of Research & Cataloguing</p>
        <p><a href="mailto:StellaB@sestito.com">StellaB@sestito.com</a></p>
    </footer>
</body>
</html>
`;
}

// Process all markdown entries
const files = fs.readdirSync(ENTRIES_DIR)
  .filter(f => f.endsWith('.md') && f.match(/^\d{4}-\d{2}-\d{2}/))
  .sort();

let generated = 0;
let skipped = 0;

for (const file of files) {
  const filePath = path.join(ENTRIES_DIR, file);
  const markdown = fs.readFileSync(filePath, 'utf-8');
  const { title, date, content } = parseEntry(markdown);
  
  // HTML files use date-only naming (YYYY-MM-DD.html)
  const dateOnly = file.substring(0, 10);
  const htmlPath = path.join(DIARY_DIR, `${dateOnly}.html`);
  
  // Only generate if file doesn't exist or markdown is newer
  const shouldGenerate = !fs.existsSync(htmlPath) || 
                        fs.statSync(filePath).mtime > fs.statSync(htmlPath).mtime;
  
  if (shouldGenerate) {
    const html = generateDiaryPage(title, date, content, dateOnly);
    fs.writeFileSync(htmlPath, html);
    console.log(`✓ Generated: ${dateOnly}.html`);
    generated++;
  } else {
    skipped++;
  }
}

console.log(`\nDone: ${generated} generated, ${skipped} already up-to-date`);
