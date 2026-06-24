use sqlx::SqlitePool;

use crate::audit::AuditService;
use crate::dto::{
    ApiResponse, CreateTreatmentDTO, MedicamentoResponse, TreatmentResponse, UpdateTreatmentDTO,
};
use crate::errors::AppError;
use crate::models::Medicamento;
use crate::repositories::treatment_repository::TreatmentRepository;

/// Treatment service for treatment plan business logic.
pub struct TreatmentService {
    repo: Box<dyn TreatmentRepository>,
    audit: AuditService,
    pool: SqlitePool,
}

impl TreatmentService {
    pub fn new(repo: Box<dyn TreatmentRepository>, audit: AuditService, pool: SqlitePool) -> Self {
        Self { repo, audit, pool }
    }

    /// Creates a new treatment with validation.
    ///
    /// Validates:
    /// - Date format
    /// - No active treatments for this patient (warns, does not block)
    pub async fn create(
        &self,
        dto: CreateTreatmentDTO,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<TreatmentResponse>, AppError> {
        self.validate_date(&dto.fecha_inicio)?;

        // Warn about existing active treatments (not blocking)
        let active = self.repo.find_active_by_paciente(dto.paciente_id).await?;
        if !active.is_empty() {
            tracing::warn!(
                "Patient {} already has {} active treatment(s)",
                dto.paciente_id,
                active.len(),
            );
        }

        let treatment = self.repo.create(&dto).await?;

        self.audit
            .log_event(
                usuario_id,
                "CREATE",
                "tratamientos",
                Some(treatment.id),
                None,
                Some(&serde_json::to_string(&dto).unwrap_or_default()),
                None,
            )
            .await?;

        Ok(ApiResponse::success(treatment))
    }

    /// Updates mutable fields of a treatment (dosis, frecuencia, observaciones).
    pub async fn update(
        &self,
        id: i64,
        dto: UpdateTreatmentDTO,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<TreatmentResponse>, AppError> {
        let treatment = self.repo.update(id, &dto).await?;

        self.audit
            .log_event(
                usuario_id,
                "UPDATE",
                "tratamientos",
                Some(id),
                None,
                Some(&serde_json::to_string(&dto).unwrap_or_default()),
                None,
            )
            .await?;

        Ok(ApiResponse::success(treatment))
    }

    /// Finishes (marks as completed) an active treatment.
    pub async fn finish(
        &self,
        id: i64,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<TreatmentResponse>, AppError> {
        let treatment = self.repo.finish(id).await?;

        self.audit
            .log_event(
                usuario_id,
                "FINISH",
                "tratamientos",
                Some(id),
                None,
                None,
                None,
            )
            .await?;

        Ok(ApiResponse::success(treatment))
    }

    /// Suspends an active treatment.
    pub async fn suspend(
        &self,
        id: i64,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<TreatmentResponse>, AppError> {
        let treatment = self.repo.suspend(id).await?;

        self.audit
            .log_event(
                usuario_id,
                "SUSPEND",
                "tratamientos",
                Some(id),
                None,
                None,
                None,
            )
            .await?;

        Ok(ApiResponse::success(treatment))
    }

    /// Returns all treatments for a given patient.
    pub async fn get_by_paciente(
        &self,
        paciente_id: i64,
    ) -> Result<ApiResponse<Vec<TreatmentResponse>>, AppError> {
        let treatments = self.repo.find_by_paciente(paciente_id).await?;
        Ok(ApiResponse::success(treatments))
    }

    /// Returns active treatments for a patient.
    pub async fn get_active_by_paciente(
        &self,
        paciente_id: i64,
    ) -> Result<ApiResponse<Vec<TreatmentResponse>>, AppError> {
        let treatments = self.repo.find_active_by_paciente(paciente_id).await?;
        Ok(ApiResponse::success(treatments))
    }

    /// Returns all active medicamentos.
    pub async fn get_medicamentos(&self) -> Result<ApiResponse<Vec<MedicamentoResponse>>, AppError> {
        let rows = sqlx::query_as::<_, Medicamento>(
            "SELECT id, nombre, activo FROM medicamentos WHERE activo = 1 ORDER BY nombre",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(format!("query medicamentos: {e}")))?;

        let medicamentos: Vec<MedicamentoResponse> = rows
            .into_iter()
            .map(|m| MedicamentoResponse {
                id: m.id,
                nombre: m.nombre,
            })
            .collect();

        Ok(ApiResponse::success(medicamentos))
    }

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    fn validate_date(&self, date: &str) -> Result<(), AppError> {
        if date.len() != 10 {
            return Err(AppError::Validation(format!(
                "Invalid date format: {date}. Expected YYYY-MM-DD"
            )));
        }
        if chrono::NaiveDate::parse_from_str(date, "%Y-%m-%d").is_err() {
            return Err(AppError::Validation(format!(
                "Invalid date: {date}. Expected YYYY-MM-DD"
            )));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repositories::treatment_repository::SqliteTreatmentRepository;

    async fn setup_test_pool() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS centros_poblados (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                activo INTEGER NOT NULL DEFAULT 1
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS pacientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                historia_clinica TEXT NOT NULL,
                dni TEXT NOT NULL,
                nombres TEXT NOT NULL,
                apellido_paterno TEXT NOT NULL,
                apellido_materno TEXT NOT NULL,
                fecha_nacimiento TEXT NOT NULL,
                sexo TEXT NOT NULL,
                activo INTEGER NOT NULL DEFAULT 1
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS medicamentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                activo INTEGER NOT NULL DEFAULT 1
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS tratamientos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                paciente_id INTEGER NOT NULL,
                medicamento_id INTEGER NOT NULL,
                dosis TEXT,
                frecuencia TEXT,
                fecha_inicio TEXT NOT NULL,
                fecha_fin TEXT,
                estado TEXT NOT NULL DEFAULT 'activo',
                observaciones TEXT
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                accion TEXT NOT NULL,
                tabla_afectada TEXT NOT NULL,
                registro_id INTEGER,
                datos_anteriores TEXT,
                datos_nuevos TEXT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_local TEXT
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        // Seed data: patient + medication
        sqlx::query(
            "INSERT INTO pacientes (historia_clinica, dni, nombres, apellido_paterno, \
             apellido_materno, fecha_nacimiento, sexo, activo) \
             VALUES ('HC-T-001', '11111111', 'Test', 'Treatment', 'Paciente', '2015-06-01', 'F', 1)",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query("INSERT INTO medicamentos (nombre) VALUES ('Sulfato Ferroso')")
            .execute(&pool)
            .await
            .unwrap();

        pool
    }

    fn make_service(pool: SqlitePool) -> TreatmentService {
        let repo = Box::new(SqliteTreatmentRepository::new(pool.clone()));
        let audit = AuditService::new(pool.clone());
        TreatmentService::new(repo, audit, pool)
    }

    #[tokio::test]
    async fn test_treatment_create() {
        let pool = setup_test_pool().await;
        let service = make_service(pool.clone());

        let dto = CreateTreatmentDTO {
            paciente_id: 1,
            medicamento_id: 1,
            dosis: Some("5mg".to_string()),
            frecuencia: Some("diaria".to_string()),
            fecha_inicio: "2025-06-01".to_string(),
            observaciones: Some("Test treatment".to_string()),
        };

        let result = service.create(dto, None).await.unwrap();
        let treatment = result.data.unwrap();
        assert_eq!(treatment.paciente_id, 1);
        assert_eq!(treatment.medicamento_id, 1);
        assert_eq!(treatment.estado, "activo");
        assert!(treatment.id > 0);
    }

    #[tokio::test]
    async fn test_treatment_finish() {
        let pool = setup_test_pool().await;
        let service = make_service(pool.clone());

        // Create treatment first
        let dto = CreateTreatmentDTO {
            paciente_id: 1,
            medicamento_id: 1,
            dosis: Some("5mg".to_string()),
            frecuencia: Some("diaria".to_string()),
            fecha_inicio: "2025-06-01".to_string(),
            observaciones: None,
        };
        let created = service.create(dto, None).await.unwrap();
        let treatment = created.data.unwrap();

        // Finish it
        let result = service.finish(treatment.id, None).await.unwrap();
        let finished = result.data.unwrap();
        assert_eq!(finished.estado, "finalizado");
        assert!(finished.fecha_fin.is_some());
    }

    #[tokio::test]
    async fn test_treatment_suspend() {
        let pool = setup_test_pool().await;
        let service = make_service(pool.clone());

        let dto = CreateTreatmentDTO {
            paciente_id: 1,
            medicamento_id: 1,
            dosis: Some("5mg".to_string()),
            frecuencia: Some("diaria".to_string()),
            fecha_inicio: "2025-06-01".to_string(),
            observaciones: None,
        };
        let created = service.create(dto, None).await.unwrap();
        let treatment = created.data.unwrap();

        // Suspend it
        let result = service.suspend(treatment.id, None).await.unwrap();
        let suspended = result.data.unwrap();
        assert_eq!(suspended.estado, "suspendido");
    }

    #[tokio::test]
    async fn test_finish_already_finished() {
        let pool = setup_test_pool().await;
        let service = make_service(pool.clone());

        let dto = CreateTreatmentDTO {
            paciente_id: 1,
            medicamento_id: 1,
            dosis: Some("5mg".to_string()),
            frecuencia: Some("diaria".to_string()),
            fecha_inicio: "2025-06-01".to_string(),
            observaciones: None,
        };
        let created = service.create(dto, None).await.unwrap();
        let treatment = created.data.unwrap();

        // First finish succeeds
        service.finish(treatment.id, None).await.unwrap();

        // Second finish should fail
        let err = service.finish(treatment.id, None).await.unwrap_err();
        match &err {
            AppError::Validation(msg) => {
                assert!(
                    msg.contains("activos"),
                    "Expected validation error about active treatments, got: {msg}"
                );
            }
            _ => panic!("Expected Validation error, got: {err:?}"),
        }
    }
}
