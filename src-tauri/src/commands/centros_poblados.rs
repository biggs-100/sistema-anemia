use tauri::AppHandle;
use tauri::Manager;
use tauri::State;

use crate::dto::{ApiResponse, CentroPobladoResponse, CreateCentroPobladoDTO};
use crate::services::auth_service::{ADMIN_ONLY, ALL_ROLES};
use crate::AppState;

#[tauri::command]
pub async fn list_centros_poblados(
    app: AppHandle,
    token: String,
) -> Result<ApiResponse<Vec<CentroPobladoResponse>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .centro_poblado_service
        .list_all()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_centro_poblado(
    app: AppHandle,
    token: String,
    nombre: String,
    distrito: String,
    provincia: String,
    departamento: String,
) -> Result<ApiResponse<CentroPobladoResponse>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ADMIN_ONLY)
        .await
        .map_err(|e| e.to_string())?;

    let dto = CreateCentroPobladoDTO {
        nombre,
        distrito,
        provincia,
        departamento,
    };

    state
        .centro_poblado_service
        .create(&dto)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_centro_poblado(
    app: AppHandle,
    token: String,
    id: i64,
    nombre: String,
    distrito: String,
    provincia: String,
    departamento: String,
) -> Result<ApiResponse<CentroPobladoResponse>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ADMIN_ONLY)
        .await
        .map_err(|e| e.to_string())?;

    let dto = CreateCentroPobladoDTO {
        nombre,
        distrito,
        provincia,
        departamento,
    };

    state
        .centro_poblado_service
        .update(id, &dto)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_centro_poblado(
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
        .centro_poblado_service
        .delete(id)
        .await
        .map_err(|e| e.to_string())
}
