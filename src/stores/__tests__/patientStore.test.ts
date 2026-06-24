import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePatientStore } from "../patientStore";

// Mock the patientService
vi.mock("@/services/patientService", () => ({
  patientService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    getById: vi.fn(),
    deactivate: vi.fn(),
    listCentrosPoblados: vi.fn(),
  },
}));

// Mock authStore for token access
vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: () => ({ token: "mock-token" }),
  },
}));

const { patientService } = await import("@/services/patientService");

describe("patientStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    usePatientStore.setState({
      patients: [],
      total: 0,
      page: 1,
      pageSize: 20,
      searchQuery: "",
      loading: false,
      error: null,
      selectedPatient: null,
      loadingDetail: false,
      centrosPoblados: [],
      loadingCentros: false,
    });
  });

  describe("initial state", () => {
    it("has empty patients array", () => {
      const state = usePatientStore.getState();
      expect(state.patients).toEqual([]);
      expect(state.total).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("loadPatients", () => {
    it("updates state with patients on success", async () => {
      const mockData = {
        data: [
          { id: 1, nombres: "Juan", apellidoPaterno: "Pérez", historiaClinica: "001", dni: "12345678" },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      };
      vi.mocked(patientService.list).mockResolvedValue(mockData);

      await usePatientStore.getState().loadPatients();

      const state = usePatientStore.getState();
      expect(state.patients).toEqual(mockData.data);
      expect(state.total).toBe(1);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error on failure", async () => {
      vi.mocked(patientService.list).mockRejectedValue(new Error("Error de conexión"));

      await usePatientStore.getState().loadPatients();

      const state = usePatientStore.getState();
      expect(state.error).toBe("Error de conexión");
      expect(state.loading).toBe(false);
    });
  });
});
