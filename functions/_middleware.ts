// Cloudflare Pages Functions 全局中间件
import type { EventContext, Env } from './env';
import { internalErrorResponse } from './utils/response';
import { logError } from './utils/error';

/**
 * 添加 CORS 头
 */
function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  // 允许所有来源（生产环境可以配置为特定域名）
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * 记录请求日志
 */
function logRequest(request: Request): void {
  const url = new URL(request.url);
  console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}${url.search}`);
}

/**
 * 处理 OPTIONS 预检请求
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * 全局错误处理中间件
 */
export async function onRequest(context: EventContext<Env>): Promise<Response> {
  const { request, next } = context;
  
  try {
    // 记录请求
    logRequest(request);
    
    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }
    
    // 执行实际的请求处理
    const response = await next();
    
    // 添加 CORS 头
    return addCorsHeaders(response);
    
  } catch (error) {
    // 全局错误捕获
    logError('_middleware', error);
    
    const errorResponse = internalErrorResponse('服务器处理请求时发生错误');
    return addCorsHeaders(errorResponse);
  }
}
