use tauri;

use crate::dto::{ApiResponse, CreateTreatmentDTO};
use crate::models::Treatment;

#[tauri::command]
pub async fn create_treatment(
    _app: tauri::AppHandle,
    _dto: CreateTreatmentDTO,
) -> Result<ApiResponse<Treatment>, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn finish_treatment(
    _app: tauri::AppHandle,
    _id: i64,
) -> Result<ApiResponse<Treatment>, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn get_treatments(
    _app: tauri::AppHandle,
    _paciente_id: i64,
) -> Result<ApiResponse<Vec<Treatment>>, String> {
    Err("Not implemented".to_string())
}
