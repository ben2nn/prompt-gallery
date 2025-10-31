/**
 * 从 API 获取提示词数据并生成 SQL 插入语句
 * API: https://gallery.52nn.us/api/v1/prompts
 */

const https = require('https');
const fs = require('fs');

const API_BASE = 'https://nana.hrids.com/api/v1/gallery/prompts';
const LIMIT = 100;
const OUTPUT_FILE = 'migrations/005_seed_prompts_from_api.sql';

// 转义 SQL 字符串
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// 获取数据
async function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 主函数
async function main() {
  console.log('开始获取数据...');
  
  let allPrompts = [];
  let offset = 0;
  let total = 0;
  
  // 获取所有数据（使用offset分页）
  do {
    const url = `${API_BASE}?limit=${LIMIT}&offset=${offset}`;
    console.log(`获取数据: offset=${offset}`);
    
    const response = await fetchData(url);
    const prompts = response.data || [];
    const pagination = response.pagination || {};
    
    total = pagination.total || 0;
    allPrompts = allPrompts.concat(prompts);
    
    console.log(`已获取 ${allPrompts.length}/${total} 条数据 (第 ${pagination.page}/${pagination.totalPages} 页)`);
    
    offset += LIMIT;
    
    // 避免请求过快
    if (allPrompts.length < total) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } while (allPrompts.length < total);
  
  console.log(`\n总共获取 ${allPrompts.length} 条提示词数据`);
  
  // 生成 SQL
  generateSQL(allPrompts);
}

