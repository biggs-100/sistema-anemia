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
    pub peso: Option<f64>,
    pub talla: Option<f64>,
    pub hemoglobina: Option<f64>,
    pub diagnostico: Option<String>,
    pub tratamiento_id: Option<i64>,
    pub observaciones: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTreatmentDTO {
    pub paciente_id: i64,
    pub fecha_inicio: String,
    pub tipo_tratamiento: String,
    pub dosis: Option<String>,
    pub observaciones: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginDTO {
    pub usuario: String,
    pub password: String,
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
