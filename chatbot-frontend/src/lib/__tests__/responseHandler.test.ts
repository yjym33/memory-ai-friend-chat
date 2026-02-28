import { ResponseParser, ResponseValidator, ResponseHandler } from "../responseHandler";

describe("ResponseValidator", () => {
  describe("isUserListResponse", () => {
    it("should return true for valid user list response", () => {
      const response = {
        users: [{ id: "1", email: "test@test.com" }],
        pagination: { total: 1, totalPages: 1 }
      };
      expect(ResponseValidator.isUserListResponse(response)).toBe(true);
    });

    it("should return false for invalid response", () => {
      expect(ResponseValidator.isUserListResponse({ data: [] })).toBe(false);
      expect(ResponseValidator.isUserListResponse(null)).toBe(false);
    });
  });
});

describe("ResponseParser", () => {
  describe("parseUserList", () => {
    it("should parse valid user list response", () => {
      const response = {
        users: [{ id: "1", email: "test@test.com" }],
        pagination: { total: 10, totalPages: 2 }
      };
      const result = ResponseParser.parseUserList(response);
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(2);
    });

    it("should handle array response", () => {
      const response = [{ id: "1", email: "test@test.com" }];
      const result = ResponseParser.parseUserList(response);
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });
});

describe("ResponseHandler", () => {
  describe("autoParseResponse", () => {
    it("should auto detect user list response", () => {
      const response = {
        users: [{ id: "1", email: "test@test.com" }],
        pagination: { total: 1, totalPages: 1 }
      };
      const result = ResponseHandler.autoParseResponse(response);
      expect(result.type).toBe("userList");
      expect(result.data).toHaveLength(1);
    });
  });
});
