export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  PATIENTS: "/patients",
  PATIENT_NEW: "/patients/new",
  PATIENT_DETAIL: "/patients/:id",
  PATIENT_EDIT: "/patients/:id/edit",
  CONTROLS: "/controls",
  TREATMENTS: "/treatments",
  REPORTS: "/reports",
  ALERTS: "/alerts",
  USERS: "/users",
  SETTINGS: "/settings",
} as const;

export const API_COMMANDS = {
  // Auth
  LOGIN: "login",
  LOGOUT: "logout",
  CURRENT_USER: "current_user",
  CHANGE_PASSWORD: "change_password",

  // Patients
  CREATE_PATIENT: "create_patient",
  UPDATE_PATIENT: "update_patient",
  GET_PATIENT: "get_patient",
  SEARCH_PATIENTS: "search_patients",
  DEACTIVATE_PATIENT: "deactivate_patient",
  LIST_CENTROS_POBLADOS: "list_centros_poblados",

  // Controls
  CREATE_CONTROL: "create_control",
  UPDATE_CONTROL: "update_control",
  GET_CONTROLS: "get_controls",

  // Treatments
  CREATE_TREATMENT: "create_treatment",
  FINISH_TREATMENT: "finish_treatment",
  GET_TREATMENTS: "get_treatments",

  // Reports
  GENERATE_PDF: "generate_pdf",
  GENERATE_EXCEL: "generate_excel",

  // Backups
  CREATE_BACKUP: "create_backup",
  RESTORE_BACKUP: "restore_backup",
  LIST_BACKUPS: "list_backups",

  // Users
  LIST_USERS: "list_users",
  CREATE_USER: "create_user",
  UPDATE_USER: "update_user",
  DEACTIVATE_USER: "deactivate_user",
} as const;

export const ANEMIA_THRESHOLDS = {
  /** Hemoglobin g/dL thresholds for anemia classification */
  NORMAL_MIN: 11.0,
  LEVE_MIN: 10.0,
  MODERADA_MIN: 7.0,
  /** Below this is severe */
  SEVERA_MAX: 7.0,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const DATE_FORMAT = "YYYY-MM-DD" as const;

export const SEXO_LABELS: Record<string, string> = {
  M: "Masculino",
  F: "Femenino",
} as const;
