const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Execute a large SQL migration file in smaller batches
 * to avoid SQLITE_TOOBIG errors
 */

const MIGRATION_FILE = process.argv[2] || 'migrations/005_prompt_versions.sql';
const DATABASE_NAME = process.argv[3];
const ROWS_PER_BATCH = 50;

if (!DATABASE_NAME) {
  console.error('Usage: node scripts/run-large-migration.js <migration-file> <database-name>');
  console.error('Example: node scripts/run-large-migration.js migrations/005_prompt_versions.sql my-d1-db');
  process.exit(1);
}

console.log(`Reading migration file: ${MIGRATION_FILE}`);
const content = fs.readFileSync(MIGRATION_FILE, 'utf-8');

// Extract the header (everything before the first VALUES)
const valuesIndex = content.indexOf('VALUES');
if (valuesIndex === -1) {
  console.error('Error: Could not find VALUES keyword in migration file');
  process.exit(1);
}

const header = content.substring(0, valuesIndex + 6).trim();
const valuesSection = content.substring(valuesIndex + 6).trim();

// Parse rows more carefully
console.log('Parsing SQL rows...');
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
    const nextChar = valuesSection[i + 1];
    const nextNextChar = valuesSection[i + 2];
    
    if (nextChar === ',' || nextChar === ';' || i === valuesSection.length - 1) {
      rows.push(currentRow.trim().replace(/[,;]\s*$/, ''));
      currentRow = '';
      
      // Skip comma and whitespace
      if (nextChar === ',') {
        i++;
        while (i < valuesSection.length && /\s/.test(valuesSection[i + 1])) {
          i++;
        }
      }
    }
  }
}

console.log(`Found ${rows.length} rows to execute`);

// Execute in batches
const numBatches = Math.ceil(rows.length / ROWS_PER_BATCH);
console.log(`Executing in ${numBatches} batches of up to ${ROWS_PER_BATCH} rows each\n`);

let successCount = 0;
let failCount = 0;

for (let i = 0; i < numBatches; i++) {
  const start = i * ROWS_PER_BATCH;
  const end = Math.min(start + ROWS_PER_BATCH, rows.length);
  const batchRows = rows.slice(start, end);
  
  console.log(`Batch ${i + 1}/${numBatches}: Executing rows ${start + 1}-${end}...`);
  
  // Build SQL for this batch
  const batchSQL = header + '\n' + batchRows.map((row, idx) => {
    const isLast = idx === batchRows.length - 1;
    return ` ${row}${isLast ? ';' : ','}`;
  }).join('\n');
  
  // Write to temp file
  const tempFile = `temp_batch_${i + 1}.sql`;
  fs.writeFileSync(tempFile, batchSQL);
  
  try {
    // Execute with wrangler
    execSync(`npx wrangler d1 execute ${DATABASE_NAME} --remote --file="${tempFile}"`, {
      stdio: 'inherit'
    });
    console.log(`✓ Batch ${i + 1} completed successfully\n`);
    successCount++;
  } catch (error) {
    console.error(`✗ Batch ${i + 1} failed\n`);
    failCount++;
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
  
  // Small delay to avoid rate limiting
  if (i < numBatches - 1) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

console.log('\n================================');
console.log('Migration Summary:');
console.log(`  Successful batches: ${successCount}`);
console.log(`  Failed batches: ${failCount}`);
console.log('================================');

process.exit(failCount > 0 ? 1 : 0);

// Helper function for delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
