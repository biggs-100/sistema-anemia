use tauri;

use crate::dto::{ApiResponse, CreatePatientDTO, UpdatePatientDTO};
use crate::models::Patient;

#[tauri::command]
pub async fn create_patient(
    _app: tauri::AppHandle,
    _dto: CreatePatientDTO,
) -> Result<ApiResponse<Patient>, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn update_patient(
    _app: tauri::AppHandle,
    _id: i64,
    _dto: UpdatePatientDTO,
) -> Result<ApiResponse<Patient>, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn get_patient(
    _app: tauri::AppHandle,
    _id: i64,
) -> Result<ApiResponse<Patient>, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn search_patients(
    _app: tauri::AppHandle,
    _query: String,
) -> Result<ApiResponse<Vec<Patient>>, String> {
    Err("Not implemented".to_string())
}
