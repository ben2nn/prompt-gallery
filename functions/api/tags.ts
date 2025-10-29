// 获取标签列表 API
import type { EventContext, Env } from '../env';
import { successResponse, databaseErrorResponse, internalErrorResponse } from '../utils/response';
import { logError, isD1Error } from '../utils/error';

interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  prompt_count: number;
}

/**
 * GET /api/tags
 * 获取所有标签列表，包含每个标签的提示词计数
 */
export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const { env } = context;
    
    // 查询所有标签及其提示词计数
    const query = `
      SELECT 
        t.id,
        t.name,
        t.color,
        t.created_at,
        t.updated_at,
        COUNT(pt.prompt_id) as prompt_count
      FROM tags t
      LEFT JOIN prompt_tags pt ON t.id = pt.tag_id
      GROUP BY t.id, t.name, t.color, t.created_at, t.updated_at
      ORDER BY t.name ASC
    `;
    
    const result = await env.DB.prepare(query).all<Tag>();
    
    if (!result.success) {
      logError('tags.ts', 'Database query failed');
      return databaseErrorResponse();
    }
    
    // 转换数据格式以匹配前端期望
    const tags = result.results.map((tag: Tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      count: tag.prompt_count,
      prompt_count: tag.prompt_count,
      created_at: tag.created_at,
      updated_at: tag.updated_at
    }));
    
    return successResponse(tags);
    
  } catch (error) {
    logError('tags.ts', error);
    
    if (isD1Error(error)) {
      return databaseErrorResponse();
    }
    
    return internalErrorResponse();
  }
}
