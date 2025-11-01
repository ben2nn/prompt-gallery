/**
 * 图片缓存管理器
 * 使用浏览器内存缓存已加载的图片，避免重复下载
 */

class ImageCache {
  private cache: Map<string, HTMLImageElement> = new Map();
  private loading: Map<string, Promise<HTMLImageElement>> = new Map();

  /**
   * 预加载图片
   * @param url 图片 URL
   * @returns Promise<HTMLImageElement>
   */
  async preload(url: string): Promise<HTMLImageElement> {
    // 如果已缓存，直接返回
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // 如果正在加载，返回加载 Promise
    if (this.loading.has(url)) {
      return this.loading.get(url)!;
    }

    // 创建新的加载 Promise
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(url, img);
        this.loading.delete(url);
        resolve(img);
      };

      img.onerror = () => {
        this.loading.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });

    this.loading.set(url, loadPromise);
    return loadPromise;
  }

  /**
   * 批量预加载图片
   * @param urls 图片 URL 数组
   */
  async preloadBatch(urls: string[]): Promise<void> {
    await Promise.allSettled(urls.map(url => this.preload(url)));
  }

  /**
   * 检查图片是否已缓存
   * @param url 图片 URL
   */
  has(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * 获取缓存的图片
   * @param url 图片 URL
   */
  get(url: string): HTMLImageElement | undefined {
    return this.cache.get(url);
  }

  /**
   * 清除指定图片缓存
   * @param url 图片 URL
   */
  remove(url: string): void {
    this.cache.delete(url);
    this.loading.delete(url);
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.loading.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

// 导出单例
export const imageCache = new ImageCache();

/**
 * 预加载提示词的所有图片
 * @param prompts 提示词数组
 */
export const preloadPromptImages = async (prompts: any[]): Promise<void> => {
  const imageUrls = prompts
    .filter(p => p.attachments && p.attachments.length > 0)
    .flatMap(p => p.attachments.map((a: any) => a.thumbnail_path || a.file_path))
    .filter(Boolean);
  
  await imageCache.preloadBatch(imageUrls);
};
