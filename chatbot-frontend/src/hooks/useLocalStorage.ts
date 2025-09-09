import { useState, useEffect, useCallback, useMemo, useRef } from "react";

type SetValue<T> = T | ((val: T) => T);

/**
 * LocalStorage 훅의 설정 옵션 인터페이스
 */
interface UseLocalStorageOptions {
  /** 직렬화/역직렬화 함수 */
  serializer?: {
    read: (value: string) => unknown;
    write: (value: unknown) => string;
  };
  /** 탭 간 동기화 활성화 여부 */
  syncAcrossTabs?: boolean;
  /** 에러 핸들링 함수 */
  onError?: (error: Error) => void;
  /** 디바운싱 지연 시간 (ms) */
  debounceDelay?: number;
}

/**
 * 스토리지 변경 이벤트 상세 정보
 */
interface StorageChangeDetail<T> {
  newValue: T;
  key: string;
  timestamp: number;
}

/**
 * 내부에서 사용하는 직렬화 유틸
 */
function makeSerializer(custom?: UseLocalStorageOptions["serializer"]) {
  const read = custom?.read ?? JSON.parse;
  const write = custom?.write ?? JSON.stringify;
  return { read, write };
}

/** 직렬화 비교: 내용이 같으면 true */
function isSerializedEqual(
  a: unknown,
  b: unknown,
  write: (v: unknown) => string
) {
  try {
    return write(a) === write(b);
  } catch {
    return a === b;
  }
}

/**
 * 로컬 스토리지를 React 상태처럼 사용할 수 있는 훅
 *
 * @template T - 저장할 데이터의 타입
 * @param key - localStorage의 키
 * @param initialValue - 초기값
 * @param options - 설정 옵션 (안정화됨)
 * @returns [현재값, 값설정함수, 값제거함수] 튜플
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions
): [T, (value: SetValue<T>) => void, () => void] {
  // options를 필드 단위로 안정 분해 (객체 참조가 바뀌어도 재생성 폭을 최소화)
  const {
    serializer: optSerializer,
    syncAcrossTabs = true,
    debounceDelay = 50,
    onError = (error: Error) =>
      console.error(`useLocalStorage error for key "${key}":`, error),
  } = options ?? {};

  // 직렬화기(함수)만 메모
  const serializer = useMemo(
    () => makeSerializer(optSerializer),
    [optSerializer]
  );

  // 마지막으로 설정한 값을 추적 (불필요 업데이트 방지)
  const lastSetValueRef = useRef<T | undefined>(undefined);

  // 디바운싱 타이머
  const debounceTimerRef = useRef<number | null>(null);

  // 현재 값 읽기 (필요 필드만 의존)
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      return serializer.read(item) as T;
    } catch (error) {
      onError(error as Error);
      return initialValue;
    }
  }, [key, initialValue, serializer.read, onError]);

  // 안전한 setState (동등값이면 스킵)
  const safeSetStored = useCallback(
    (next: T) => {
      // 마지막 set 기준으로도 빠르게 스킵
      if (
        lastSetValueRef.current !== undefined &&
        isSerializedEqual(lastSetValueRef.current, next, serializer.write)
      ) {
        return;
      }

      setStoredValue((prev) => {
        if (isSerializedEqual(prev, next, serializer.write)) return prev;
        return next;
      });

      lastSetValueRef.current = next;
    },
    [serializer.write]
  );

  // 초기값
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      return serializer.read(item) as T;
    } catch (error) {
      onError(error as Error);
      return initialValue;
    }
  });

  // 값 설정
  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (typeof window === "undefined") {
        console.warn(`useLocalStorage: localStorage is not available`);
        return;
      }

      try {
        const newValue = value instanceof Function ? value(storedValue) : value;

        // 동등값이면 모든 작업 스킵
        if (isSerializedEqual(storedValue, newValue, serializer.write)) {
          return;
        }

        // 상태 업데이트
        safeSetStored(newValue);

        // 로컬 스토리지 업데이트
        if (newValue === undefined || newValue === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, serializer.write(newValue));
        }

        // 탭 간 동기화 (디바운스)
        if (syncAcrossTabs) {
          if (debounceTimerRef.current) {
            window.clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent<StorageChangeDetail<T>>(`localStorage-${key}`, {
                detail: {
                  newValue,
                  key,
                  timestamp: Date.now(),
                },
              })
            );
          }, debounceDelay);
        }

        lastSetValueRef.current = newValue;
      } catch (error) {
        onError(error as Error);
      }
    },
    [
      key,
      storedValue,
      serializer.write,
      syncAcrossTabs,
      debounceDelay,
      onError,
      safeSetStored,
    ]
  );

  // 값 제거 (실제 삭제)
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
      lastSetValueRef.current = undefined;
      // 초기값으로만 상태 동기화 (동등성 검사 포함)
      safeSetStored(initialValue);
    } catch (error) {
      onError(error as Error);
    }
  }, [key, initialValue, onError, safeSetStored]);

  // 스토리지 이벤트 리스너 (다른 탭에서의 변경 감지)
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        const newValue =
          e.newValue !== null
            ? (serializer.read(e.newValue) as T)
            : initialValue;
        safeSetStored(newValue);
      } catch (error) {
        onError(error as Error);
      }
    };

    const handleCustomEvent = (e: Event) => {
      const ce = e as CustomEvent<StorageChangeDetail<T>>;
      const { newValue, timestamp } = ce.detail;
      // 오래된 이벤트 무시
      if (Date.now() - timestamp > 1000) return;
      safeSetStored(newValue);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(`localStorage-${key}`, handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(`localStorage-${key}`, handleCustomEvent);

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [
    key,
    initialValue,
    serializer.read,
    onError,
    syncAcrossTabs,
    safeSetStored,
  ]);

  // key가 바뀔 때만 스토리지에서 재동기화 (핵심 수정)
  useEffect(() => {
    const current = readValue();
    safeSetStored(current);
    // 의존성은 의도대로 key만!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue, removeValue];
}

/**
 * 세션 스토리지 버전
 * (동일한 패턴으로 안전 수정)
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options?: Omit<UseLocalStorageOptions, "syncAcrossTabs">
): [T, (value: SetValue<T>) => void, () => void] {
  const {
    serializer: optSerializer,
    onError = (error) =>
      console.error(`useSessionStorage error for key "${key}":`, error),
  } = options ?? {};

  const serializer = useMemo(
    () => makeSerializer(optSerializer),
    [optSerializer]
  );

  const readValue = useCallback((): T => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.sessionStorage.getItem(key);
      if (item === null) return initialValue;
      return serializer.read(item) as T;
    } catch (error) {
      onError(error as Error);
      return initialValue;
    }
  }, [key, initialValue, serializer.read, onError]);

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.sessionStorage.getItem(key);
      if (item === null) return initialValue;
      return serializer.read(item) as T;
    } catch (error) {
      onError(error as Error);
      return initialValue;
    }
  });

  const safeSetStored = useCallback(
    (next: T) => {
      setStoredValue((prev) => {
        if (isSerializedEqual(prev, next, serializer.write)) return prev;
        return next;
      });
    },
    [serializer.write]
  );

  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (typeof window === "undefined") {
        console.warn(`useSessionStorage: sessionStorage is not available`);
        return;
      }
      try {
        const newValue = value instanceof Function ? value(storedValue) : value;

        if (isSerializedEqual(storedValue, newValue, serializer.write)) return;

        safeSetStored(newValue);

        if (newValue === undefined || newValue === null) {
          window.sessionStorage.removeItem(key);
        } else {
          window.sessionStorage.setItem(key, serializer.write(newValue));
        }
      } catch (error) {
        onError(error as Error);
      }
    },
    [key, storedValue, serializer.write, onError, safeSetStored]
  );

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(key);
      }
      safeSetStored(initialValue);
    } catch (error) {
      onError(error as Error);
    }
  }, [key, initialValue, onError, safeSetStored]);

  // key 변경 시에만 재동기화
  useEffect(() => {
    safeSetStored(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue, removeValue];
}

/**
 * 특정 용도별 로컬 스토리지 훅들
 */

