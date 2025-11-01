import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse, Prompt, Tag, PaginatedResponse, PaginationInfo } from '@/types';

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // 统一错误处理
    console.error('API 请求错误:', error.message);
    return Promise.reject(error);
  }
);

// API 调用函数

/**
 * 获取提示词列表
 * @param params 查询参数
 * @returns 提示词列表和分页信息
 */
export const getPrompts = async (params?: {
  page?: number;
  limit?: number;
  offset?: number;
  tags?: string[];  // 多标签支持
  search?: string;
  q?: string;
  media_type?: string;
}): Promise<ApiResponse<Prompt[]> & { pagination?: PaginationInfo }> => {
  // 转换参数：前端使用 page/limit，后端使用 offset/limit
  const { page = 1, limit = 20, search, tags, ...rest } = params || {};
  const offset = (page - 1) * limit;
  
  // 构建查询参数
  const queryParams: Record<string, any> = {
    ...rest,
    limit,
    offset,
    q: search  // 后端使用 q 参数进行搜索
  };
  
  // 处理多标签参数
  if (tags && tags.length > 0) {
    // 过滤掉 'all' 标签和空值
    const filteredTags = tags.filter(t => t && t !== 'all' && t.trim() !== '');
    if (filteredTags.length > 0) {
      // 使用逗号分隔的格式：tags=1,3,5
      queryParams.tags = filteredTags.join(',');
    }
  }
  
  const response = await apiClient.get('/prompts', { 
    params: queryParams
  });
  return response.data;
};

/**
 * 搜索提示词
 * @param query 搜索关键词
 * @param limit 返回数量限制
 * @returns 搜索结果列表
 */
export const searchPrompts = async (
  query: string,
  limit?: number
): Promise<ApiResponse<Prompt[]>> => {
  const response = await apiClient.get('/search', {
    params: { q: query, limit },
  });
  return response.data;
};

/**
 * 获取单个提示词详情
 * @param id 提示词 ID
 * @returns 提示词详细信息
 */
export const getPromptById = async (id: string): Promise<ApiResponse<Prompt>> => {
  const response = await apiClient.get(`/prompts/${id}`);
  return response.data;
};

/**
 * 获取标签列表
 * @returns 所有可用标签
 */
export const getTags = async (): Promise<ApiResponse<Tag[]>> => {
  const response = await apiClient.get('/tags');
  return response.data;
};

// 导出 axios 实例供其他地方使用
export default apiClient;
