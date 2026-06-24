use tauri;

use crate::dto::{ApiResponse, CreateControlDTO};
use crate::models::Control;

#[tauri::command]
pub async fn create_control(
    _app: tauri::AppHandle,
    _dto: CreateControlDTO,
) -> Result<ApiResponse<Control>, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn update_control(
    _app: tauri::AppHandle,
    _id: i64,
    _dto: CreateControlDTO,
) -> Result<ApiResponse<Control>, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn get_controls(
    _app: tauri::AppHandle,
    _paciente_id: i64,
) -> Result<ApiResponse<Vec<Control>>, String> {
    Err("Not implemented".to_string())
}
