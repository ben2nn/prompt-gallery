// Cloudflare Pages Functions 环境类型定义

interface Env {
  // D1 数据库绑定
  DB: D1Database;
  
  // R2 存储绑定（可选）
  ASSETS?: R2Bucket;
  
  // 环境变量
  ENVIRONMENT?: string;
}

// Pages Functions 上下文类型
interface EventContext<Env = any, P extends string = any, Data extends Record<string, unknown> = Record<string, unknown>> {
  request: Request;
  env: Env;
  params: Record<P, string>;
  data: Data;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  waitUntil: (promise: Promise<any>) => void;
  passThroughOnException: () => void;
}

// 导出类型
export { Env, EventContext };