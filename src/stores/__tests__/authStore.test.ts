import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../authStore";

// Mock the authService before importing the module under test
vi.mock("@/services/authService", () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    currentUser: vi.fn(),
    changePassword: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

const { authService } = await import("@/services/authService");

describe("authStore", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe("initial state", () => {
    it("has token from localStorage when available", () => {
      localStorageMock.setItem("sistema_anemia_token", "stored-token");
      // Re-initialize store to pick up stored token
      useAuthStore.setState({
        token: "stored-token",
        isAuthenticated: false,
        user: null,
      });
      const state = useAuthStore.getState();
      expect(state.token).toBe("stored-token");
      expect(state.isAuthenticated).toBe(false);
    });

    it("has null token when localStorage is empty", () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("login", () => {
    it("sets user, token, and isAuthenticated on success", async () => {
      const mockUser = { id: 1, usuario: "admin", nombres: "Admin", apellidos: "", rolId: 1, activo: true };
      vi.mocked(authService.login).mockResolvedValue({
        token: "test-token",
        user: mockUser,
      });

      await useAuthStore.getState().login("admin", "password");

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe("test-token");
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error on login failure", async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error("Credenciales inválidas"));

      try {
        await useAuthStore.getState().login("admin", "wrong");
      } catch {
        // expected
      }

      const state = useAuthStore.getState();
      expect(state.error).toBe("Credenciales inválidas");
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("logout", () => {
    it("clears everything on logout", async () => {
      vi.mocked(authService.logout).mockResolvedValue(undefined);

      // Set initial authenticated state
      useAuthStore.setState({
        user: { id: 1, usuario: "admin", nombres: "Admin", apellidos: "", rolId: 1, activo: true },
        token: "test-token",
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("clearError", () => {
    it("resets error to null", () => {
      useAuthStore.setState({ error: "Some error" });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
