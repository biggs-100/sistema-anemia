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
