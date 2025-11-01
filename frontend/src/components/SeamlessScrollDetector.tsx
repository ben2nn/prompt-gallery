import React, { useEffect, useRef, useCallback } from 'react';

interface ScrollMetrics {
  /** 滚动进度 (0-1) */
  progress: number;
  /** 滚动速度 (px/ms) */
  velocity: number;
  /** 滚动方向 (1: 向下, -1: 向上, 0: 静止) */
  direction: number;
  /** 预计到达底部的时间 (ms) */
  estimatedTimeToBottom: number;
  /** 是否正在快速滚动 */
  isFastScrolling: boolean;
}

interface SeamlessScrollDetectorProps {
  /** 滚动容器引用 */
  containerRef: React.RefObject<HTMLElement>;
  /** 滚动指标变化回调 */
  onScrollMetrics?: (metrics: ScrollMetrics) => void;
  /** 预加载触发回调 */
  onPreloadTrigger?: (progress: number, velocity: number) => void;
  /** 快速滚动阈值 (px/ms) */
  fastScrollThreshold?: number;
  /** 预加载触发点 (0-1) */
  preloadThreshold?: number;
  /** 智能预测开关 */
  enablePrediction?: boolean;
}

/**
 * SeamlessScrollDetector 组件 - 无感滚动检测器
 * 智能分析用户滚动行为，预测滚动趋势，提前触发预加载
 */
export const SeamlessScrollDetector: React.FC<SeamlessScrollDetectorProps> = ({
  containerRef,
  onScrollMetrics,
  onPreloadTrigger,
  fastScrollThreshold = 2, // 2px/ms
  preloadThreshold = 0.7,
  enablePrediction = true
}) => {
  // 滚动状态追踪
  const scrollStateRef = useRef({
    lastScrollTop: 0,
    lastTimestamp: 0,
    velocityHistory: [] as number[],
    directionHistory: [] as number[],
    isScrolling: false,
    scrollTimeout: null as NodeJS.Timeout | null
  });

  // 计算滚动指标
  const calculateMetrics = useCallback((scrollTop: number, timestamp: number): ScrollMetrics => {
    const container = containerRef.current;
    if (!container) {
      return {
        progress: 0,
        velocity: 0,
        direction: 0,
        estimatedTimeToBottom: Infinity,
        isFastScrolling: false
      };
    }

    const { scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

    // 计算速度和方向
    const deltaScroll = scrollTop - scrollStateRef.current.lastScrollTop;
    const deltaTime = timestamp - scrollStateRef.current.lastTimestamp;
    const velocity = deltaTime > 0 ? deltaScroll / deltaTime : 0;
    const direction = deltaScroll > 0 ? 1 : deltaScroll < 0 ? -1 : 0;

    // 更新历史记录
    const state = scrollStateRef.current;
    state.velocityHistory.push(velocity);
    state.directionHistory.push(direction);

    // 保持历史记录长度
    const historyLength = 10;
    if (state.velocityHistory.length > historyLength) {
      state.velocityHistory.shift();
      state.directionHistory.shift();
    }

    // 计算平均速度
    const avgVelocity = state.velocityHistory.length > 0
      ? state.velocityHistory.reduce((sum, v) => sum + v, 0) / state.velocityHistory.length
      : 0;

    // 判断是否快速滚动
    const isFastScrolling = Math.abs(avgVelocity) > fastScrollThreshold;

    // 预测到达底部的时间
    let estimatedTimeToBottom = Infinity;
    if (avgVelocity > 0 && maxScroll > scrollTop) {
      const remainingDistance = maxScroll - scrollTop;
      estimatedTimeToBottom = remainingDistance / avgVelocity;
    }

    // 更新状态
    state.lastScrollTop = scrollTop;
    state.lastTimestamp = timestamp;

    return {
      progress,
      velocity: avgVelocity,
      direction,
      estimatedTimeToBottom,
      isFastScrolling
    };
  }, [containerRef, fastScrollThreshold]);

  // 智能预加载触发逻辑
  const checkPreloadTrigger = useCallback((metrics: ScrollMetrics) => {
    const { progress, velocity, direction, estimatedTimeToBottom, isFastScrolling } = metrics;

    let shouldTrigger = false;
    let triggerReason = '';

    // 基础触发条件：滚动到阈值
    if (progress >= preloadThreshold && direction > 0) {
      shouldTrigger = true;
      triggerReason = 'threshold';
    }

    // 智能预测触发
    if (enablePrediction && direction > 0) {
      // 快速滚动时提前触发
      if (isFastScrolling && progress >= preloadThreshold * 0.5) {
        shouldTrigger = true;
        triggerReason = 'fast-scroll';
      }

      // 根据预计到达时间提前触发
      if (estimatedTimeToBottom < 2000 && progress >= preloadThreshold * 0.6) { // 2秒内到达
        shouldTrigger = true;
        triggerReason = 'time-prediction';
      }

      // 加速滚动检测
      const state = scrollStateRef.current;
      if (state.velocityHistory.length >= 3) {
        const recentVelocities = state.velocityHistory.slice(-3);
        const isAccelerating = recentVelocities.every((v, i) => 
          i === 0 || v > recentVelocities[i - 1]
        );
        
        if (isAccelerating && velocity > 0 && progress >= preloadThreshold * 0.4) {
          shouldTrigger = true;
          triggerReason = 'acceleration';
        }
      }
    }

    if (shouldTrigger && onPreloadTrigger) {
      onPreloadTrigger(progress, velocity);
    }
  }, [preloadThreshold, enablePrediction, onPreloadTrigger]);

  // 滚动事件处理
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const timestamp = performance.now();

    // 计算滚动指标
    const metrics = calculateMetrics(scrollTop, timestamp);

    // 触发回调
    if (onScrollMetrics) {
      onScrollMetrics(metrics);
    }

    // 检查预加载触发
    checkPreloadTrigger(metrics);

    // 设置滚动状态
    const state = scrollStateRef.current;
    state.isScrolling = true;

    // 清除之前的定时器
    if (state.scrollTimeout) {
      clearTimeout(state.scrollTimeout);
    }

    // 设置滚动结束检测
    state.scrollTimeout = setTimeout(() => {
      state.isScrolling = false;
      // 滚动结束时清理速度历史
      state.velocityHistory = [];
      state.directionHistory = [];
    }, 150);
  }, [containerRef, calculateMetrics, onScrollMetrics, checkPreloadTrigger]);

  // 节流滚动事件
  const throttledHandleScroll = useCallback(() => {
    requestAnimationFrame(handleScroll);
  }, [handleScroll]);

  // 绑定滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 初始化状态
    scrollStateRef.current.lastScrollTop = container.scrollTop;
    scrollStateRef.current.lastTimestamp = performance.now();

    container.addEventListener('scroll', throttledHandleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', throttledHandleScroll);
      
      // 清理定时器
      if (scrollStateRef.current.scrollTimeout) {
        clearTimeout(scrollStateRef.current.scrollTimeout);
      }
    };
  }, [containerRef, throttledHandleScroll]);

  return null; // 这是一个逻辑组件，不渲染任何内容
};

