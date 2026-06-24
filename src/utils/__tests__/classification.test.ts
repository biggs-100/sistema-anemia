import { describe, it, expect } from "vitest";
import { classifyHemoglobina, getColorForClassification, getLabelForClassification } from "../classification";
import type { HemoglobinaLevel } from "../classification";

describe("classifyHemoglobina", () => {
  it("returns 'normal' for values >= 11.0", () => {
    expect(classifyHemoglobina(12.0)).toBe("normal");
    expect(classifyHemoglobina(11.0)).toBe("normal");
    expect(classifyHemoglobina(15.0)).toBe("normal");
  });

  it("returns 'leve' for values between 10.0 and 10.9", () => {
    expect(classifyHemoglobina(10.5)).toBe("leve");
    expect(classifyHemoglobina(10.0)).toBe("leve");
    expect(classifyHemoglobina(10.9)).toBe("leve");
  });

  it("returns 'moderada' for values between 7.0 and 9.9", () => {
    expect(classifyHemoglobina(8.0)).toBe("moderada");
    expect(classifyHemoglobina(7.0)).toBe("moderada");
    expect(classifyHemoglobina(9.9)).toBe("moderada");
  });

  it("returns 'severa' for values < 7.0", () => {
    expect(classifyHemoglobina(5.0)).toBe("severa");
    expect(classifyHemoglobina(6.9)).toBe("severa");
    expect(classifyHemoglobina(0)).toBe("severa");
  });
});

describe("getColorForClassification", () => {
  it("returns green for normal", () => {
    expect(getColorForClassification("normal")).toBe("bg-green-100 text-green-800");
  });

  it("returns yellow for leve", () => {
    expect(getColorForClassification("leve")).toBe("bg-yellow-100 text-yellow-800");
  });

  it("returns orange for moderada", () => {
    expect(getColorForClassification("moderada")).toBe("bg-orange-100 text-orange-800");
  });

  it("returns red for severa", () => {
    expect(getColorForClassification("severa")).toBe("bg-red-100 text-red-800");
  });
});

describe("getLabelForClassification", () => {
  it("returns correct labels", () => {
    expect(getLabelForClassification("normal")).toBe("Normal");
    expect(getLabelForClassification("leve")).toBe("Leve");
    expect(getLabelForClassification("moderada")).toBe("Moderada");
    expect(getLabelForClassification("severa")).toBe("Severa");
  });
});
