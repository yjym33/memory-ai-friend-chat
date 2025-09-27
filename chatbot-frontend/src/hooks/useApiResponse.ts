import { useState, useCallback } from "react";
import { ResponseParser, ResponseHandler } from "../lib/responseHandler";
import { useErrorHandler } from "./useErrorHandler";
import { logger } from "../lib/logger";
import {
  User,
  Document,
  Organization,
  StatisticsResponse,
  EmbeddingStatusResponse,
} from "../types";

// 로딩 상태 관리 인터페이스
interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// 페이지네이션 상태
interface PaginationState {
  currentPage: number;
  totalPages: number;
  total: number;
  hasMore: boolean;
}

// 목록 상태 관리
interface ListState<T> {
  data: T[];
  pagination: PaginationState;
  loading: LoadingState;
}

// 단일 객체 상태 관리
interface SingleState<T> {
  data: T | null;
  loading: LoadingState;
}

/**
 * 사용자 목록 관리 훅
 */
export function useUserList() {
  const [state, setState] = useState<ListState<User>>({
    data: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      total: 0,
      hasMore: false,
    },
    loading: {
      isLoading: false,
      error: null,
    },
  });

  const { handleError } = useErrorHandler();

  const parseResponse = useCallback((response: unknown) => {
    return ResponseHandler.safeParseResponse(
      response,
      ResponseParser.parseUserList,
      { users: [], totalPages: 1, total: 0 }
    );
  }, []);

  const updateData = useCallback(
    (response: unknown, page: number = 1) => {
      const parsed = parseResponse(response);

      setState((prev) => ({
        ...prev,
        data: parsed.users,
        pagination: {
          currentPage: page,
          totalPages: parsed.totalPages,
          total: parsed.total,
          hasMore: page < parsed.totalPages,
        },
        loading: {
          isLoading: false,
          error: null,
        },
      }));

      logger.debug("사용자 목록 업데이트", {
        count: parsed.users.length,
        page,
        totalPages: parsed.totalPages,
      });
    },
    [parseResponse]
  );

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading: {
        ...prev.loading,
        isLoading,
      },
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      loading: {
        isLoading: false,
        error,
      },
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        total: 0,
        hasMore: false,
      },
      loading: {
        isLoading: false,
        error: null,
      },
    });
  }, []);

  return {
    ...state,
    updateData,
    setLoading,
    setError,
    reset,
    parseResponse,
  };
}

/**
 * 문서 목록 관리 훅
 */
export function useDocumentList() {
  const [state, setState] = useState<ListState<Document>>({
    data: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      total: 0,
      hasMore: false,
    },
    loading: {
      isLoading: false,
      error: null,
    },
  });

  const { handleError } = useErrorHandler();

  const parseResponse = useCallback((response: unknown) => {
    return ResponseHandler.safeParseResponse(
      response,
      ResponseParser.parseDocumentList,
      { documents: [], totalPages: 1, total: 0 }
    );
  }, []);

  const updateData = useCallback(
    (response: unknown, page: number = 1) => {
      const parsed = parseResponse(response);

      setState((prev) => ({
        ...prev,
        data: parsed.documents,
        pagination: {
          currentPage: page,
          totalPages: parsed.totalPages,
          total: parsed.total,
          hasMore: page < parsed.totalPages,
        },
        loading: {
          isLoading: false,
          error: null,
        },
      }));

      logger.debug("문서 목록 업데이트", {
        count: parsed.documents.length,
        page,
        totalPages: parsed.totalPages,
      });
    },
    [parseResponse]
  );

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading: {
        ...prev.loading,
        isLoading,
      },
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      loading: {
        isLoading: false,
        error,
      },
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        total: 0,
        hasMore: false,
      },
      loading: {
        isLoading: false,
        error: null,
      },
    });
  }, []);

  return {
    ...state,
    updateData,
    setLoading,
    setError,
    reset,
    parseResponse,
  };
}

/**
 * 조직 목록 관리 훅
 */
export function useOrganizationList() {
  const [state, setState] = useState<ListState<Organization>>({
    data: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      total: 0,
      hasMore: false,
    },
    loading: {
      isLoading: false,
      error: null,
    },
  });

  const parseResponse = useCallback((response: unknown) => {
    return ResponseHandler.safeParseResponse(
      response,
      ResponseParser.parseOrganizationList,
      { organizations: [], totalPages: 1, total: 0 }
    );
  }, []);

  const updateData = useCallback(
    (response: unknown, page: number = 1) => {
      const parsed = parseResponse(response);

      setState((prev) => ({
        ...prev,
        data: parsed.organizations,
        pagination: {
          currentPage: page,
          totalPages: parsed.totalPages,
          total: parsed.total,
          hasMore: page < parsed.totalPages,
        },
        loading: {
          isLoading: false,
          error: null,
        },
      }));

      logger.debug("조직 목록 업데이트", {
        count: parsed.organizations.length,
        page,
        totalPages: parsed.totalPages,
      });
    },
    [parseResponse]
  );

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading: {
        ...prev.loading,
        isLoading,
      },
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      loading: {
        isLoading: false,
        error,
      },
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        total: 0,
        hasMore: false,
      },
      loading: {
        isLoading: false,
        error: null,
      },
    });
  }, []);

  return {
    ...state,
    updateData,
    setLoading,
    setError,
    reset,
    parseResponse,
  };
}

