// API 客户端服务
import type { Prompt, Tag, PromptClassRead, PromptVersionRead, AttachmentRead } from '@/types';

// 重新导出类型以便其他模块使用
export type { Prompt, Tag };

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PromptsResponse {
  success: boolean;
  data: Prompt[];
  pagination: PaginationInfo;
  message?: string;
}

export interface PromptDetailResponse {
  success: boolean;
  data: Prompt;
}

export interface TagsResponse {
  success: boolean;
  data: Tag[];
  message?: string;
}

// 查询参数接口
export interface PromptsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  author?: string;
}

// API 基础 URL
const API_BASE_URL = '/api';

// 构建查询字符串
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// 获取提示词列表
export async function getPrompts(params: PromptsQueryParams = {}): Promise<PromptsResponse> {
  const queryString = buildQueryString(params);
  const response = await fetch(`${API_BASE_URL}/prompts${queryString}`);
  
  if (!response.ok) {
    throw new Error('获取提示词列表失败');
  }
  
  return response.json();
}

// 获取单个提示词详情
export async function getPromptById(id: number): Promise<PromptDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/prompts/${id}`);
  
  if (!response.ok) {
    throw new Error('获取提示词详情失败');
  }
  
  return response.json();
}

// 获取所有标签
export async function getTags(): Promise<TagsResponse> {
  const response = await fetch(`${API_BASE_URL}/tags`);
  
  if (!response.ok) {
    throw new Error('获取标签失败');
  }
  
  return response.json();
}
