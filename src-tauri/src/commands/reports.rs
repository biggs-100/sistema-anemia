use tauri;

#[tauri::command]
pub async fn generate_pdf(_app: tauri::AppHandle, _paciente_id: i64) -> Result<String, String> {
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn generate_excel(_app: tauri::AppHandle, _fecha_inicio: String, _fecha_fin: String) -> Result<String, String> {
    Err("Not implemented".to_string())
}
