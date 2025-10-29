import { useState, useEffect } from 'react';
import { getPromptById, Prompt } from '@/lib/api';

interface UsePromptDetailResult {
  prompt: Prompt | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// 自定义 Hook：获取单个提示词详情
export function usePromptDetail(id: number): UsePromptDetailResult {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompt = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPromptById(id);
      
      if (response.success) {
        setPrompt(response.data);
      } else {
        setError('获取详情失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPrompt();
    }
  }, [id]);

  return {
    prompt,
    loading,
    error,
    refetch: fetchPrompt,
  };
}
