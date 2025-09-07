import { useState, useEffect, useCallback } from "react";

type SetValue<T> = T | ((val: T) => T);

interface UseLocalStorageOptions {
  serializer?: {
    read: (value: string) => any;
    write: (value: any) => string;
  };
  syncAcrossTabs?: boolean;
  onError?: (error: Error) => void;
}

/**
 * 로컬 스토리지를 React 상태처럼 사용할 수 있는 훅
 * 타입 안전성, 에러 처리, 탭 간 동기화 지원
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: SetValue<T>) => void, () => void] {
  const {
    serializer = {
      read: JSON.parse,
      write: JSON.stringify,
    },
    syncAcrossTabs = true,
    onError = (error) =>
      console.error(`useLocalStorage error for key "${key}":`, error),
  } = options;

  // 초기값 읽기
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return serializer.read(item);
    } catch (error) {
      onError(error as Error);
      return initialValue;
    }
  }, [key, initialValue, serializer, onError]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 값 설정
  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (typeof window === "undefined") {
        console.warn(`useLocalStorage: localStorage is not available`);
        return;
      }

      try {
        const newValue = value instanceof Function ? value(storedValue) : value;

        // 상태 업데이트
        setStoredValue(newValue);

        // 로컬 스토리지에 저장
        if (newValue === undefined || newValue === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, serializer.write(newValue));
        }

        // 커스텀 이벤트 발생 (탭 간 동기화용)
        if (syncAcrossTabs) {
          window.dispatchEvent(
            new CustomEvent(`localStorage-${key}`, {
              detail: { newValue, key },
            })
          );
        }
      } catch (error) {
        onError(error as Error);
      }
    },
    [key, storedValue, serializer, syncAcrossTabs, onError]
  );

  // 값 제거
  const removeValue = useCallback(() => {
    setValue(initialValue);
  }, [setValue, initialValue]);

  // 스토리지 이벤트 리스너 (다른 탭에서의 변경 감지)
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key) return;

      try {
        const newValue = e.newValue
          ? serializer.read(e.newValue)
          : initialValue;
        setStoredValue(newValue);
      } catch (error) {
        onError(error as Error);
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      setStoredValue(e.detail.newValue);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      `localStorage-${key}`,
      handleCustomEvent as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        `localStorage-${key}`,
        handleCustomEvent as EventListener
      );
    };
  }, [key, initialValue, serializer, syncAcrossTabs, onError]);

  // 마운트 시 최신 값으로 동기화
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * 세션 스토리지 버전
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: Omit<UseLocalStorageOptions, "syncAcrossTabs"> = {}
): [T, (value: SetValue<T>) => void, () => void] {
  const {
    serializer = {
      read: JSON.parse,
      write: JSON.stringify,
    },
    onError = (error) =>
      console.error(`useSessionStorage error for key "${key}":`, error),
  } = options;

  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return serializer.read(item);
    } catch (error) {
      onError(error as Error);
      return initialValue;
    }
  }, [key, initialValue, serializer, onError]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (typeof window === "undefined") {
        console.warn(`useSessionStorage: sessionStorage is not available`);
        return;
      }

      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        setStoredValue(newValue);

        if (newValue === undefined || newValue === null) {
          window.sessionStorage.removeItem(key);
        } else {
          window.sessionStorage.setItem(key, serializer.write(newValue));
        }
      } catch (error) {
        onError(error as Error);
      }
    },
    [key, storedValue, serializer, onError]
  );

  const removeValue = useCallback(() => {
    setValue(initialValue);
  }, [setValue, initialValue]);

  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * 특정 용도별 로컬 스토리지 훅들
 */

// 사용자 설정 관리
export function useUserPreferences() {
  return useLocalStorage("user-preferences", {
    theme: "light" as "light" | "dark",
    language: "ko" as string,
    fontSize: "medium" as "small" | "medium" | "large",
    notifications: true,
    autoSave: true,
  });
}

// 채팅 기록 임시 저장
export function useChatDraft(chatId: string) {
  return useLocalStorage(`chat-draft-${chatId}`, "", {
    syncAcrossTabs: false, // 채팅 초안은 탭별로 독립적
  });
}

// 최근 검색어
export function useRecentSearches(maxItems = 10) {
  const [searches, setSearches] = useLocalStorage<string[]>(
    "recent-searches",
    []
  );

  const addSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      setSearches((prev) => {
        const filtered = prev.filter((item) => item !== query);
        return [query, ...filtered].slice(0, maxItems);
      });
    },
    [setSearches, maxItems]
  );

  const removeSearch = useCallback(
    (query: string) => {
      setSearches((prev) => prev.filter((item) => item !== query));
    },
    [setSearches]
  );

  const clearSearches = useCallback(() => {
    setSearches([]);
  }, [setSearches]);

  return {
    searches,
    addSearch,
    removeSearch,
    clearSearches,
  };
}

// 앱 상태 캐시
export function useAppCache<T>(key: string, initialValue: T, ttl?: number) {
  const cacheKey = `app-cache-${key}`;

  const [cacheData, setCacheData] = useLocalStorage<{
    value: T;
    timestamp: number;
    ttl?: number;
  } | null>(cacheKey, null);

  const setValue = useCallback(
    (value: T) => {
      setCacheData({
        value,
        timestamp: Date.now(),
        ttl,
      });
    },
    [setCacheData, ttl]
  );

  const getValue = useCallback((): T => {
    if (!cacheData) return initialValue;

    // TTL 체크
    if (ttl && Date.now() - cacheData.timestamp > ttl) {
      setCacheData(null);
      return initialValue;
    }

    return cacheData.value;
  }, [cacheData, initialValue, ttl, setCacheData]);

  const clearCache = useCallback(() => {
    setCacheData(null);
  }, [setCacheData]);

  const isExpired = useCallback(() => {
    if (!cacheData || !ttl) return false;
    return Date.now() - cacheData.timestamp > ttl;
  }, [cacheData, ttl]);

  return {
    value: getValue(),
    setValue,
    clearCache,
    isExpired: isExpired(),
    lastUpdated: cacheData?.timestamp,
  };
}
