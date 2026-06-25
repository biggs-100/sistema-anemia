#![allow(dead_code)]

use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Command DTOs
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePatientDTO {
    pub historia_clinica: String,
    pub dni: String,
    pub nombres: String,
    pub apellido_paterno: String,
    pub apellido_materno: String,
    pub fecha_nacimiento: String,
    pub sexo: String,
    pub direccion: Option<String>,
    pub centro_poblado_id: Option<i64>,
    pub nombre_apoderado: Option<String>,
    pub celular_apoderado: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePatientDTO {
    pub id: i64,
    pub historia_clinica: Option<String>,
    pub dni: Option<String>,
    pub nombres: Option<String>,
    pub apellido_paterno: Option<String>,
    pub apellido_materno: Option<String>,
    pub fecha_nacimiento: Option<String>,
    pub sexo: Option<String>,
    pub direccion: Option<String>,
    pub centro_poblado_id: Option<i64>,
    pub nombre_apoderado: Option<String>,
    pub celular_apoderado: Option<String>,
    pub activo: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateControlDTO {
    pub paciente_id: i64,
    pub fecha_control: String,
    pub edad_meses: Option<i32>,
    pub peso: Option<f64>,
    pub talla: Option<f64>,
    pub hemoglobina: Option<f64>,
    pub temperatura: Option<f64>,
    pub observaciones: Option<String>,
    pub usuario_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTreatmentDTO {
    pub paciente_id: i64,
    pub medicamento_id: i64,
    pub dosis: Option<String>,
    pub frecuencia: Option<String>,
    pub fecha_inicio: String,
    pub observaciones: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginDTO {
    pub usuario: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateUserDTO {
    pub usuario: String,
    pub password: String,
    pub nombres: String,
    pub apellidos: String,
    pub rol_id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserDTO {
    pub nombres: Option<String>,
    pub apellidos: Option<String>,
    pub rol_id: Option<i64>,
    pub activo: Option<bool>,
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

/// Public-facing patient data with computed edad.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatientResponse {
    pub id: i64,
    pub historia_clinica: String,
    pub dni: String,
    pub nombres: String,
    pub apellido_paterno: String,
    pub apellido_materno: String,
    pub fecha_nacimiento: String,
    pub sexo: String,
    pub edad: String,
    pub direccion: Option<String>,
    pub centro_poblado_id: Option<i64>,
    pub centro_poblado_nombre: Option<String>,
    pub nombre_apoderado: Option<String>,
    pub celular_apoderado: Option<String>,
    pub fecha_registro: Option<String>,
    pub activo: bool,
}

/// DTO for creating a centro poblado.
/// Result of CSV patient import.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub imported: i64,
    pub errors: i64,
    pub details: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCentroPobladoDTO {
    pub nombre: String,
    pub distrito: String,
    pub provincia: String,
    pub departamento: String,
}

/// Public-facing centro poblado data.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CentroPobladoResponse {
    pub id: i64,
    pub nombre: String,
    pub distrito: String,
    pub provincia: String,
    pub departamento: String,
}

/// Paginated search result wrapper.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult<T: Serialize> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

/// Public-facing treatment response with patient and medication names.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TreatmentResponse {
    pub id: i64,
    pub paciente_id: i64,
    pub paciente_nombre: String,
    pub medicamento_id: i64,
    pub medicamento_nombre: String,
    pub dosis: Option<String>,
    pub frecuencia: Option<String>,
    pub fecha_inicio: String,
    pub fecha_fin: Option<String>,
    pub estado: String,
    pub observaciones: Option<String>,
}

/// Public-facing medicamento response for dropdowns.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MedicamentoResponse {
    pub id: i64,
    pub nombre: String,
}

/// DTO for updating a treatment's mutable fields.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTreatmentDTO {
    pub dosis: Option<String>,
    pub frecuencia: Option<String>,
    pub observaciones: Option<String>,
}

/// Public-facing control response with computed `clasificacion`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlResponse {
    pub id: i64,
    pub paciente_id: i64,
    pub fecha_control: String,
    pub edad_meses: Option<i64>,
    pub peso: f64,
    pub talla: f64,
    pub hemoglobina: f64,
    /// Computed anemia severity: "normal" | "leve" | "moderada" | "severa"
    pub clasificacion: String,
    pub temperatura: Option<f64>,
    pub observaciones: Option<String>,
    pub usuario_id: i64,
    pub creado_en: Option<String>,
}

/// Return type for `create_control` command — identical to `ControlResponse`.
pub type CreateControlResponse = ControlResponse;

/// Public-facing alert response with patient name.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlertaResponse {
    pub id: i64,
    pub paciente_id: i64,
    pub paciente_nombre: Option<String>,
    pub tipo: String,
    pub descripcion: Option<String>,
    pub fecha: Option<String>,
    pub resuelta: bool,
}

/// Public-facing visita domiciliaria response.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VisitaResponse {
    pub id: i64,
    pub paciente_id: i64,
    pub paciente_nombre: Option<String>,
    pub fecha_visita: String,
    pub responsable: Option<String>,
    pub resultado: Option<String>,
    pub observaciones: Option<String>,
}

/// DTO for creating a visita domiciliaria.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateVisitaDTO {
    pub paciente_id: i64,
    pub fecha_visita: String,
    pub responsable: Option<String>,
    pub resultado: Option<String>,
    pub observaciones: Option<String>,
}

// ---------------------------------------------------------------------------
// Generic API Response
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    pub message: String,
    pub data: Option<T>,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            message: String::new(),
            data: Some(data),
        }
    }

    pub fn error(msg: impl Into<String>) -> Self {
        Self {
            success: false,
            message: msg.into(),
            data: None,
        }
    }
}
