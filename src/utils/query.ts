// 查询参数解析工具函数

/**
 * 从 URL 获取查询参数
 */
export function getQueryParams(request: Request): URLSearchParams {
  const url = new URL(request.url);
  return url.searchParams;
}

/**
 * 获取整数查询参数
 */
export function getIntParam(
  params: URLSearchParams,
  key: string,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  const value = params.get(key);
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  
  let result = parsed;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  
  return result;
}

/**
 * 获取字符串查询参数
 */
export function getStringParam(
  params: URLSearchParams,
  key: string,
  defaultValue = ''
): string {
  return params.get(key) || defaultValue;
}

/**
 * 验证分页参数
 */
export function validatePaginationParams(page: number, limit: number): {
  valid: boolean;
  error?: string;
} {
  if (page < 1) {
    return { valid: false, error: '页码必须大于 0' };
  }
  
  if (limit < 1 || limit > 100) {
    return { valid: false, error: '每页数量必须在 1-100 之间' };
  }
  
  return { valid: true };
}

/**
 * 计算分页偏移量
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
