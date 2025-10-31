// 获取提示词详情 API
import type { EventContext, Env } from '../../../env';
import { 
  successResponse, 
  notFoundResponse,
  databaseErrorResponse, 
  internalErrorResponse,
  badRequestResponse 
} from '../../../utils/response';
import { logError, isD1Error } from '../../../utils/error';

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
 * GET /api/prompts/:id
 * 获取单个提示词的详细信息，包括所有版本和标签
 */
export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const { env, params } = context;
    
    // 获取提示词 ID
    const promptId = parseInt(params.id, 10);
    
    if (isNaN(promptId) || promptId < 1) {
      return badRequestResponse('无效的提示词 ID');
    }
    
    // 查询提示词基本信息
    const promptQuery = `
      SELECT 
        p.*,
        pc.name as class_name,
        pc.description as class_description
      FROM prompts p
      LEFT JOIN prompt_classes pc ON p.class_id = pc.id
      WHERE p.id = ?
    `;
    
    const promptResult = await env.DB.prepare(promptQuery)
      .bind(promptId)
      .first<Prompt>();
    
    if (!promptResult) {
      return notFoundResponse('提示词不存在');
    }
    
    // 查询提示词的所有标签
    const tagsQuery = `
      SELECT t.*
      FROM prompt_tags t
      JOIN prompt_tag_links pt ON t.id = pt.tag_id
      WHERE pt.prompt_id = ?
      ORDER BY t.name
    `;
    
    const tagsResult = await env.DB.prepare(tagsQuery)
      .bind(promptId)
      .all<Tag>();
    
    // 查询提示词的所有版本
    const versionsQuery = `
      SELECT *
      FROM prompt_versions
      WHERE prompt_id = ?
      ORDER BY created_at DESC
    `;
    
    const versionsResult = await env.DB.prepare(versionsQuery)
      .bind(promptId)
      .all<PromptVersion>();
    
    // 查询提示词的所有附件
    const attachmentsQuery = `
      SELECT *
      FROM prompt_attachments
      WHERE prompt_id = ?
      ORDER BY created_at ASC
    `;
    
    const attachmentsResult = await env.DB.prepare(attachmentsQuery)
      .bind(promptId)
      .all<PromptAttachment>();
    
    if (!tagsResult.success || !versionsResult.success || !attachmentsResult.success) {
      logError('prompts/[id].ts', 'Failed to query related data');
      return databaseErrorResponse();
    }
    
    // 组装完整的提示词数据
    const tags = tagsResult.results.map((tag: Tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      created_at: tag.created_at,
      updated_at: tag.updated_at
    }));
    
    const versions = versionsResult.results.map((version: PromptVersion) => ({
      id: version.id,
      prompt_id: version.prompt_id,
      version: version.version,
      content: version.content || '',
      contentzh: version.contentzh || '',
      created_at: version.created_at,
      updated_at: version.updated_at
    }));
    
    const currentVersion = versions.length > 0 ? versions[0] : null;
    
    // 格式化附件数据
    const attachments = attachmentsResult.results.map((att: PromptAttachment) => ({
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
    
    const formattedPrompt = {
      id: promptResult.id,
      name: promptResult.name,
      description: promptResult.description || '',
      author: promptResult.author || '',
      media_type: promptResult.media_type,
      tags: tags,
      prompt_class: promptResult.class_id ? {
        id: promptResult.class_id,
        name: promptResult.class_name || '',
        description: promptResult.class_description || '',
        created_at: '',
        updated_at: ''
      } : null,
      current_version: currentVersion,
      versions: versions,
      attachments: attachments,
      created_at: promptResult.created_at,
      updated_at: promptResult.updated_at
    };
    
    return successResponse(formattedPrompt);
    
  } catch (error) {
    logError('prompts/[id].ts', error);
    
    if (isD1Error(error)) {
      return databaseErrorResponse();
    }
    
    return internalErrorResponse();
  }
}
