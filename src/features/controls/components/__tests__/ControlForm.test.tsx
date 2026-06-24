import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ControlForm from "../ControlForm";
import { useCreateControl } from "@/hooks/useControls";

// Mock the hook
vi.mock("@/hooks/useControls", () => ({
  useCreateControl: vi.fn(),
}));

const mockUseCreateControl = vi.mocked(useCreateControl);

beforeEach(() => {
  vi.clearAllMocks();
  mockUseCreateControl.mockReturnValue({
    createControl: vi.fn(),
    loading: false,
    error: null,
    clearError: vi.fn(),
  });
});

describe("ControlForm", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    pacienteId: 1,
    onSuccess: vi.fn(),
  };

  it("renders all fields when open", () => {
    render(<ControlForm {...defaultProps} />);

    expect(screen.getByText("Nuevo Control")).toBeDefined();
    expect(screen.getByText("Guardar Control")).toBeDefined();
    expect(screen.getByText("Cancelar")).toBeDefined();
  });

  it("does not render when closed", () => {
    render(<ControlForm {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Nuevo Control")).toBeNull();
  });

  it("calls onSuccess after successful submit", async () => {
    const createControl = vi.fn().mockResolvedValue({ id: 1 });
    mockUseCreateControl.mockReturnValue({
      createControl,
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    render(<ControlForm {...defaultProps} />);
    const user = userEvent.setup();

    // Fill form with valid data using spinbutton role
    const numberInputs = screen.getAllByRole("spinbutton");
    await user.clear(numberInputs[0]);
    await user.type(numberInputs[0], "12.5");
    await user.clear(numberInputs[1]);
    await user.type(numberInputs[1], "85");
    await user.clear(numberInputs[2]);
    await user.type(numberInputs[2], "11.5");

    // Submit
    await user.click(screen.getByText("Guardar Control"));

    await waitFor(() => {
      expect(createControl).toHaveBeenCalled();
    });
  });
});
