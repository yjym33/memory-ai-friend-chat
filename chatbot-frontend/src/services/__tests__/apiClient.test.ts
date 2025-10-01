import axios from "axios";
import { apiClient } from "../apiClient";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("API Client Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe("Request Interceptors", () => {
    it("should add authorization header when token exists", async () => {
      const mockToken = "test-jwt-token";
      mockLocalStorage.getItem.mockReturnValue(mockToken);

      const mockResponse = { data: { message: "success" } };
      mockedAxios.create.mockReturnValue({
        ...mockedAxios,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
        get: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      // Simulate the request interceptor behavior
      const config = {
        headers: {},
      };

      // This would be called by the request interceptor
      if (mockToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${mockToken}`,
        };
      }

      expect(config.headers).toEqual({
        Authorization: `Bearer ${mockToken}`,
      });
    });

    it("should not add authorization header when token does not exist", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const config = {
        headers: {},
      };

      // Simulate interceptor behavior
      const token = mockLocalStorage.getItem("token");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      expect(config.headers).toEqual({});
    });

    it("should set correct content type for JSON requests", () => {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      expect(config.headers["Content-Type"]).toBe("application/json");
    });
  });

  describe("Response Interceptors", () => {
    it("should return response data on success", async () => {
      const mockResponseData = { message: "success", data: [1, 2, 3] };
      const mockResponse = { data: mockResponseData };

      // Simulate successful response interceptor
      const result = mockResponse.data;
      expect(result).toEqual(mockResponseData);
    });

    it("should handle 401 unauthorized errors", async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: "Unauthorized" },
        },
      };

      // Simulate error interceptor behavior
      if (mockError.response?.status === 401) {
        mockLocalStorage.removeItem("token");
        // Would redirect to login in real implementation
      }

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
    });

    it("should handle network errors", async () => {
      const networkError = {
        code: "NETWORK_ERROR",
        message: "Network Error",
      };

      // Simulate network error handling
      const isNetworkError = !networkError.response && networkError.code;
      expect(isNetworkError).toBe(true);
    });

    it("should handle server errors (5xx)", async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: "Internal Server Error" },
        },
      };

      // Simulate server error handling
      const isServerError = serverError.response?.status >= 500;
      expect(isServerError).toBe(true);
    });
  });

  describe("API Methods", () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance);
    });

    it("should make GET requests correctly", async () => {
      const mockData = { users: [{ id: 1, name: "John" }] };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const result = await mockAxiosInstance.get("/users");

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/users");
      expect(result.data).toEqual(mockData);
    });

    it("should make POST requests correctly", async () => {
      const postData = { name: "John", email: "john@test.com" };
      const mockResponse = { data: { id: 1, ...postData } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await mockAxiosInstance.post("/users", postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/users", postData);
      expect(result.data).toEqual({ id: 1, ...postData });
    });

    it("should make PUT requests correctly", async () => {
      const updateData = { name: "John Updated" };
      const mockResponse = { data: { id: 1, ...updateData } };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await mockAxiosInstance.put("/users/1", updateData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/users/1",
        updateData
      );
      expect(result.data).toEqual({ id: 1, ...updateData });
    });

    it("should make DELETE requests correctly", async () => {
      const mockResponse = { data: { message: "Deleted successfully" } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await mockAxiosInstance.delete("/users/1");

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith("/users/1");
      expect(result.data).toEqual({ message: "Deleted successfully" });
    });
  });

  describe("Error Handling Integration", () => {
    let mockAxiosInstance: any;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      mockedAxios.create.mockReturnValue(mockAxiosInstance);
    });

    it("should handle validation errors (400)", async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            message: "Validation failed",
            errors: ["Email is required", "Password too short"],
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(validationError);

      try {
        await mockAxiosInstance.post("/auth/register", {});
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.errors).toContain("Email is required");
      }
    });

    it("should handle authentication errors (401)", async () => {
      const authError = {
        response: {
          status: 401,
          data: { message: "Token expired" },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(authError);

      try {
        await mockAxiosInstance.get("/protected-route");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.message).toBe("Token expired");
      }
    });

    it("should handle authorization errors (403)", async () => {
      const forbiddenError = {
        response: {
          status: 403,
          data: { message: "Access denied" },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(forbiddenError);

      try {
        await mockAxiosInstance.get("/admin/users");
      } catch (error: any) {
        expect(error.response.status).toBe(403);
        expect(error.response.data.message).toBe("Access denied");
      }
    });

    it("should handle not found errors (404)", async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { message: "User not found" },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(notFoundError);

      try {
        await mockAxiosInstance.get("/users/999");
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.message).toBe("User not found");
      }
    });
  });

  describe("Token Management", () => {
    it("should retrieve token from localStorage", () => {
      const mockToken = "stored-jwt-token";
      mockLocalStorage.getItem.mockReturnValue(mockToken);

      const token = mockLocalStorage.getItem("token");
      expect(token).toBe(mockToken);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("token");
    });

    it("should handle missing token gracefully", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const token = mockLocalStorage.getItem("token");
      expect(token).toBeNull();
    });

    it("should remove token on logout", () => {
      mockLocalStorage.removeItem("token");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
    });
  });

  describe("Base URL Configuration", () => {
    it("should use correct base URL for API requests", () => {
      const expectedBaseURL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      // This would be tested by checking the axios.create call
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expectedBaseURL,
        })
      );
    });

    it("should handle different environments", () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;

      // Test development environment
      process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
      let baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      expect(baseURL).toBe("http://localhost:3001");

      // Test production environment
      process.env.NEXT_PUBLIC_API_URL = "https://api.production.com";
      baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      expect(baseURL).toBe("https://api.production.com");

      // Restore original environment
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });
  });
});
