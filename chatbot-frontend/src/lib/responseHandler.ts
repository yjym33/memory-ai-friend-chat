import { logger } from "./logger";
import {
  UserListResponse,
  DocumentListResponse,
  OrganizationListResponse,
  StatisticsResponse,
  EmbeddingStatusResponse,
  User,
  Document,
  Organization,
} from "../types";

// 응답 검증 및 타입 가드
export class ResponseValidator {
  /**
   * 사용자 목록 응답인지 확인
   */
  static isUserListResponse(response: unknown): response is UserListResponse {
    return (
      typeof response === "object" &&
      response !== null &&
      "users" in response &&
      Array.isArray((response as any).users)
    );
  }

  /**
   * 문서 목록 응답인지 확인
   */
  static isDocumentListResponse(
    response: unknown
  ): response is DocumentListResponse {
    return (
      typeof response === "object" &&
      response !== null &&
      "documents" in response &&
      Array.isArray((response as any).documents)
    );
  }

  /**
   * 조직 목록 응답인지 확인
   */
  static isOrganizationListResponse(
    response: unknown
  ): response is OrganizationListResponse {
    return (
      typeof response === "object" &&
      response !== null &&
      "organizations" in response &&
      Array.isArray((response as any).organizations)
    );
  }

  /**
   * 통계 응답인지 확인
   */
  static isStatisticsResponse(
    response: unknown
  ): response is StatisticsResponse {
    return (
      typeof response === "object" &&
      response !== null &&
      "totalUsers" in response &&
      "totalConversations" in response
    );
  }

  /**
   * 임베딩 상태 응답인지 확인
   */
  static isEmbeddingStatusResponse(
    response: unknown
  ): response is EmbeddingStatusResponse {
    return (
      typeof response === "object" &&
      response !== null &&
      "totalDocuments" in response &&
      "embeddedDocuments" in response
    );
  }

  /**
   * 단순 배열 응답인지 확인
   */
  static isArrayResponse<T>(response: unknown): response is T[] {
    return Array.isArray(response);
  }

  /**
   * 페이지네이션이 있는 응답인지 확인
   */
  static hasPagination(response: unknown): response is { pagination: any } {
    return (
      typeof response === "object" &&
      response !== null &&
      "pagination" in response &&
      typeof (response as any).pagination === "object"
    );
  }
}

// 응답 파서
export class ResponseParser {
  /**
   * 사용자 목록 파싱
   */
  static parseUserList(response: unknown): {
    users: User[];
    totalPages: number;
    total: number;
  } {
    if (ResponseValidator.isUserListResponse(response)) {
      return {
        users: response.users,
        totalPages: response.pagination?.totalPages || 1,
        total: response.pagination?.total || response.users.length,
      };
    }

    if (ResponseValidator.isArrayResponse<User>(response)) {
      return {
        users: response,
        totalPages: 1,
        total: response.length,
      };
    }

    logger.warn("예상하지 못한 사용자 목록 응답 형식", { response });
    return {
      users: [],
      totalPages: 1,
      total: 0,
    };
  }

  /**
   * 문서 목록 파싱
   */
  static parseDocumentList(response: unknown): {
    documents: Document[];
    totalPages: number;
    total: number;
  } {
    if (ResponseValidator.isDocumentListResponse(response)) {
      return {
        documents: response.documents,
        totalPages: response.pagination?.totalPages || 1,
        total: response.pagination?.total || response.documents.length,
      };
    }

    if (ResponseValidator.isArrayResponse<Document>(response)) {
      return {
        documents: response,
        totalPages: 1,
        total: response.length,
      };
    }

    logger.warn("예상하지 못한 문서 목록 응답 형식", { response });
    return {
      documents: [],
      totalPages: 1,
      total: 0,
    };
  }

  /**
   * 조직 목록 파싱
   */
  static parseOrganizationList(response: unknown): {
    organizations: Organization[];
    totalPages: number;
    total: number;
  } {
    if (ResponseValidator.isOrganizationListResponse(response)) {
      return {
        organizations: response.organizations,
        totalPages: response.pagination?.totalPages || 1,
        total: response.pagination?.total || response.organizations.length,
      };
    }

    if (ResponseValidator.isArrayResponse<Organization>(response)) {
      return {
        organizations: response,
        totalPages: 1,
        total: response.length,
      };
    }

    logger.warn("예상하지 못한 조직 목록 응답 형식", { response });
    return {
      organizations: [],
      totalPages: 1,
      total: 0,
    };
  }

