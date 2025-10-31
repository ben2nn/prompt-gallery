const fs = require('fs');
const path = require('path');

/**
 * Split a large SQL migration file into smaller chunks
 * to avoid SQLITE_TOOBIG errors
 */

const MIGRATION_FILE = 'migrations/005_prompt_versions.sql';
const OUTPUT_DIR = 'migrations/chunks';
const ROWS_PER_CHUNK = 50; // Adjust this based on your needs

// Read the original file
const content = fs.readFileSync(MIGRATION_FILE, 'utf-8');

// Extract the header (everything before the first VALUES)
const valuesIndex = content.indexOf('VALUES');
const header = content.substring(0, valuesIndex + 6); // Include "VALUES"

// Extract all the value rows
const valuesSection = content.substring(valuesIndex + 6);

// Split by "),\n (" to get individual rows
// We need to be careful with the last row which ends with ");"
const rows = [];
let currentRow = '';
let parenDepth = 0;
let inString = false;
let escapeNext = false;

for (let i = 0; i < valuesSection.length; i++) {
  const char = valuesSection[i];
  
  if (escapeNext) {
    currentRow += char;
    escapeNext = false;
    continue;
  }
  
  if (char === '\\') {
    escapeNext = true;
    currentRow += char;
    continue;
  }
  
  if (char === "'" && !inString) {
    inString = true;
  } else if (char === "'" && inString) {
    inString = false;
  }
  
  if (!inString) {
    if (char === '(') parenDepth++;
    if (char === ')') parenDepth--;
  }
  
  currentRow += char;
  
  // Check if we've completed a row
  if (!inString && parenDepth === 0 && currentRow.trim().endsWith(')')) {
    const nextChars = valuesSection.substring(i + 1, i + 3);
    if (nextChars === ',\n' || nextChars === ';\n' || i === valuesSection.length - 1) {
      rows.push(currentRow.trim());
      currentRow = '';
      if (nextChars === ',\n') {
        i += 2; // Skip the comma and newline
      }
    }
  }
}

console.log(`Found ${rows.length} rows to split`);

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Split into chunks
const numChunks = Math.ceil(rows.length / ROWS_PER_CHUNK);
console.log(`Creating ${numChunks} chunk files...`);

for (let i = 0; i < numChunks; i++) {
  const start = i * ROWS_PER_CHUNK;
  const end = Math.min(start + ROWS_PER_CHUNK, rows.length);
  const chunkRows = rows.slice(start, end);
  
  // Build the chunk file content
  let chunkContent = `-- ============================================\n`;
  chunkContent += `-- Chunk ${i + 1} of ${numChunks}: prompt_versions rows ${start + 1}-${end}\n`;
  chunkContent += `-- ============================================\n\n`;
  chunkContent += header + '\n';
  
  // Add rows
  chunkContent += chunkRows.map((row, idx) => {
    const isLast = idx === chunkRows.length - 1;
    // Remove trailing comma or semicolon
    let cleanRow = row.replace(/[,;]\s*$/, '');
    return ` ${cleanRow}${isLast ? ';' : ','}`;
  }).join('\n');
  
  // Write chunk file
  const chunkFile = path.join(OUTPUT_DIR, `005_prompt_versions_chunk_${String(i + 1).padStart(3, '0')}.sql`);
  fs.writeFileSync(chunkFile, chunkContent);
  console.log(`Created ${chunkFile} (${chunkRows.length} rows)`);
}

console.log('\nDone! Now you can run each chunk file separately:');
console.log(`npx wrangler d1 execute YOUR_DB_NAME --remote --file=${OUTPUT_DIR}/005_prompt_versions_chunk_001.sql`);
console.log('...');
