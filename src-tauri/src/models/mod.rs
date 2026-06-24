use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

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
    pub centro_poblado_id: Option<i64>,
    pub nombre_apoderado: Option<String>,
    pub celular_apoderado: Option<String>,
    pub activo: bool,
    pub creado_en: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Control {
    pub id: i64,
    pub paciente_id: i64,
    pub fecha_control: String,
    pub peso: Option<f64>,
    pub talla: Option<f64>,
    pub hemoglobina: Option<f64>,
    pub diagnostico: Option<String>,
    pub tratamiento_id: Option<i64>,
    pub observaciones: Option<String>,
    pub creado_en: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Treatment {
    pub id: i64,
    pub paciente_id: i64,
    pub fecha_inicio: String,
    pub fecha_fin: Option<String>,
    pub tipo_tratamiento: String,
    pub dosis: Option<String>,
    pub activo: bool,
    pub observaciones: Option<String>,
    pub creado_en: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: i64,
    pub usuario: String,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CentroPoblado {
    pub id: i64,
    pub nombre: String,
    pub distrito: Option<String>,
    pub provincia: Option<String>,
    pub departamento: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Alerta {
    pub id: i64,
    pub paciente_id: i64,
    pub tipo: String,
    pub mensaje: String,
    pub leida: bool,
    pub creada_en: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditLog {
    pub id: i64,
    pub usuario: String,
    pub accion: String,
    pub tabla: String,
    pub registro_id: i64,
    pub fecha: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupHistory {
    pub id: i64,
    pub filename: String,
    pub file_size: i64,
    pub checksum: String,
    pub creado_en: Option<NaiveDateTime>,
}