  /**
   * 통계 응답 파싱
   */
  static parseStatistics(response: unknown): StatisticsResponse {
    if (ResponseValidator.isStatisticsResponse(response)) {
      return response;
    }

    logger.warn("예상하지 못한 통계 응답 형식", { response });
    return {
      totalUsers: 0,
      totalConversations: 0,
      totalMessages: 0,
      totalDocuments: 0,
      totalStorage: 0,
      dailyActive: 0,
      monthlyActive: 0,
      storageUsed: 0,
      storageLimit: 0,
    };
  }

  /**
   * 임베딩 상태 파싱
   */
  static parseEmbeddingStatus(response: unknown): EmbeddingStatusResponse {
    if (ResponseValidator.isEmbeddingStatusResponse(response)) {
      return response;
    }

    logger.warn("예상하지 못한 임베딩 상태 응답 형식", { response });
    return {
      totalDocuments: 0,
      embeddedDocuments: 0,
      pendingDocuments: 0,
      failedDocuments: 0,
      processingDocuments: 0,
      lastProcessedAt: null,
      estimatedTimeRemaining: null,
    };
  }

  /**
   * 일반적인 목록 응답 파싱 (제네릭)
   */
  static parseList<T>(
    response: unknown,
    dataKey: string
  ): {
    data: T[];
    totalPages: number;
    total: number;
  } {
    // 객체 형태의 응답 (예: { users: [...], pagination: {...} })
    if (
      typeof response === "object" &&
      response !== null &&
      dataKey in response
    ) {
      const data = (response as any)[dataKey];
      if (Array.isArray(data)) {
        const pagination = ResponseValidator.hasPagination(response)
          ? (response as any).pagination
          : null;

        return {
          data,
          totalPages: pagination?.totalPages || 1,
          total: pagination?.total || data.length,
        };
      }
    }

    // 직접 배열 응답
    if (ResponseValidator.isArrayResponse<T>(response)) {
      return {
        data: response,
        totalPages: 1,
        total: response.length,
      };
    }

    logger.warn("예상하지 못한 목록 응답 형식", { response, dataKey });
    return {
      data: [],
      totalPages: 1,
      total: 0,
    };
  }

  /**
   * 단일 객체 응답 파싱
   */
  static parseSingle<T>(response: unknown, defaultValue: T): T {
    if (
      typeof response === "object" &&
      response !== null &&
      !Array.isArray(response)
    ) {
      return response as T;
    }

    logger.warn("예상하지 못한 단일 객체 응답 형식", { response });
    return defaultValue;
  }
}

// 응답 처리 유틸리티
export class ResponseHandler {
  /**
   * 안전한 응답 파싱
   */
  static safeParseResponse<T>(
    response: unknown,
    parser: (response: unknown) => T,
    fallback: T
  ): T {
    try {
      return parser(response);
    } catch (error) {
      logger.error("응답 파싱 중 오류 발생", { error, response });
      return fallback;
    }
  }

  /**
   * 응답 타입 감지 및 자동 파싱
   */
  static autoParseResponse(response: unknown): {
    type: string;
    data: unknown;
    meta?: {
      totalPages?: number;
      total?: number;
    };
  } {
    if (ResponseValidator.isUserListResponse(response)) {
      const parsed = ResponseParser.parseUserList(response);
      return {
        type: "userList",
        data: parsed.users,
        meta: {
          totalPages: parsed.totalPages,
          total: parsed.total,
        },
      };
    }

    if (ResponseValidator.isDocumentListResponse(response)) {
      const parsed = ResponseParser.parseDocumentList(response);
      return {
        type: "documentList",
        data: parsed.documents,
        meta: {
          totalPages: parsed.totalPages,
          total: parsed.total,
        },
      };
    }

    if (ResponseValidator.isOrganizationListResponse(response)) {
      const parsed = ResponseParser.parseOrganizationList(response);
      return {
        type: "organizationList",
        data: parsed.organizations,
        meta: {
          totalPages: parsed.totalPages,
          total: parsed.total,
        },
      };
    }

    if (ResponseValidator.isStatisticsResponse(response)) {
      return {
        type: "statistics",
        data: ResponseParser.parseStatistics(response),
      };
    }

    if (ResponseValidator.isEmbeddingStatusResponse(response)) {
      return {
        type: "embeddingStatus",
        data: ResponseParser.parseEmbeddingStatus(response),
      };
    }

    if (ResponseValidator.isArrayResponse(response)) {
      return {
        type: "array",
        data: response,
        meta: {
          total: response.length,
          totalPages: 1,
        },
      };
    }

    return {
      type: "unknown",
      data: response,
    };
  }
}

export default ResponseHandler;
