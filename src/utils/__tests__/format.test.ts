import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime } from "../format";

describe("formatDate", () => {
  it("returns formatted date for valid ISO string", () => {
    const result = formatDate("2024-06-15T12:00:00");
    // es-PE locale uses DD/MM/YYYY
    expect(result).toBe("15/06/2024");
  });

  it("returns original string on invalid date", () => {
    const result = formatDate("invalid-date");
    expect(result).toBe("invalid-date");
  });
});

describe("formatDateTime", () => {
  it("returns formatted datetime for valid ISO string", () => {
    const result = formatDateTime("2024-06-15T14:30:00");
    // Should contain date and time
    expect(result).toContain("15/06/2024");
  });

  it("returns original string on invalid date", () => {
    const result = formatDateTime("not-a-date");
    expect(result).toBe("not-a-date");
  });
});
