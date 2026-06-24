use async_trait::async_trait;
use sqlx::SqlitePool;

use crate::dto::{CreateTreatmentDTO, TreatmentResponse, UpdateTreatmentDTO};
use crate::errors::AppError;

#[async_trait]
pub trait TreatmentRepository: Send + Sync {
    async fn create(&self, dto: &CreateTreatmentDTO) -> Result<TreatmentResponse, AppError>;
    async fn update(&self, id: i64, dto: &UpdateTreatmentDTO) -> Result<TreatmentResponse, AppError>;
    async fn finish(&self, id: i64) -> Result<TreatmentResponse, AppError>;
    async fn suspend(&self, id: i64) -> Result<TreatmentResponse, AppError>;
    async fn find_by_paciente(&self, paciente_id: i64) -> Result<Vec<TreatmentResponse>, AppError>;
    async fn find_active_by_paciente(&self, paciente_id: i64) -> Result<Vec<TreatmentResponse>, AppError>;
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
    async fn create(&self, dto: &CreateTreatmentDTO) -> Result<TreatmentResponse, AppError> {
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

        self.find_response_by_id(id).await
            .map(|t| t.expect("just created"))
    }

    async fn update(&self, id: i64, dto: &UpdateTreatmentDTO) -> Result<TreatmentResponse, AppError> {
        let affected = sqlx::query(
            "UPDATE tratamientos SET \
             dosis = COALESCE(?1, dosis), \
             frecuencia = COALESCE(?2, frecuencia), \
             observaciones = COALESCE(?3, observaciones) \
             WHERE id = ?4",
        )
        .bind(&dto.dosis)
        .bind(&dto.frecuencia)
        .bind(&dto.observaciones)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| db_error("update treatment", e))?
        .rows_affected();

        if affected == 0 {
            return Err(AppError::NotFound(format!("Treatment {id} not found")));
        }

        self.find_response_by_id(id).await
            .map(|t| t.expect("just updated"))
    }

    async fn finish(&self, id: i64) -> Result<TreatmentResponse, AppError> {
        let affected = sqlx::query(
            "UPDATE tratamientos SET estado = 'finalizado', fecha_fin = date('now') \
             WHERE id = ?1 AND estado = 'activo'",
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| db_error("finish treatment", e))?
        .rows_affected();

        if affected == 0 {
            // Check if it exists at all (not found vs wrong state)
            let exists: bool = sqlx::query_scalar(
                "SELECT COUNT(*) > 0 FROM tratamientos WHERE id = ?1",
            )
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| db_error("check treatment exists", e))?;

            if !exists {
                return Err(AppError::NotFound(format!("Treatment {id} not found")));
            }
            return Err(AppError::Validation(
                "Solo tratamientos activos pueden ser finalizados".into(),
            ));
        }

        self.find_response_by_id(id).await
            .map(|t| t.expect("just finished"))
    }

    async fn suspend(&self, id: i64) -> Result<TreatmentResponse, AppError> {
        let affected = sqlx::query(
            "UPDATE tratamientos SET estado = 'suspendido' \
             WHERE id = ?1 AND estado = 'activo'",
        )
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| db_error("suspend treatment", e))?
        .rows_affected();

        if affected == 0 {
            let exists: bool = sqlx::query_scalar(
                "SELECT COUNT(*) > 0 FROM tratamientos WHERE id = ?1",
            )
            .bind(id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| db_error("check treatment exists", e))?;

            if !exists {
                return Err(AppError::NotFound(format!("Treatment {id} not found")));
            }
            return Err(AppError::Validation(
                "Solo tratamientos activos pueden ser suspendidos".into(),
            ));
        }

        self.find_response_by_id(id).await
            .map(|t| t.expect("just suspended"))
    }

    async fn find_by_paciente(&self, paciente_id: i64) -> Result<Vec<TreatmentResponse>, AppError> {
        let rows = sqlx::query_as::<_, TreatmentResponseRow>(
            "SELECT t.id, t.paciente_id, p.nombres || ' ' || p.apellido_paterno || ' ' || \
             COALESCE(p.apellido_materno, '') AS paciente_nombre, \
             t.medicamento_id, m.nombre AS medicamento_nombre, \
             t.dosis, t.frecuencia, t.fecha_inicio, t.fecha_fin, t.estado, t.observaciones \
             FROM tratamientos t \
             JOIN pacientes p ON p.id = t.paciente_id \
             JOIN medicamentos m ON m.id = t.medicamento_id \
             WHERE t.paciente_id = ?1 \
             ORDER BY t.fecha_inicio DESC",
        )
        .bind(paciente_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| db_error("find treatments by patient", e))?;

        Ok(rows.into_iter().map(|r| r.into_response()).collect())
    }

    async fn find_active_by_paciente(&self, paciente_id: i64) -> Result<Vec<TreatmentResponse>, AppError> {
        let rows = sqlx::query_as::<_, TreatmentResponseRow>(
            "SELECT t.id, t.paciente_id, p.nombres || ' ' || p.apellido_paterno || ' ' || \
             COALESCE(p.apellido_materno, '') AS paciente_nombre, \
             t.medicamento_id, m.nombre AS medicamento_nombre, \
             t.dosis, t.frecuencia, t.fecha_inicio, t.fecha_fin, t.estado, t.observaciones \
             FROM tratamientos t \
             JOIN pacientes p ON p.id = t.paciente_id \
             JOIN medicamentos m ON m.id = t.medicamento_id \
             WHERE t.paciente_id = ?1 AND t.estado = 'activo' \
             ORDER BY t.fecha_inicio DESC",
        )
        .bind(paciente_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| db_error("find active treatments by patient", e))?;

        Ok(rows.into_iter().map(|r| r.into_response()).collect())
    }
}

impl SqliteTreatmentRepository {
    async fn find_response_by_id(&self, id: i64) -> Result<Option<TreatmentResponse>, AppError> {
        sqlx::query_as::<_, TreatmentResponseRow>(
            "SELECT t.id, t.paciente_id, p.nombres || ' ' || p.apellido_paterno || ' ' || \
             COALESCE(p.apellido_materno, '') AS paciente_nombre, \
             t.medicamento_id, m.nombre AS medicamento_nombre, \
             t.dosis, t.frecuencia, t.fecha_inicio, t.fecha_fin, t.estado, t.observaciones \
             FROM tratamientos t \
             JOIN pacientes p ON p.id = t.paciente_id \
             JOIN medicamentos m ON m.id = t.medicamento_id \
             WHERE t.id = ?1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| db_error("find treatment by id", e))
        .map(|opt| opt.map(|r| r.into_response()))
    }
}

#[derive(sqlx::FromRow)]
struct TreatmentResponseRow {
    id: i64,
    paciente_id: i64,
    paciente_nombre: String,
    medicamento_id: i64,
    medicamento_nombre: String,
    dosis: Option<String>,
    frecuencia: Option<String>,
    fecha_inicio: String,
    fecha_fin: Option<String>,
    estado: String,
    observaciones: Option<String>,
}

impl TreatmentResponseRow {
    fn into_response(self) -> TreatmentResponse {
        TreatmentResponse {
            id: self.id,
            paciente_id: self.paciente_id,
            paciente_nombre: self.paciente_nombre,
            medicamento_id: self.medicamento_id,
            medicamento_nombre: self.medicamento_nombre,
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
