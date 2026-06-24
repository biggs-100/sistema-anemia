use async_trait::async_trait;
use sqlx::SqlitePool;

use crate::dto::{CreatePatientDTO, UpdatePatientDTO};
use crate::errors::AppError;
use crate::models::Patient;

/// Trait defining patient data access operations.
#[async_trait]
pub trait PatientRepository: Send + Sync {
    async fn create(&self, dto: &CreatePatientDTO) -> Result<Patient, AppError>;
    async fn update(&self, id: i64, dto: &UpdatePatientDTO) -> Result<Patient, AppError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Patient>, AppError>;
    async fn find_by_dni(&self, dni: &str) -> Result<Option<Patient>, AppError>;
    async fn find_by_historia(&self, historia: &str) -> Result<Option<Patient>, AppError>;
    async fn search(&self, query: &str) -> Result<Vec<Patient>, AppError>;
    async fn deactivate(&self, id: i64) -> Result<(), AppError>;
}

/// SQLite-backed patient repository using sqlx.
pub struct SqlitePatientRepository {
    pool: SqlitePool,
}

impl SqlitePatientRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl PatientRepository for SqlitePatientRepository {
    async fn create(&self, dto: &CreatePatientDTO) -> Result<Patient, AppError> {
        let id = sqlx::query_scalar::<_, i64>(
            "INSERT INTO patients (historia_clinica, dni, nombres, apellido_paterno, apellido_materno, \
             fecha_nacimiento, sexo, centro_poblado_id, nombre_apoderado, celular_apoderado, direccion) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11) RETURNING id",
        )
        .bind(&dto.historia_clinica)
        .bind(&dto.dni)
        .bind(&dto.nombres)
        .bind(&dto.apellido_paterno)
        .bind(&dto.apellido_materno)
        .bind(&dto.fecha_nacimiento)
        .bind(&dto.sexo)
        .bind(dto.centro_poblado_id)
        .bind(&dto.nombre_apoderado)
        .bind(&dto.celular_apoderado)
        .bind(&dto.direccion)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| db_error("create patient", e))?;

