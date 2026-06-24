use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::ApiResponse;
use crate::models::BackupHistory;
use crate::services::auth_service::ADMIN_ONLY;
use crate::AppState;

#[tauri::command]
pub async fn create_backup(
    app: AppHandle,
    token: String,
) -> Result<ApiResponse<BackupHistory>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ADMIN_ONLY)
        .await
        .map_err(|e| e.to_string())?;

    state
        .backup_service
        .create_backup()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn restore_backup(
    app: AppHandle,
    token: String,
    path: String,
) -> Result<ApiResponse<()>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ADMIN_ONLY)
        .await
        .map_err(|e| e.to_string())?;

    state
        .backup_service
        .restore_backup(&path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_backups(
    app: AppHandle,
    token: String,
) -> Result<ApiResponse<Vec<BackupHistory>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ADMIN_ONLY)
        .await
        .map_err(|e| e.to_string())?;

    state
        .backup_service
        .list_backups()
        .await
        .map_err(|e| e.to_string())
}
