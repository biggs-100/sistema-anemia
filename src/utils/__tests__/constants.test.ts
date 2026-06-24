import { describe, it, expect } from "vitest";
import { ROUTES, API_COMMANDS, ANEMIA_THRESHOLDS } from "../constants";

describe("ROUTES", () => {
  it("has expected keys", () => {
    expect(ROUTES.LOGIN).toBe("/login");
    expect(ROUTES.DASHBOARD).toBe("/dashboard");
    expect(ROUTES.PATIENTS).toBe("/patients");
    expect(ROUTES.PATIENT_NEW).toBe("/patients/new");
    expect(ROUTES.PATIENT_DETAIL).toBe("/patients/:id");
    expect(ROUTES.PATIENT_EDIT).toBe("/patients/:id/edit");
    expect(ROUTES.CONTROLS).toBe("/controls");
    expect(ROUTES.TREATMENTS).toBe("/treatments");
    expect(ROUTES.REPORTS).toBe("/reports");
    expect(ROUTES.ALERTS).toBe("/alerts");
    expect(ROUTES.USERS).toBe("/users");
    expect(ROUTES.SETTINGS).toBe("/settings");
  });

  it("PATIENT_CONTROLS returns dynamic route", () => {
    expect(ROUTES.PATIENT_CONTROLS(5)).toBe("/patients/5?tab=controles");
  });
});

describe("API_COMMANDS", () => {
  it("has auth commands", () => {
    expect(API_COMMANDS.LOGIN).toBe("login");
    expect(API_COMMANDS.LOGOUT).toBe("logout");
    expect(API_COMMANDS.CURRENT_USER).toBe("current_user");
  });

  it("has patient commands", () => {
    expect(API_COMMANDS.CREATE_PATIENT).toBe("create_patient");
    expect(API_COMMANDS.SEARCH_PATIENTS).toBe("search_patients");
  });

  it("has treatment commands", () => {
    expect(API_COMMANDS.CREATE_TREATMENT).toBe("create_treatment");
    expect(API_COMMANDS.LIST_MEDICAMENTOS).toBe("list_medicamentos");
  });
});

describe("ANEMIA_THRESHOLDS", () => {
  it("NORMAL is >= 11.0", () => {
    expect(ANEMIA_THRESHOLDS.NORMAL).toBe(11.0);
    expect(ANEMIA_THRESHOLDS.NORMAL_MIN).toBe(11.0);
  });

  it("LEVE is >= 10.0", () => {
    expect(ANEMIA_THRESHOLDS.LEVE).toBe(10.0);
    expect(ANEMIA_THRESHOLDS.LEVE_MIN).toBe(10.0);
  });

  it("MODERADA is >= 7.0", () => {
    expect(ANEMIA_THRESHOLDS.MODERADA).toBe(7.0);
    expect(ANEMIA_THRESHOLDS.MODERADA_MIN).toBe(7.0);
  });

  it("SEVERA is < 7.0", () => {
    expect(ANEMIA_THRESHOLDS.SEVERA_MAX).toBe(7.0);
  });
});
