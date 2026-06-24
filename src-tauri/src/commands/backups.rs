use tauri;

use crate::dto::ApiResponse;
use crate::models::BackupHistory;

#[tauri::command]
pub async fn create_backup(_app: tauri::AppHandle) -> Result<ApiResponse<BackupHistory>, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn restore_backup(_app: tauri::AppHandle, _path: String) -> Result<ApiResponse<()>, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn list_backups(_app: tauri::AppHandle) -> Result<ApiResponse<Vec<BackupHistory>>, String> {
    Err("Not implemented".to_string())
}
