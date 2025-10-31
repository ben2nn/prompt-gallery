// 将大的 migration 文件拆分成多个小文件
const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || 'migrations/007_prompt_attachments.sql';
const batchSize = parseInt(process.argv[3]) || 50; // 每个文件包含的记录数

console.log(`读取文件: ${inputFile}`);
console.log(`每批记录数: ${batchSize}`);

// 读取文件内容
const content = fs.readFileSync(inputFile, 'utf-8');

// 提取 INSERT 语句的头部和数据行
const lines = content.trim().split('\n');

// 查找 INSERT 语句的头部（可能不在第一行）
let headerMatch = null;
let insertLineIndex = -1;
for (let i = 0; i < lines.length; i++) {
    headerMatch = lines[i].match(/INSERT OR IGNORE INTO (\w+) \((.*?)\) VALUES/);
    if (headerMatch) {
        insertLineIndex = i;
        break;
    }
}

if (!headerMatch) {
    console.error('无法解析 INSERT 语句头部');
    process.exit(1);
}

const tableName = headerMatch[1];
const columns = headerMatch[2];

console.log(`表名: ${tableName}`);
console.log(`列: ${columns}`);

// 提取所有数据行（从 INSERT 语句之后开始）
const dataLines = [];
let currentLine = '';

for (let i = insertLineIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过空行
    if (!line) {
        continue;
    }
    
    currentLine += line;
    
    // 如果行以 '), 或 '); 结尾，说明是一条完整的记录
    if (line.endsWith('),') || line.endsWith(');')) {
        dataLines.push(currentLine);
        currentLine = '';
    }
}

console.log(`总记录数: ${dataLines.length}`);

// 计算需要拆分成多少个文件
const totalBatches = Math.ceil(dataLines.length / batchSize);
console.log(`将拆分成 ${totalBatches} 个文件`);

// 获取输入文件的基本信息
const inputDir = path.dirname(inputFile);
const inputBasename = path.basename(inputFile, '.sql');

// 拆分并写入文件
for (let batch = 0; batch < totalBatches; batch++) {
    const start = batch * batchSize;
    const end = Math.min(start + batchSize, dataLines.length);
    const batchLines = dataLines.slice(start, end);
    
    // 构建 SQL 语句
    let sql = `INSERT OR IGNORE INTO ${tableName} (${columns}) VALUES\n`;
    
    // 添加数据行
    for (let i = 0; i < batchLines.length; i++) {
        let line = batchLines[i];
        
        // 如果是最后一行，确保以分号结尾
        if (i === batchLines.length - 1) {
            line = line.replace(/,\s*$/, ';');
        } else {
            // 确保不是最后一行时以逗号结尾
            if (!line.endsWith(',')) {
                line += ',';
            }
        }
        
        sql += line + '\n';
    }
    
    // 写入文件
    const outputFile = path.join(inputDir, `${inputBasename}_part${batch + 1}.sql`);
    fs.writeFileSync(outputFile, sql, 'utf-8');
    
    console.log(`✓ 创建文件: ${outputFile} (${end - start} 条记录)`);
}

console.log('\n拆分完成！');
console.log('\n执行迁移命令:');
for (let batch = 0; batch < totalBatches; batch++) {
    const outputFile = `${inputBasename}_part${batch + 1}.sql`;
    console.log(`wrangler d1 execute prompt-gallery-db --remote --file=./migrations/${outputFile}`);
}
