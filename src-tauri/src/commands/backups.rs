use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::ApiResponse;
use crate::models::BackupHistory;
use crate::AppState;

#[tauri::command]
pub async fn create_backup(app: AppHandle) -> Result<ApiResponse<BackupHistory>, String> {
    let state: State<AppState> = app.state();
    state
        .backup_service
        .create_backup()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn restore_backup(app: AppHandle, path: String) -> Result<ApiResponse<()>, String> {
    let state: State<AppState> = app.state();
    state
        .backup_service
        .restore_backup(&path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_backups(app: AppHandle) -> Result<ApiResponse<Vec<BackupHistory>>, String> {
    let state: State<AppState> = app.state();
    state
        .backup_service
        .list_backups()
        .await
        .map_err(|e| e.to_string())
}
