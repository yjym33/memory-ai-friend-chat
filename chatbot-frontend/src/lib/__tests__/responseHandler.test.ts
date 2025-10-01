import { ResponseHandler } from "../responseHandler";
import type {
  ApiResponseType,
  PaginatedResponse,
  UserListResponse,
  DocumentListResponse,
  OrganizationListResponse,
  Statistics,
  EmbeddingStatus,
} from "../../types";

describe("ResponseHandler", () => {
  let responseHandler: ResponseHandler;

  beforeEach(() => {
    responseHandler = new ResponseHandler();
  });

  describe("parseUserListResponse", () => {
    it("should parse valid user list response", () => {
      const mockResponse = {
        users: [
          { id: 1, name: "John", email: "john@test.com" },
          { id: 2, name: "Jane", email: "jane@test.com" },
        ],
        pagination: {
          page: 1,
          totalPages: 5,
          totalCount: 50,
        },
      };

      const result = responseHandler.parseUserListResponse(mockResponse);

      expect(result.users).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.totalCount).toBe(50);
    });

    it("should handle response without pagination", () => {
      const mockResponse = {
        users: [{ id: 1, name: "John", email: "john@test.com" }],
      };

      const result = responseHandler.parseUserListResponse(mockResponse);

      expect(result.users).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.totalCount).toBe(1);
    });

    it("should handle empty user list", () => {
      const mockResponse = { users: [] };

      const result = responseHandler.parseUserListResponse(mockResponse);

      expect(result.users).toHaveLength(0);
      expect(result.pagination.totalCount).toBe(0);
    });

    it("should throw error for invalid response", () => {
      const invalidResponse = { data: "invalid" };

      expect(() => {
        responseHandler.parseUserListResponse(invalidResponse);
      }).toThrow("Invalid user list response format");
    });
  });

  describe("parseDocumentListResponse", () => {
    it("should parse valid document list response", () => {
      const mockResponse = {
        documents: [
          { id: "1", title: "Doc 1", type: "pdf" },
          { id: "2", title: "Doc 2", type: "docx" },
        ],
        pagination: {
          page: 1,
          totalPages: 3,
          totalCount: 25,
        },
      };

      const result = responseHandler.parseDocumentListResponse(mockResponse);

      expect(result.documents).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(3);
    });

    it("should handle array response format", () => {
      const mockResponse = [
        { id: "1", title: "Doc 1", type: "pdf" },
        { id: "2", title: "Doc 2", type: "docx" },
      ];

      const result = responseHandler.parseDocumentListResponse(mockResponse);

      expect(result.documents).toHaveLength(2);
      expect(result.pagination.totalCount).toBe(2);
    });

    it("should throw error for invalid document response", () => {
      const invalidResponse = { files: [] };

      expect(() => {
        responseHandler.parseDocumentListResponse(invalidResponse);
      }).toThrow("Invalid document list response format");
    });
  });

  describe("parseOrganizationListResponse", () => {
    it("should parse valid organization list response", () => {
      const mockResponse = {
        organizations: [
          { id: "1", name: "Org 1", memberCount: 10 },
          { id: "2", name: "Org 2", memberCount: 5 },
        ],
      };

      const result =
        responseHandler.parseOrganizationListResponse(mockResponse);

      expect(result.organizations).toHaveLength(2);
      expect(result.organizations[0].name).toBe("Org 1");
    });

    it("should handle array response format", () => {
      const mockResponse = [{ id: "1", name: "Org 1", memberCount: 10 }];

      const result =
        responseHandler.parseOrganizationListResponse(mockResponse);

      expect(result.organizations).toHaveLength(1);
    });

    it("should throw error for invalid organization response", () => {
      const invalidResponse = { companies: [] };

      expect(() => {
        responseHandler.parseOrganizationListResponse(invalidResponse);
      }).toThrow("Invalid organization list response format");
    });
  });

  describe("parseStatisticsResponse", () => {
    it("should parse valid statistics response", () => {
      const mockResponse = {
        totalUsers: 100,
        totalDocuments: 50,
        totalConversations: 200,
        activeUsers: 75,
      };

      const result = responseHandler.parseStatisticsResponse(mockResponse);

      expect(result.totalUsers).toBe(100);
      expect(result.totalDocuments).toBe(50);
      expect(result.totalConversations).toBe(200);
      expect(result.activeUsers).toBe(75);
    });

    it("should handle partial statistics", () => {
      const mockResponse = {
        totalUsers: 50,
      };

      const result = responseHandler.parseStatisticsResponse(mockResponse);

      expect(result.totalUsers).toBe(50);
      expect(result.totalDocuments).toBe(0);
      expect(result.totalConversations).toBe(0);
    });

    it("should throw error for invalid statistics response", () => {
      const invalidResponse = { stats: "invalid" };

      expect(() => {
        responseHandler.parseStatisticsResponse(invalidResponse);
      }).toThrow("Invalid statistics response format");
    });
  });

  describe("parseEmbeddingStatusResponse", () => {
    it("should parse valid embedding status response", () => {
      const mockResponse = {
        total: 100,
        processed: 80,
        pending: 15,
        failed: 5,
        processingRate: 0.8,
      };

      const result = responseHandler.parseEmbeddingStatusResponse(mockResponse);

      expect(result.total).toBe(100);
      expect(result.processed).toBe(80);
      expect(result.pending).toBe(15);
      expect(result.failed).toBe(5);
      expect(result.processingRate).toBe(0.8);
    });

    it("should handle minimal embedding status", () => {
      const mockResponse = {
        total: 10,
        processed: 5,
      };

      const result = responseHandler.parseEmbeddingStatusResponse(mockResponse);

      expect(result.total).toBe(10);
      expect(result.processed).toBe(5);
      expect(result.pending).toBe(0);
      expect(result.failed).toBe(0);
    });

    it("should throw error for invalid embedding status response", () => {
      const invalidResponse = { status: "unknown" };

      expect(() => {
        responseHandler.parseEmbeddingStatusResponse(invalidResponse);
      }).toThrow("Invalid embedding status response format");
    });
  });

  describe("validateResponse", () => {
    it("should validate response with required fields", () => {
      const response = { name: "test", age: 25 };
      const requiredFields = ["name", "age"];

      expect(() => {
        responseHandler.validateResponse(response, requiredFields);
      }).not.toThrow();
    });

    it("should throw error for missing required fields", () => {
      const response = { name: "test" };
      const requiredFields = ["name", "age", "email"];

      expect(() => {
        responseHandler.validateResponse(response, requiredFields);
      }).toThrow("Missing required fields: age, email");
    });

    it("should handle null or undefined response", () => {
      expect(() => {
        responseHandler.validateResponse(null, ["name"]);
      }).toThrow("Response is null or undefined");

      expect(() => {
        responseHandler.validateResponse(undefined, ["name"]);
      }).toThrow("Response is null or undefined");
    });
  });

  describe("createPaginationInfo", () => {
    it("should create pagination info from response", () => {
      const response = {
        page: 2,
        totalPages: 10,
        totalCount: 100,
        limit: 10,
      };

      const result = responseHandler.createPaginationInfo(response);

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(10);
      expect(result.totalCount).toBe(100);
      expect(result.limit).toBe(10);
    });

    it("should provide defaults for missing pagination fields", () => {
      const response = {};

      const result = responseHandler.createPaginationInfo(response);

      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.totalCount).toBe(0);
      expect(result.limit).toBe(20);
    });

    it("should handle array length for totalCount", () => {
      const response = {};
      const arrayLength = 15;

      const result = responseHandler.createPaginationInfo(
        response,
        arrayLength
      );

      expect(result.totalCount).toBe(15);
      expect(result.totalPages).toBe(1);
    });
  });
});
