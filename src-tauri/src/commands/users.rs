use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, CreateUserDTO, UpdateUserDTO};
use crate::models::{User, UserResponse};
use crate::services::auth_service::ADMIN_ONLY;
use crate::AppState;

#[tauri::command]
pub async fn list_users(
    app: AppHandle,
    token: String,
) -> Result<ApiResponse<Vec<UserResponse>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ADMIN_ONLY)
        .await
        .map_err(|e| e.to_string())?;

    #[derive(sqlx::FromRow)]
    struct UserWithRoleRow {
        id: i64,
        usuario: String,
        nombres: String,
        apellidos: String,
        rol_id: i64,
        rol_nombre: String,
        activo: bool,
    }

    let rows = sqlx::query_as::<_, UserWithRoleRow>(
        "SELECT u.id, u.usuario, u.nombres, u.apellidos, u.rol_id, r.nombre AS rol_nombre, u.activo
         FROM users u
         JOIN roles r ON r.id = u.rol_id
         ORDER BY u.nombres, u.apellidos",
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| format!("Error al listar usuarios: {e}"))?;

    let users: Vec<UserResponse> = rows
        .into_iter()
        .map(|r| UserResponse {
            id: r.id,
            usuario: r.usuario,
            nombres: r.nombres,
            apellidos: r.apellidos,
            rol_id: r.rol_id,
            rol_nombre: r.rol_nombre,
            activo: r.activo,
        })
        .collect();

    Ok(ApiResponse::success(users))
}

#[tauri::command]
pub async fn create_user(
    app: AppHandle,
    token: String,
    dto: CreateUserDTO,
) -> Result<ApiResponse<User>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ADMIN_ONLY)
        .await
        .map_err(|e| e.to_string())?;

    // Hash password
    let password_hash =
        crate::security::hash_password(&dto.password).map_err(|e| e.to_string())?;

    let user = state
        .user_repo
        .create(&dto.usuario, &password_hash, &dto.nombres, &dto.apellidos, dto.rol_id)
        .await
        .map_err(|e| e.to_string())?;

    state
        .audit_service
        .log_event(
            Some(user.id),
            "CREATE",
            "users",
            Some(user.id),
            None,
            Some(&serde_json::to_string(&dto).unwrap_or_default()),
            None,
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(user))
}

#[tauri::command]
pub async fn update_user(
    app: AppHandle,
    token: String,
    id: i64,
    dto: UpdateUserDTO,
) -> Result<ApiResponse<User>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ADMIN_ONLY)
        .await
        .map_err(|e| e.to_string())?;

    let user = state
        .user_repo
        .update(
            id,
            dto.nombres.as_deref(),
            dto.apellidos.as_deref(),
            dto.rol_id,
            dto.activo,
        )
        .await
        .map_err(|e| e.to_string())?;

    state
        .audit_service
        .log_event(Some(id), "UPDATE", "users", Some(id), None, None, None)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(user))
}

#[tauri::command]
pub async fn deactivate_user(
    app: AppHandle,
    token: String,
    id: i64,
) -> Result<ApiResponse<()>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ADMIN_ONLY)
        .await
        .map_err(|e| e.to_string())?;

    state
        .user_repo
        .deactivate(id)
        .await
        .map_err(|e| e.to_string())?;

    state
        .audit_service
        .log_event(Some(id), "DEACTIVATE", "users", Some(id), None, None, None)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiResponse::success(()))
}
