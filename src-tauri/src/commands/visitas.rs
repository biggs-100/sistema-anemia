use tauri::AppHandle;
use tauri::Manager;
use tauri::State;

use crate::dto::{ApiResponse, CreateVisitaDTO, VisitaResponse};
use crate::services::auth_service::{ALL_ROLES, CLINICAL_ROLES};
use crate::AppState;

#[tauri::command]
pub async fn create_visita(
    app: AppHandle,
    token: String,
    paciente_id: i64,
    fecha_visita: String,
    responsable: Option<String>,
    resultado: Option<String>,
    observaciones: Option<String>,
) -> Result<ApiResponse<VisitaResponse>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, CLINICAL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    // Validate date format (basic check)
    if fecha_visita.len() != 10 {
        return Ok(ApiResponse::error(
            "Formato de fecha inválido. Use YYYY-MM-DD",
        ));
    }

    let dto = CreateVisitaDTO {
        paciente_id,
        fecha_visita,
        responsable,
        resultado,
        observaciones,
    };

    let id: i64 = sqlx::query_scalar(
        "INSERT INTO visitas_domiciliarias (paciente_id, fecha_visita, responsable, resultado, observaciones) \
         VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id",
    )
    .bind(dto.paciente_id)
    .bind(&dto.fecha_visita)
    .bind(&dto.responsable)
    .bind(&dto.resultado)
    .bind(&dto.observaciones)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| format!("Error al crear visita: {e}"))?;

    // Fetch patient name for response
    let paciente_nombre: Option<String> = sqlx::query_scalar(
        "SELECT nombres || ' ' || apellido_paterno FROM pacientes WHERE id = ?1",
    )
    .bind(dto.paciente_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| format!("Error al obtener paciente: {e}"))?;

    state
        .audit_service
        .log_event(
            Some(user.id),
            "CREATE",
            "visitas_domiciliarias",
            Some(id),
            None,
            None,
            None,
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(VisitaResponse {
        id,
        paciente_id: dto.paciente_id,
        paciente_nombre,
        fecha_visita: dto.fecha_visita,
        responsable: dto.responsable,
        resultado: dto.resultado,
        observaciones: dto.observaciones,
    }))
}

#[tauri::command]
pub async fn get_visitas(
    app: AppHandle,
    token: String,
    paciente_id: i64,
) -> Result<ApiResponse<Vec<VisitaResponse>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    #[derive(sqlx::FromRow)]
    struct VisitaRow {
        id: i64,
        paciente_id: i64,
        fecha_visita: String,
        responsable: Option<String>,
        resultado: Option<String>,
        observaciones: Option<String>,
    }

    let rows = sqlx::query_as::<_, VisitaRow>(
        "SELECT v.id, v.paciente_id, v.fecha_visita, v.responsable, v.resultado, v.observaciones \
         FROM visitas_domiciliarias v \
         WHERE v.paciente_id = ?1 \
         ORDER BY v.fecha_visita DESC",
    )
    .bind(paciente_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| format!("Error al listar visitas: {e}"))?;

    // Get patient name
    let paciente_nombre: Option<String> = sqlx::query_scalar(
        "SELECT nombres || ' ' || apellido_paterno FROM pacientes WHERE id = ?1",
    )
    .bind(paciente_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| format!("Error al obtener paciente: {e}"))?;

    let data: Vec<VisitaResponse> = rows
        .into_iter()
        .map(|r| VisitaResponse {
            id: r.id,
            paciente_id: r.paciente_id,
            paciente_nombre: paciente_nombre.clone(),
            fecha_visita: r.fecha_visita,
            responsable: r.responsable,
            resultado: r.resultado,
            observaciones: r.observaciones,
        })
        .collect();

    Ok(ApiResponse::success(data))
}
