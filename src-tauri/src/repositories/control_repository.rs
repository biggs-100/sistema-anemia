use async_trait::async_trait;
use sqlx::SqlitePool;

use crate::dto::CreateControlDTO;
use crate::errors::AppError;
use crate::models::Control;

#[async_trait]
pub trait ControlRepository: Send + Sync {
    async fn create(&self, dto: &CreateControlDTO) -> Result<Control, AppError>;
    async fn update(&self, id: i64, dto: &CreateControlDTO) -> Result<Control, AppError>;
    async fn find_by_paciente(&self, paciente_id: i64) -> Result<Vec<Control>, AppError>;
    async fn find_latest(&self, paciente_id: i64) -> Result<Option<Control>, AppError>;
    async fn find_by_date_range(
        &self,
        fecha_inicio: &str,
        fecha_fin: &str,
    ) -> Result<Vec<Control>, AppError>;
    async fn count_by_paciente(&self, paciente_id: i64) -> Result<i64, AppError>;
    async fn find_by_paciente_paginated(
        &self,
        paciente_id: i64,
        page: i64,
        page_size: i64,
    ) -> Result<Vec<Control>, AppError>;
    async fn find_by_paciente_date_range(
        &self,
        paciente_id: i64,
        fecha_inicio: &str,
        fecha_fin: &str,
    ) -> Result<Vec<Control>, AppError>;
}

pub struct SqliteControlRepository {
    pool: SqlitePool,
}

impl SqliteControlRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ControlRepository for SqliteControlRepository {
    async fn create(&self, dto: &CreateControlDTO) -> Result<Control, AppError> {
        let id = sqlx::query_scalar::<_, i64>(
            "INSERT INTO controles (paciente_id, fecha_control, edad_meses, peso, talla, \
             hemoglobina, temperatura, observaciones, usuario_id) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9) RETURNING id",
        )
        .bind(dto.paciente_id)
        .bind(&dto.fecha_control)
        .bind(dto.edad_meses)
        .bind(dto.peso)
        .bind(dto.talla)
        .bind(dto.hemoglobina)
        .bind(dto.temperatura)
        .bind(&dto.observaciones)
        .bind(dto.usuario_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| db_error("create control", e))?;

        self.find_by_id(id).await.map(|c| c.expect("just created"))
    }

    async fn update(&self, id: i64, dto: &CreateControlDTO) -> Result<Control, AppError> {
        let affected = sqlx::query(
            "UPDATE controles SET paciente_id = ?1, fecha_control = ?2, edad_meses = ?3, \
             peso = ?4, talla = ?5, hemoglobina = ?6, temperatura = ?7, observaciones = ?8, \
             usuario_id = ?9 WHERE id = ?10",
        )
        .bind(dto.paciente_id)
        .bind(&dto.fecha_control)
        .bind(dto.edad_meses)
        .bind(dto.peso)
        .bind(dto.talla)
        .bind(dto.hemoglobina)
        .bind(dto.temperatura)
        .bind(&dto.observaciones)
        .bind(dto.usuario_id)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| db_error("update control", e))?
        .rows_affected();

        if affected == 0 {
            return Err(AppError::NotFound(format!("Control {id} not found")));
        }

