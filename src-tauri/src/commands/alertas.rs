use tauri::AppHandle;
use tauri::Manager;
use tauri::State;

use crate::dto::{AlertaResponse, ApiResponse, SearchResult};
use crate::services::auth_service::{ADMIN_ONLY, ALL_ROLES};
use crate::AppState;

#[tauri::command]
pub async fn list_alertas(
    app: AppHandle,
    token: String,
    page: Option<i64>,
    page_size: Option<i64>,
    tipo: Option<String>,
    resuelta: Option<bool>,
) -> Result<ApiResponse<SearchResult<AlertaResponse>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    let page = page.unwrap_or(1).max(1);
    let page_size = page_size.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * page_size;

    // Build count query with same filters
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM alertas a
         WHERE (?1 IS NULL OR a.tipo = ?1)
           AND (?2 IS NULL OR a.resuelta = ?2)",
    )
    .bind(&tipo)
    .bind(resuelta.map(|r| r as i64))
    .fetch_one(&state.pool)
    .await
    .map_err(|e| format!("Error al contar alertas: {e}"))?;

    // Fetch paginated results
    #[derive(sqlx::FromRow)]
    struct AlertaRow {
        id: i64,
        paciente_id: i64,
        paciente_nombre: Option<String>,
        tipo: String,
        descripcion: Option<String>,
        fecha: Option<String>,
        resuelta: bool,
    }

    let rows = sqlx::query_as::<_, AlertaRow>(
        "SELECT a.id, a.paciente_id,
                p.nombres || ' ' || p.apellido_paterno AS paciente_nombre,
                a.tipo, a.descripcion,
                a.fecha_generada AS fecha,
                a.resuelta
         FROM alertas a
         LEFT JOIN pacientes p ON p.id = a.paciente_id
         WHERE (?1 IS NULL OR a.tipo = ?1)
           AND (?2 IS NULL OR a.resuelta = ?2)
         ORDER BY a.fecha_generada DESC
         LIMIT ?3 OFFSET ?4",
    )
    .bind(&tipo)
    .bind(resuelta.map(|r| r as i64))
    .bind(page_size)
    .bind(offset)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| format!("Error al listar alertas: {e}"))?;

    let data: Vec<AlertaResponse> = rows
        .into_iter()
        .map(|r| AlertaResponse {
            id: r.id,
            paciente_id: r.paciente_id,
            paciente_nombre: r.paciente_nombre,
            tipo: r.tipo,
            descripcion: r.descripcion,
            fecha: r.fecha,
            resuelta: r.resuelta,
        })
        .collect();

    Ok(ApiResponse::success(SearchResult {
        data,
        total: count,
        page,
        page_size,
    }))
}

#[tauri::command]
pub async fn resolver_alerta(
    app: AppHandle,
    token: String,
    id: i64,
) -> Result<ApiResponse<()>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, ADMIN_ONLY)
        .await
        .map_err(|e| e.to_string())?;

    let affected = sqlx::query("UPDATE alertas SET resuelta = 1 WHERE id = ?1")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| format!("Error al resolver alerta: {e}"))?
        .rows_affected();

    if affected == 0 {
        return Ok(ApiResponse::error("Alerta no encontrada"));
    }

    state
        .audit_service
        .log_event(
            Some(user.id),
            "RESOLVE_ALERTA",
            "alertas",
            Some(id),
            None,
            None,
            None,
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(()))
}

#[tauri::command]
pub async fn resolver_todas_alertas(
    app: AppHandle,
    token: String,
) -> Result<ApiResponse<i64>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, ADMIN_ONLY)
        .await
        .map_err(|e| e.to_string())?;

    let affected = sqlx::query("UPDATE alertas SET resuelta = 1 WHERE resuelta = 0")
        .execute(&state.pool)
        .await
        .map_err(|e| format!("Error al resolver todas las alertas: {e}"))?
        .rows_affected() as i64;

    state
        .audit_service
        .log_event(
            Some(user.id),
            "RESOLVE_ALL_ALERTAS",
            "alertas",
            None,
            None,
            None,
            None,
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(affected))
}

#[cfg(test)]
mod tests {
    use sqlx::SqlitePool;

