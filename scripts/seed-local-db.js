#!/usr/bin/env node

// 本地 D1 数据库种子数据脚本 (JavaScript 版本)
// 从 nana.hrids.com 接口读取数据并更新到 D1 数据库

import { execSync } from 'child_process';

console.log('🌱 开始从 nana.hrids.com 接口读取数据并更新到本地数据库...\n');

// API 配置
const API_BASE_URL = 'https://nana.hrids.com';
const TAGS_ENDPOINT = '/api/v1/gallery/tags';
const PROMPTS_ENDPOINT = '/api/v1/gallery/prompts';
const PAGE_SIZE = 100; // 每页最大数量

// 从 API 获取数据的函数
async function getApiData(url) {
  try {
    console.log(`📡 正在从 API 获取数据: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ 成功获取数据');
    return data;
  } catch (error) {
    console.error(`❌ 获取 API 数据失败: ${error.message}`);
    throw error;
  }
}

// 获取标签数据
async function getTags(baseUrl, endpoint) {
  console.log('📥 获取标签数据...');
  const response = await getApiData(`${baseUrl}${endpoint}`);

  if (response.success && response.data && response.data.items) {
    console.log(`✅ 获取到 ${response.data.items.length} 个标签\n`);
    return response.data.items;
  }

  return [];
}

// 分页获取所有提示词数据
async function getAllPrompts(baseUrl, endpoint, pageSize = 30) {
  const allPrompts = [];
  let offset = 0;
  let hasMore = true;

  console.log('📥 开始分页获取提示词数据...');

  while (hasMore) {
    const url = `${baseUrl}${endpoint}?limit=${pageSize}&offset=${offset}`;
    console.log(`   偏移量 ${offset}...`);

    try {
      const response = await getApiData(url);

      if (response.success && response.data && Array.isArray(response.data)) {
        const currentPrompts = response.data;

        if (currentPrompts.length > 0) {
          allPrompts.push(...currentPrompts);
          console.log(`   ✓ 获取 ${currentPrompts.length} 个提示词 (累计: ${allPrompts.length})`);
        }

        // 判断是否还有更多数据
        if (response.pagination) {
          const { page, totalPages } = response.pagination;
          hasMore = page < totalPages;
        } else {
          hasMore = currentPrompts.length === pageSize;
        }

        offset += pageSize;

        // 添加短暂延迟避免请求过快
        await new Promise((resolve) => setTimeout(resolve, 300));
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.warn(`⚠️  获取偏移量 ${offset} 数据失败，停止分页`);
      hasMore = false;
    }
  }

  console.log(`\n✅ 共获取 ${allPrompts.length} 个提示词\n`);
  return allPrompts;
}

// 执行 SQL 命令的函数
function executeD1SQL(sql) {
  try {
    // 转义引号
    const escapedSQL = sql.replace(/"/g, '\\"');
    const command = `npx wrangler d1 execute prompt-gallery-db --local --command="${escapedSQL}"`;

    execSync(command, { stdio: 'ignore' });
  } catch (error) {
    console.error(`❌ 执行 SQL 失败: ${sql}`);
    console.error(`错误信息: ${error.message}`);
  }
}

// 转义 SQL 字符串的函数
function escapeSqlString(text) {
  if (!text) {
    return '';
  }
  return text.replace(/'/g, "''");
}

// 主函数
async function main() {
  try {
    // 获取标签数据
    const tags = await getTags(API_BASE_URL, TAGS_ENDPOINT);

    // 获取提示词数据
    const prompts = await getAllPrompts(API_BASE_URL, PROMPTS_ENDPOINT, PAGE_SIZE);

    // 检查数据是否为空
    if (tags.length === 0 && prompts.length === 0) {
      console.warn('⚠️  未获取到任何数据，退出脚本');
      process.exit(1);
    }

    console.log('📊 获取到的数据统计:');
    console.log(`   - 标签: ${tags.length} 个`);
    console.log(`   - 提示词: ${prompts.length} 个\n`);

    // 插入标签数据
    if (tags.length > 0) {
      console.log('📝 插入标签数据...');

      for (const tag of tags) {
        const tagName = escapeSqlString(tag.name);
        const tagColor = tag.color || '#999999';
        const sql = `INSERT OR IGNORE INTO tags (name, color) VALUES ('${tagName}', '${tagColor}')`;
        executeD1SQL(sql);
      }

      console.log(`✅ 成功插入 ${tags.length} 个标签\n`);
    }

    // 插入提示词分类数据（从提示词中提取）
    const uniqueClasses = new Map();
    for (const prompt of prompts) {
      if (prompt.prompt_class) {
        uniqueClasses.set(prompt.prompt_class.id, prompt.prompt_class);
      }
    }

    if (uniqueClasses.size > 0) {
      console.log('📝 插入提示词分类数据...');

      for (const promptClass of uniqueClasses.values()) {
        const className = escapeSqlString(promptClass.name);
        const classDesc = escapeSqlString(promptClass.description || '');
        const sql = `INSERT OR IGNORE INTO prompt_classes (id, name, description) VALUES (${promptClass.id}, '${className}', '${classDesc}')`;
        executeD1SQL(sql);
      }

      console.log(`✅ 成功插入 ${uniqueClasses.size} 个分类\n`);
    }

    // 插入提示词数据
    if (prompts.length > 0) {
      console.log('📝 插入提示词数据...');

      let insertedCount = 0;
      for (const prompt of prompts) {
        try {
          // 转义字符串
          const promptName = escapeSqlString(prompt.name || '');
          const promptDesc = escapeSqlString(prompt.description || '');
          const promptAuthor = escapeSqlString(prompt.author || '');
          const mediaType = prompt.media_type || 'image';
          const classId = prompt.prompt_class?.id || null;

          // 从 attachments 获取 URL
          const attachmentUrl = prompt.attachments?.[0]?.download_url || '';
          const thumbnailUrl = prompt.attachments?.[0]?.thumbnail_url || '';
          const escapedAttachmentUrl = escapeSqlString(attachmentUrl);
          const escapedThumbnailUrl = escapeSqlString(thumbnailUrl);

          // 插入提示词
          const sql = `INSERT INTO prompts (id, name, description, author, media_type, prompt_class_id, attachment_url, thumbnail_url) VALUES (${prompt.id}, '${promptName}', '${promptDesc}', '${promptAuthor}', '${mediaType}', ${classId}, '${escapedAttachmentUrl}', '${escapedThumbnailUrl}')`;
          executeD1SQL(sql);

          // 插入版本
          if (prompt.versions && Array.isArray(prompt.versions)) {
            for (const version of prompt.versions) {
              const versionNum = escapeSqlString(version.version || '1.0.0');
              const content = escapeSqlString(version.content || '');
              const contentzh = escapeSqlString(version.contentzh || '');
              const versionSql = `INSERT INTO prompt_versions (id, prompt_id, version, content, contentzh) VALUES (${version.id}, ${prompt.id}, '${versionNum}', '${content}', '${contentzh}')`;
              executeD1SQL(versionSql);
            }
          }

          // 插入标签关联
          if (prompt.tags && Array.isArray(prompt.tags)) {
            for (const tag of prompt.tags) {
              const tagSql = `INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (${prompt.id}, ${tag.id})`;
              executeD1SQL(tagSql);
            }
          }

          insertedCount++;

          // 每10个提示词显示一次进度
          if (insertedCount % 10 === 0) {
            console.log(`   已处理 ${insertedCount}/${prompts.length} 个提示词...`);
          }
        } catch (error) {
          console.warn(`⚠️  插入提示词失败: ${prompt.name} - ${error.message}`);
        }
      }

      console.log(`✅ 成功插入 ${insertedCount} 个提示词及其版本和标签\n`);
    }

    console.log('🎉 数据更新完成！\n');
    console.log('📊 最终数据统计:');
    console.log(`   - 标签: ${tags.length} 个`);
    console.log(`   - 分类: ${uniqueClasses.size} 个`);
    console.log(`   - 提示词: ${prompts.length} 个`);

    console.log('\n💡 提示: 使用以下命令启动本地开发服务器:');
    console.log('   npm run dev');
  } catch (error) {
    console.error('❌ 脚本执行失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();