/**
 * 滚动行为分析器 Hook
 */
export const useScrollBehaviorAnalyzer = () => {
  const behaviorRef = useRef({
    totalScrollDistance: 0,
    scrollSessions: 0,
    averageScrollSpeed: 0,
    preferredScrollDirection: 0,
    scrollPatterns: [] as string[]
  });

  const analyzeScrollBehavior = useCallback((metrics: ScrollMetrics) => {
    const behavior = behaviorRef.current;
    
    // 累计滚动距离
    behavior.totalScrollDistance += Math.abs(metrics.velocity * 16); // 假设16ms间隔
    
    // 分析滚动模式
    if (metrics.isFastScrolling) {
      behavior.scrollPatterns.push('fast');
    } else if (Math.abs(metrics.velocity) < 0.1) {
      behavior.scrollPatterns.push('slow');
    } else {
      behavior.scrollPatterns.push('normal');
    }

    // 保持模式历史长度
    if (behavior.scrollPatterns.length > 50) {
      behavior.scrollPatterns.shift();
    }

    // 计算平均滚动速度
    behavior.averageScrollSpeed = behavior.totalScrollDistance / (behavior.scrollSessions + 1);
    
    // 分析偏好方向
    behavior.preferredScrollDirection = metrics.direction;
  }, []);

  const getScrollInsights = useCallback(() => {
    const behavior = behaviorRef.current;
    const patterns = behavior.scrollPatterns;
    
    const fastScrollRatio = patterns.filter(p => p === 'fast').length / patterns.length;
    const slowScrollRatio = patterns.filter(p => p === 'slow').length / patterns.length;
    
    return {
      isHeavyUser: behavior.totalScrollDistance > 10000,
      prefersFastScrolling: fastScrollRatio > 0.3,
      prefersSlowScrolling: slowScrollRatio > 0.5,
      averageSpeed: behavior.averageScrollSpeed,
      recommendedPreloadThreshold: fastScrollRatio > 0.3 ? 0.5 : 0.7
    };
  }, []);

  return {
    analyzeScrollBehavior,
    getScrollInsights
  };
};