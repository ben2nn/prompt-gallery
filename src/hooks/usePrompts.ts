import { useState, useEffect, useCallback } from 'react';
import { getPrompts, PromptsQueryParams, Prompt, PaginationInfo } from '@/lib/api';

interface UsePromptsResult {
  prompts: Prompt[];
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setParams: (params: PromptsQueryParams) => void;
}

// 自定义 Hook：管理提示词列表查询
export function usePrompts(initialParams: PromptsQueryParams = {}): UsePromptsResult {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<PromptsQueryParams>(initialParams);

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPrompts(params);
      
      if (response.success) {
        setPrompts(response.data);
        setPagination(response.pagination);
      } else {
        setError('获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return {
    prompts,
    pagination,
    loading,
    error,
    refetch: fetchPrompts,
    setParams,
  };
}
