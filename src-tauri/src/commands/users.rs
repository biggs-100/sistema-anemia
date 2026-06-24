use tauri;

use crate::dto::ApiResponse;
use crate::models::User;

#[tauri::command]
pub async fn list_users(_app: tauri::AppHandle) -> Result<ApiResponse<Vec<User>>, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn create_user(_app: tauri::AppHandle) -> Result<ApiResponse<User>, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn update_user(_app: tauri::AppHandle, _id: i64) -> Result<ApiResponse<User>, String> {
    Err("Not implemented".to_string())
}
