import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/**
 * 값의 변경을 지연시키는 디바운스 훅
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 함수 호출을 지연시키는 디바운스 콜백 훅
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): [T, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // 콜백 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  // 디바운스된 함수
  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  // 즉시 실행 함수
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 클린업
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedCallback, flush];
}

/**
 * 함수 호출 빈도를 제한하는 쓰로틀 훅
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): [T, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  const lastCallTimeRef = useRef<number>(0);

  // 콜백 업데이트
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  // 쓰로틀된 함수
  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTimeRef.current;

      if (timeSinceLastCall >= delay) {
        // 즉시 실행
        lastCallTimeRef.current = now;
        callbackRef.current(...args);
      } else {
        // 지연 실행
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastCallTimeRef.current = Date.now();
          callbackRef.current(...args);
        }, delay - timeSinceLastCall);
      }
    }) as T,
    [delay]
  );

  // 즉시 실행 함수
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 클린업
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [throttledCallback, flush];
}

/**
 * 검색 입력에 최적화된 디바운스 훅
 */
export function useSearchDebounce(
  searchTerm: string,
  delay: number = 300,
  minLength: number = 2
) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.length < minLength) {
      setDebouncedSearchTerm("");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay, minLength]);

  return {
    debouncedSearchTerm,
    isSearching,
    shouldSearch: debouncedSearchTerm.length >= minLength,
  };
}

/**
 * API 호출에 최적화된 디바운스 훅
 */
export function useApiDebounce<T, P extends unknown[]>(
  apiFunction: (...args: P) => Promise<T>,
  delay: number = 500,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const [debouncedApiCall] = useDebouncedCallback(
    (async (...args: P) => {
      try {
        // 이전 요청 취소
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // 새 요청 시작
        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError(null);

        const result = await apiFunction(...args);

        if (!abortControllerRef.current.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (!abortControllerRef.current?.signal.aborted) {
          setError(err instanceof Error ? err.message : "API 호출 실패");
          setData(null);
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    }) as (...args: unknown[]) => unknown,
    delay,
    deps
  );

  // 클린업
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    execute: debouncedApiCall,
  };
}

/**
 * 스크롤 이벤트 최적화 훅
 */
export function useScrollThrottle(delay: number = 100) {
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(
    null
  );
  const lastScrollY = useRef(0);

  const [throttledScrollHandler] = useThrottle(() => {
    const currentScrollY = window.scrollY;

    setScrollY(currentScrollY);

    if (currentScrollY > lastScrollY.current) {
      setScrollDirection("down");
    } else if (currentScrollY < lastScrollY.current) {
      setScrollDirection("up");
    }

    lastScrollY.current = currentScrollY;
  }, delay);

  useEffect(() => {
    window.addEventListener("scroll", throttledScrollHandler, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", throttledScrollHandler);
    };
  }, [throttledScrollHandler]);

  return {
    scrollY,
    scrollDirection,
    isScrollingDown: scrollDirection === "down",
    isScrollingUp: scrollDirection === "up",
  };
}

/**
 * 리사이즈 이벤트 최적화 훅
 */
export function useResizeThrottle(delay: number = 250) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const [throttledResizeHandler] = useThrottle(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, delay);

  useEffect(() => {
    window.addEventListener("resize", throttledResizeHandler);

    return () => {
      window.removeEventListener("resize", throttledResizeHandler);
    };
  }, [throttledResizeHandler]);

  // 반응형 브레이크포인트 계산
  const breakpoint = useMemo(() => {
    const { width } = windowSize;
    if (width < 640) return "sm";
    if (width < 768) return "md";
    if (width < 1024) return "lg";
    if (width < 1280) return "xl";
    return "2xl";
  }, [windowSize]);

  return {
    ...windowSize,
    breakpoint,
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
  };
}

/**
 * 입력 필드 최적화 훅 (실시간 검증 + 디바운스)
 */
export function useInputDebounce<T>(
  initialValue: T,
  validator?: (value: T) => string | null,
  delay: number = 300
) {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const debouncedValue = useDebounce(value, delay);

  // 디바운스된 검증
  useEffect(() => {
    if (!validator) return;

    if (value !== initialValue) {
      setIsValidating(true);
    }

    const validationError = validator(debouncedValue);
    setError(validationError);
    setIsValidating(false);
  }, [debouncedValue, validator, initialValue, value]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setIsValidating(false);
  }, [initialValue]);

  return {
    value,
    setValue,
    debouncedValue,
    error,
    isValidating,
    isValid: !error && !isValidating,
    reset,
  };
}