        self.find_by_id(id)
            .await
            .map(|p| p.expect("just created"))
    }

    async fn update(&self, id: i64, dto: &UpdatePatientDTO) -> Result<Patient, AppError> {
        let existing = self
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Patient {id} not found")))?;

        let historia_clinica = dto.historia_clinica.as_deref().unwrap_or(&existing.historia_clinica);
        let dni = dto.dni.as_deref().unwrap_or(&existing.dni);
        let nombres = dto.nombres.as_deref().unwrap_or(&existing.nombres);
        let apellido_paterno = dto.apellido_paterno.as_deref().unwrap_or(&existing.apellido_paterno);
        let apellido_materno = dto.apellido_materno.as_deref().unwrap_or(&existing.apellido_materno);
        let fecha_nacimiento = dto.fecha_nacimiento.as_deref().unwrap_or(&existing.fecha_nacimiento);
        let sexo = dto.sexo.as_deref().unwrap_or(&existing.sexo);
        let centro_poblado_id = dto.centro_poblado_id.or(existing.centro_poblado_id);
        let nombre_apoderado = dto.nombre_apoderado.as_deref().or(existing.nombre_apoderado.as_deref());
        let celular_apoderado = dto.celular_apoderado.as_deref().or(existing.celular_apoderado.as_deref());
        let direccion = dto.direccion.as_deref().or(existing.direccion.as_deref());
        let activo = dto.activo.unwrap_or(existing.activo);

        sqlx::query(
            "UPDATE patients SET historia_clinica = ?1, dni = ?2, nombres = ?3, apellido_paterno = ?4, \
             apellido_materno = ?5, fecha_nacimiento = ?6, sexo = ?7, centro_poblado_id = ?8, \
             nombre_apoderado = ?9, celular_apoderado = ?10, direccion = ?11, activo = ?12, \
             actualizado_en = CURRENT_TIMESTAMP WHERE id = ?13",
        )
        .bind(historia_clinica)
        .bind(dni)
        .bind(nombres)
        .bind(apellido_paterno)
        .bind(apellido_materno)
        .bind(fecha_nacimiento)
        .bind(sexo)
        .bind(centro_poblado_id)
        .bind(nombre_apoderado)
        .bind(celular_apoderado)
        .bind(direccion)
        .bind(activo)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| db_error("update patient", e))?;

        self.find_by_id(id)
            .await
            .map(|p| p.expect("just updated"))
    }

    async fn find_by_id(&self, id: i64) -> Result<Option<Patient>, AppError> {
        sqlx::query_as::<_, PatientRow>(
            "SELECT id, historia_clinica, dni, nombres, apellido_paterno, apellido_materno, \
             fecha_nacimiento, sexo, direccion, centro_poblado_id, nombre_apoderado, celular_apoderado, \
             fecha_registro, activo, creado_en, actualizado_en \
             FROM patients WHERE id = ?1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| db_error("find patient by id", e))
        .map(|opt| opt.map(PatientRow::into_model))
    }

    async fn find_by_dni(&self, dni: &str) -> Result<Option<Patient>, AppError> {
        sqlx::query_as::<_, PatientRow>(
            "SELECT id, historia_clinica, dni, nombres, apellido_paterno, apellido_materno, \
             fecha_nacimiento, sexo, direccion, centro_poblado_id, nombre_apoderado, celular_apoderado, \
             fecha_registro, activo, creado_en, actualizado_en \
             FROM patients WHERE dni = ?1",
        )
        .bind(dni)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| db_error("find patient by dni", e))
        .map(|opt| opt.map(PatientRow::into_model))
    }

    async fn find_by_historia(&self, historia: &str) -> Result<Option<Patient>, AppError> {
        sqlx::query_as::<_, PatientRow>(
            "SELECT id, historia_clinica, dni, nombres, apellido_paterno, apellido_materno, \
             fecha_nacimiento, sexo, direccion, centro_poblado_id, nombre_apoderado, celular_apoderado, \
             fecha_registro, activo, creado_en, actualizado_en \
             FROM patients WHERE historia_clinica = ?1",
        )
        .bind(historia)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| db_error("find patient by historia", e))
        .map(|opt| opt.map(PatientRow::into_model))
    }

    async fn search(&self, query: &str) -> Result<Vec<Patient>, AppError> {
        let pattern = format!("%{}%", query);
        let rows = sqlx::query_as::<_, PatientRow>(
            "SELECT id, historia_clinica, dni, nombres, apellido_paterno, apellido_materno, \
             fecha_nacimiento, sexo, direccion, centro_poblado_id, nombre_apoderado, celular_apoderado, \
             fecha_registro, activo, creado_en, actualizado_en \
             FROM patients WHERE activo = 1 AND ( \
             nombres LIKE ?1 OR apellido_paterno LIKE ?1 OR apellido_materno LIKE ?1 \
             OR dni LIKE ?1 OR historia_clinica LIKE ?1) \
             ORDER BY apellido_paterno, apellido_materno, nombres",
        )
        .bind(&pattern)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| db_error("search patients", e))?;

        Ok(rows.into_iter().map(PatientRow::into_model).collect())
    }

    async fn deactivate(&self, id: i64) -> Result<(), AppError> {
        let affected = sqlx::query("UPDATE patients SET activo = 0, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| db_error("deactivate patient", e))?
            .rows_affected();

        if affected == 0 {
            return Err(AppError::NotFound(format!("Patient {id} not found")));
        }
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Internal row mapper
// ---------------------------------------------------------------------------

#[derive(sqlx::FromRow)]
struct PatientRow {
    id: i64,
    historia_clinica: String,
    dni: String,
    nombres: String,
    apellido_paterno: String,
    apellido_materno: String,
    fecha_nacimiento: String,
    sexo: String,
    direccion: Option<String>,
    centro_poblado_id: Option<i64>,
    nombre_apoderado: Option<String>,
    celular_apoderado: Option<String>,
    fecha_registro: Option<String>,
    activo: bool,
    creado_en: Option<chrono::NaiveDateTime>,
    actualizado_en: Option<chrono::NaiveDateTime>,
}

impl PatientRow {
    fn into_model(self) -> Patient {
        Patient {
            id: self.id,
            historia_clinica: self.historia_clinica,
            dni: self.dni,
            nombres: self.nombres,
            apellido_paterno: self.apellido_paterno,
            apellido_materno: self.apellido_materno,
            fecha_nacimiento: self.fecha_nacimiento,
            sexo: self.sexo,
            direccion: self.direccion,
            centro_poblado_id: self.centro_poblado_id,
            nombre_apoderado: self.nombre_apoderado,
            celular_apoderado: self.celular_apoderado,
            fecha_registro: self.fecha_registro,
            activo: self.activo,
            creado_en: self.creado_en,
            actualizado_en: self.actualizado_en,
        }
    }
}

fn db_error(context: &str, err: sqlx::Error) -> AppError {
    AppError::Database(format!("{context}: {err}"))
}
