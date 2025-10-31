/**
 * 工具函数集合
 */

/**
 * 将相对路径的图片 URL 转换为完整 URL
 * @param url 图片 URL（可能是相对路径或完整 URL）
 * @returns 完整的图片 URL
 */
export const getFullImageUrl = (url: string | undefined | null): string => {
  if (!url) return '/placeholder.svg';

  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 如果是相对路径，拼接后端资源地址
  const assetsBaseURL = '/assets';
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${assetsBaseURL}${path}`;
};
