// 响应格式化工具函数

/**
 * 成功响应
 */
export function successResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    }
  });
}

/**
 * 分页响应
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  status = 200
): Response {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);
  
  return new Response(JSON.stringify({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    }
  });
}

/**
 * 错误响应
 */
export function errorResponse(
  code: string,
  message: string,
  status = 500,
  details?: any
): Response {
  return new Response(JSON.stringify({
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

/**
 * 404 响应
 */
export function notFoundResponse(message = '资源未找到'): Response {
  return errorResponse('NOT_FOUND', message, 404);
}

/**
 * 400 响应
 */
export function badRequestResponse(message = '请求参数错误', details?: any): Response {
  return errorResponse('BAD_REQUEST', message, 400, details);
}

/**
 * 500 响应
 */
export function internalErrorResponse(message = '服务器内部错误'): Response {
  return errorResponse('INTERNAL_ERROR', message, 500);
}

/**
 * 数据库错误响应
 */
export function databaseErrorResponse(message = '数据库查询失败'): Response {
  return errorResponse('DATABASE_ERROR', message, 500);
}