export function useUserPreferences() {
  return useLocalStorage("user-preferences", {
    theme: "light" as "light" | "dark",
    language: "ko" as string,
    fontSize: "medium" as "small" | "medium" | "large",
    notifications: true,
    autoSave: true,
  });
}

export function useChatDraft(chatId: string) {
  return useLocalStorage(`chat-draft-${chatId}`, "", {
    // 채팅 초안은 탭별 독립
    syncAcrossTabs: false,
  });
}

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

  return { searches, addSearch, removeSearch, clearSearches };
}

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

/**
 * 테스트용 localStorage 모킹 유틸리티
 */
export const createMockStorage = (): Storage => {
  const storage: Record<string, string> = {};

  return {
    getItem: (key: string): string | null =>
      key in storage ? storage[key] : null,
    setItem: (key: string, value: string): void => {
      storage[key] = value;
    },
    removeItem: (key: string): void => {
      delete storage[key];
    },
    clear: (): void => {
      Object.keys(storage).forEach((k) => delete storage[k]);
    },
    key: (index: number): string | null => Object.keys(storage)[index] ?? null,
    get length(): number {
      return Object.keys(storage).length;
    },
  };
};

/**
 * 테스트 환경에서 localStorage를 모킹하는 함수
 */
export const mockLocalStorage = (mockStorage?: Storage): void => {
  const mock = mockStorage || createMockStorage();
  Object.defineProperty(window, "localStorage", {
    value: mock,
    writable: true,
  });
};

/**
 * 스토리지 유틸리티 함수들
 */
export const storageUtils = {
  /** 스토리지 크기 계산 (바이트) */
  getStorageSize: (
    storage: Storage = typeof window !== "undefined"
      ? localStorage
      : ({} as Storage)
  ): number => {
    let total = 0;
    for (const key in storage) {
      if (Object.prototype.hasOwnProperty.call(storage, key)) {
        const value = storage.getItem(key);
        total += (value?.length || 0) + key.length;
      }
    }
    return total;
  },

  /** 스토리지 사용량을 퍼센트로 반환 */
  getStorageUsage: (
    storage: Storage = typeof window !== "undefined"
      ? localStorage
      : ({} as Storage)
  ): number => {
    try {
      const total = storageUtils.getStorageSize(storage);
      const limit = 5 * 1024 * 1024; // 대략적인 localStorage 제한 (5MB)
      return (total / limit) * 100;
    } catch {
      return 0;
    }
  },

  /** 스토리지가 가득 찬 상태인지 확인 */
  isStorageFull: (
    storage: Storage = typeof window !== "undefined"
      ? localStorage
      : ({} as Storage)
  ): boolean => {
    try {
      const testKey = "__storage_test__";
      storage.setItem(testKey, "test");
      storage.removeItem(testKey);
      return false;
    } catch {
      return true;
    }
  },
} as const;
