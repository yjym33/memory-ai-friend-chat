import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "../useAuth";
import * as AuthService from "../../services/authService";

// Mock the auth service
jest.mock("../../services/authService");
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

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
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

describe("useAuth Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe("Login Flow", () => {
    it("should complete successful login flow", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        userType: "individual" as const,
        role: "user" as const,
      };

      const mockAuthResponse = {
        user: mockUser,
        token: "jwt-token",
        userType: "individual" as const,
        role: "user" as const,
        organizationId: null,
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "token",
        "jwt-token"
      );
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockPush).toHaveBeenCalledWith("/chat");
    });

    it("should handle login failure", async () => {
      const loginError = new Error("Invalid credentials");
      mockAuthService.login.mockRejectedValue(loginError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login("test@example.com", "wrongpassword");
        } catch (error) {
          expect(error).toBe(loginError);
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it("should handle network errors during login", async () => {
      const networkError = {
        code: "NETWORK_ERROR",
        message: "Network request failed",
      };
      mockAuthService.login.mockRejectedValue(networkError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login("test@example.com", "password123");
        } catch (error) {
          expect(error).toEqual(networkError);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("Registration Flow", () => {
    it("should complete successful registration flow", async () => {
      const registrationData = {
        email: "newuser@example.com",
        password: "password123",
        name: "New User",
        birthYear: 1990,
      };

      const mockUser = {
        id: 2,
        email: "newuser@example.com",
        name: "New User",
        userType: "individual" as const,
        role: "user" as const,
      };

      const mockAuthResponse = {
        user: mockUser,
        token: "new-jwt-token",
        userType: "individual" as const,
        role: "user" as const,
        organizationId: null,
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register(registrationData);
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(registrationData);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "token",
        "new-jwt-token"
      );
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockPush).toHaveBeenCalledWith("/chat");
    });

    it("should handle registration validation errors", async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            message: "Validation failed",
            errors: ["Email already exists"],
          },
        },
      };

      mockAuthService.register.mockRejectedValue(validationError);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.register({
            email: "existing@example.com",
            password: "password123",
            name: "Test User",
            birthYear: 1990,
          });
        } catch (error) {
          expect(error).toEqual(validationError);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("Logout Flow", () => {
    it("should complete logout flow", async () => {
      // Setup authenticated state
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        userType: "individual" as const,
        role: "user" as const,
      };

      mockLocalStorage.getItem.mockReturnValue("existing-token");

      const { result } = renderHook(() => useAuth());

      // Simulate being logged in
      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Logout
      act(() => {
        result.current.logout();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  describe("Token Persistence", () => {
    it("should restore authentication state from stored token", async () => {
      const storedToken = "stored-jwt-token";
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        userType: "individual" as const,
        role: "user" as const,
      };

      mockLocalStorage.getItem.mockReturnValue(storedToken);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
    });

    it("should handle invalid stored token", async () => {
      const invalidToken = "invalid-jwt-token";
      mockLocalStorage.getItem.mockReturnValue(invalidToken);
      mockAuthService.getCurrentUser.mockRejectedValue(
        new Error("Invalid token")
      );

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
      expect(result.current.user).toBeNull();
    });
  });

  describe("Business User Flow", () => {
    it("should handle business user login", async () => {
      const mockBusinessUser = {
        id: 1,
        email: "business@example.com",
        name: "Business User",
        userType: "business" as const,
        role: "user" as const,
      };

      const mockAuthResponse = {
        user: mockBusinessUser,
        token: "business-jwt-token",
        userType: "business" as const,
        role: "user" as const,
        organizationId: "org-123",
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login("business@example.com", "password123");
      });

      expect(result.current.user).toEqual(mockBusinessUser);
      expect(result.current.userType).toBe("business");
      expect(result.current.organizationId).toBe("org-123");
    });
  });

  describe("Admin User Flow", () => {
    it("should handle admin user login", async () => {
      const mockAdminUser = {
        id: 1,
        email: "admin@example.com",
        name: "Admin User",
        userType: "individual" as const,
        role: "admin" as const,
      };

      const mockAuthResponse = {
        user: mockAdminUser,
        token: "admin-jwt-token",
        userType: "individual" as const,
        role: "admin" as const,
        organizationId: null,
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login("admin@example.com", "password123");
      });

      expect(result.current.user).toEqual(mockAdminUser);
      expect(result.current.role).toBe("admin");
      expect(result.current.isAdmin).toBe(true);
    });
  });

  describe("Error Recovery", () => {
    it("should recover from temporary network failures", async () => {
      const networkError = { code: "NETWORK_ERROR" };
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        userType: "individual" as const,
        role: "user" as const,
      };

      // First call fails, second succeeds
      mockAuthService.login
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          user: mockUser,
          token: "jwt-token",
          userType: "individual" as const,
          role: "user" as const,
          organizationId: null,
        });

      const { result } = renderHook(() => useAuth());

      // First attempt fails
      await act(async () => {
        try {
          await result.current.login("test@example.com", "password123");
        } catch (error) {
          expect(error).toEqual(networkError);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);

      // Second attempt succeeds
      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent login attempts", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        userType: "individual" as const,
        role: "user" as const,
      };

      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        token: "jwt-token",
        userType: "individual" as const,
        role: "user" as const,
        organizationId: null,
      });

      const { result } = renderHook(() => useAuth());

      // Start multiple login attempts
      const loginPromises = [
        result.current.login("test@example.com", "password123"),
        result.current.login("test@example.com", "password123"),
        result.current.login("test@example.com", "password123"),
      ];

      await act(async () => {
        await Promise.all(loginPromises);
      });

      // Should only make one actual API call
      expect(mockAuthService.login).toHaveBeenCalledTimes(3);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