        self.find_by_id(id).await.map(|c| c.expect("just updated"))
    }

    async fn find_by_paciente(&self, paciente_id: i64) -> Result<Vec<Control>, AppError> {
        let rows = sqlx::query_as::<_, ControlRow>(
            "SELECT id, paciente_id, fecha_control, edad_meses, peso, talla, hemoglobina, \
             temperatura, observaciones, usuario_id, creado_en \
             FROM controles WHERE paciente_id = ?1 ORDER BY fecha_control DESC",
        )
        .bind(paciente_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| db_error("find controls by patient", e))?;

        Ok(rows.into_iter().map(ControlRow::into_model).collect())
    }

    async fn find_latest(&self, paciente_id: i64) -> Result<Option<Control>, AppError> {
        sqlx::query_as::<_, ControlRow>(
            "SELECT id, paciente_id, fecha_control, edad_meses, peso, talla, hemoglobina, \
             temperatura, observaciones, usuario_id, creado_en \
             FROM controles WHERE paciente_id = ?1 ORDER BY fecha_control DESC LIMIT 1",
        )
        .bind(paciente_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| db_error("find latest control", e))
        .map(|opt| opt.map(ControlRow::into_model))
    }

    async fn find_by_date_range(
        &self,
        fecha_inicio: &str,
        fecha_fin: &str,
    ) -> Result<Vec<Control>, AppError> {
        let rows = sqlx::query_as::<_, ControlRow>(
            "SELECT c.id, c.paciente_id, c.fecha_control, c.edad_meses, c.peso, c.talla, \
             c.hemoglobina, c.temperatura, c.observaciones, c.usuario_id, c.creado_en \
             FROM controles c WHERE c.fecha_control >= ?1 AND c.fecha_control <= ?2 \
             ORDER BY c.fecha_control DESC",
        )
        .bind(fecha_inicio)
        .bind(fecha_fin)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| db_error("find controls by date range", e))?;

        Ok(rows.into_iter().map(ControlRow::into_model).collect())
    }

    async fn count_by_paciente(&self, paciente_id: i64) -> Result<i64, AppError> {
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM controles WHERE paciente_id = ?1",
        )
        .bind(paciente_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| db_error("count controls by patient", e))
    }

    async fn find_by_paciente_paginated(
        &self,
        paciente_id: i64,
        page: i64,
        page_size: i64,
    ) -> Result<Vec<Control>, AppError> {
        let offset = (page - 1).max(0) * page_size;
        let rows = sqlx::query_as::<_, ControlRow>(
            "SELECT id, paciente_id, fecha_control, edad_meses, peso, talla, hemoglobina, \
             temperatura, observaciones, usuario_id, creado_en \
             FROM controles WHERE paciente_id = ?1 \
             ORDER BY fecha_control DESC LIMIT ?2 OFFSET ?3",
        )
        .bind(paciente_id)
        .bind(page_size)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| db_error("find controls paginated", e))?;

        Ok(rows.into_iter().map(ControlRow::into_model).collect())
    }

    async fn find_by_paciente_date_range(
        &self,
        paciente_id: i64,
        fecha_inicio: &str,
        fecha_fin: &str,
    ) -> Result<Vec<Control>, AppError> {
        let rows = sqlx::query_as::<_, ControlRow>(
            "SELECT c.id, c.paciente_id, c.fecha_control, c.edad_meses, c.peso, c.talla, \
             c.hemoglobina, c.temperatura, c.observaciones, c.usuario_id, c.creado_en \
             FROM controles c \
             WHERE c.paciente_id = ?1 AND c.fecha_control >= ?2 AND c.fecha_control <= ?3 \
             ORDER BY c.fecha_control DESC",
        )
        .bind(paciente_id)
        .bind(fecha_inicio)
        .bind(fecha_fin)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| db_error("find controls by patient date range", e))?;

        Ok(rows.into_iter().map(ControlRow::into_model).collect())
    }
}

impl SqliteControlRepository {
    async fn find_by_id(&self, id: i64) -> Result<Option<Control>, AppError> {
        sqlx::query_as::<_, ControlRow>(
            "SELECT id, paciente_id, fecha_control, edad_meses, peso, talla, hemoglobina, \
             temperatura, observaciones, usuario_id, creado_en \
             FROM controles WHERE id = ?1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| db_error("find control by id", e))
        .map(|opt| opt.map(ControlRow::into_model))
    }
}

#[derive(sqlx::FromRow)]
struct ControlRow {
    id: i64,
    paciente_id: i64,
    fecha_control: String,
    edad_meses: Option<i32>,
    peso: Option<f64>,
    talla: Option<f64>,
    hemoglobina: Option<f64>,
    temperatura: Option<f64>,
    observaciones: Option<String>,
    usuario_id: Option<i64>,
    creado_en: Option<chrono::NaiveDateTime>,
}

impl ControlRow {
    fn into_model(self) -> Control {
        Control {
            id: self.id,
            paciente_id: self.paciente_id,
            fecha_control: self.fecha_control,
            edad_meses: self.edad_meses,
            peso: self.peso,
            talla: self.talla,
            hemoglobina: self.hemoglobina,
            temperatura: self.temperatura,
            observaciones: self.observaciones,
            usuario_id: self.usuario_id,
            creado_en: self.creado_en,
        }
    }
}

fn db_error(context: &str, err: sqlx::Error) -> AppError {
    AppError::Database(format!("{context}: {err}"))
}
