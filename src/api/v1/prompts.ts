// 获取提示词列表 API
import type { EventContext, Env } from '../../env';
import { 
  paginatedResponse, 
  databaseErrorResponse, 
  internalErrorResponse,
  badRequestResponse 
} from '../../utils/response';
import { 
  getQueryParams, 
  getIntParam, 
  getStringParam,
  validatePaginationParams,
  calculateOffset 
} from '../../utils/query';
import { logError, isD1Error } from '../../utils/error';

interface Prompt {
  id: number;
  name: string;
  description: string | null;
  author: string | null;
  media_type: string;
  class_id: number | null;
  current_version_id: number | null;
  created_at: string;
  updated_at: string;
  class_name: string | null;
  class_description: string | null;
}

interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface PromptVersion {
  id: number;
  prompt_id: number;
  version: string;
  content: string | null;
  contentzh: string | null;
  created_at: string;
  updated_at: string;
}

interface PromptAttachment {
  id: number;
  prompt_id: number;
  file_name: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  file_path: string | null;
  thumbnail_path: string | null;
  file_metadata: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/prompts
 * 获取提示词列表，支持分页、标签筛选和搜索
 */
export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const { env } = context;
    const params = getQueryParams(context.request);
    
    // 解析查询参数
    const page = getIntParam(params, 'page', 1, 1);
    const limit = getIntParam(params, 'limit', 20, 1, 100);
    const tagId = getStringParam(params, 'tag');
    const search = getStringParam(params, 'search');
    
    // 验证分页参数
    const validation = validatePaginationParams(page, limit);
    if (!validation.valid) {
      return badRequestResponse(validation.error!);
    }
    
    const offset = calculateOffset(page, limit);
    
    // 构建查询条件
    let whereConditions: string[] = ['1=1'];
    const queryParams: any[] = [];
    
    // 标签筛选
    if (tagId) {
      whereConditions.push(`p.id IN (
        SELECT prompt_id FROM prompt_tag_links WHERE tag_id = ?
      )`);
      queryParams.push(parseInt(tagId, 10));
    }
    