/**
 * 통계 데이터 관리 훅
 */
export function useStatistics() {
  const [state, setState] = useState<SingleState<StatisticsResponse>>({
    data: null,
    loading: {
      isLoading: false,
      error: null,
    },
  });

  const parseResponse = useCallback((response: unknown) => {
    return ResponseHandler.safeParseResponse(
      response,
      ResponseParser.parseStatistics,
      {
        totalUsers: 0,
        totalConversations: 0,
        totalMessages: 0,
        totalDocuments: 0,
        totalStorage: 0,
        dailyActive: 0,
        monthlyActive: 0,
        storageUsed: 0,
        storageLimit: 0,
      }
    );
  }, []);

  const updateData = useCallback(
    (response: unknown) => {
      const parsed = parseResponse(response);

      setState((prev) => ({
        ...prev,
        data: parsed,
        loading: {
          isLoading: false,
          error: null,
        },
      }));

      logger.debug("통계 데이터 업데이트", parsed);
    },
    [parseResponse]
  );

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading: {
        ...prev.loading,
        isLoading,
      },
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      loading: {
        isLoading: false,
        error,
      },
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: {
        isLoading: false,
        error: null,
      },
    });
  }, []);

  return {
    ...state,
    updateData,
    setLoading,
    setError,
    reset,
    parseResponse,
  };
}

/**
 * 임베딩 상태 관리 훅
 */
export function useEmbeddingStatus() {
  const [state, setState] = useState<SingleState<EmbeddingStatusResponse>>({
    data: null,
    loading: {
      isLoading: false,
      error: null,
    },
  });

  const parseResponse = useCallback((response: unknown) => {
    return ResponseHandler.safeParseResponse(
      response,
      ResponseParser.parseEmbeddingStatus,
      {
        totalDocuments: 0,
        embeddedDocuments: 0,
        pendingDocuments: 0,
        failedDocuments: 0,
        processingDocuments: 0,
        lastProcessedAt: null,
        estimatedTimeRemaining: null,
      }
    );
  }, []);

  const updateData = useCallback(
    (response: unknown) => {
      const parsed = parseResponse(response);

      setState((prev) => ({
        ...prev,
        data: parsed,
        loading: {
          isLoading: false,
          error: null,
        },
      }));

      logger.debug("임베딩 상태 업데이트", parsed);
    },
    [parseResponse]
  );

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading: {
        ...prev.loading,
        isLoading,
      },
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      loading: {
        isLoading: false,
        error,
      },
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: {
        isLoading: false,
        error: null,
      },
    });
  }, []);

  return {
    ...state,
    updateData,
    setLoading,
    setError,
    reset,
    parseResponse,
  };
}

/**
 * 범용 목록 관리 훅 (제네릭)
 */
export function useGenericList<T>(dataKey: string) {
  const [state, setState] = useState<ListState<T>>({
    data: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      total: 0,
      hasMore: false,
    },
    loading: {
      isLoading: false,
      error: null,
    },
  });

  const parseResponse = useCallback(
    (response: unknown) => {
      return ResponseHandler.safeParseResponse(
        response,
        (res) => ResponseParser.parseList<T>(res, dataKey),
        { data: [], totalPages: 1, total: 0 }
      );
    },
    [dataKey]
  );

  const updateData = useCallback(
    (response: unknown, page: number = 1) => {
      const parsed = parseResponse(response);

      setState((prev) => ({
        ...prev,
        data: parsed.data,
        pagination: {
          currentPage: page,
          totalPages: parsed.totalPages,
          total: parsed.total,
          hasMore: page < parsed.totalPages,
        },
        loading: {
          isLoading: false,
          error: null,
        },
      }));

      logger.debug(`${dataKey} 목록 업데이트`, {
        count: parsed.data.length,
        page,
        totalPages: parsed.totalPages,
      });
    },
    [parseResponse, dataKey]
  );

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading: {
        ...prev.loading,
        isLoading,
      },
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      loading: {
        isLoading: false,
        error,
      },
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        total: 0,
        hasMore: false,
      },
      loading: {
        isLoading: false,
        error: null,
      },
    });
  }, []);

  return {
    ...state,
    updateData,
    setLoading,
    setError,
    reset,
    parseResponse,
  };
}
