use async_trait::async_trait;
use sqlx::SqlitePool;

use crate::dto::CreateTreatmentDTO;
use crate::errors::AppError;
use crate::models::Treatment;

#[async_trait]
pub trait TreatmentRepository: Send + Sync {
    async fn create(&self, dto: &CreateTreatmentDTO) -> Result<Treatment, AppError>;
    async fn update(&self, id: i64, dto: &CreateTreatmentDTO) -> Result<Treatment, AppError>;
    async fn finish(&self, id: i64) -> Result<Treatment, AppError>;
    async fn find_by_paciente(&self, paciente_id: i64) -> Result<Vec<Treatment>, AppError>;
    async fn find_active_by_paciente(&self, paciente_id: i64) -> Result<Vec<Treatment>, AppError>;
}

pub struct SqliteTreatmentRepository {
    pool: SqlitePool,
}

impl SqliteTreatmentRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TreatmentRepository for SqliteTreatmentRepository {
    async fn create(&self, dto: &CreateTreatmentDTO) -> Result<Treatment, AppError> {
        let id = sqlx::query_scalar::<_, i64>(
            "INSERT INTO tratamientos (paciente_id, medicamento_id, dosis, frecuencia, \
             fecha_inicio, observaciones) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING id",
        )
        .bind(dto.paciente_id)
        .bind(dto.medicamento_id)
        .bind(&dto.dosis)
        .bind(&dto.frecuencia)
        .bind(&dto.fecha_inicio)
        .bind(&dto.observaciones)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| db_error("create treatment", e))?;

        self.find_by_id(id).await.map(|t| t.expect("just created"))
    }

    async fn update(&self, id: i64, dto: &CreateTreatmentDTO) -> Result<Treatment, AppError> {
        let affected = sqlx::query(
            "UPDATE tratamientos SET paciente_id = ?1, medicamento_id = ?2, dosis = ?3, \
             frecuencia = ?4, fecha_inicio = ?5, observaciones = ?6 WHERE id = ?7",
        )
        .bind(dto.paciente_id)
        .bind(dto.medicamento_id)
        .bind(&dto.dosis)
        .bind(&dto.frecuencia)
        .bind(&dto.fecha_inicio)
        .bind(&dto.observaciones)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| db_error("update treatment", e))?
        .rows_affected();

        if affected == 0 {
            return Err(AppError::NotFound(format!("Treatment {id} not found")));
        }

        self.find_by_id(id).await.map(|t| t.expect("just updated"))
    }

    async fn finish(&self, id: i64) -> Result<Treatment, AppError> {
        let affected = sqlx::query(
            "UPDATE tratamientos SET estado = 'finalizado', fecha_fin = date('now') WHERE id = ?1",
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| db_error("finish treatment", e))?
        .rows_affected();

        if affected == 0 {
            return Err(AppError::NotFound(format!("Treatment {id} not found")));
        }

        self.find_by_id(id).await.map(|t| t.expect("just finished"))
    }

    async fn find_by_paciente(&self, paciente_id: i64) -> Result<Vec<Treatment>, AppError> {
        let rows = sqlx::query_as::<_, TreatmentRow>(
            "SELECT id, paciente_id, medicamento_id, dosis, frecuencia, fecha_inicio, \
             fecha_fin, estado, observaciones \
             FROM tratamientos WHERE paciente_id = ?1 ORDER BY fecha_inicio DESC",
        )
        .bind(paciente_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| db_error("find treatments by patient", e))?;

        Ok(rows.into_iter().map(TreatmentRow::into_model).collect())
    }

    async fn find_active_by_paciente(&self, paciente_id: i64) -> Result<Vec<Treatment>, AppError> {
        let rows = sqlx::query_as::<_, TreatmentRow>(
            "SELECT id, paciente_id, medicamento_id, dosis, frecuencia, fecha_inicio, \
             fecha_fin, estado, observaciones \
             FROM tratamientos WHERE paciente_id = ?1 AND estado = 'activo' \
             ORDER BY fecha_inicio DESC",
        )
        .bind(paciente_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| db_error("find active treatments by patient", e))?;

        Ok(rows.into_iter().map(TreatmentRow::into_model).collect())
    }
}

impl SqliteTreatmentRepository {
    async fn find_by_id(&self, id: i64) -> Result<Option<Treatment>, AppError> {
        sqlx::query_as::<_, TreatmentRow>(
            "SELECT id, paciente_id, medicamento_id, dosis, frecuencia, fecha_inicio, \
             fecha_fin, estado, observaciones \
             FROM tratamientos WHERE id = ?1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| db_error("find treatment by id", e))
        .map(|opt| opt.map(TreatmentRow::into_model))
    }
}

#[derive(sqlx::FromRow)]
struct TreatmentRow {
    id: i64,
    paciente_id: i64,
    medicamento_id: i64,
    dosis: Option<String>,
    frecuencia: Option<String>,
    fecha_inicio: String,
    fecha_fin: Option<String>,
    estado: String,
    observaciones: Option<String>,
}

impl TreatmentRow {
    fn into_model(self) -> Treatment {
        Treatment {
            id: self.id,
            paciente_id: self.paciente_id,
            medicamento_id: self.medicamento_id,
            dosis: self.dosis,
            frecuencia: self.frecuencia,
            fecha_inicio: self.fecha_inicio,
            fecha_fin: self.fecha_fin,
            estado: self.estado,
            observaciones: self.observaciones,
        }
    }
}

fn db_error(context: &str, err: sqlx::Error) -> AppError {
    AppError::Database(format!("{context}: {err}"))
}
