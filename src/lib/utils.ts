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
  
  // 如果已经是完整 URL，转换为本地静态资源路径
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // 从外部 API URL 提取文件名
    // 例如: https://pw.hrids.com/api/v1/files/attachments/xxx.png -> /attachments/xxx.png
    // 例如: https://pw.hrids.com/api/v1/files/thumbnails/xxx.png -> /thumbnails/xxx.png
    
    if (url.includes('/attachments/')) {
      const filename = url.split('/attachments/')[1];
      return `/attachments/${filename}`;
    } else if (url.includes('/thumbnails/')) {
      const filename = url.split('/thumbnails/')[1];
      return `/thumbnails/${filename}`;
    }
    
    // 如果无法识别，返回原 URL（向后兼容）
    return url;
  }
  
  // 如果已经是本地路径，直接返回
  if (url.startsWith('/attachments/') || url.startsWith('/thumbnails/')) {
    return url;
  }
  
  // 如果是相对路径，确保以 / 开头
  return url.startsWith('/') ? url : `/${url}`;
};