    async fn setup_test_pool() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS centros_poblados (
                id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT, historia_clinica TEXT NOT NULL,
                dni TEXT NOT NULL, nombres TEXT NOT NULL, apellido_paterno TEXT NOT NULL,
                apellido_materno TEXT NOT NULL, fecha_nacimiento TEXT NOT NULL,
                sexo TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS alertas (
                id INTEGER PRIMARY KEY AUTOINCREMENT, paciente_id INTEGER NOT NULL,
                tipo TEXT NOT NULL, descripcion TEXT,
                fecha_generada DATETIME DEFAULT CURRENT_TIMESTAMP,
                resuelta INTEGER NOT NULL DEFAULT 0
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        pool
    }

    #[tokio::test]
    async fn test_list_alertas_empty() {
        let pool = setup_test_pool().await;

        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM alertas")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(count, 0);
    }

    #[tokio::test]
    async fn test_list_alertas_with_data() {
        let pool = setup_test_pool().await;

        // Insert a patient
        sqlx::query(
            "INSERT INTO patients (historia_clinica, dni, nombres, apellido_paterno, \
             apellido_materno, fecha_nacimiento, sexo, activo) \
             VALUES ('HC-A-01', '99999999', 'Alerta', 'Test', 'Paciente', '2018-01-01', 'M', 1)",
        )
        .execute(&pool)
        .await
        .unwrap();

        // Insert alerts
        for i in 0..3 {
            sqlx::query(
                "INSERT INTO alertas (paciente_id, tipo, descripcion, resuelta) \
                 VALUES (1, 'TEST', ?1, 0)",
            )
            .bind(format!("Test alerta {i}"))
            .execute(&pool)
            .await
            .unwrap();
        }

        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM alertas WHERE resuelta = 0")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(count, 3, "Should have 3 unresolved alerts");

        // Test tipo filter
        let typed_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM alertas WHERE tipo = 'TEST'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(typed_count, 3);

        let wrong_type_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM alertas WHERE tipo = 'OTHER'",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(wrong_type_count, 0);
    }

    #[tokio::test]
    async fn test_resolver_alerta() {
        let pool = setup_test_pool().await;

        sqlx::query(
            "INSERT INTO patients (historia_clinica, dni, nombres, apellido_paterno, \
             apellido_materno, fecha_nacimiento, sexo, activo) \
             VALUES ('HC-A-02', '88888888', 'Resuelve', 'Alerta', 'Test', '2020-01-01', 'F', 1)",
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO alertas (paciente_id, tipo, descripcion, resuelta) \
             VALUES (1, 'CRITICAL', 'test alert', 0)",
        )
        .execute(&pool)
        .await
        .unwrap();

        // Verify unresolved
        let unresolved: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM alertas WHERE resuelta = 0",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(unresolved, 1);

        // Resolve it
        let affected = sqlx::query("UPDATE alertas SET resuelta = 1 WHERE id = 1")
            .execute(&pool)
            .await
            .unwrap()
            .rows_affected();
        assert_eq!(affected, 1);

        // Verify resolved
        let unresolved: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM alertas WHERE resuelta = 0",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(unresolved, 0);

        let resolved: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM alertas WHERE resuelta = 1",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(resolved, 1);
    }

    #[tokio::test]
    async fn test_resolver_alerta_not_found() {
        let pool = setup_test_pool().await;

        let affected = sqlx::query("UPDATE alertas SET resuelta = 1 WHERE id = 999")
            .execute(&pool)
            .await
            .unwrap()
            .rows_affected();
        assert_eq!(affected, 0, "Non-existent alert should affect 0 rows");
    }

    #[tokio::test]
    async fn test_alerta_pagination() {
        let pool = setup_test_pool().await;

        sqlx::query(
            "INSERT INTO patients (historia_clinica, dni, nombres, apellido_paterno, \
             apellido_materno, fecha_nacimiento, sexo, activo) \
             VALUES ('HC-A-03', '77777777', 'Pagina', 'Alerta', 'Test', '2021-01-01', 'M', 1)",
        )
        .execute(&pool)
        .await
        .unwrap();

        // Insert 5 alerts
        for i in 0..5 {
            sqlx::query(
                "INSERT INTO alertas (paciente_id, tipo, descripcion, resuelta) \
                 VALUES (1, 'TEST', ?1, 0)",
            )
            .bind(format!("Alerta {i}"))
            .execute(&pool)
            .await
            .unwrap();
        }

        // Test LIMIT/OFFSET pagination
        let page1: Vec<(i64, String)> = sqlx::query_as(
            "SELECT id, descripcion FROM alertas \
             WHERE resuelta = 0 ORDER BY id LIMIT 2 OFFSET 0",
        )
        .fetch_all(&pool)
        .await
        .unwrap();
        assert_eq!(page1.len(), 2);

        let page2: Vec<(i64, String)> = sqlx::query_as(
            "SELECT id, descripcion FROM alertas \
             WHERE resuelta = 0 ORDER BY id LIMIT 2 OFFSET 2",
        )
        .fetch_all(&pool)
        .await
        .unwrap();
        assert_eq!(page2.len(), 2);

        let page3: Vec<(i64, String)> = sqlx::query_as(
            "SELECT id, descripcion FROM alertas \
             WHERE resuelta = 0 ORDER BY id LIMIT 2 OFFSET 4",
        )
        .fetch_all(&pool)
        .await
        .unwrap();
        assert_eq!(page3.len(), 1);

        // Verify no overlap
        let ids1: Vec<i64> = page1.iter().map(|(id, _)| *id).collect();
        let ids2: Vec<i64> = page2.iter().map(|(id, _)| *id).collect();
        for id in &ids2 {
            assert!(!ids1.contains(id), "Pages should not overlap");
        }
    }
}