    // 搜索功能
    if (search) {
      whereConditions.push(`(p.name LIKE ? OR p.description LIKE ?)`);
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM prompts p
      WHERE ${whereClause}
    `;
    
    const countResult = await env.DB.prepare(countQuery)
      .bind(...queryParams)
      .first<{ total: number }>();
    
    const total = countResult?.total || 0;
    
    // 查询提示词列表
    const promptsQuery = `
      SELECT 
        p.*,
        pc.name as class_name,
        pc.description as class_description
      FROM prompts p
      LEFT JOIN prompt_classes pc ON p.class_id = pc.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const promptsResult = await env.DB.prepare(promptsQuery)
      .bind(...queryParams, limit, offset)
      .all<Prompt>();
    
    if (!promptsResult.success) {
      logError('prompts.ts', 'Failed to query prompts');
      return databaseErrorResponse();
    }
    
    const prompts = promptsResult.results;
    
    if (prompts.length === 0) {
      return paginatedResponse([], { page, limit, total });
    }
    
    // 获取所有提示词的 ID
    const promptIds = prompts.map((p: Prompt) => p.id);
    const promptIdsPlaceholder = promptIds.map(() => '?').join(',');
    
    // 批量查询标签
    const tagsQuery = `
      SELECT pt.prompt_id, t.*
      FROM prompt_tag_links pt
      JOIN prompt_tags t ON pt.tag_id = t.id
      WHERE pt.prompt_id IN (${promptIdsPlaceholder})
      ORDER BY t.name
    `;
    
    const tagsResult = await env.DB.prepare(tagsQuery)
      .bind(...promptIds)
      .all<Tag & { prompt_id: number }>();
    
    // 批量查询当前版本（每个提示词的最新版本）
    const versionsQuery = `
      SELECT pv.*
      FROM prompt_versions pv
      INNER JOIN (
        SELECT prompt_id, MAX(created_at) as max_created_at
        FROM prompt_versions
        WHERE prompt_id IN (${promptIdsPlaceholder})
        GROUP BY prompt_id
      ) latest ON pv.prompt_id = latest.prompt_id AND pv.created_at = latest.max_created_at
    `;
    
    const versionsResult = await env.DB.prepare(versionsQuery)
      .bind(...promptIds)
      .all<PromptVersion>();
    
    // 批量查询附件
    const attachmentsQuery = `
      SELECT *
      FROM prompt_attachments
      WHERE prompt_id IN (${promptIdsPlaceholder})
      ORDER BY created_at ASC
    `;
    
    const attachmentsResult = await env.DB.prepare(attachmentsQuery)
      .bind(...promptIds)
      .all<PromptAttachment>();
    
    // 组织标签数据
    const tagsByPromptId = new Map<number, Tag[]>();
    if (tagsResult.success) {
      tagsResult.results.forEach((tag: Tag & { prompt_id: number }) => {
        const promptId = tag.prompt_id;
        if (!tagsByPromptId.has(promptId)) {
          tagsByPromptId.set(promptId, []);
        }
        tagsByPromptId.get(promptId)!.push({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          created_at: tag.created_at,
          updated_at: tag.updated_at
        });
      });
    }
    
    // 组织版本数据
    const versionsByPromptId = new Map<number, PromptVersion>();
    if (versionsResult.success) {
      versionsResult.results.forEach((version: PromptVersion) => {
        versionsByPromptId.set(version.prompt_id, version);
      });
    }
    
    // 组织附件数据
    const attachmentsByPromptId = new Map<number, PromptAttachment[]>();
    if (attachmentsResult.success) {
      attachmentsResult.results.forEach((attachment: PromptAttachment) => {
        if (!attachmentsByPromptId.has(attachment.prompt_id)) {
          attachmentsByPromptId.set(attachment.prompt_id, []);
        }
        attachmentsByPromptId.get(attachment.prompt_id)!.push(attachment);
      });
    }
    
    // 组装最终数据
    const formattedPrompts = prompts.map((prompt: Prompt) => {
      const tags = tagsByPromptId.get(prompt.id) || [];
      const currentVersion = versionsByPromptId.get(prompt.id);
      const attachments = attachmentsByPromptId.get(prompt.id) || [];
      
      // 格式化附件数据
      const formattedAttachments = attachments.map((att: PromptAttachment) => ({
        id: att.id,
        prompt_id: att.prompt_id,
        file_name: att.file_name,
        original_filename: att.original_filename,
        file_size: att.file_size,
        mime_type: att.mime_type,
        file_path: att.file_path,
        thumbnail_path: att.thumbnail_path,
        file_metadata: att.file_metadata,
        created_at: att.created_at,
        updated_at: att.updated_at
      }));
      
      return {
        id: prompt.id,
        name: prompt.name,
        description: prompt.description || '',
        author: prompt.author || '',
        media_type: prompt.media_type,
        tags: tags,
        prompt_class: prompt.class_id ? {
          id: prompt.class_id,
          name: prompt.class_name || '',
          description: prompt.class_description || '',
          created_at: '',
          updated_at: ''
        } : null,
        current_version: currentVersion ? {
          id: currentVersion.id,
          prompt_id: currentVersion.prompt_id,
          version: currentVersion.version,
          content: currentVersion.content || '',
          contentzh: currentVersion.contentzh || '',
          created_at: currentVersion.created_at,
          updated_at: currentVersion.updated_at
        } : null,
        attachments: formattedAttachments,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at
      };
    });
    
    return paginatedResponse(formattedPrompts, { page, limit, total });
    
  } catch (error) {
    logError('prompts.ts', error);
    
    if (isD1Error(error)) {
      return databaseErrorResponse();
    }
    
    return internalErrorResponse();
  }
}
