// 错误处理工具函数

/**
 * 判断是否为 D1 错误
 */
export function isD1Error(error: any): boolean {
  return error && (
    error.message?.includes('D1') ||
    error.message?.includes('database') ||
    error.message?.includes('SQL')
  );
}

/**
 * 格式化错误信息
 */
export function formatErrorMessage(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return '未知错误';
}

/**
 * 记录错误日志
 */
export function logError(context: string, error: any): void {
  console.error(`[${context}] Error:`, {
    message: formatErrorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
}