function generateSQL(prompts) {
  console.log('\n开始生成 SQL...');
  
  let sql = `-- 从 API 导入的提示词数据
-- 来源: ${API_BASE}
-- 导入时间: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}
-- 总数: ${prompts.length}
--
-- 执行顺序说明：
-- 1. prompt_classes (提示词分类) - 无依赖
-- 2. tags (标签) - 无依赖
-- 3. prompts (提示词) - 依赖 prompt_classes
-- 4. prompt_versions (提示词版本) - 依赖 prompts
-- 5. prompt_tags (提示词标签关联) - 依赖 prompts 和 tags

`;

  // 收集所有唯一的分类和标签
  const classesMap = new Map();
  const tagsMap = new Map();
  
  prompts.forEach(prompt => {
    if (prompt.prompt_class) {
      classesMap.set(prompt.prompt_class.id, prompt.prompt_class);
    }
    if (prompt.tags && Array.isArray(prompt.tags)) {
      prompt.tags.forEach(tag => {
        tagsMap.set(tag.id, tag);
      });
    }
  });
  
  // 1. 生成分类插入语句（第一步：无依赖）
  if (classesMap.size > 0) {
    sql += `-- ============================================\n`;
    sql += `-- 步骤 1: 插入提示词分类（无依赖）\n`;
    sql += `-- ============================================\n`;
    sql += `INSERT OR IGNORE INTO prompt_classes (id, name, description, created_at, updated_at) VALUES\n`;
    
    const classValues = Array.from(classesMap.values()).map(cls => {
      return `  (${cls.id}, ${escapeSql(cls.name)}, ${escapeSql(cls.description || '')}, ${escapeSql(cls.created_at)}, ${escapeSql(cls.updated_at)})`;
    });
    
    sql += classValues.join(',\n') + ';\n\n';
  }
  
  // 2. 生成标签插入语句（第二步：无依赖）
  if (tagsMap.size > 0) {
    sql += `-- ============================================\n`;
    sql += `-- 步骤 2: 插入标签（无依赖）\n`;
    sql += `-- ============================================\n`;
    sql += `INSERT OR IGNORE INTO tags (id, name, color, created_at, updated_at) VALUES\n`;
    
    const tagValues = Array.from(tagsMap.values()).map(tag => {
      return `  (${tag.id}, ${escapeSql(tag.name)}, ${escapeSql(tag.color)}, ${escapeSql(tag.created_at)}, ${escapeSql(tag.updated_at)})`;
    });
    
    sql += tagValues.join(',\n') + ';\n\n';
  }
  
  // 3. 生成提示词插入语句（第三步：依赖 prompt_classes）
  sql += `-- ============================================\n`;
  sql += `-- 步骤 3: 插入提示词（依赖 prompt_classes）\n`;
  sql += `-- ============================================\n`;
  sql += `INSERT INTO prompts (id, name, description, author, media_type, prompt_class_id, attachment_url, thumbnail_url, created_at, updated_at) VALUES\n`;
  
  const promptValues = prompts.map(p => {
    return `  (${p.id}, ${escapeSql(p.name)}, ${escapeSql(p.description)}, ${escapeSql(p.author)}, ${escapeSql(p.media_type)}, ${p.prompt_class_id || 'NULL'}, ${escapeSql(p.attachment_url)}, ${escapeSql(p.thumbnail_url)}, ${escapeSql(p.created_at)}, ${escapeSql(p.updated_at)})`;
  });
  
  sql += promptValues.join(',\n') + ';\n\n';
  
  // 4. 生成提示词版本插入语句（第四步：依赖 prompts）
  const versions = [];
  prompts.forEach(p => {
    if (p.versions && Array.isArray(p.versions)) {
      p.versions.forEach(v => {
        versions.push({
          id: v.id,
          prompt_id: p.id,
          version: v.version,
          content: v.content,
          contentzh: v.contentzh,
          created_at: v.created_at,
          updated_at: v.updated_at
        });
      });
    }
  });
  
  if (versions.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- 步骤 4: 插入提示词版本（依赖 prompts）\n`;
    sql += `-- ============================================\n`;
    sql += `INSERT INTO prompt_versions (id, prompt_id, version, content, contentzh, created_at, updated_at) VALUES\n`;
    
    const versionValues = versions.map(v => {
      return `  (${v.id}, ${v.prompt_id}, ${escapeSql(v.version)}, ${escapeSql(v.content)}, ${escapeSql(v.contentzh)}, ${escapeSql(v.created_at)}, ${escapeSql(v.updated_at)})`;
    });
    
    sql += versionValues.join(',\n') + ';\n\n';
  }
  
  // 5. 生成提示词标签关联插入语句（第五步：依赖 prompts 和 tags）
  const promptTags = [];
  prompts.forEach(p => {
    if (p.tags && Array.isArray(p.tags)) {
      p.tags.forEach(tag => {
        promptTags.push({
          prompt_id: p.id,
          tag_id: tag.id
        });
      });
    }
  });
  
  if (promptTags.length > 0) {
    sql += `-- ============================================\n`;
    sql += `-- 步骤 5: 插入提示词标签关联（依赖 prompts 和 tags）\n`;
    sql += `-- ============================================\n`;
    sql += `INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES\n`;
    
    const tagValues = promptTags.map(pt => {
      return `  (${pt.prompt_id}, ${pt.tag_id})`;
    });
    
    sql += tagValues.join(',\n') + ';\n\n';
  }
  
  // 添加统计信息
  sql += `-- ============================================\n`;
  sql += `-- 统计信息\n`;
  sql += `-- ============================================\n`;
  sql += `-- 提示词分类: ${classesMap.size}\n`;
  sql += `-- 提示词: ${prompts.length}\n`;
  sql += `-- 提示词版本: ${versions.length}\n`;
  sql += `-- 提示词标签关联: ${promptTags.length}\n`;
  
  // 写入文件
  fs.writeFileSync(OUTPUT_FILE, sql, 'utf8');
  console.log(`\nSQL 文件已生成: ${OUTPUT_FILE}`);
  console.log(`- 提示词分类: ${classesMap.size}`);
  console.log(`- 提示词: ${prompts.length}`);
  console.log(`- 提示词版本: ${versions.length}`);
  console.log(`- 提示词标签关联: ${promptTags.length}`);
}

// 运行
main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
