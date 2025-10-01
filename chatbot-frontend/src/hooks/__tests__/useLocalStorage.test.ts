import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../useLocalStorage";

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("useLocalStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial value when localStorage is empty", () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default-value")
    );

    expect(result.current[0]).toBe("default-value");
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("test-key");
  });

  it("should return stored value from localStorage", () => {
    mockLocalStorage.getItem.mockReturnValue('"stored-value"');

    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default-value")
    );

    expect(result.current[0]).toBe("stored-value");
  });

  it("should store value in localStorage when setValue is called", () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default-value")
    );

    act(() => {
      result.current[1]("new-value");
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "test-key",
      '"new-value"'
    );
    expect(result.current[0]).toBe("new-value");
  });

  it("should handle function updates", () => {
    mockLocalStorage.getItem.mockReturnValue('"initial-value"');

    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default-value")
    );

    act(() => {
      result.current[1]((prev: string) => prev + "-updated");
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "test-key",
      '"initial-value-updated"'
    );
    expect(result.current[0]).toBe("initial-value-updated");
  });

  it("should handle complex objects", () => {
    const complexObject = { name: "test", nested: { value: 123 } };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(complexObject));

    const { result } = renderHook(() => useLocalStorage("test-key", {}));

    expect(result.current[0]).toEqual(complexObject);

    act(() => {
      result.current[1]({ ...complexObject, updated: true });
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "test-key",
      JSON.stringify({ ...complexObject, updated: true })
    );
  });

  it("should handle arrays", () => {
    const testArray = [1, 2, 3, "test"];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testArray));

    const { result } = renderHook(() => useLocalStorage("test-key", []));

    expect(result.current[0]).toEqual(testArray);

    act(() => {
      result.current[1]([...testArray, "new-item"]);
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "test-key",
      JSON.stringify([...testArray, "new-item"])
    );
  });

  it("should handle localStorage errors gracefully", () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error("localStorage error");
    });

    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default-value")
    );

    expect(result.current[0]).toBe("default-value");
  });

  it("should handle JSON parse errors gracefully", () => {
    mockLocalStorage.getItem.mockReturnValue("invalid-json");

    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default-value")
    );

    expect(result.current[0]).toBe("default-value");
  });

  it("should handle setItem errors gracefully", () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error("Storage quota exceeded");
    });

    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default-value")
    );

    // Should not throw error
    act(() => {
      result.current[1]("new-value");
    });

    // Value should still be updated in state even if localStorage fails
    expect(result.current[0]).toBe("new-value");
  });

  it("should handle boolean values", () => {
    mockLocalStorage.getItem.mockReturnValue("true");

    const { result } = renderHook(() => useLocalStorage("test-key", false));

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1](false);
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("test-key", "false");
  });

  it("should handle number values", () => {
    mockLocalStorage.getItem.mockReturnValue("42");

    const { result } = renderHook(() => useLocalStorage("test-key", 0));

    expect(result.current[0]).toBe(42);

    act(() => {
      result.current[1](100);
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("test-key", "100");
  });
});
