#![allow(dead_code)]

use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Domain entities matching the DB schema. All use serde(rename_all = "camelCase")
// for JSON consistency with the TypeScript frontend.
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Patient {
    pub id: i64,
    pub historia_clinica: String,
    pub dni: String,
    pub nombres: String,
    pub apellido_paterno: String,
    pub apellido_materno: String,
    pub fecha_nacimiento: String,
    pub sexo: String,
    pub direccion: Option<String>,
    pub centro_poblado_id: Option<i64>,
    pub centro_poblado_nombre: Option<String>,
    pub nombre_apoderado: Option<String>,
    pub celular_apoderado: Option<String>,
    pub fecha_registro: Option<String>,
    pub activo: bool,
    pub creado_en: Option<NaiveDateTime>,
    pub actualizado_en: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Control {
    pub id: i64,
    pub paciente_id: i64,
    pub fecha_control: String,
    pub edad_meses: Option<i32>,
    pub peso: Option<f64>,
    pub talla: Option<f64>,
    pub hemoglobina: Option<f64>,
    pub temperatura: Option<f64>,
    pub observaciones: Option<String>,
    pub usuario_id: Option<i64>,
    pub creado_en: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Treatment {
    pub id: i64,
    pub paciente_id: i64,
    pub medicamento_id: i64,
    pub dosis: Option<String>,
    pub frecuencia: Option<String>,
    pub fecha_inicio: String,
    pub fecha_fin: Option<String>,
    pub estado: String,
    pub observaciones: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: i64,
    pub usuario: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub nombres: String,
    pub apellidos: String,
    pub rol_id: i64,
    pub activo: bool,
    pub creado_en: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Role {
    pub id: i64,
    pub nombre: String,
}

/// Public-facing user response without password_hash.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserResponse {
    pub id: i64,
    pub usuario: String,
    pub nombres: String,
    pub apellidos: String,
    pub rol_id: i64,
    pub rol_nombre: String,
    pub activo: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CentroPoblado {
    pub id: i64,
    pub nombre: String,
    pub distrito: Option<String>,
    pub provincia: Option<String>,
    pub departamento: Option<String>,
    pub activo: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Alerta {
    pub id: i64,
    pub paciente_id: i64,
    pub tipo: String,
    pub descripcion: Option<String>,
    pub fecha_generada: Option<NaiveDateTime>,
    pub resuelta: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditLog {
    pub id: i64,
    pub usuario_id: Option<i64>,
    pub accion: String,
    pub tabla_afectada: String,
    pub registro_id: Option<i64>,
    pub datos_anteriores: Option<String>,
    pub datos_nuevos: Option<String>,
    pub fecha: Option<NaiveDateTime>,
    pub ip_local: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupHistory {
    pub id: i64,
    pub nombre_archivo: String,
    pub tamaño_mb: f64,
    pub fecha_generacion: Option<NaiveDateTime>,
    pub resultado: String,
    pub checksum: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Medicamento {
    pub id: i64,
    pub nombre: String,
    pub activo: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VisitaDomiciliaria {
    pub id: i64,
    pub paciente_id: i64,
    pub fecha_visita: String,
    pub responsable: Option<String>,
    pub resultado: Option<String>,
    pub observaciones: Option<String>,
}

/// Hemoglobin classification per Peruvian clinical guidelines (PRD-003 §6).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum HemoglobinaClasificacion {
    Normal,
    Leve,
    Moderada,
    Severa,
}

/// Anemia classification enum used in `ControlResponse` DTO.
///
/// This mirrors `HemoglobinaClasificacion` but is serialized as `snake_case`
/// strings for the frontend-facing API (`"normal"`, `"leve"`, etc.) and
/// provides convenience methods `from_hemoglobina` and `as_str`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ClasificacionAnemia {
    Normal,
    Leve,
    Moderada,
    Severa,
}

impl ClasificacionAnemia {
    pub fn from_hemoglobina(hb: f64) -> Self {
        if hb >= 11.0 {
            ClasificacionAnemia::Normal
        } else if hb >= 10.0 {
            ClasificacionAnemia::Leve
        } else if hb >= 7.0 {
            ClasificacionAnemia::Moderada
        } else {
            ClasificacionAnemia::Severa
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            ClasificacionAnemia::Normal => "normal",
            ClasificacionAnemia::Leve => "leve",
            ClasificacionAnemia::Moderada => "moderada",
            ClasificacionAnemia::Severa => "severa",
        }
    }
}

/// Classifies a hemoglobin value into a severity level.
///
/// * `Normal`   — hb >= 11.0 g/dL
/// * `Leve`     — 10.0 <= hb < 11.0
/// * `Moderada` — 7.0  <= hb < 10.0
/// * `Severa`   — hb < 7.0
pub fn classify_hemoglobina(hb: f64) -> HemoglobinaClasificacion {
    if hb >= 11.0 {
        HemoglobinaClasificacion::Normal
    } else if hb >= 10.0 {
        HemoglobinaClasificacion::Leve
    } else if hb >= 7.0 {
        HemoglobinaClasificacion::Moderada
    } else {
        HemoglobinaClasificacion::Severa
    }
}
